import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Course } from "@/server/models/course";
import { Module } from "@/server/models/module";
import { Lesson, LessonType } from "@/server/models/lesson";
import { CurrentUser } from "@/server/auth/session";
import { assertCourseOwner } from "@/server/policies/ownership";
import { NotFoundError, BadRequestError } from "@/server/http";
import { parseVideoUrl } from "@/lib/video";
import {
  CreateModuleSchema,
  UpdateModuleSchema,
  CreateLessonSchema,
  UpdateLessonSchema,
} from "@/validations/course";

async function assertCourseInstructor(courseId: string, actor: CurrentUser) {
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

  return course;
}

export async function createModule(
  courseId: string,
  actor: CurrentUser,
  input: CreateModuleSchema
) {
  await connectToDatabase();
  const course = await assertCourseInstructor(courseId, actor);

  let order = input.order;
  if (order === undefined) {
    const lastModule = await Module.findOne({ courseId: course._id }).sort({ order: -1 }).lean();
    order = lastModule ? lastModule.order + 1 : 0;
  }

  const courseModule = await Module.create({
    courseId: course._id,
    title: input.title,
    order,
  });

  return {
    id: courseModule._id.toString(),
    courseId: course._id.toString(),
    title: courseModule.title,
    order: courseModule.order,
  };
}

export async function updateModule(
  courseId: string,
  actor: CurrentUser,
  input: UpdateModuleSchema
) {
  await connectToDatabase();
  const course = await assertCourseInstructor(courseId, actor);

  const courseModule = await Module.findOne({
    _id: new Types.ObjectId(input.moduleId),
    courseId: course._id,
  });

  if (!courseModule) {
    throw new NotFoundError("Module not found");
  }

  if (input.title !== undefined) courseModule.title = input.title;
  if (input.order !== undefined) courseModule.order = input.order;

  await courseModule.save();

  return {
    id: courseModule._id.toString(),
    title: courseModule.title,
    order: courseModule.order,
  };
}

export async function deleteModule(
  courseId: string,
  moduleId: string,
  actor: CurrentUser
) {
  await connectToDatabase();
  const course = await assertCourseInstructor(courseId, actor);

  if (!Types.ObjectId.isValid(moduleId)) {
    throw new NotFoundError("Module not found");
  }

  const courseModule = await Module.findOne({
    _id: new Types.ObjectId(moduleId),
    courseId: course._id,
  });

  if (!courseModule) {
    throw new NotFoundError("Module not found");
  }

  // Delete lessons belonging to this module
  await Lesson.deleteMany({ moduleId: courseModule._id });
  await Module.findByIdAndDelete(courseModule._id);

  // Recalculate lesson count
  const remainingLessons = await Lesson.countDocuments({ courseId: course._id });
  course.lessonCount = remainingLessons;
  await course.save();

  return { success: true };
}

export async function reorderModules(
  courseId: string,
  actor: CurrentUser,
  moduleIds: string[]
) {
  await connectToDatabase();
  const course = await assertCourseInstructor(courseId, actor);

  const bulkOps = moduleIds.map((id, index) => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(id), courseId: course._id },
      update: { $set: { order: index } },
    },
  }));

  if (bulkOps.length > 0) {
    await Module.bulkWrite(bulkOps);
  }

  return { success: true };
}

export async function createLesson(
  courseId: string,
  actor: CurrentUser,
  input: CreateLessonSchema
) {
  await connectToDatabase();
  const course = await assertCourseInstructor(courseId, actor);

  const courseModule = await Module.findOne({
    _id: new Types.ObjectId(input.moduleId),
    courseId: course._id,
  });

  if (!courseModule) {
    throw new BadRequestError("Target module does not belong to this course");
  }

  let finalVideoUrl: string | null = null;
  if (input.type === "VIDEO") {
    if (!input.videoUrl) {
      throw new BadRequestError("Video URL is required for video lessons");
    }
    const parsed = parseVideoUrl(input.videoUrl);
    if (!parsed) {
      throw new BadRequestError("Invalid video URL. Only YouTube and Vimeo are supported.");
    }
    finalVideoUrl = parsed.embedUrl;
  }

  const lastLesson = await Lesson.findOne({
    courseId: course._id,
    moduleId: courseModule._id,
  })
    .sort({ order: -1 })
    .lean();

  const nextOrder = lastLesson ? lastLesson.order + 1 : 0;

  const lesson = await Lesson.create({
    courseId: course._id,
    moduleId: courseModule._id,
    title: input.title,
    order: nextOrder,
    type: input.type as LessonType,
    videoUrl: finalVideoUrl,
    content: input.content || "",
    durationMin: input.durationMin || 0,
    isPreview: input.isPreview || false,
  });

  // Update denormalized lessonCount on Course
  course.lessonCount = await Lesson.countDocuments({ courseId: course._id });
  await course.save();

  return {
    id: lesson._id.toString(),
    moduleId: lesson.moduleId.toString(),
    title: lesson.title,
    order: lesson.order,
    type: lesson.type,
    videoUrl: lesson.videoUrl,
    durationMin: lesson.durationMin,
    isPreview: lesson.isPreview,
  };
}

export async function updateLesson(
  courseId: string,
  actor: CurrentUser,
  input: UpdateLessonSchema
) {
  await connectToDatabase();
  const course = await assertCourseInstructor(courseId, actor);

  const lesson = await Lesson.findOne({
    _id: new Types.ObjectId(input.lessonId),
    courseId: course._id,
  });

  if (!lesson) {
    throw new NotFoundError("Lesson not found");
  }

  if (input.title !== undefined) lesson.title = input.title;
  if (input.type !== undefined) lesson.type = input.type as LessonType;
  if (input.content !== undefined) lesson.content = input.content;
  if (input.durationMin !== undefined) lesson.durationMin = input.durationMin;
  if (input.isPreview !== undefined) lesson.isPreview = input.isPreview;

  if (input.videoUrl !== undefined) {
    if (input.videoUrl) {
      const parsed = parseVideoUrl(input.videoUrl);
      if (!parsed) {
        throw new BadRequestError("Invalid video URL. Only YouTube and Vimeo are supported.");
      }
      lesson.videoUrl = parsed.embedUrl;
    } else {
      lesson.videoUrl = null;
    }
  }

  if (input.moduleId !== undefined) {
    const newModule = await Module.findOne({
      _id: new Types.ObjectId(input.moduleId),
      courseId: course._id,
    });
    if (!newModule) {
      throw new BadRequestError("Destination module not found in this course");
    }
    lesson.moduleId = newModule._id;
  }

  await lesson.save();

  return {
    id: lesson._id.toString(),
    title: lesson.title,
    type: lesson.type,
    videoUrl: lesson.videoUrl,
    durationMin: lesson.durationMin,
    isPreview: lesson.isPreview,
  };
}

export async function deleteLesson(
  courseId: string,
  lessonId: string,
  actor: CurrentUser
) {
  await connectToDatabase();
  const course = await assertCourseInstructor(courseId, actor);

  if (!Types.ObjectId.isValid(lessonId)) {
    throw new NotFoundError("Lesson not found");
  }

  const lesson = await Lesson.findOneAndDelete({
    _id: new Types.ObjectId(lessonId),
    courseId: course._id,
  });

  if (!lesson) {
    throw new NotFoundError("Lesson not found");
  }

  course.lessonCount = await Lesson.countDocuments({ courseId: course._id });
  await course.save();

  return { success: true };
}

export async function reorderLessons(
  courseId: string,
  actor: CurrentUser,
  moduleId: string,
  lessonIds: string[]
) {
  await connectToDatabase();
  const course = await assertCourseInstructor(courseId, actor);

  const bulkOps = lessonIds.map((id, index) => ({
    updateOne: {
      filter: {
        _id: new Types.ObjectId(id),
        courseId: course._id,
        moduleId: new Types.ObjectId(moduleId),
      },
      update: { $set: { order: index } },
    },
  }));

  if (bulkOps.length > 0) {
    await Lesson.bulkWrite(bulkOps);
  }

  return { success: true };
}
