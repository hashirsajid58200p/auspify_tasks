import { apiHandler, NotFoundError } from "@/server/http";
import { startOrResumeAttempt } from "@/server/services/attempts";

export const POST = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 10,
      windowSeconds: 60,
      keyPrefix: "quiz:attempt:start",
    },
  },
  async ({ user, params }) => {
    const quizId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!quizId) {
      throw new NotFoundError("Quiz not found");
    }

    const attempt = await startOrResumeAttempt(user!, quizId);
    return {
      data: attempt,
      status: attempt.resumed ? 200 : 201,
    };
  }
);
