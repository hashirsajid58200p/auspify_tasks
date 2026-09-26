import { apiHandler, NotFoundError } from "@/server/http";
import { enrollStudent, dropCourse } from "@/server/services/enrollments";

export const POST = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "courses:enroll",
    },
  },
  async ({ user, params }) => {
    const courseId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
    if (!courseId) {
      throw new NotFoundError("Course not found");
    }

    const result = await enrollStudent(user!.userId, courseId);
    return {
      data: result,
      status: result.alreadyEnrolled ? 200 : 201,
    };
  }
);

export const DELETE = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "courses:drop",
    },
  },
  async ({ user, params }) => {
    const courseId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
    if (!courseId) {
      throw new NotFoundError("Course not found");
    }

    const result = await dropCourse(user!.userId, courseId);
    return {
      data: result,
    };
  }
);
