import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Course } from "@/server/models/course";
import { Lesson } from "@/server/models/lesson";
import { Quiz } from "@/server/models/quiz";
import { QuizAttempt } from "@/server/models/quiz-attempt";
import { Assignment } from "@/server/models/assignment";
import { Submission } from "@/server/models/submission";
import { Enrollment } from "@/server/models/enrollment";
import { LessonProgress } from "@/server/models/lesson-progress";
import { CurrentUser } from "@/server/auth/session";
import { canAccessCourseContent } from "@/server/policies/course-access";
import { NotFoundError } from "@/server/http";
import { issueCertificate } from "@/server/services/certificates";

export interface ProgressRecalculationResult {
  progressPct: number;
  isCompleted: boolean;
  totalRequired: number;
  completedCount: number;
}

export async function recalculateProgress(
  userId: string,
  courseId: string
): Promise<ProgressRecalculationResult> {
  await connectToDatabase();

  const userOid = new Types.ObjectId(userId);
  const courseOid = new Types.ObjectId(courseId);

  const [totalLessons, completedLessons, requiredQuizzes, requiredAssignments] =
    await Promise.all([
      Lesson.countDocuments({ courseId: courseOid }),
      LessonProgress.countDocuments({ userId: userOid, courseId: courseOid }),
      Quiz.find({ courseId: courseOid, isRequired: true }).select("_id").lean(),
      Assignment.find({ courseId: courseOid, isRequired: true }).select("_id").lean(),
    ]);

  let passedQuizzesCount = 0;
  if (requiredQuizzes.length > 0) {
    const passedQuizIds = await QuizAttempt.distinct("quizId", {
      userId: userOid,
      courseId: courseOid,
      passed: true,
      quizId: { $in: requiredQuizzes.map((q) => q._id) },
    });
    passedQuizzesCount = passedQuizIds.length;
  }

  let submittedAssignmentsCount = 0;
  if (requiredAssignments.length > 0) {
    const submittedAsgnIds = await Submission.distinct("assignmentId", {
      userId: userOid,
      courseId: courseOid,
      status: { $in: ["SUBMITTED", "GRADED"] },
      assignmentId: { $in: requiredAssignments.map((a) => a._id) },
    });
    submittedAssignmentsCount = submittedAsgnIds.length;
  }

  const totalRequired =
    totalLessons + requiredQuizzes.length + requiredAssignments.length;
  const completedCount =
    completedLessons + passedQuizzesCount + submittedAssignmentsCount;

  const progressPct =
    totalRequired > 0
      ? Math.min(100, Math.round((completedCount / totalRequired) * 100))
      : 0;

  const isCompleted = progressPct === 100 && totalRequired > 0;

  const enrollment = await Enrollment.findOne({
    userId: userOid,
    courseId: courseOid,
  });

  if (enrollment) {
    enrollment.progressPct = progressPct;

    if (isCompleted) {
      if (enrollment.status !== "COMPLETED") {
        enrollment.status = "COMPLETED";
        enrollment.completedAt = new Date();
      }
    } else {
      if (enrollment.status === "COMPLETED") {
        enrollment.status = "ACTIVE";
        enrollment.completedAt = undefined;
      }
    }

    await enrollment.save();

    if (isCompleted) {
      try {
        await issueCertificate(userOid, courseOid);
      } catch (err) {
        console.error("Auto-issue certificate error:", err);
      }
    }
  }

  return {
    progressPct,
    isCompleted,
    totalRequired,
    completedCount: completedLessons,
  };
}

export async function completeLesson(
  user: CurrentUser,
  lessonId: string
): Promise<ProgressRecalculationResult> {
  if (!Types.ObjectId.isValid(lessonId)) {
    throw new NotFoundError("Lesson not found");
  }

  await connectToDatabase();

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new NotFoundError("Lesson not found");
  }

  const course = await Course.findById(lesson.courseId);
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
    lesson.isPreview,
    !!enrollment
  );

  if (!hasAccess) {
    throw new NotFoundError("Lesson not found");
  }

  // Idempotent completion record
  await LessonProgress.findOneAndUpdate(
    {
      userId: new Types.ObjectId(user.userId),
      lessonId: lesson._id,
    },
    {
      userId: new Types.ObjectId(user.userId),
      courseId: course._id,
      lessonId: lesson._id,
      completedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // Update last accessed lesson on enrollment
  if (enrollment) {
    enrollment.lastLessonId = lesson._id;
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();
  }

  return recalculateProgress(user.userId, course._id.toString());
}

export async function uncompleteLesson(
  user: CurrentUser,
  lessonId: string
): Promise<ProgressRecalculationResult> {
  if (!Types.ObjectId.isValid(lessonId)) {
    throw new NotFoundError("Lesson not found");
  }

  await connectToDatabase();

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new NotFoundError("Lesson not found");
  }

  const course = await Course.findById(lesson.courseId);
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
    lesson.isPreview,
    !!enrollment
  );

  if (!hasAccess) {
    throw new NotFoundError("Lesson not found");
  }

  await LessonProgress.deleteOne({
    userId: new Types.ObjectId(user.userId),
    lessonId: lesson._id,
  });

  return recalculateProgress(user.userId, course._id.toString());
}
