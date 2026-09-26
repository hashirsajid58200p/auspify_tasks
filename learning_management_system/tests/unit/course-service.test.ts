import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User, IUser } from "@/server/models/user";
import { Category } from "@/server/models/category";
import { Course } from "@/server/models/course";
import { Module } from "@/server/models/module";
import { Lesson } from "@/server/models/lesson";
import { Enrollment } from "@/server/models/enrollment";
import { CurrentUser } from "@/server/auth/session";
import {
  createCourse,
  getCourseWithCurriculum,
  updateCourse,
  updateCourseStatus,
  deleteCourse,
  checkCoursePublishReadiness,
} from "@/server/services/courses";
import { createModule, createLesson } from "@/server/services/curriculum";
import { NotFoundError, BadRequestError } from "@/server/http";

describe("Course Management Service", () => {
  let mongoServer: MongoMemoryServer;
  let categoryId: string;

  const instructorA: CurrentUser = {
    userId: new Types.ObjectId().toString(),
    email: "instructorA@lms.local",
    name: "Instructor Alice",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    isDemo: false,
  };

  const instructorB: CurrentUser = {
    userId: new Types.ObjectId().toString(),
    email: "instructorB@lms.local",
    name: "Instructor Bob",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    isDemo: false,
  };

  const adminUser: CurrentUser = {
    userId: new Types.ObjectId().toString(),
    email: "admin@lms.local",
    name: "Admin User",
    role: "ADMIN",
    status: "ACTIVE",
    isDemo: false,
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    const cat = await Category.create({
      name: "Web Development",
      slug: "web-dev",
    });
    categoryId = cat._id.toString();
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
  });

  describe("Course Creation & Ownership Isolation", () => {
    it("should allow an instructor to create a course in DRAFT status", async () => {
      const course = await createCourse(instructorA, {
        title: "Mastering Next.js 16",
        summary: "A comprehensive guide to building full-stack web applications.",
        categoryId,
        level: "INTERMEDIATE",
      });

      expect(course.id).toBeDefined();
      expect(course.title).toBe("Mastering Next.js 16");
      expect(course.status).toBe("DRAFT");
      expect(course.slug.startsWith("mastering-nextjs-16-")).toBe(true);

      const saved = await Course.findById(course.id);
      expect(saved?.instructorId.toString()).toBe(instructorA.userId);
      expect(saved?.lessonCount).toBe(0);
      expect(saved?.enrollmentCount).toBe(0);
    });

    it("should block instructor B from viewing instructor A's course (404 anti-enumeration)", async () => {
      const course = await createCourse(instructorA, {
        title: "Secret Architecture",
        summary: "Internal architecture patterns for modern high-performance cloud apps.",
        categoryId,
        level: "ADVANCED",
      });

      // Instructor A can access
      const retrievedByA = await getCourseWithCurriculum(course.id, instructorA);
      expect(retrievedByA.id).toBe(course.id);

      // Instructor B is blocked with 404 (not 403)
      await expect(
        getCourseWithCurriculum(course.id, instructorB)
      ).rejects.toThrow(NotFoundError);

      // Admin can inspect
      const retrievedByAdmin = await getCourseWithCurriculum(course.id, adminUser);
      expect(retrievedByAdmin.id).toBe(course.id);
    });

    it("should block instructor B from updating instructor A's course (404)", async () => {
      const course = await createCourse(instructorA, {
        title: "Original Course",
        summary: "Original course summary for testing.",
        categoryId,
        level: "BEGINNER",
      });

      await expect(
        updateCourse(course.id, instructorB, { title: "Hacked Title" })
      ).rejects.toThrow(NotFoundError);

      // Verify title remained unchanged
      const check = await Course.findById(course.id);
      expect(check?.title).toBe("Original Course");
    });
  });

  describe("Publishing Lifecycle & Verification Rules", () => {
    it("should reject publishing if course is missing thumbnail or curriculum lessons", async () => {
      const course = await createCourse(instructorA, {
        title: "Incomplete Course",
        summary: "This course has no modules, lessons, or thumbnail.",
        categoryId,
        level: "BEGINNER",
      });

      // Check readiness
      const readiness = await checkCoursePublishReadiness(course.id);
      expect(readiness.ready).toBe(false);
      expect(readiness.issues.some((i) => i.includes("thumbnail"))).toBe(true);
      expect(readiness.issues.some((i) => i.includes("module"))).toBe(true);

      // Attempting to publish should throw BadRequestError
      await expect(
        updateCourseStatus(course.id, instructorA, "PUBLISH")
      ).rejects.toThrow(BadRequestError);
    });

    it("should publish successfully once thumbnail, module, and lesson are added", async () => {
      const course = await createCourse(instructorA, {
        title: "Complete Course",
        summary: "This course will satisfy all publishing prerequisites.",
        categoryId,
        level: "BEGINNER",
      });

      // 1. Add thumbnail
      await updateCourse(course.id, instructorA, {
        thumbnailUrl: "https://images.unsplash.com/photo-123456",
      });

      // 2. Add module
      const mod = await createModule(course.id, instructorA, {
        title: "Module 1: Getting Started",
      });

      // 3. Add lesson
      await createLesson(course.id, instructorA, {
        moduleId: mod.id,
        title: "Lesson 1: Installation",
        type: "TEXT",
        content: "# Installation Guide\nRun `npm install`.",
        durationMin: 15,
      });

      // Readiness should now be true
      const readiness = await checkCoursePublishReadiness(course.id);
      expect(readiness.ready).toBe(true);
      expect(readiness.issues.length).toBe(0);

      // Publish course
      const published = await updateCourseStatus(course.id, instructorA, "PUBLISH");
      expect(published.status).toBe("PUBLISHED");
      expect(published.publishedAt).toBeDefined();

      // Unpublish course back to draft
      const unpublished = await updateCourseStatus(course.id, instructorA, "UNPUBLISH");
      expect(unpublished.status).toBe("DRAFT");
    });
  });

  describe("Course Deletion Safeguards", () => {
    it("should allow deleting a course with zero enrollments and cascade delete curriculum", async () => {
      const course = await createCourse(instructorA, {
        title: "Doomed Course",
        summary: "This course has no enrollments and can be cleanly deleted.",
        categoryId,
        level: "BEGINNER",
      });

      const mod = await createModule(course.id, instructorA, {
        title: "Doomed Module",
      });

      await createLesson(course.id, instructorA, {
        moduleId: mod.id,
        title: "Doomed Lesson",
        type: "TEXT",
      });

      // Delete course
      await deleteCourse(course.id, instructorA);

      // Verify course, module, and lesson are removed
      expect(await Course.findById(course.id)).toBeNull();
      expect(await Module.findOne({ courseId: course.id })).toBeNull();
      expect(await Lesson.findOne({ courseId: course.id })).toBeNull();
    });

    it("should reject deleting a course that has student enrollments", async () => {
      const course = await createCourse(instructorA, {
        title: "Active Enrolled Course",
        summary: "This course has active students and must not be deleted.",
        categoryId,
        level: "BEGINNER",
      });

      // Simulate enrollment
      await Enrollment.create({
        userId: new Types.ObjectId(),
        courseId: new Types.ObjectId(course.id),
        status: "ACTIVE",
        progressPct: 0,
      });
      await Course.findByIdAndUpdate(course.id, { $inc: { enrollmentCount: 1 } });

      // Attempting deletion should throw BadRequestError
      await expect(deleteCourse(course.id, instructorA)).rejects.toThrow(
        "Courses with active student enrollments cannot be deleted"
      );
    });
  });
});
