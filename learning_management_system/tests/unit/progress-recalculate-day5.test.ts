import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Category } from "@/server/models/category";
import { Course } from "@/server/models/course";
import { Module } from "@/server/models/module";
import { Lesson } from "@/server/models/lesson";
import { Quiz } from "@/server/models/quiz";
import { Assignment } from "@/server/models/assignment";
import { Enrollment } from "@/server/models/enrollment";
import { User } from "@/server/models/user";
import { CurrentUser } from "@/server/auth/session";
import { completeLesson } from "@/server/services/progress";
import { startOrResumeAttempt, submitQuizAttempt } from "@/server/services/attempts";
import { submitAssignment } from "@/server/services/submissions";

describe("Integrated Progress Recalculation (Lessons + Quizzes + Assignments)", () => {
  let mongoServer: MongoMemoryServer;
  let category: any;
  let instructor: any;
  let student: any;
  let course: any;
  let lesson: any;
  let quiz: any;
  let assignment: any;

  const studentUser: CurrentUser = {
    userId: "",
    email: "student@lms.local",
    name: "Student",
    role: "STUDENT",
    status: "ACTIVE",
    isDemo: false,
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    instructor = await User.create({
      name: "Instructor",
      email: "inst@lms.local",
      passwordHash: "hash123",
      role: "INSTRUCTOR",
      status: "ACTIVE",
    });

    student = await User.create({
      name: "Student",
      email: "student@lms.local",
      passwordHash: "hash123",
      role: "STUDENT",
      status: "ACTIVE",
    });
    studentUser.userId = student._id.toString();

    category = await Category.create({
      name: "Full Stack",
      slug: "full-stack",
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
    await Quiz.deleteMany({});
    await Assignment.deleteMany({});
    await Enrollment.deleteMany({});

    course = await Course.create({
      instructorId: instructor._id,
      title: "Master Course",
      slug: "master-course",
      summary: "Full loop",
      categoryId: category._id,
      level: "BEGINNER",
      status: "PUBLISHED",
    });

    const mod = await Module.create({
      courseId: course._id,
      title: "Module 1",
      order: 0,
    });

    lesson = await Lesson.create({
      courseId: course._id,
      moduleId: mod._id,
      title: "Lesson 1",
      order: 0,
      type: "TEXT",
      content: "Notes",
    });

    quiz = await Quiz.create({
      courseId: course._id,
      moduleId: mod._id,
      title: "Required Quiz",
      passingPct: 70,
      isRequired: true,
      questions: [
        {
          id: "q1",
          type: "TRUE_FALSE",
          prompt: "The sky is blue",
          points: 10,
          options: [
            { id: "t", text: "True", isCorrect: true },
            { id: "f", text: "False", isCorrect: false },
          ],
        },
      ],
    });

    assignment = await Assignment.create({
      courseId: course._id,
      moduleId: mod._id,
      title: "Required Project",
      instructions: "Build app",
      isRequired: true,
      maxPoints: 100,
    });

    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "ACTIVE",
      progressPct: 0,
    });
  });

  it("should incrementally advance progress across lesson completion, quiz pass, and assignment submit to 100%", async () => {
    // 3 required items total: 1 lesson, 1 quiz, 1 assignment

    // 1. Complete lesson (1/3 -> 33%)
    const res1 = await completeLesson(studentUser, lesson._id.toString());
    expect(res1.totalRequired).toBe(3);
    expect(res1.completedCount).toBe(1);
    expect(res1.progressPct).toBe(33);
    expect(res1.isCompleted).toBe(false);

    // 2. Take and FAIL quiz (score 0 < 70% passingPct) -> progress remains 33%
    const attempt1 = await startOrResumeAttempt(studentUser, quiz._id.toString());
    await submitQuizAttempt(studentUser, attempt1.attemptId, [
      { questionId: "q1", selectedOptionIds: ["f"] }, // WRONG answer
    ]);

    let enrollment = await Enrollment.findOne({
      userId: student._id,
      courseId: course._id,
    });
    expect(enrollment?.progressPct).toBe(33); // Didn't increase!

    // 3. Retake and PASS quiz -> 2/3 -> 67%
    const attempt2 = await startOrResumeAttempt(studentUser, quiz._id.toString());
    await submitQuizAttempt(studentUser, attempt2.attemptId, [
      { questionId: "q1", selectedOptionIds: ["t"] }, // CORRECT
    ]);

    enrollment = await Enrollment.findOne({
      userId: student._id,
      courseId: course._id,
    });
    expect(enrollment?.progressPct).toBe(67);

    // 4. Submit assignment -> 3/3 -> 100% -> status becomes COMPLETED!
    await submitAssignment(
      studentUser,
      assignment._id.toString(),
      "Finished project",
      "https://github.com/student/project"
    );

    enrollment = await Enrollment.findOne({
      userId: student._id,
      courseId: course._id,
    });
    expect(enrollment?.progressPct).toBe(100);
    expect(enrollment?.status).toBe("COMPLETED");
    expect(enrollment?.completedAt).toBeDefined();
  });
});
