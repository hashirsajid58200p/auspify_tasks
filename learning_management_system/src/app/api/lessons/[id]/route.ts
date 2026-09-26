import { apiHandler, NotFoundError } from "@/server/http";
import { getLessonContentForLearning } from "@/server/services/learning";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 120,
      windowSeconds: 60,
      keyPrefix: "lessons:content",
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

    const result = await getLessonContentForLearning(user!, lessonId);
    return {
      data: result,
    };
  }
);
