import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Category } from "@/server/models/category";
import { Course } from "@/server/models/course";
import { Module } from "@/server/models/module";
import { Lesson } from "@/server/models/lesson";
import { Enrollment } from "@/server/models/enrollment";
import { LessonProgress } from "@/server/models/lesson-progress";
import { User } from "@/server/models/user";
import { CurrentUser } from "@/server/auth/session";
import {
  completeLesson,
  uncompleteLesson,
  recalculateProgress,
} from "@/server/services/progress";

describe("Progress Service & Recalculation", () => {
  let mongoServer: MongoMemoryServer;
  let category: any;
  let instructor: any;
  let student: any;
  let course: any;
  let lesson1: any;
  let lesson2: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    instructor = await User.create({
      name: "Instructor Ian",
      email: "ian@lms.local",
      passwordHash: "hash123",
      role: "INSTRUCTOR",
      status: "ACTIVE",
    });

    student = await User.create({
      name: "Student Stan",
      email: "stan@lms.local",
      passwordHash: "hash123",
      role: "STUDENT",
      status: "ACTIVE",
    });

    category = await Category.create({
      name: "Design Systems",
      slug: "design-systems",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    await Enrollment.deleteMany({});
    await LessonProgress.deleteMany({});

    course = await Course.create({
      instructorId: instructor._id,
      title: "UI Design Foundations",
      slug: "ui-design-foundations",
      summary: "Colors, typography, layout",
      categoryId: category._id,
      level: "BEGINNER",
      status: "PUBLISHED",
      lessonCount: 2,
    });

    const mod = await Module.create({
      courseId: course._id,
      title: "Module 1",
      order: 0,
    });

    lesson1 = await Lesson.create({
      courseId: course._id,
      moduleId: mod._id,
      title: "Lesson 1: Typography",
      order: 0,
      type: "TEXT",
      content: "Typography basics",
      durationMin: 20,
    });

    lesson2 = await Lesson.create({
      courseId: course._id,
      moduleId: mod._id,
      title: "Lesson 2: Color Theory",
      order: 1,
      type: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationMin: 30,
    });

    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "ACTIVE",
      progressPct: 0,
    });
  });

  it("should complete lessons idempotently and advance progress towards completion", async () => {
    const user: CurrentUser = {
      userId: student._id.toString(),
      email: student.email,
      name: student.name,
      role: "STUDENT",
      status: "ACTIVE",
      isDemo: false,
    };

    // 1st complete (50%)
    const res1 = await completeLesson(user, lesson1._id.toString());
    expect(res1.completedCount).toBe(1);
    expect(res1.totalRequired).toBe(2);
    expect(res1.progressPct).toBe(50);
    expect(res1.isCompleted).toBe(false);

    let enrollment = await Enrollment.findOne({
      userId: student._id,
      courseId: course._id,
    });
    expect(enrollment?.progressPct).toBe(50);
    expect(enrollment?.status).toBe("ACTIVE");

    // Repeat 1st complete (idempotent, still 50%)
    const resRepeat = await completeLesson(user, lesson1._id.toString());
    expect(resRepeat.progressPct).toBe(50);

    // 2nd complete (100% -> COMPLETED status)
    const res2 = await completeLesson(user, lesson2._id.toString());
    expect(res2.completedCount).toBe(2);
    expect(res2.progressPct).toBe(100);
    expect(res2.isCompleted).toBe(true);

    enrollment = await Enrollment.findOne({
      userId: student._id,
      courseId: course._id,
    });
    expect(enrollment?.progressPct).toBe(100);
    expect(enrollment?.status).toBe("COMPLETED");
    expect(enrollment?.completedAt).toBeDefined();
  });

  it("should uncomplete lesson and revert status back to ACTIVE", async () => {
    const user: CurrentUser = {
      userId: student._id.toString(),
      email: student.email,
      name: student.name,
      role: "STUDENT",
      status: "ACTIVE",
      isDemo: false,
    };

    await completeLesson(user, lesson1._id.toString());
    await completeLesson(user, lesson2._id.toString());

    let enrollment = await Enrollment.findOne({
      userId: student._id,
      courseId: course._id,
    });
    expect(enrollment?.status).toBe("COMPLETED");

    // Uncomplete lesson 2
    const resUncomplete = await uncompleteLesson(user, lesson2._id.toString());
    expect(resUncomplete.completedCount).toBe(1);
    expect(resUncomplete.progressPct).toBe(50);
    expect(resUncomplete.isCompleted).toBe(false);

    enrollment = await Enrollment.findOne({
      userId: student._id,
      courseId: course._id,
    });
    expect(enrollment?.status).toBe("ACTIVE");
  });
});
