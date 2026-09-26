import { apiHandler, NotFoundError } from "@/server/http";
import { createQuizSchema, CreateQuizSchema } from "@/validations/quiz";
import {
  createQuiz,
  listQuizzesForInstructor,
} from "@/server/services/quizzes";

export const POST = apiHandler<CreateQuizSchema>(
  {
    auth: true,
    bodySchema: createQuizSchema,
  },
  async ({ user, params, body }) => {
    const courseId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!courseId) {
      throw new NotFoundError("Course not found");
    }

    const quiz = await createQuiz(user!, courseId, body);
    return {
      data: quiz,
      status: 201,
    };
  }
);

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    const courseId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!courseId) {
      throw new NotFoundError("Course not found");
    }

    const quizzes = await listQuizzesForInstructor(user!, courseId);
    return {
      data: quizzes,
    };
  }
);
