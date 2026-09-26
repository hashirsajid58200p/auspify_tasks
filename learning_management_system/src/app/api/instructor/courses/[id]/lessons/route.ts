import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { requireRole } from "@/server/policies/roles";
import {
  createLessonSchema,
  CreateLessonSchema,
  updateLessonSchema,
  UpdateLessonSchema,
  reorderLessonsSchema,
  ReorderLessonsSchema,
} from "@/validations/course";
import {
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from "@/server/services/curriculum";

export const POST = apiHandler<CreateLessonSchema>(
  {
    bodySchema: createLessonSchema,
    rateLimit: {
      maxPoints: 40,
      windowSeconds: 60,
      keyPrefix: "lesson-create",
    },
  },
  async ({ req, params, body }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const lesson = await createLesson(courseId, user, body);

    return NextResponse.json(
      {
        data: lesson,
      },
      { status: 201 }
    );
  }
);

export const PATCH = apiHandler<UpdateLessonSchema>(
  {
    bodySchema: updateLessonSchema,
    rateLimit: {
      maxPoints: 40,
      windowSeconds: 60,
      keyPrefix: "lesson-update",
    },
  },
  async ({ req, params, body }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const lesson = await updateLesson(courseId, user, body);

    return NextResponse.json({
      data: lesson,
    });
  }
);

export const DELETE = apiHandler(
  {
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "lesson-delete",
    },
  },
  async ({ req, params }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const url = new URL(req.url);
    const lessonId = url.searchParams.get("lessonId") || "";

    const result = await deleteLesson(courseId, lessonId, user);
    return NextResponse.json({
      data: result,
    });
  }
);

export const PUT = apiHandler<ReorderLessonsSchema>(
  {
    bodySchema: reorderLessonsSchema,
    rateLimit: {
      maxPoints: 40,
      windowSeconds: 60,
      keyPrefix: "lesson-reorder",
    },
  },
  async ({ req, params, body }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const result = await reorderLessons(
      courseId,
      user,
      body.moduleId,
      body.lessonIds
    );

    return NextResponse.json({
      data: result,
    });
  }
);
