import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { requireRole } from "@/server/policies/roles";
import { updateCourseSchema, UpdateCourseSchema } from "@/validations/course";
import {
  getCourseWithCurriculum,
  updateCourse,
  deleteCourse,
} from "@/server/services/courses";

export const GET = apiHandler(
  {
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "instructor-course-get",
    },
  },
  async ({ req, params }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const course = await getCourseWithCurriculum(courseId, user);

    return NextResponse.json({
      data: course,
    });
  }
);

export const PATCH = apiHandler<UpdateCourseSchema>(
  {
    bodySchema: updateCourseSchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "instructor-course-update",
    },
  },
  async ({ req, params, body }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const updated = await updateCourse(courseId, user, body);

    return NextResponse.json({
      data: updated,
    });
  }
);

export const DELETE = apiHandler(
  {
    rateLimit: {
      maxPoints: 10,
      windowSeconds: 60,
      keyPrefix: "instructor-course-delete",
    },
  },
  async ({ req, params }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const result = await deleteCourse(courseId, user);

    return NextResponse.json({
      data: result,
    });
  }
);
