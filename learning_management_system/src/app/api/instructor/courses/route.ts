import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { requireRole } from "@/server/policies/roles";
import { createCourseSchema, CreateCourseSchema } from "@/validations/course";
import { listInstructorCourses, createCourse } from "@/server/services/courses";

export const GET = apiHandler(
  {
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "instructor-courses-list",
    },
  },
  async ({ req }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const status = url.searchParams.get("status") || undefined;

    const result = await listInstructorCourses(user, page, limit, status);
    return NextResponse.json({
      data: result.items,
      meta: result.meta,
    });
  }
);

export const POST = apiHandler<CreateCourseSchema>(
  {
    bodySchema: createCourseSchema,
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "instructor-course-create",
    },
  },
  async ({ req, body }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const course = await createCourse(user, body);
    return NextResponse.json(
      {
        data: course,
      },
      { status: 201 }
    );
  }
);
