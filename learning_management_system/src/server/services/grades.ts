import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Enrollment } from "@/server/models/enrollment";
import { Course } from "@/server/models/course";
import { Quiz } from "@/server/models/quiz";
import { QuizAttempt } from "@/server/models/quiz-attempt";
import { Assignment } from "@/server/models/assignment";
import { Submission } from "@/server/models/submission";

export interface QuizGradeItem {
  id: string;
  title: string;
  maxScore: number;
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
  attemptCount: number;
  submittedAt: Date | null;
}

export interface AssignmentGradeItem {
  id: string;
  title: string;
  maxPoints: number;
  grade: number | null;
  status: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
  feedback: string | null;
  isLate: boolean;
  submittedAt: Date | null;
}

export interface CourseGradeSummary {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  level: string;
  progressPct: number;
  enrollmentStatus: string;
  totalPossiblePoints: number;
  totalEarnedPoints: number;
  overallPercentage: number | null;
  letterGrade: string;
  quizzes: QuizGradeItem[];
  assignments: AssignmentGradeItem[];
}

export function calculateLetterGrade(pct: number | null): string {
  if (pct === null) return "N/A";
  if (pct >= 93) return "A";
  if (pct >= 90) return "A-";
  if (pct >= 87) return "B+";
  if (pct >= 83) return "B";
  if (pct >= 80) return "B-";
  if (pct >= 77) return "C+";
  if (pct >= 73) return "C";
  if (pct >= 70) return "C-";
  if (pct >= 60) return "D";
  return "F";
}

export async function getStudentGrades(studentId: string): Promise<CourseGradeSummary[]> {
  await connectToDatabase();

  const userOid = new Types.ObjectId(studentId);
  const enrollments = await Enrollment.find({ userId: userOid })
    .populate<{ courseId: { _id: Types.ObjectId; title: string; slug: string; level: string; status: string } }>(
      "courseId",
      "title slug level status"
    )
    .lean();

  const summaries: CourseGradeSummary[] = [];

  for (const enr of enrollments) {
    if (!enr.courseId) continue;
    const course = enr.courseId;
    const courseOid = course._id;

    // Fetch course quizzes and assignments
    const [quizzes, assignments] = await Promise.all([
      Quiz.find({ courseId: courseOid }).sort({ order: 1 }).lean(),
      Assignment.find({ courseId: courseOid }).sort({ order: 1 }).lean(),
    ]);

    let totalPossible = 0;
    let totalEarned = 0;
    let gradedItemsCount = 0;

    // Quiz Grades
    const quizItems: QuizGradeItem[] = [];
    for (const q of quizzes) {
      const attempts = await QuizAttempt.find({
        userId: userOid,
        quizId: q._id,
      })
        .sort({ score: -1 })
        .lean();

      const bestAttempt = attempts[0] || null;
      const maxScore =
        q.questions?.reduce((acc: number, item: { points?: number }) => acc + (item.points || 1), 0) || 100;
      totalPossible += maxScore;

      if (bestAttempt) {
        totalEarned += bestAttempt.score;
        gradedItemsCount++;
        quizItems.push({
          id: q._id.toString(),
          title: q.title,
          maxScore,
          score: bestAttempt.score,
          percentage: bestAttempt.percentage,
          passed: bestAttempt.passed,
          attemptCount: attempts.length,
          submittedAt: bestAttempt.submittedAt || bestAttempt.createdAt,
        });
      } else {
        quizItems.push({
          id: q._id.toString(),
          title: q.title,
          maxScore,
          score: null,
          percentage: null,
          passed: null,
          attemptCount: 0,
          submittedAt: null,
        });
      }
    }

    // Assignment Grades
    const assignmentItems: AssignmentGradeItem[] = [];
    for (const a of assignments) {
      const sub = await Submission.findOne({
        userId: userOid,
        assignmentId: a._id,
      }).lean();

      totalPossible += a.maxPoints;

      if (sub) {
        if (sub.status === "GRADED" && typeof sub.grade === "number") {
          totalEarned += sub.grade;
          gradedItemsCount++;
        }
        assignmentItems.push({
          id: a._id.toString(),
          title: a.title,
          maxPoints: a.maxPoints,
          grade: typeof sub.grade === "number" ? sub.grade : null,
          status: sub.status,
          feedback: sub.feedback || null,
          isLate: sub.isLate,
          submittedAt: sub.submittedAt,
        });
      } else {
        assignmentItems.push({
          id: a._id.toString(),
          title: a.title,
          maxPoints: a.maxPoints,
          grade: null,
          status: "NOT_SUBMITTED",
          feedback: null,
          isLate: false,
          submittedAt: null,
        });
      }
    }

    const overallPercentage =
      totalPossible > 0 && gradedItemsCount > 0
        ? Math.round((totalEarned / totalPossible) * 100)
        : null;

    summaries.push({
      courseId: courseOid.toString(),
      courseTitle: course.title,
      courseSlug: course.slug,
      level: course.level,
      progressPct: enr.progressPct,
      enrollmentStatus: enr.status,
      totalPossiblePoints: totalPossible,
      totalEarnedPoints: totalEarned,
      overallPercentage,
      letterGrade: calculateLetterGrade(overallPercentage),
      quizzes: quizItems,
      assignments: assignmentItems,
    });
  }

  return summaries;
}
