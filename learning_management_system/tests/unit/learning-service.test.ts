import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Category } from "@/server/models/category";
import { Course } from "@/server/models/course";
import { Module } from "@/server/models/module";
import { Lesson } from "@/server/models/lesson";
import { Enrollment } from "@/server/models/enrollment";
import { User } from "@/server/models/user";
import { CurrentUser } from "@/server/auth/session";
import {
  getCourseCurriculumForLearning,
  getLessonContentForLearning,
} from "@/server/services/learning";
import { NotFoundError } from "@/server/http";

describe("Learning Service & Content Access Control", () => {
  let mongoServer: MongoMemoryServer;
  let category: any;
  let instructor: any;
  let foreignInstructor: any;
  let studentEnrolled: any;
  let studentNotEnrolled: any;
  let admin: any;
  let course: any;
  let previewLesson: any;
  let lockedLesson: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    instructor = await User.create({
      name: "Owning Instructor",
      email: "owner@lms.local",
      passwordHash: "hash123",
      role: "INSTRUCTOR",
      status: "ACTIVE",
    });

    foreignInstructor = await User.create({
      name: "Foreign Instructor",
      email: "foreign@lms.local",
      passwordHash: "hash123",
      role: "INSTRUCTOR",
      status: "ACTIVE",
    });

    studentEnrolled = await User.create({
      name: "Enrolled Student",
      email: "enrolled@lms.local",
      passwordHash: "hash123",
      role: "STUDENT",
      status: "ACTIVE",
    });

    studentNotEnrolled = await User.create({
      name: "Unenrolled Student",
      email: "unenrolled@lms.local",
      passwordHash: "hash123",
      role: "STUDENT",
      status: "ACTIVE",
    });

    admin = await User.create({
      name: "Admin User",
      email: "admin@lms.local",
      passwordHash: "hash123",
      role: "ADMIN",
      status: "ACTIVE",
    });

    category = await Category.create({
      name: "Computer Science",
      slug: "computer-science",
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

    course = await Course.create({
      instructorId: instructor._id,
      title: "Distributed Systems",
      slug: "distributed-systems",
      summary: "Consensus, Paxos, Raft",
      categoryId: category._id,
      level: "ADVANCED",
      status: "PUBLISHED",
    });

    const mod = await Module.create({
      courseId: course._id,
      title: "Module 1: Introduction",
      order: 0,
    });

    previewLesson = await Lesson.create({
      courseId: course._id,
      moduleId: mod._id,
      title: "Overview (Preview)",
      order: 0,
      type: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      content: "Welcome to distributed systems!",
      durationMin: 15,
      isPreview: true,
    });

    lockedLesson = await Lesson.create({
      courseId: course._id,
      moduleId: mod._id,
      title: "Raft Consensus Protocol",
      order: 1,
      type: "TEXT",
      content: "Strictly protected consensus notes",
      durationMin: 45,
      isPreview: false,
    });

    await Enrollment.create({
      userId: studentEnrolled._id,
      courseId: course._id,
      status: "ACTIVE",
    });
  });

  it("should allow enrolled student to read locked content and navigate lessons", async () => {
    const user: CurrentUser = {
      userId: studentEnrolled._id.toString(),
      email: studentEnrolled.email,
      name: studentEnrolled.name,
      role: "STUDENT",
      status: "ACTIVE",
      isDemo: false,
    };

    const res = await getLessonContentForLearning(user, lockedLesson._id.toString());
    expect(res.lesson.title).toBe("Raft Consensus Protocol");
    expect(res.lesson.content).toBe("Strictly protected consensus notes");
    expect(res.previousLesson?._id).toBe(previewLesson._id.toString());
    expect(res.nextLesson).toBeNull();
  });

  it("should return 404 for unenrolled student on locked lesson", async () => {
    const user: CurrentUser = {
      userId: studentNotEnrolled._id.toString(),
      email: studentNotEnrolled.email,
      name: studentNotEnrolled.name,
      role: "STUDENT",
      status: "ACTIVE",
      isDemo: false,
    };

    await expect(
      getLessonContentForLearning(user, lockedLesson._id.toString())
    ).rejects.toThrow(NotFoundError);
  });

  it("should allow unenrolled user to read preview lesson on published course", async () => {
    const user: CurrentUser = {
      userId: studentNotEnrolled._id.toString(),
      email: studentNotEnrolled.email,
      name: studentNotEnrolled.name,
      role: "STUDENT",
      status: "ACTIVE",
      isDemo: false,
    };

    const res = await getLessonContentForLearning(user, previewLesson._id.toString());
    expect(res.lesson.title).toBe("Overview (Preview)");
    expect(res.lesson.content).toBe("Welcome to distributed systems!");
  });

  it("should allow owning instructor to read locked lesson without enrollment", async () => {
    const user: CurrentUser = {
      userId: instructor._id.toString(),
      email: instructor.email,
      name: instructor.name,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      isDemo: false,
    };

    const res = await getLessonContentForLearning(user, lockedLesson._id.toString());
    expect(res.lesson.title).toBe("Raft Consensus Protocol");
  });

  it("should return 404 for foreign instructor attempting to read locked lesson", async () => {
    const user: CurrentUser = {
      userId: foreignInstructor._id.toString(),
      email: foreignInstructor.email,
      name: foreignInstructor.name,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      isDemo: false,
    };

    await expect(
      getLessonContentForLearning(user, lockedLesson._id.toString())
    ).rejects.toThrow(NotFoundError);
  });

  it("should allow admin to read locked lesson", async () => {
    const user: CurrentUser = {
      userId: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: "ADMIN",
      status: "ACTIVE",
      isDemo: false,
    };

    const res = await getLessonContentForLearning(user, lockedLesson._id.toString());
    expect(res.lesson.title).toBe("Raft Consensus Protocol");
  });
});
