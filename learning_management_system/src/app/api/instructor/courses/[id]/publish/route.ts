import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { requireRole } from "@/server/policies/roles";
import {
  courseStatusActionSchema,
  CourseStatusActionSchema,
} from "@/validations/course";
import {
  checkCoursePublishReadiness,
  updateCourseStatus,
} from "@/server/services/courses";

export const GET = apiHandler(
  {
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "course-publish-check",
    },
  },
  async ({ req, params }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const readiness = await checkCoursePublishReadiness(courseId);

    return NextResponse.json({
      data: readiness,
    });
  }
);

export const POST = apiHandler<CourseStatusActionSchema>(
  {
    bodySchema: courseStatusActionSchema,
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "course-publish-action",
    },
  },
  async ({ req, params, body }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const result = await updateCourseStatus(courseId, user, body.action);

    return NextResponse.json({
      data: result,
    });
  }
);
