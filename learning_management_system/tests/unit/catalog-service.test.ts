import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Category } from "@/server/models/category";
import { Course } from "@/server/models/course";
import { Module } from "@/server/models/module";
import { Lesson } from "@/server/models/lesson";
import { User } from "@/server/models/user";
import {
  getCatalogCourses,
  getCourseBySlug,
  getFeaturedCourses,
} from "@/server/services/catalog";
import { NotFoundError } from "@/server/http";

describe("Catalog Service", () => {
  let mongoServer: MongoMemoryServer;
  let categoryWeb: any;
  let categoryData: any;
  let instructor: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    instructor = await User.create({
      name: "Professor Turing",
      email: "turing@lms.local",
      passwordHash: "hash123",
      role: "INSTRUCTOR",
      status: "ACTIVE",
      bio: "Computer Science pioneer",
    });

    categoryWeb = await Category.create({
      name: "Web Development",
      slug: "web-development",
    });

    categoryData = await Category.create({
      name: "Data Science",
      slug: "data-science",
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
  });

  it("should query only published courses with pagination and sorting", async () => {
    // 1 Draft, 2 Published
    await Course.create({
      instructorId: instructor._id,
      title: "Draft React Course",
      slug: "draft-react",
      summary: "Draft summary for testing",
      categoryId: categoryWeb._id,
      level: "BEGINNER",
      status: "DRAFT",
    });

    const c1 = await Course.create({
      instructorId: instructor._id,
      title: "Learn TypeScript Deep Dive",
      slug: "typescript-deep-dive",
      summary: "Master strict typescript with real examples",
      categoryId: categoryWeb._id,
      level: "ADVANCED",
      status: "PUBLISHED",
      enrollmentCount: 42,
      publishedAt: new Date(Date.now() - 10000),
    });

    const c2 = await Course.create({
      instructorId: instructor._id,
      title: "Python for Data Analysis",
      slug: "python-data-analysis",
      summary: "Pandas and numpy from scratch",
      categoryId: categoryData._id,
      level: "BEGINNER",
      status: "PUBLISHED",
      enrollmentCount: 100,
      publishedAt: new Date(Date.now() - 5000),
    });

    // Default query: newest published
    const resAll = await getCatalogCourses({
      sort: "newest",
      page: 1,
      limit: 10,
    });

    expect(resAll.courses).toHaveLength(2);
    expect(resAll.meta.total).toBe(2);
    expect(resAll.courses[0].slug).toBe("python-data-analysis");

    // Sort popular
    const resPopular = await getCatalogCourses({
      sort: "popular",
      page: 1,
      limit: 10,
    });
    expect(resPopular.courses[0].slug).toBe("python-data-analysis");
    expect(resPopular.courses[0].enrollmentCount).toBe(100);

    // Filter by category
    const resCategory = await getCatalogCourses({
      categoryId: categoryWeb._id.toString(),
      sort: "newest",
      page: 1,
      limit: 10,
    });
    expect(resCategory.courses).toHaveLength(1);
    expect(resCategory.courses[0].slug).toBe("typescript-deep-dive");

    // Filter by level
    const resLevel = await getCatalogCourses({
      level: "BEGINNER",
      sort: "newest",
      page: 1,
      limit: 10,
    });
    expect(resLevel.courses).toHaveLength(1);
    expect(resLevel.courses[0].slug).toBe("python-data-analysis");

    // Search query
    const resSearch = await getCatalogCourses({
      q: "deep dive",
      sort: "newest",
      page: 1,
      limit: 10,
    });
    expect(resSearch.courses).toHaveLength(1);
    expect(resSearch.courses[0].slug).toBe("typescript-deep-dive");
  });

  it("should return course details with curriculum and preview flags by slug", async () => {
    const course = await Course.create({
      instructorId: instructor._id,
      title: "Fullstack Architecture",
      slug: "fullstack-architecture",
      summary: "Modern fullstack systems",
      description: "# Syllabus details in markdown",
      categoryId: categoryWeb._id,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      publishedAt: new Date(),
    });

    const mod = await Module.create({
      courseId: course._id,
      title: "Module 1: Foundations",
      order: 0,
    });

    await Lesson.create({
      courseId: course._id,
      moduleId: mod._id,
      title: "Introduction (Preview)",
      order: 0,
      type: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      durationMin: 12,
      isPreview: true,
      content: "Hidden unless enrolled or preview",
    });

    await Lesson.create({
      courseId: course._id,
      moduleId: mod._id,
      title: "Deep Dive Architecture",
      order: 1,
      type: "TEXT",
      durationMin: 25,
      isPreview: false,
      content: "Strictly secret notes",
    });

    const detail = await getCourseBySlug("fullstack-architecture");
    expect(detail.course.title).toBe("Fullstack Architecture");
    expect(detail.course.instructor?.name).toBe("Professor Turing");
    expect(detail.modules).toHaveLength(1);
    expect(detail.modules[0].lessons).toHaveLength(2);
    expect(detail.modules[0].lessons[0].isPreview).toBe(true);
    expect(detail.modules[0].lessons[1].isPreview).toBe(false);
    expect(detail.totalDurationMin).toBe(37);
  });

  it("should throw NotFoundError for draft or non-existent course slug", async () => {
    await Course.create({
      instructorId: instructor._id,
      title: "Secret Draft",
      slug: "secret-draft",
      summary: "Draft not ready for public",
      categoryId: categoryWeb._id,
      level: "BEGINNER",
      status: "DRAFT",
    });

    await expect(getCourseBySlug("secret-draft")).rejects.toThrow(NotFoundError);
    await expect(getCourseBySlug("does-not-exist")).rejects.toThrow(NotFoundError);
  });

  it("should return top featured courses", async () => {
    await Course.create({
      instructorId: instructor._id,
      title: "Popular Course 1",
      slug: "pop-1",
      summary: "Very popular",
      categoryId: categoryWeb._id,
      level: "BEGINNER",
      status: "PUBLISHED",
      enrollmentCount: 500,
    });

    await Course.create({
      instructorId: instructor._id,
      title: "Popular Course 2",
      slug: "pop-2",
      summary: "Also popular",
      categoryId: categoryWeb._id,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      enrollmentCount: 300,
    });

    const featured = await getFeaturedCourses(2);
    expect(featured).toHaveLength(2);
    expect(featured[0].slug).toBe("pop-1");
    expect(featured[1].slug).toBe("pop-2");
  });
});
