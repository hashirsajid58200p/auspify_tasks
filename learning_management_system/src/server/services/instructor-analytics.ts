import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Course } from "@/server/models/course";
import { Enrollment } from "@/server/models/enrollment";
import { Submission } from "@/server/models/submission";
import { Quiz } from "@/server/models/quiz";
import { QuizAttempt } from "@/server/models/quiz-attempt";

export interface StudentProgressRow {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  progressPct: number;
  status: string;
  enrolledAt: Date;
  lastAccessedAt: Date;
}

export interface QuizStatItem {
  quizId: string;
  quizTitle: string;
  courseTitle: string;
  totalAttempts: number;
  avgScore: number;
  passRatePct: number;
}

export interface PendingSubmissionItem {
  id: string;
  assignmentTitle: string;
  courseTitle: string;
  studentName: string;
  submittedAt: Date;
  isLate: boolean;
}

export interface InstructorDashboardMetrics {
  overview: {
    totalCourses: number;
    publishedCourses: number;
    totalStudents: number;
    completedStudents: number;
    pendingSubmissionsCount: number;
  };
  pendingSubmissions: PendingSubmissionItem[];
  studentProgress: StudentProgressRow[];
  quizStats: QuizStatItem[];
}

export async function getInstructorDashboardData(
  instructorId: string
): Promise<InstructorDashboardMetrics> {
  await connectToDatabase();

  const instructorOid = new Types.ObjectId(instructorId);
  const courses = await Course.find({ instructorId: instructorOid })
    .select("_id title slug status")
    .lean();

  const courseIds = courses.map((c) => c._id);
  const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

  if (courseIds.length === 0) {
    return {
      overview: {
        totalCourses: 0,
        publishedCourses: 0,
        totalStudents: 0,
        completedStudents: 0,
        pendingSubmissionsCount: 0,
      },
      pendingSubmissions: [],
      studentProgress: [],
      quizStats: [],
    };
  }

  // 1. Overview counts
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === "PUBLISHED").length;

  const [totalStudents, completedStudents, pendingSubmissionsCount] =
    await Promise.all([
      Enrollment.countDocuments({ courseId: { $in: courseIds } }),
      Enrollment.countDocuments({
        courseId: { $in: courseIds },
        status: "COMPLETED",
      }),
      Submission.countDocuments({
        courseId: { $in: courseIds },
        status: "SUBMITTED",
      }),
    ]);

  // 2. Pending submissions list (latest 10)
  const pendingSubs = await Submission.find({
    courseId: { $in: courseIds },
    status: "SUBMITTED",
  })
    .sort({ submittedAt: -1 })
    .limit(10)
    .populate<{ userId: { name: string } }>("userId", "name")
    .populate<{ assignmentId: { title: string } }>("assignmentId", "title")
    .lean();

  const pendingSubmissions: PendingSubmissionItem[] = pendingSubs.map((s) => ({
    id: s._id.toString(),
    assignmentTitle: s.assignmentId?.title || "Assignment",
    courseTitle: courseMap.get(s.courseId.toString())?.title || "Course",
    studentName: s.userId?.name || "Student",
    submittedAt: s.submittedAt,
    isLate: s.isLate,
  }));

  // 3. Per-student progress rows
  const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate<{ userId: { _id: Types.ObjectId; name: string; email: string } }>(
      "userId",
      "name email"
    )
    .lean();

  const studentProgress: StudentProgressRow[] = enrollments.map((e) => {
    const course = courseMap.get(e.courseId.toString());
    return {
      enrollmentId: e._id.toString(),
      studentId: e.userId?._id?.toString() || "",
      studentName: e.userId?.name || "Student",
      studentEmail: e.userId?.email || "",
      courseId: e.courseId.toString(),
      courseTitle: course?.title || "Course",
      courseSlug: course?.slug || "",
      progressPct: e.progressPct,
      status: e.status,
      enrolledAt: e.createdAt,
      lastAccessedAt: e.lastAccessedAt,
    };
  });

  // 4. Quiz Statistics
  const quizzes = await Quiz.find({ courseId: { $in: courseIds } })
    .select("_id title courseId")
    .lean();

  const quizStats: QuizStatItem[] = [];

  for (const q of quizzes) {
    const statsAgg = await QuizAttempt.aggregate([
      { $match: { quizId: q._id } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          avgScore: { $avg: "$score" },
          passedCount: {
            $sum: { $cond: [{ $eq: ["$passed", true] }, 1, 0] },
          },
        },
      },
    ]);

    const stat = statsAgg[0] || {
      totalAttempts: 0,
      avgScore: 0,
      passedCount: 0,
    };

    const passRate =
      stat.totalAttempts > 0
        ? Math.round((stat.passedCount / stat.totalAttempts) * 100)
        : 0;

    quizStats.push({
      quizId: q._id.toString(),
      quizTitle: q.title,
      courseTitle: courseMap.get(q.courseId.toString())?.title || "Course",
      totalAttempts: stat.totalAttempts,
      avgScore: Math.round(stat.avgScore * 10) / 10,
      passRatePct: passRate,
    });
  }

  return {
    overview: {
      totalCourses,
      publishedCourses,
      totalStudents,
      completedStudents,
      pendingSubmissionsCount,
    },
    pendingSubmissions,
    studentProgress,
    quizStats,
  };
}
