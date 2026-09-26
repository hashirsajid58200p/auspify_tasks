import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Course } from "@/server/models/course";
import { Quiz, IQuizQuestion } from "@/server/models/quiz";
import { QuizAttempt, IQuizAttemptAnswer } from "@/server/models/quiz-attempt";
import { Enrollment } from "@/server/models/enrollment";
import { CurrentUser } from "@/server/auth/session";
import { canAccessCourseContent } from "@/server/policies/course-access";
import { recalculateProgress } from "@/server/services/progress";
import { NotFoundError, BadRequestError, ForbiddenError } from "@/server/http";

export interface SubmitAnswerItem {
  questionId: string;
  selectedOptionIds: string[];
}

export async function startOrResumeAttempt(user: CurrentUser, quizId: string) {
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

  const userOid = new Types.ObjectId(user.userId);

  // Check for an existing in-progress attempt
  const existingInProgress = await QuizAttempt.findOne({
    userId: userOid,
    quizId: quiz._id,
    status: "IN_PROGRESS",
  });

  if (existingInProgress) {
    // Check if expired
    if (
      existingInProgress.expiresAt &&
      new Date().getTime() > existingInProgress.expiresAt.getTime() + 10000
    ) {
      existingInProgress.status = "EXPIRED";
      existingInProgress.score = 0;
      existingInProgress.percentage = 0;
      existingInProgress.passed = false;
      await existingInProgress.save();
    } else {
      // Resume existing in-progress attempt!
      return {
        attemptId: existingInProgress._id.toString(),
        attemptNo: existingInProgress.attemptNo,
        status: existingInProgress.status,
        startedAt: existingInProgress.startedAt.toISOString(),
        expiresAt: existingInProgress.expiresAt
          ? existingInProgress.expiresAt.toISOString()
          : null,
        resumed: true,
      };
    }
  }

  // Check attempt limit
  const totalPreviousAttempts = await QuizAttempt.countDocuments({
    userId: userOid,
    quizId: quiz._id,
  });

  if (quiz.maxAttempts > 0 && totalPreviousAttempts >= quiz.maxAttempts) {
    throw new BadRequestError(
      `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.`
    );
  }

  const nextAttemptNo = totalPreviousAttempts + 1;
  const startedAt = new Date();
  const expiresAt = quiz.timeLimitMin
    ? new Date(startedAt.getTime() + quiz.timeLimitMin * 60 * 1000)
    : null;

  const attempt = await QuizAttempt.create({
    userId: userOid,
    quizId: quiz._id,
    courseId: course._id,
    attemptNo: nextAttemptNo,
    status: "IN_PROGRESS",
    answers: [],
    score: 0,
    maxScore: quiz.questions.reduce((acc, q) => acc + q.points, 0),
    percentage: 0,
    passed: false,
    startedAt,
    expiresAt: expiresAt ?? undefined,
  });

  return {
    attemptId: attempt._id.toString(),
    attemptNo: attempt.attemptNo,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: attempt.expiresAt ? attempt.expiresAt.toISOString() : null,
    resumed: false,
  };
}

export async function submitQuizAttempt(
  user: CurrentUser,
  attemptId: string,
  answers: SubmitAnswerItem[]
) {
  if (!Types.ObjectId.isValid(attemptId)) {
    throw new NotFoundError("Attempt not found");
  }

  await connectToDatabase();

  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) {
    throw new NotFoundError("Attempt not found");
  }

  if (attempt.userId.toString() !== user.userId) {
    throw new NotFoundError("Attempt not found");
  }

  if (attempt.status !== "IN_PROGRESS") {
    throw new BadRequestError(
      "This quiz attempt has already been submitted or expired."
    );
  }

  const quiz = await Quiz.findById(attempt.quizId);
  if (!quiz) {
    throw new NotFoundError("Quiz not found");
  }

  const now = new Date();

  // 1. Server-Authoritative Timer & Grace Period (10s buffer)
  if (attempt.expiresAt) {
    const deadlineWithGrace = new Date(attempt.expiresAt.getTime() + 10000);
    if (now > deadlineWithGrace) {
      attempt.status = "EXPIRED";
      attempt.score = 0;
      attempt.percentage = 0;
      attempt.passed = false;
      attempt.submittedAt = now;
      await attempt.save();

      return {
        attemptId: attempt._id.toString(),
        status: "EXPIRED",
        score: 0,
        maxScore: attempt.maxScore,
        percentage: 0,
        passed: false,
        message: "Time limit exceeded. The attempt has been marked as expired.",
      };
    }
  }

  // 2. Server-side Grading
  const answersMap = new Map<string, string[]>();
  for (const a of answers) {
    answersMap.set(a.questionId, a.selectedOptionIds);
  }

  let totalPointsEarned = 0;
  let totalMaxPoints = 0;

  for (const question of quiz.questions) {
    totalMaxPoints += question.points;
    const selectedIds = answersMap.get(question.id) || [];
    const correctIds = question.options
      .filter((o) => o.isCorrect)
      .map((o) => o.id);

    // Exact match comparison
    const isCorrect =
      selectedIds.length === correctIds.length &&
      selectedIds.every((id) => correctIds.includes(id));

    if (isCorrect) {
      totalPointsEarned += question.points;
    }
  }

  const percentage =
    totalMaxPoints > 0
      ? Math.round((totalPointsEarned / totalMaxPoints) * 100)
      : 0;

  const passed = percentage >= quiz.passingPct;

  attempt.answers = answers.map((a) => ({
    questionId: a.questionId,
    selectedOptionIds: a.selectedOptionIds,
  }));
  attempt.score = totalPointsEarned;
  attempt.maxScore = totalMaxPoints;
  attempt.percentage = percentage;
  attempt.passed = passed;
  attempt.status = "SUBMITTED";
  attempt.submittedAt = now;
  await attempt.save();

  // 3. Recalculate progress if required
  if (quiz.isRequired && passed) {
    await recalculateProgress(user.userId, quiz.courseId.toString());
  }

  // 4. Build response review
  const review =
    quiz.showAnswers === "AFTER_SUBMIT"
      ? quiz.questions.map((q) => ({
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          points: q.points,
          explanation: q.explanation || "",
          selectedOptionIds: answersMap.get(q.id) || [],
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        }))
      : null;

  return {
    attemptId: attempt._id.toString(),
    status: attempt.status,
    score: totalPointsEarned,
    maxScore: totalMaxPoints,
    percentage,
    passed,
    passingPct: quiz.passingPct,
    showAnswers: quiz.showAnswers,
    review,
  };
}

export async function getAttemptResult(user: CurrentUser, attemptId: string) {
  if (!Types.ObjectId.isValid(attemptId)) {
    throw new NotFoundError("Attempt not found");
  }

  await connectToDatabase();

  const attempt = await QuizAttempt.findById(attemptId).lean();
  if (!attempt) {
    throw new NotFoundError("Attempt not found");
  }

  const quiz = await Quiz.findById(attempt.quizId).lean();
  if (!quiz) {
    throw new NotFoundError("Quiz not found");
  }

  const course = await Course.findById(quiz.courseId).lean();
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  // Authorization: student who took the attempt, or owning instructor, or admin
  const isOwnerStudent = attempt.userId.toString() === user.userId;
  const isCourseInstructor =
    user.role === "INSTRUCTOR" &&
    course.instructorId.toString() === user.userId;
  const isAdmin = user.role === "ADMIN";

  if (!isOwnerStudent && !isCourseInstructor && !isAdmin) {
    throw new NotFoundError("Attempt not found");
  }

  const answersMap = new Map<string, string[]>();
  for (const a of attempt.answers || []) {
    answersMap.set(a.questionId, a.selectedOptionIds);
  }

  // Reveal correct answers only if showAnswers is AFTER_SUBMIT or user is instructor/admin
  const canSeeAnswers =
    quiz.showAnswers === "AFTER_SUBMIT" || isCourseInstructor || isAdmin;

  const review = canSeeAnswers
    ? quiz.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        points: q.points,
        explanation: q.explanation || "",
        selectedOptionIds: answersMap.get(q.id) || [],
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      }))
    : null;

  return {
    attemptId: attempt._id.toString(),
    quizId: quiz._id.toString(),
    quizTitle: quiz.title,
    courseSlug: course.slug,
    attemptNo: attempt.attemptNo,
    status: attempt.status,
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    passed: attempt.passed,
    passingPct: quiz.passingPct,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
    showAnswers: quiz.showAnswers,
    review,
  };
}
