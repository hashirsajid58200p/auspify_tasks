import { apiHandler, NotFoundError } from "@/server/http";
import { getQuizForStudent } from "@/server/services/quizzes";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "quiz:view",
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

    const quiz = await getQuizForStudent(user!, quizId);
    return {
      data: quiz,
    };
  }
);
