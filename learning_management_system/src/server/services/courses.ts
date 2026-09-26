import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Course, ICourse, CourseStatus, CourseLevel } from "@/server/models/course";
import { Module, IModule } from "@/server/models/module";
import { Lesson, ILesson } from "@/server/models/lesson";
import { Enrollment } from "@/server/models/enrollment";
import { Category } from "@/server/models/category";
import { CurrentUser } from "@/server/auth/session";
import { assertCourseOwner } from "@/server/policies/ownership";
import { generateCourseSlug } from "@/lib/slug";
import { NotFoundError, BadRequestError } from "@/server/http";
import { CreateCourseSchema, UpdateCourseSchema } from "@/validations/course";

export interface InstructorCourseListItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl?: string;
  categoryName?: string;
  level: string;
  status: CourseStatus;
  lessonCount: number;
  enrollmentCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseWithCurriculum {
  id: string;
  instructorId: Types.ObjectId;
  title: string;
  slug: string;
  summary: string;
  description: string;
  thumbnailUrl?: string | null;
  categoryId: Types.ObjectId;
  level: CourseLevel;
  status: CourseStatus;
  lessonCount: number;
  enrollmentCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  modules: Array<IModule & { id: string; lessons: Array<ILesson & { id: string }> }>;
  category?: { id: string; name: string; slug: string };
}

export async function listInstructorCourses(
  actor: CurrentUser,
  page = 1,
  limit = 20,
  statusFilter?: string
) {
  await connectToDatabase();

  const query: { instructorId: Types.ObjectId; status?: CourseStatus } = {
    instructorId: new Types.ObjectId(actor.userId),
  };

  if (statusFilter && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(statusFilter)) {
    query.status = statusFilter as CourseStatus;
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const [courses, total] = await Promise.all([
    Course.find(query)
      .populate("categoryId", "name slug")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Course.countDocuments(query),
  ]);

  const items: InstructorCourseListItem[] = courses.map((c) => {
    const cat = c.categoryId as unknown as { _id: Types.ObjectId; name: string } | null;
    return {
      id: c._id.toString(),
      title: c.title,
      slug: c.slug,
      summary: c.summary,
      thumbnailUrl: c.thumbnailUrl || undefined,
      categoryName: cat?.name || "Uncategorized",
      level: c.level,
      status: c.status,
      lessonCount: c.lessonCount,
      enrollmentCount: c.enrollmentCount,
      publishedAt: c.publishedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  });

  return {
    items,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

export async function getCourseWithCurriculum(
  courseId: string,
  actor: CurrentUser
) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(courseId)) {
    throw new NotFoundError("Course not found");
  }

  const course = await Course.findById(courseId).populate("categoryId", "name slug").lean();
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  // Enforce ownership: other instructors get 404 (rule 8 & policy layer)
  if (actor.role !== "ADMIN") {
    assertCourseOwner(course.instructorId, actor.userId);
  }

  const [modules, lessons] = await Promise.all([
    Module.find({ courseId: course._id }).sort({ order: 1 }).lean(),
    Lesson.find({ courseId: course._id }).sort({ order: 1 }).lean(),
  ]);

  const modulesWithLessons = modules.map((mod) => ({
    ...mod,
    id: mod._id.toString(),
    lessons: lessons
      .filter((l) => l.moduleId.toString() === mod._id.toString())
      .map((l) => ({
        ...l,
        id: l._id.toString(),
      })),
  }));

  const cat = course.categoryId as unknown as { _id: Types.ObjectId; name: string; slug: string } | null;

  return {
    ...course,
    id: course._id.toString(),
    category: cat ? { id: cat._id.toString(), name: cat.name, slug: cat.slug } : undefined,
    modules: modulesWithLessons,
  };
}

export async function createCourse(
  actor: CurrentUser,
  input: CreateCourseSchema
) {
  await connectToDatabase();

  const categoryExists = await Category.findById(input.categoryId);
  if (!categoryExists) {
    throw new BadRequestError("Specified category does not exist");
  }

  const slug = generateCourseSlug(input.title);

  const course = await Course.create({
    instructorId: new Types.ObjectId(actor.userId),
    title: input.title,
    slug,
    summary: input.summary,
    description: input.description || "",
    categoryId: new Types.ObjectId(input.categoryId),
    level: input.level,
    thumbnailUrl: input.thumbnailUrl || null,
    status: "DRAFT",
    lessonCount: 0,
    enrollmentCount: 0,
  });

  return {
    id: course._id.toString(),
    title: course.title,
    slug: course.slug,
    status: course.status,
  };
}

export async function updateCourse(
  courseId: string,
  actor: CurrentUser,
  input: UpdateCourseSchema
) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(courseId)) {
    throw new NotFoundError("Course not found");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  if (actor.role !== "ADMIN") {
    assertCourseOwner(course.instructorId, actor.userId);
  }

  if (input.categoryId) {
    const categoryExists = await Category.findById(input.categoryId);
    if (!categoryExists) {
      throw new BadRequestError("Specified category does not exist");
    }
    course.categoryId = new Types.ObjectId(input.categoryId);
  }

  if (input.title !== undefined) course.title = input.title;
  if (input.summary !== undefined) course.summary = input.summary;
  if (input.description !== undefined) course.description = input.description;
  if (input.level !== undefined) course.level = input.level;
  if (input.thumbnailUrl !== undefined) {
    course.thumbnailUrl = input.thumbnailUrl || null;
  }

  await course.save();

  return {
    id: course._id.toString(),
    title: course.title,
    slug: course.slug,
    summary: course.summary,
    description: course.description,
    level: course.level,
    thumbnailUrl: course.thumbnailUrl,
    status: course.status,
  };
}

export async function checkCoursePublishReadiness(courseId: string | Types.ObjectId) {
  const course = await Course.findById(courseId).lean();
  if (!course) return { ready: false, issues: ["Course not found"] };

  const issues: string[] = [];

  if (!course.title || course.title.trim().length < 3) {
    issues.push("Title must be at least 3 characters");
  }
  if (!course.summary || course.summary.trim().length < 10) {
    issues.push("Summary must be at least 10 characters");
  }
  if (!course.categoryId) {
    issues.push("A category must be selected");
  }
  if (!course.level) {
    issues.push("Course level must be selected");
  }
  if (!course.thumbnailUrl) {
    issues.push("A course thumbnail image URL is required");
  }

  const modules = await Module.find({ courseId: course._id }).lean();
  if (modules.length === 0) {
    issues.push("Course must have at least one module");
  } else {
    const moduleIds = modules.map((m) => m._id);
    const lessonCount = await Lesson.countDocuments({
      courseId: course._id,
      moduleId: { $in: moduleIds },
    });
    if (lessonCount === 0) {
      issues.push("Course must have at least one lesson");
    }
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}

export async function updateCourseStatus(
  courseId: string,
  actor: CurrentUser,
  action: "PUBLISH" | "UNPUBLISH" | "ARCHIVE"
) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(courseId)) {
    throw new NotFoundError("Course not found");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  if (actor.role !== "ADMIN") {
    assertCourseOwner(course.instructorId, actor.userId);
  }

  if (action === "PUBLISH") {
    const { ready, issues } = await checkCoursePublishReadiness(course._id);
    if (!ready) {
      throw new BadRequestError(`Cannot publish course: ${issues.join("; ")}`);
    }

    course.status = "PUBLISHED";
    course.publishedAt = course.publishedAt || new Date();
  } else if (action === "UNPUBLISH") {
    course.status = "DRAFT";
  } else if (action === "ARCHIVE") {
    course.status = "ARCHIVED";
  }

  await course.save();

  return {
    id: course._id.toString(),
    status: course.status,
    publishedAt: course.publishedAt,
  };
}

export async function deleteCourse(courseId: string, actor: CurrentUser) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(courseId)) {
    throw new NotFoundError("Course not found");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  if (actor.role !== "ADMIN") {
    assertCourseOwner(course.instructorId, actor.userId);
  }

  // Business Rule: "A course with enrollments cannot be deleted, only archived"
  if (course.enrollmentCount > 0) {
    throw new BadRequestError(
      "Courses with active student enrollments cannot be deleted. You can archive the course instead."
    );
  }

  const activeEnrollments = await Enrollment.countDocuments({ courseId: course._id });
  if (activeEnrollments > 0) {
    throw new BadRequestError(
      "Courses with student enrollments cannot be deleted. You can archive the course instead."
    );
  }

  // Cascade delete modules and lessons
  await Promise.all([
    Lesson.deleteMany({ courseId: course._id }),
    Module.deleteMany({ courseId: course._id }),
    Course.findByIdAndDelete(course._id),
  ]);

  return { success: true };
}
