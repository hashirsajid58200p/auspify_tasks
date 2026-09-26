import { apiHandler, NotFoundError } from "@/server/http";
import { updateQuizSchema, UpdateQuizSchema } from "@/validations/quiz";
import {
  getQuizForInstructor,
  updateQuiz,
  deleteQuiz,
} from "@/server/services/quizzes";

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
    const quizId =
      typeof params.qid === "string"
        ? params.qid
        : Array.isArray(params.qid)
        ? params.qid[0]
        : "";

    if (!courseId || !quizId) {
      throw new NotFoundError("Quiz not found");
    }

    const quiz = await getQuizForInstructor(user!, courseId, quizId);
    return { data: quiz };
  }
);

export const PATCH = apiHandler<UpdateQuizSchema>(
  {
    auth: true,
    bodySchema: updateQuizSchema,
  },
  async ({ user, params, body }) => {
    const courseId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";
    const quizId =
      typeof params.qid === "string"
        ? params.qid
        : Array.isArray(params.qid)
        ? params.qid[0]
        : "";

    if (!courseId || !quizId) {
      throw new NotFoundError("Quiz not found");
    }

    const quiz = await updateQuiz(user!, courseId, quizId, body);
    return { data: quiz };
  }
);

export const DELETE = apiHandler(
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
    const quizId =
      typeof params.qid === "string"
        ? params.qid
        : Array.isArray(params.qid)
        ? params.qid[0]
        : "";

    if (!courseId || !quizId) {
      throw new NotFoundError("Quiz not found");
    }

    const result = await deleteQuiz(user!, courseId, quizId);
    return { data: result };
  }
);
