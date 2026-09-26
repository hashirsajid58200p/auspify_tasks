"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Inbox,
  CheckCircle,
  Clock,
  ExternalLink,
  Award,
  User,
  MessageSquare,
  Loader2,
  Calendar,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchApi, ApiClientError } from "@/lib/api-client";

interface SubmissionsTabProps {
  courseId: string;
}

interface SubmissionItem {
  _id: string;
  assignment: {
    _id: string;
    title: string;
    maxPoints: number;
  } | null;
  student: {
    _id: string;
    name: string;
    email: string;
  } | null;
  text?: string;
  linkUrl?: string | null;
  isLate: boolean;
  status: "SUBMITTED" | "GRADED";
  grade?: number | null;
  feedback?: string | null;
  submittedAt: string;
  gradedAt?: string | null;
}

export function SubmissionsTab({ courseId }: SubmissionsTabProps) {
  const queryClient = useQueryClient();
  const [gradingSubmission, setGradingSubmission] =
    React.useState<SubmissionItem | null>(null);
  const [gradeInput, setGradeInput] = React.useState<number | "">("");
  const [feedbackInput, setFeedbackInput] = React.useState<string>("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    data: submissions,
    isLoading,
    isError,
  } = useQuery<SubmissionItem[]>({
    queryKey: ["instructor-submissions", courseId],
    queryFn: async () => {
      const res = await fetchApi<SubmissionItem[]>(
        `/api/instructor/courses/${courseId}/submissions`
      );
      return res;
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({
      submissionId,
      grade,
      feedback,
    }: {
      submissionId: string;
      grade: number;
      feedback: string;
    }) => {
      return await fetchApi(`/api/submissions/${submissionId}/grade`, {
        method: "PATCH",
        body: JSON.stringify({ grade, feedback }),
      });
    },
    onSuccess: () => {
      toast.success("Grade and feedback saved successfully.");
      queryClient.invalidateQueries({
        queryKey: ["instructor-submissions", courseId],
      });
      setGradingSubmission(null);
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to grade submission.");
      }
    },
  });

  const handleOpenGradeDialog = (sub: SubmissionItem) => {
    setGradingSubmission(sub);
    setGradeInput(typeof sub.grade === "number" ? sub.grade : "");
    setFeedbackInput(sub.feedback || "");
    setFormError(null);
  };

  const handleSaveGrade = () => {
    if (!gradingSubmission) return;

    if (gradeInput === "" || isNaN(Number(gradeInput))) {
      setFormError("Please enter a valid numeric grade.");
      return;
    }

    const numericGrade = Number(gradeInput);
    const maxPoints = gradingSubmission.assignment?.maxPoints || 100;

    if (numericGrade < 0 || numericGrade > maxPoints) {
      setFormError(`Grade must be between 0 and ${maxPoints}.`);
      return;
    }

    setFormError(null);
    gradeMutation.mutate({
      submissionId: gradingSubmission._id,
      grade: numericGrade,
      feedback: feedbackInput.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-pulse">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center rounded-2xl border-destructive/20 bg-destructive/5 text-destructive max-w-md mx-auto">
        <p className="text-xs">Failed to load submissions queue. Please refresh.</p>
      </Card>
    );
  }

  const pendingCount = submissions?.filter((s) => s.status === "SUBMITTED").length || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            Grading Queue ({submissions?.length || 0})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review student deliverables, provide qualitative feedback, and record marks.
          </p>
        </div>

        {pendingCount > 0 ? (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-semibold px-3 py-1 self-start sm:self-auto">
            {pendingCount} Pending Review
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold px-3 py-1 self-start sm:self-auto">
            All Graded
          </Badge>
        )}
      </div>

      {/* Submissions List */}
      {!submissions || submissions.length === 0 ? (
        <Card className="p-10 text-center rounded-2xl border-dashed border-border bg-card/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              No Submissions Yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Student assignment responses will appear here for grading as they are submitted.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {submissions.map((sub) => {
            const submittedDate = new Date(sub.submittedAt);
            const isGraded = sub.status === "GRADED";
            const maxPoints = sub.assignment?.maxPoints || 100;

            return (
              <Card
                key={sub._id}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[11px] font-semibold text-foreground">
                      {sub.assignment?.title || "Assignment"}
                    </Badge>
                    {sub.isLate && (
                      <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[11px]">
                        Late Submission
                      </Badge>
                    )}
                    {isGraded ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]">
                        Graded: {sub.grade}/{maxPoints}
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px]">
                        Needs Grading
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{sub.student?.name || "Student"}</span>
                    <span className="text-muted-foreground font-normal text-[11px]">
                      ({sub.student?.email})
                    </span>
                  </div>

                  {/* Submission Preview */}
                  {sub.text && (
                    <p className="text-xs text-muted-foreground line-clamp-1 italic bg-muted/30 px-2.5 py-1 rounded-lg">
                      &quot;{sub.text}&quot;
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Submitted {submittedDate.toLocaleDateString()} at{" "}
                      {submittedDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {sub.linkUrl && (
                      <a
                        href={sub.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Attached Link
                      </a>
                    )}
                  </div>
                </div>

                {/* Grade Action Button */}
                <div className="self-end md:self-center shrink-0">
                  <Button
                    size="sm"
                    variant={isGraded ? "outline" : "default"}
                    className="rounded-xl text-xs gap-1.5 h-9"
                    onClick={() => handleOpenGradeDialog(sub)}
                  >
                    <Award className="w-3.5 h-3.5" />
                    {isGraded ? "Review / Re-grade" : "Grade Submission"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Grade Submission Dialog */}
      <Dialog
        open={!!gradingSubmission}
        onOpenChange={(open) => !open && setGradingSubmission(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Grade Submission: {gradingSubmission?.assignment?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review student response and assign score (0 to{" "}
              {gradingSubmission?.assignment?.maxPoints || 100} points).
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-4 pt-2">
            {/* Student Info Card */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Student: {gradingSubmission?.student?.name}
                </span>
                {gradingSubmission?.isLate && (
                  <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px]">
                    Late Submission
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{gradingSubmission?.student?.email}</p>
            </div>

            {/* Submission Content */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Student Response</Label>
              {gradingSubmission?.text ? (
                <div className="p-3.5 rounded-xl border border-border bg-card text-xs leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {gradingSubmission.text}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No text submitted.
                </p>
              )}

              {gradingSubmission?.linkUrl && (
                <div className="pt-1">
                  <a
                    href={gradingSubmission.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Submission Link: {gradingSubmission.linkUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Score & Feedback Form */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Points Earned *</Label>
                  <span className="text-[11px] text-muted-foreground">
                    Max: {gradingSubmission?.assignment?.maxPoints || 100} pts
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={gradingSubmission?.assignment?.maxPoints || 100}
                  placeholder={`0 - ${gradingSubmission?.assignment?.maxPoints || 100}`}
                  value={gradeInput}
                  onChange={(e) =>
                    setGradeInput(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Instructor Feedback</Label>
                <Textarea
                  placeholder="Provide qualitative feedback, suggestions, or rubric commentary..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  rows={4}
                  className="rounded-xl text-xs resize-y"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl text-xs"
              onClick={() => setGradingSubmission(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl text-xs gap-1.5"
              onClick={handleSaveGrade}
              disabled={gradeMutation.isPending}
            >
              {gradeMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Save Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
