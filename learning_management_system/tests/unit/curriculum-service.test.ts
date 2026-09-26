import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Category } from "@/server/models/category";
import { Course } from "@/server/models/course";
import { Module } from "@/server/models/module";
import { Lesson } from "@/server/models/lesson";
import { CurrentUser } from "@/server/auth/session";
import { createCourse } from "@/server/services/courses";
import {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from "@/server/services/curriculum";
import { NotFoundError, BadRequestError } from "@/server/http";

describe("Curriculum Service (Modules & Lessons)", () => {
  let mongoServer: MongoMemoryServer;
  let categoryId: string;
  let courseId: string;

  const ownerInstructor: CurrentUser = {
    userId: new Types.ObjectId().toString(),
    email: "owner@lms.local",
    name: "Owner Instructor",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    isDemo: false,
  };

  const foreignInstructor: CurrentUser = {
    userId: new Types.ObjectId().toString(),
    email: "foreign@lms.local",
    name: "Foreign Instructor",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    isDemo: false,
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    const cat = await Category.create({
      name: "Computer Science",
      slug: "cs",
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

    const course = await createCourse(ownerInstructor, {
      title: "Algorithms & Data Structures",
      summary: "Comprehensive algorithms curriculum covering trees, graphs, and dynamic programming.",
      categoryId,
      level: "ADVANCED",
    });
    courseId = course.id;
  });

  describe("Module Operations", () => {
    it("should create sequential modules and allow reordering", async () => {
      const mod1 = await createModule(courseId, ownerInstructor, {
        title: "Module 1: Big-O & Complexity",
      });
      const mod2 = await createModule(courseId, ownerInstructor, {
        title: "Module 2: Binary Search Trees",
      });

      expect(mod1.order).toBe(0);
      expect(mod2.order).toBe(1);

      // Reorder modules: invert sequence
      await reorderModules(courseId, ownerInstructor, [mod2.id, mod1.id]);

      const updatedMod1 = await Module.findById(mod1.id);
      const updatedMod2 = await Module.findById(mod2.id);

      expect(updatedMod2?.order).toBe(0);
      expect(updatedMod1?.order).toBe(1);
    });

    it("should block a foreign instructor from creating or modifying modules (404)", async () => {
      await expect(
        createModule(courseId, foreignInstructor, { title: "Intruder Module" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Lesson Operations & Video Parsing", () => {
    it("should create video lesson, parse embed URL, and increment course lessonCount", async () => {
      const mod = await createModule(courseId, ownerInstructor, {
        title: "Module 1",
      });

      const lesson = await createLesson(courseId, ownerInstructor, {
        moduleId: mod.id,
        title: "Graph Traversal BFS & DFS",
        type: "VIDEO",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        durationMin: 25,
        isPreview: true,
      });

      expect(lesson.id).toBeDefined();
      expect(lesson.type).toBe("VIDEO");
      expect(lesson.videoUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
      expect(lesson.isPreview).toBe(true);

      // Verify denormalized counter
      const course = await Course.findById(courseId);
      expect(course?.lessonCount).toBe(1);
    });

    it("should reject invalid video URLs when creating video lessons", async () => {
      const mod = await createModule(courseId, ownerInstructor, {
        title: "Module 1",
      });

      await expect(
        createLesson(courseId, ownerInstructor, {
          moduleId: mod.id,
          title: "Invalid Video Lesson",
          type: "VIDEO",
          videoUrl: "https://not-youtube.com/video/123",
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should delete lesson and decrement course lessonCount", async () => {
      const mod = await createModule(courseId, ownerInstructor, {
        title: "Module 1",
      });

      const lesson1 = await createLesson(courseId, ownerInstructor, {
        moduleId: mod.id,
        title: "Lesson 1",
        type: "TEXT",
      });

      const lesson2 = await createLesson(courseId, ownerInstructor, {
        moduleId: mod.id,
        title: "Lesson 2",
        type: "TEXT",
      });

      expect((await Course.findById(courseId))?.lessonCount).toBe(2);

      await deleteLesson(courseId, lesson1.id, ownerInstructor);

      expect((await Course.findById(courseId))?.lessonCount).toBe(1);
      expect(await Lesson.findById(lesson1.id)).toBeNull();
      expect(await Lesson.findById(lesson2.id)).not.toBeNull();
    });

    it("should cascade delete all lessons when a module is deleted", async () => {
      const mod = await createModule(courseId, ownerInstructor, {
        title: "Module with Lessons",
      });

      await createLesson(courseId, ownerInstructor, {
        moduleId: mod.id,
        title: "Lesson A",
        type: "TEXT",
      });
      await createLesson(courseId, ownerInstructor, {
        moduleId: mod.id,
        title: "Lesson B",
        type: "TEXT",
      });

      expect((await Course.findById(courseId))?.lessonCount).toBe(2);

      // Delete module
      await deleteModule(courseId, mod.id, ownerInstructor);

      expect((await Course.findById(courseId))?.lessonCount).toBe(0);
      expect(await Module.findById(mod.id)).toBeNull();
      expect(await Lesson.countDocuments({ courseId })).toBe(0);
    });
  });
});
