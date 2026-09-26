"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle2,
  FileText,
  HelpCircle,
  TrendingUp,
  Search,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InstructorDashboardMetrics } from "@/server/services/instructor-analytics";

interface InstructorDashboardViewProps {
  initialData: InstructorDashboardMetrics;
}

export function InstructorDashboardView({ initialData }: InstructorDashboardViewProps) {
  const [data] = React.useState(initialData);
  const [searchStudent, setSearchStudent] = React.useState("");
  const [searchQuiz, setSearchQuiz] = React.useState("");

  const { overview, pendingSubmissions, studentProgress, quizStats } = data;

  const filteredStudents = React.useMemo(() => {
    if (!searchStudent.trim()) return studentProgress;
    const q = searchStudent.toLowerCase().trim();
    return studentProgress.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.studentEmail.toLowerCase().includes(q) ||
        s.courseTitle.toLowerCase().includes(q)
    );
  }, [studentProgress, searchStudent]);

  const filteredQuizzes = React.useMemo(() => {
    if (!searchQuiz.trim()) return quizStats;
    const q = searchQuiz.toLowerCase().trim();
    return quizStats.filter(
      (quiz) =>
        quiz.quizTitle.toLowerCase().includes(q) ||
        quiz.courseTitle.toLowerCase().includes(q)
    );
  }, [quizStats, searchQuiz]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Instructor Command Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track student retention, grading backlogs, and academic assessment performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="rounded-xl text-xs" asChild>
            <Link href="/instructor/courses">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Manage Courses
            </Link>
          </Button>
          <Button size="sm" className="rounded-xl text-xs shadow-xs" asChild>
            <Link href="/instructor/submissions">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Grading Queue ({overview.pendingSubmissionsCount})
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Enrolled Students
            </span>
            <Users className="w-4 h-4" />
          </div>
          <div className="mt-3 text-3xl font-extrabold">{overview.totalStudents}</div>
          <p className="mt-1 text-xs opacity-80">Across all active courses</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Grading Backlog
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">
            {overview.pendingSubmissionsCount}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Submissions awaiting score</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Completions
            </span>
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">
            {overview.completedStudents}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">100% course requirements met</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Published Courses
            </span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">
            {overview.publishedCourses}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              / {overview.totalCourses} total
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Live in catalog</p>
        </Card>
      </div>

      {/* Submissions Waiting Notice Banner */}
      {overview.pendingSubmissionsCount > 0 && (
        <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-foreground">
                {overview.pendingSubmissionsCount} assignment submission{overview.pendingSubmissionsCount > 1 ? "s" : ""} waiting to be graded
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Provide constructive feedback and assign marks to unlock student certificates.
            </p>
          </div>
          <Button size="sm" className="rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white shrink-0" asChild>
            <Link href="/instructor/submissions">
              Open Grading Screen
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </Card>
      )}

      {/* Main Tabbed Analytics Section */}
      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList className="rounded-xl p-1 bg-muted/60">
          <TabsTrigger value="progress" className="rounded-lg text-xs font-medium">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Per-Student Progress ({studentProgress.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="rounded-lg text-xs font-medium">
            <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
            Quiz Analytics ({quizStats.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg text-xs font-medium">
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Pending Submissions ({pendingSubmissions.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Student Progress */}
        <TabsContent value="progress" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name, email, or course..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No student enrollments found matching search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Progress</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Enrolled On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredStudents.map((s) => (
                      <tr key={s.enrollmentId} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-foreground">{s.studentName}</p>
                          <p className="text-2xs text-muted-foreground">{s.studentEmail}</p>
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {s.courseTitle}
                        </td>
                        <td className="py-3 px-4 w-44">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-2xs">
                              <span className="font-bold text-foreground">{s.progressPct}%</span>
                            </div>
                            <Progress value={s.progressPct} className="h-1.5" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {s.status === "COMPLETED" ? (
                            <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20 text-2xs">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-2xs text-blue-600 border-blue-500/20">
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(s.enrolledAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 2: Quiz Analytics */}
        <TabsContent value="quizzes" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchQuiz}
                onChange={(e) => setSearchQuiz(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
            {filteredQuizzes.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No quiz metrics recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Quiz Title</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4 text-center">Total Attempts</th>
                      <th className="py-3 px-4 text-center">Avg. Score</th>
                      <th className="py-3 px-4 text-center">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredQuizzes.map((quiz) => (
                      <tr key={quiz.quizId} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {quiz.quizTitle}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {quiz.courseTitle}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-foreground">
                          {quiz.totalAttempts}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-foreground">
                          {quiz.avgScore} pts
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`text-2xs ${
                              quiz.passRatePct >= 70
                                ? "bg-emerald-600/10 text-emerald-600 border-emerald-600/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                          >
                            {quiz.passRatePct}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 3: Pending Submissions */}
        <TabsContent value="pending" className="space-y-4">
          <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
            {pendingSubmissions.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                <p className="font-semibold text-foreground">All caught up!</p>
                <p>No student submissions are currently awaiting evaluation.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {pendingSubmissions.map((sub) => (
                  <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-foreground">
                          {sub.assignmentTitle}
                        </span>
                        {sub.isLate && (
                          <Badge variant="destructive" className="text-2xs">
                            Late
                          </Badge>
                        )}
                      </div>
                      <p className="text-2xs text-muted-foreground">
                        Submitted by <span className="font-semibold text-foreground">{sub.studentName}</span> in{" "}
                        <span className="font-medium text-foreground">{sub.courseTitle}</span> on{" "}
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" asChild>
                      <Link href="/instructor/submissions">
                        Grade Submission
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
