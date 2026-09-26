import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Course } from "@/server/models/course";
import { Enrollment, IEnrollment } from "@/server/models/enrollment";
import { Category } from "@/server/models/category";
import { User } from "@/server/models/user";
import { BadRequestError, NotFoundError } from "@/server/http";

export interface EnrolledCourseItem {
  enrollmentId: string;
  courseId: string;
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl: string | null;
  level: string;
  status: "ACTIVE" | "COMPLETED";
  progressPct: number;
  lastLessonId: string | null;
  lastAccessedAt: string;
  enrolledAt: string;
  completedAt: string | null;
  lessonCount: number;
  category: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  instructor: {
    _id: string;
    name: string;
  } | null;
}

export async function enrollStudent(userId: string, courseId: string) {
  if (!Types.ObjectId.isValid(courseId)) {
    throw new NotFoundError("Course not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  if (course.status === "DRAFT") {
    throw new BadRequestError("Cannot enroll in an unpublished course");
  }

  if (course.status === "ARCHIVED") {
    throw new BadRequestError("This course is archived and no longer accepts new enrollments");
  }

  const existing = await Enrollment.findOne({
    userId: new Types.ObjectId(userId),
    courseId: course._id,
  });

  if (existing) {
    if (existing.status === "ACTIVE" || existing.status === "COMPLETED") {
      return {
        enrollmentId: existing._id.toString(),
        status: existing.status,
        progressPct: existing.progressPct,
        alreadyEnrolled: true,
      };
    }

    // If it was dropped, reactivate
    existing.status = "ACTIVE";
    existing.lastAccessedAt = new Date();
    await existing.save();

    await Course.findByIdAndUpdate(course._id, {
      $inc: { enrollmentCount: 1 },
    });

    return {
      enrollmentId: existing._id.toString(),
      status: existing.status,
      progressPct: existing.progressPct,
      alreadyEnrolled: false,
    };
  }

  const enrollment = await Enrollment.create({
    userId: new Types.ObjectId(userId),
    courseId: course._id,
    status: "ACTIVE",
    progressPct: 0,
    enrolledAt: new Date(),
    lastAccessedAt: new Date(),
  });

  await Course.findByIdAndUpdate(course._id, {
    $inc: { enrollmentCount: 1 },
  });

  return {
    enrollmentId: enrollment._id.toString(),
    status: enrollment.status,
    progressPct: enrollment.progressPct,
    alreadyEnrolled: false,
  };
}

export async function dropCourse(userId: string, courseId: string) {
  if (!Types.ObjectId.isValid(courseId)) {
    throw new NotFoundError("Course not found");
  }

  await connectToDatabase();

  const enrollment = await Enrollment.findOne({
    userId: new Types.ObjectId(userId),
    courseId: new Types.ObjectId(courseId),
    status: { $in: ["ACTIVE", "COMPLETED"] },
  });

  if (!enrollment) {
    throw new NotFoundError("Active enrollment not found");
  }

  enrollment.status = "DROPPED";
  await enrollment.save();

  // Decrement enrollmentCount (min 0)
  await Course.updateOne(
    { _id: new Types.ObjectId(courseId), enrollmentCount: { $gt: 0 } },
    { $inc: { enrollmentCount: -1 } }
  );

  return { success: true };
}

export async function getUserEnrollments(userId: string): Promise<EnrolledCourseItem[]> {
  await connectToDatabase();

  const enrollments = await Enrollment.find({
    userId: new Types.ObjectId(userId),
    status: { $in: ["ACTIVE", "COMPLETED"] },
  })
    .sort({ lastAccessedAt: -1, enrolledAt: -1 })
    .populate({
      path: "courseId",
      populate: [
        { path: "categoryId", select: "name slug" },
        { path: "instructorId", select: "name" },
      ],
    })
    .lean();

  const items: EnrolledCourseItem[] = [];

  for (const e of enrollments) {
    const course = e.courseId as unknown as (Record<string, any> & { _id: Types.ObjectId }) | null;
    if (!course || course.status === "DRAFT") continue;

    const cat = course.categoryId as { _id: Types.ObjectId; name: string; slug: string } | null;
    const inst = course.instructorId as { _id: Types.ObjectId; name: string } | null;

    items.push({
      enrollmentId: e._id.toString(),
      courseId: course._id.toString(),
      title: course.title,
      slug: course.slug,
      summary: course.summary,
      thumbnailUrl: course.thumbnailUrl || null,
      level: course.level,
      status: e.status as "ACTIVE" | "COMPLETED",
      progressPct: e.progressPct || 0,
      lastLessonId: e.lastLessonId ? e.lastLessonId.toString() : null,
      lastAccessedAt: e.lastAccessedAt ? e.lastAccessedAt.toISOString() : e.enrolledAt.toISOString(),
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt ? e.completedAt.toISOString() : null,
      lessonCount: course.lessonCount || 0,
      category: cat ? { _id: cat._id.toString(), name: cat.name, slug: cat.slug } : null,
      instructor: inst ? { _id: inst._id.toString(), name: inst.name } : null,
    });
  }

  return items;
}

export async function getEnrollmentForCourse(
  userId: string,
  courseId: string
): Promise<IEnrollment | null> {
  if (!Types.ObjectId.isValid(courseId)) return null;
  await connectToDatabase();
  return Enrollment.findOne({
    userId: new Types.ObjectId(userId),
    courseId: new Types.ObjectId(courseId),
    status: { $in: ["ACTIVE", "COMPLETED"] },
  }).lean();
}
