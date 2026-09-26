import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Types } from "mongoose";
import {
  BookOpen,
  Award,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
  Clock,
  TrendingUp,
  Calendar,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { requireServerUser } from "@/server/auth/server-session";
import { getUserEnrollments } from "@/server/services/enrollments";
import { getStudentGrades } from "@/server/services/grades";
import { Assignment } from "@/server/models/assignment";
import { Course } from "@/server/models/course";

export const metadata: Metadata = {
  title: "Student Dashboard | EduFlow LMS",
};

export default async function StudentDashboardPage() {
  const user = await requireServerUser(["STUDENT"]);
  const enrollments = await getUserEnrollments(user.userId);
  const grades = await getStudentGrades(user.userId);

  const activeCourses = enrollments.filter((e) => e.status === "ACTIVE");
  const completedCourses = enrollments.filter((e) => e.status === "COMPLETED");
  const recentCourse = activeCourses[0] || enrollments[0] || null;

  const totalProgress = enrollments.reduce((acc, e) => acc + e.progressPct, 0);
  const avgProgress =
    enrollments.length > 0 ? Math.round(totalProgress / enrollments.length) : null;

  // Upcoming deadlines from enrolled courses
  const enrolledCourseIds = enrollments.map((e) => new Types.ObjectId(e.courseId));
  const upcomingAssignments = await Assignment.find({
    courseId: { $in: enrolledCourseIds },
    dueAt: { $gte: new Date() },
  })
    .sort({ dueAt: 1 })
    .limit(3)
    .populate<{ courseId: { title: string; slug: string } }>("courseId", "title slug")
    .lean();

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track your course progress, upcoming deadlines, and earned credentials.
          </p>
        </div>
        <Button size="sm" className="rounded-xl shadow-xs" asChild>
          <Link href="/courses">
            <BookOpen className="w-4 h-4 mr-2" />
            Browse Courses
          </Link>
        </Button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
              Active Courses
            </span>
            <BookOpen className="w-4 h-4 opacity-80" />
          </div>
          <div className="mt-3 text-3xl font-extrabold">{activeCourses.length}</div>
          <p className="mt-1 text-xs opacity-80">Currently in progress</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">
            {completedCourses.length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">100% finished</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Avg. Progress
            </span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">
            {avgProgress !== null ? `${avgProgress}%` : "--"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Across all courses</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Certificates
            </span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">
            {completedCourses.length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Earned credentials</p>
        </Card>
      </div>

      {/* Main Content: Continue Learning + Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Continue Learning Spotlight (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                Continue Learning
              </h2>
              {enrollments.length > 1 && (
                <Link
                  href="/my-courses"
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  View all ({enrollments.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {recentCourse ? (
              <Card className="p-6 rounded-2xl border-border bg-card shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="relative aspect-video w-full sm:w-48 rounded-xl overflow-hidden bg-muted/60 shrink-0">
                    {recentCourse.thumbnailUrl ? (
                      <Image
                        src={recentCourse.thumbnailUrl}
                        alt={recentCourse.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {recentCourse.category && (
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                          {recentCourse.category.name}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {recentCourse.level}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-lg text-foreground hover:text-primary transition-colors">
                      <Link href={`/learn/${recentCourse.slug}`}>
                        {recentCourse.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {recentCourse.summary}
                    </p>
                  </div>
                </div>

                {/* Progress bar and button */}
                <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 max-w-md space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Completion</span>
                      <span className="font-bold text-primary">{recentCourse.progressPct}%</span>
                    </div>
                    <Progress value={recentCourse.progressPct} className="h-2" />
                  </div>

                  <Button
                    size="sm"
                    className="rounded-xl h-10 px-5 text-xs font-semibold gap-1.5 shadow-md bg-primary text-primary-foreground self-start sm:self-auto"
                    asChild
                  >
                    <Link href={`/learn/${recentCourse.slug}`}>
                      <PlayCircle className="w-4 h-4" />
                      Resume Course
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="rounded-2xl border-border bg-card p-12 text-center space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/60" />
                <h3 className="text-base font-semibold text-foreground">
                  No courses in progress
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Browse our catalog of published courses and enroll to jumpstart your career.
                </p>
                <Button size="sm" className="rounded-xl mt-2" asChild>
                  <Link href="/courses">Explore Catalog</Link>
                </Button>
              </Card>
            )}
          </div>

          {/* Recent Course Grades summary */}
          {grades.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Recent Grades & Standing
                </h2>
                <Link
                  href="/grades"
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  Full report
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {grades.slice(0, 2).map((g) => (
                  <div
                    key={g.courseId}
                    className="p-4 rounded-xl border border-border/70 bg-card shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground line-clamp-1">
                        {g.courseTitle}
                      </p>
                      <p className="text-2xs text-muted-foreground mt-0.5">
                        {g.totalEarnedPoints} / {g.totalPossiblePoints} points earned
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-foreground">
                        {g.letterGrade !== "N/A" ? g.letterGrade : "—"}
                      </span>
                      {g.overallPercentage !== null && (
                        <p className="text-2xs text-muted-foreground">
                          {g.overallPercentage}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Info / Quick Links (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Deadlines Widget */}
          <Card className="p-5 rounded-2xl border-border bg-card space-y-3 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              Upcoming Deadlines
            </h3>

            {upcomingAssignments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                No approaching deadlines found. You are all caught up!
              </p>
            ) : (
              <div className="space-y-2.5">
                {upcomingAssignments.map((asgn) => (
                  <div
                    key={asgn._id.toString()}
                    className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground line-clamp-1">
                        {asgn.title}
                      </span>
                      <Badge variant="outline" className="text-2xs shrink-0 text-amber-600 border-amber-500/30">
                        {asgn.dueAt ? new Date(asgn.dueAt).toLocaleDateString() : ""}
                      </Badge>
                    </div>
                    <p className="text-2xs text-muted-foreground line-clamp-1">
                      {asgn.courseId?.title || "Course"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Links Card */}
          <Card className="p-5 rounded-2xl border-border bg-card space-y-3 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Learning Milestones
            </h3>
            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60">
                <span className="font-medium text-foreground">Active Courses</span>
                <span className="font-bold text-primary">{activeCourses.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60">
                <span className="font-medium text-foreground">Completed Courses</span>
                <span className="font-bold text-emerald-500">{completedCourses.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60">
                <span className="font-medium text-foreground">Certificates</span>
                <span className="font-bold text-purple-500">{completedCourses.length}</span>
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="outline" size="sm" className="w-full rounded-xl text-xs" asChild>
                <Link href="/certificates">View My Certificates</Link>
              </Button>
              <Button variant="ghost" size="sm" className="w-full rounded-xl text-xs" asChild>
                <Link href="/my-courses">View All My Courses</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
