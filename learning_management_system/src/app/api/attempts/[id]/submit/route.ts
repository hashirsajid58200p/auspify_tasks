import { apiHandler, NotFoundError } from "@/server/http";
import {
  submitQuizAttemptSchema,
  SubmitQuizAttemptSchema,
} from "@/validations/quiz";
import { submitQuizAttempt } from "@/server/services/attempts";

export const POST = apiHandler<SubmitQuizAttemptSchema>(
  {
    auth: true,
    bodySchema: submitQuizAttemptSchema,
    rateLimit: {
      maxPoints: 15,
      windowSeconds: 60,
      keyPrefix: "quiz:attempt:submit",
    },
  },
  async ({ user, params, body }) => {
    const attemptId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!attemptId) {
      throw new NotFoundError("Attempt not found");
    }

    const result = await submitQuizAttempt(user!, attemptId, body.answers);
    return {
      data: result,
    };
  }
);
