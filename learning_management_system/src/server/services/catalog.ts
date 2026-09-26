import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Course } from "@/server/models/course";
import { Module } from "@/server/models/module";
import { Lesson } from "@/server/models/lesson";
import { NotFoundError } from "@/server/http";
import { CatalogQuerySchema } from "@/validations/course";

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export interface CatalogCourseItem {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl: string | null;
  level: string;
  lessonCount: number;
  enrollmentCount: number;
  publishedAt: string | null;
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

export async function getCatalogCourses(query: CatalogQuerySchema) {
  await connectToDatabase();

  const filter: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  if (query.categoryId) {
    filter.categoryId = new Types.ObjectId(query.categoryId);
  }

  if (query.level) {
    filter.level = query.level;
  }

  if (query.q) {
    const escaped = escapeRegex(query.q);
    filter.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { summary: { $regex: escaped, $options: "i" } },
    ];
  }

  let sortObj: Record<string, 1 | -1> = { publishedAt: -1, createdAt: -1 };
  if (query.sort === "popular") {
    sortObj = { enrollmentCount: -1, createdAt: -1 };
  } else if (query.sort === "title") {
    sortObj = { title: 1 };
  }

  const page = query.page || 1;
  const limit = query.limit || 12;
  const skip = (page - 1) * limit;

  const [total, rawCourses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name slug")
      .populate("instructorId", "name bio")
      .lean(),
  ]);

  const courses: CatalogCourseItem[] = rawCourses.map((c) => {
    const cat = c.categoryId as unknown as { _id: Types.ObjectId; name: string; slug: string } | null;
    const inst = c.instructorId as unknown as { _id: Types.ObjectId; name: string } | null;

    return {
      _id: c._id.toString(),
      title: c.title,
      slug: c.slug,
      summary: c.summary,
      thumbnailUrl: c.thumbnailUrl || null,
      level: c.level,
      lessonCount: c.lessonCount || 0,
      enrollmentCount: c.enrollmentCount || 0,
      publishedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
      category: cat ? { _id: cat._id.toString(), name: cat.name, slug: cat.slug } : null,
      instructor: inst ? { _id: inst._id.toString(), name: inst.name } : null,
    };
  });

  return {
    courses,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getCourseBySlug(slug: string) {
  await connectToDatabase();

  const course = await Course.findOne({
    slug: slug.toLowerCase(),
    status: "PUBLISHED",
  })
    .populate("categoryId", "name slug")
    .populate("instructorId", "name bio")
    .lean();

  if (!course) {
    throw new NotFoundError("Course not found");
  }

  const [rawModules, rawLessons] = await Promise.all([
    Module.find({ courseId: course._id }).sort({ order: 1 }).lean(),
    Lesson.find({ courseId: course._id })
      .sort({ order: 1 })
      .select("_id courseId moduleId title order type durationMin isPreview")
      .lean(),
  ]);

  let totalDurationMin = 0;
  const lessonsByModule = new Map<string, typeof rawLessons>();

  for (const lesson of rawLessons) {
    totalDurationMin += lesson.durationMin || 0;
    const modId = lesson.moduleId.toString();
    if (!lessonsByModule.has(modId)) {
      lessonsByModule.set(modId, []);
    }
    lessonsByModule.get(modId)!.push(lesson);
  }

  const modules = rawModules.map((m) => ({
    _id: m._id.toString(),
    title: m.title,
    order: m.order,
    lessons: (lessonsByModule.get(m._id.toString()) || []).map((l) => ({
      _id: l._id.toString(),
      title: l.title,
      order: l.order,
      type: l.type,
      durationMin: l.durationMin || 0,
      isPreview: !!l.isPreview,
    })),
  }));

  const cat = course.categoryId as unknown as { _id: Types.ObjectId; name: string; slug: string } | null;
  const inst = course.instructorId as unknown as { _id: Types.ObjectId; name: string; bio?: string } | null;

  return {
    course: {
      _id: course._id.toString(),
      title: course.title,
      slug: course.slug,
      summary: course.summary,
      description: course.description || "",
      thumbnailUrl: course.thumbnailUrl || null,
      level: course.level,
      lessonCount: course.lessonCount || 0,
      enrollmentCount: course.enrollmentCount || 0,
      publishedAt: course.publishedAt ? course.publishedAt.toISOString() : null,
      createdAt: course.createdAt.toISOString(),
      category: cat ? { _id: cat._id.toString(), name: cat.name, slug: cat.slug } : null,
      instructor: inst ? { _id: inst._id.toString(), name: inst.name, bio: inst.bio || "" } : null,
    },
    modules,
    totalDurationMin,
  };
}

export async function getFeaturedCourses(limit = 6) {
  await connectToDatabase();

  const rawCourses = await Course.find({ status: "PUBLISHED" })
    .sort({ enrollmentCount: -1, publishedAt: -1 })
    .limit(limit)
    .populate("categoryId", "name slug")
    .populate("instructorId", "name")
    .lean();

  return rawCourses.map((c) => {
    const cat = c.categoryId as unknown as { _id: Types.ObjectId; name: string; slug: string } | null;
    const inst = c.instructorId as unknown as { _id: Types.ObjectId; name: string } | null;

    return {
      _id: c._id.toString(),
      title: c.title,
      slug: c.slug,
      summary: c.summary,
      thumbnailUrl: c.thumbnailUrl || null,
      level: c.level,
      lessonCount: c.lessonCount || 0,
      enrollmentCount: c.enrollmentCount || 0,
      category: cat ? { _id: cat._id.toString(), name: cat.name, slug: cat.slug } : null,
      instructor: inst ? { _id: inst._id.toString(), name: inst.name } : null,
    };
  });
}
