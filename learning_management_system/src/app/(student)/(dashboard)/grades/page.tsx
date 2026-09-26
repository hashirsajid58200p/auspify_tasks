import { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, CheckCircle, Clock, FileText, HelpCircle, XCircle } from "lucide-react";
import { requireServerUser } from "@/server/auth/server-session";
import { getStudentGrades } from "@/server/services/grades";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "My Grades | EduFlow LMS",
  description: "View points-weighted scores, assessment results, and instructor feedback.",
};

export default async function StudentGradesPage() {
  const user = await requireServerUser(["STUDENT"]);
  const coursesGrades = await getStudentGrades(user.userId);

  const totalPointsEarned = coursesGrades.reduce((acc, c) => acc + c.totalEarnedPoints, 0);
  const totalPointsPossible = coursesGrades.reduce((acc, c) => acc + c.totalPossiblePoints, 0);
  const cumulativePct =
    totalPointsPossible > 0
      ? Math.round((totalPointsEarned / totalPointsPossible) * 100)
      : null;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-border/60">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          My Grades & Performance
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Detailed performance breakdown across quizzes, homework assignments, and instructor reviews.
        </p>
      </div>

      {/* High-level performance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Enrolled Courses
            </span>
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">
            {coursesGrades.length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">With assessment tracking</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-card border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Points Accrued
            </span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">
            {totalPointsEarned}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              / {totalPointsPossible}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Total earned points</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Cumulative Average
            </span>
            <Award className="w-4 h-4" />
          </div>
          <div className="mt-3 text-3xl font-bold">
            {cumulativePct !== null ? `${cumulativePct}%` : "N/A"}
          </div>
          <p className="mt-1 text-xs opacity-80">Weighted overall standing</p>
        </Card>
      </div>

      {/* Courses List */}
      {coursesGrades.length === 0 ? (
        <Card className="rounded-2xl border-border bg-card p-12 text-center">
          <Award className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-base font-semibold text-foreground">No graded courses yet</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Enroll in a course and submit required quizzes and assignments to see your graded performance.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {coursesGrades.map((course) => (
            <Card
              key={course.courseId}
              className="rounded-2xl border-border bg-card shadow-xs overflow-hidden"
            >
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses/${course.courseSlug}`}
                        className="text-lg font-bold text-foreground hover:text-primary transition-colors"
                      >
                        {course.courseTitle}
                      </Link>
                      <Badge variant="outline" className="text-2xs capitalize">
                        {course.level.toLowerCase().replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Course Progress: {course.progressPct}% • Status: {course.enrollmentStatus}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Course Grade</div>
                      <div className="text-2xl font-black text-foreground">
                        {course.letterGrade !== "N/A" ? course.letterGrade : "—"}
                        <span className="text-xs font-medium text-muted-foreground ml-1.5">
                          {course.overallPercentage !== null
                            ? `(${course.overallPercentage}%)`
                            : "(Ungraded)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Quizzes Breakdown */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    Quizzes & Exams ({course.quizzes.length})
                  </h3>

                  {course.quizzes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No quizzes in this course.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {course.quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="p-3.5 rounded-xl border border-border/70 bg-background flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground line-clamp-1">
                                {quiz.title}
                              </span>
                              {quiz.passed === true ? (
                                <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20 text-2xs">
                                  Passed
                                </Badge>
                              ) : quiz.passed === false ? (
                                <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-2xs">
                                  Failed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-2xs text-muted-foreground">
                                  Not Taken
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="text-xs text-muted-foreground">Score:</span>
                              <span className="text-sm font-bold text-foreground">
                                {quiz.score !== null ? quiz.score : "—"}{" "}
                                <span className="text-2xs font-normal text-muted-foreground">
                                  / {quiz.maxScore} pts
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-border/40 text-2xs text-muted-foreground flex justify-between">
                            <span>Attempts: {quiz.attemptCount}</span>
                            <span>{quiz.percentage !== null ? `${quiz.percentage}%` : "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assignments Breakdown */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-primary" />
                    Assignments & Projects ({course.assignments.length})
                  </h3>

                  {course.assignments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No assignments in this course.</p>
                  ) : (
                    <div className="space-y-3">
                      {course.assignments.map((asgn) => (
                        <div
                          key={asgn.id}
                          className="p-4 rounded-xl border border-border/70 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-foreground">
                                {asgn.title}
                              </span>
                              {asgn.status === "GRADED" ? (
                                <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20 text-2xs">
                                  Graded
                                </Badge>
                              ) : asgn.status === "SUBMITTED" ? (
                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-2xs">
                                  In Review
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-2xs text-muted-foreground">
                                  Not Submitted
                                </Badge>
                              )}
                              {asgn.isLate && (
                                <Badge variant="destructive" className="text-2xs">
                                  Late
                                </Badge>
                              )}
                            </div>

                            {asgn.feedback && (
                              <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg mt-1.5 border border-border/40">
                                <span className="font-semibold text-foreground">Instructor Feedback: </span>
                                {asgn.feedback}
                              </p>
                            )}
                          </div>

                          <div className="sm:text-right shrink-0">
                            <div className="text-xs text-muted-foreground">Points</div>
                            <div className="text-base font-bold text-foreground">
                              {asgn.grade !== null ? asgn.grade : "—"}{" "}
                              <span className="text-xs font-normal text-muted-foreground">
                                / {asgn.maxPoints} pts
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
