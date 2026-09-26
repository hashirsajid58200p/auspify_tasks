import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Course } from "@/server/models/course";
import { Quiz, IQuiz } from "@/server/models/quiz";
import { QuizAttempt } from "@/server/models/quiz-attempt";
import { Enrollment } from "@/server/models/enrollment";
import { CurrentUser } from "@/server/auth/session";
import { assertCourseOwner } from "@/server/policies/ownership";
import { canAccessCourseContent } from "@/server/policies/course-access";
import { NotFoundError, BadRequestError } from "@/server/http";
import { CreateQuizSchema, UpdateQuizSchema } from "@/validations/quiz";

export async function createQuiz(
  user: CurrentUser,
  courseId: string,
  data: CreateQuizSchema
) {
  if (!Types.ObjectId.isValid(courseId)) {
    throw new NotFoundError("Course not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseOwner(course.instructorId, user.userId);

  const quiz = await Quiz.create({
    courseId: course._id,
    moduleId: data.moduleId ? new Types.ObjectId(data.moduleId) : undefined,
    title: data.title,
    description: data.description || "",
    timeLimitMin: data.timeLimitMin || undefined,
    passingPct: data.passingPct,
    maxAttempts: data.maxAttempts,
    shuffle: data.shuffle,
    showAnswers: data.showAnswers,
    isRequired: data.isRequired,
    questions: data.questions,
  });

  return quiz.toObject();
}

export async function updateQuiz(
  user: CurrentUser,
  courseId: string,
  quizId: string,
  data: UpdateQuizSchema
) {
  if (!Types.ObjectId.isValid(courseId) || !Types.ObjectId.isValid(quizId)) {
    throw new NotFoundError("Quiz not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseOwner(course.instructorId, user.userId);

  const quiz = await Quiz.findOne({
    _id: new Types.ObjectId(quizId),
    courseId: course._id,
  });

  if (!quiz) {
    throw new NotFoundError("Quiz not found");
  }

  if (data.title !== undefined) quiz.title = data.title;
  if (data.description !== undefined) quiz.description = data.description;
  if (data.moduleId !== undefined) {
    quiz.moduleId = data.moduleId ? new Types.ObjectId(data.moduleId) : undefined;
  }
  if (data.timeLimitMin !== undefined) {
    quiz.timeLimitMin = data.timeLimitMin || undefined;
  }
  if (data.passingPct !== undefined) quiz.passingPct = data.passingPct;
  if (data.maxAttempts !== undefined) quiz.maxAttempts = data.maxAttempts;
  if (data.shuffle !== undefined) quiz.shuffle = data.shuffle;
  if (data.showAnswers !== undefined) quiz.showAnswers = data.showAnswers;
  if (data.questions !== undefined) {
    quiz.questions = data.questions.map((q) => ({
      ...q,
      points: q.points ?? 1,
      explanation: q.explanation ?? "",
    }));
  }

  await quiz.save();
  return quiz.toObject();
}

export async function deleteQuiz(
  user: CurrentUser,
  courseId: string,
  quizId: string
) {
  if (!Types.ObjectId.isValid(courseId) || !Types.ObjectId.isValid(quizId)) {
    throw new NotFoundError("Quiz not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseOwner(course.instructorId, user.userId);

  const quiz = await Quiz.findOne({
    _id: new Types.ObjectId(quizId),
    courseId: course._id,
  });

  if (!quiz) {
    throw new NotFoundError("Quiz not found");
  }

  // Check if any student has attempts on this quiz
  const hasAttempts = await QuizAttempt.exists({ quizId: quiz._id });
  if (hasAttempts) {
    throw new BadRequestError(
      "Cannot delete a quiz that already has student attempts."
    );
  }

  await Quiz.deleteOne({ _id: quiz._id });
  return { success: true };
}

export async function getQuizForInstructor(
  user: CurrentUser,
  courseId: string,
  quizId: string
) {
  if (!Types.ObjectId.isValid(courseId) || !Types.ObjectId.isValid(quizId)) {
    throw new NotFoundError("Quiz not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseOwner(course.instructorId, user.userId);

  const quiz = await Quiz.findOne({
    _id: new Types.ObjectId(quizId),
    courseId: course._id,
  }).lean();

  if (!quiz) {
    throw new NotFoundError("Quiz not found");
  }

  return quiz;
}

export async function listQuizzesForInstructor(
  user: CurrentUser,
  courseId: string
) {
  if (!Types.ObjectId.isValid(courseId)) {
    throw new NotFoundError("Course not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseOwner(course.instructorId, user.userId);

  return Quiz.find({ courseId: course._id }).sort({ createdAt: 1 }).lean();
}

/**
 * Student-facing quiz loader:
 * NEVER returns `isCorrect` or `explanation` to the client.
 */
export async function getQuizForStudent(
  user: CurrentUser,
  quizId: string
) {
  if (!Types.ObjectId.isValid(quizId)) {
    throw new NotFoundError("Quiz not found");
  }

  await connectToDatabase();

  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) {
    throw new NotFoundError("Quiz not found");
  }

  const course = await Course.findById(quiz.courseId).lean();
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  const enrollment = await Enrollment.findOne({
    userId: new Types.ObjectId(user.userId),
    courseId: course._id,
    status: { $in: ["ACTIVE", "COMPLETED"] },
  });

  const hasAccess = canAccessCourseContent(
    user,
    {
      courseStatus: course.status,
      instructorId: course.instructorId,
    },
    false,
    !!enrollment
  );

  if (!hasAccess) {
    throw new NotFoundError("Quiz not found");
  }

  // Load student's attempt history for this quiz
  const attempts = await QuizAttempt.find({
    userId: new Types.ObjectId(user.userId),
    quizId: quiz._id,
  })
    .sort({ attemptNo: -1 })
    .lean();

  const inProgressAttempt = attempts.find((a) => a.status === "IN_PROGRESS");
  const completedAttempts = attempts.filter((a) => a.status !== "IN_PROGRESS");
  const bestPercentage = completedAttempts.reduce(
    (max, a) => Math.max(max, a.percentage || 0),
    0
  );
  const hasPassed = completedAttempts.some((a) => a.passed);

  // SANITIZE: strip isCorrect and explanation from questions!
  const sanitizedQuestions = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    points: q.points,
    options: q.options.map((o) => ({
      id: o.id,
      text: o.text,
    })),
  }));

  return {
    quiz: {
      _id: quiz._id.toString(),
      courseId: quiz.courseId.toString(),
      moduleId: quiz.moduleId ? quiz.moduleId.toString() : null,
      title: quiz.title,
      description: quiz.description || "",
      timeLimitMin: quiz.timeLimitMin || null,
      passingPct: quiz.passingPct,
      maxAttempts: quiz.maxAttempts,
      isRequired: quiz.isRequired,
      questionCount: quiz.questions.length,
      questions: sanitizedQuestions,
    },
    course: {
      _id: course._id.toString(),
      title: course.title,
      slug: course.slug,
    },
    userStatus: {
      attemptsCount: completedAttempts.length,
      maxAttempts: quiz.maxAttempts,
      hasPassed,
      bestPercentage,
      activeAttempt: inProgressAttempt
        ? {
            _id: inProgressAttempt._id.toString(),
            attemptNo: inProgressAttempt.attemptNo,
            startedAt: inProgressAttempt.startedAt.toISOString(),
            expiresAt: inProgressAttempt.expiresAt
              ? inProgressAttempt.expiresAt.toISOString()
              : null,
          }
        : null,
    },
  };
}
