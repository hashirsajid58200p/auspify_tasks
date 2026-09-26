import { apiHandler, NotFoundError } from "@/server/http";
import { completeLesson, uncompleteLesson } from "@/server/services/progress";

export const POST = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "lessons:complete",
    },
  },
  async ({ user, params }) => {
    const lessonId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!lessonId) {
      throw new NotFoundError("Lesson not found");
    }

    const result = await completeLesson(user!, lessonId);
    return {
      data: result,
    };
  }
);

export const DELETE = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "lessons:uncomplete",
    },
  },
  async ({ user, params }) => {
    const lessonId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!lessonId) {
      throw new NotFoundError("Lesson not found");
    }

    const result = await uncompleteLesson(user!, lessonId);
    return {
      data: result,
    };
  }
);
