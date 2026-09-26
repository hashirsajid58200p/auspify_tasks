"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Award,
  ExternalLink,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Edit2,
  BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownView } from "@/components/ui/markdown-view";
import { fetchApi, ApiClientError } from "@/lib/api-client";

interface AssignmentViewProps {
  assignmentId: string;
}

interface StudentAssignmentData {
  assignment: {
    _id: string;
    courseId: string;
    moduleId: string | null;
    title: string;
    instructions: string;
    dueAt: string | null;
    maxPoints: number;
    allowLate: boolean;
    isRequired: boolean;
  };
  course: {
    _id: string;
    title: string;
    slug: string;
  };
  submission: {
    _id: string;
    text: string;
    linkUrl: string | null;
    isLate: boolean;
    status: "SUBMITTED" | "GRADED";
    grade: number | null;
    feedback: string;
    submittedAt: string;
    gradedAt: string | null;
  } | null;
}

interface SubmissionFormCardProps {
  assignmentId: string;
  maxPoints: number;
  initialText: string;
  initialLink: string;
  isPastDue: boolean;
  allowLate: boolean;
  isEditing: boolean;
  onCancelEdit?: () => void;
  onSuccess: () => void;
}

function SubmissionFormCard({
  assignmentId,
  maxPoints,
  initialText,
  initialLink,
  isPastDue,
  allowLate,
  isEditing,
  onCancelEdit,
  onSuccess,
}: SubmissionFormCardProps) {
  const [textInput, setTextInput] = React.useState(initialText);
  const [linkInput, setLinkInput] = React.useState(initialLink);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: async ({
      text,
      linkUrl,
    }: {
      text: string;
      linkUrl?: string;
    }) => {
      return await fetchApi(`/api/assignments/${assignmentId}/submission`, {
        method: "PUT",
        body: JSON.stringify({
          text: text.trim(),
          linkUrl: linkUrl?.trim() || undefined,
        }),
      });
    },
    onSuccess: () => {
      toast.success(
        isEditing
          ? "Assignment resubmitted successfully."
          : "Assignment submitted successfully."
      );
      setValidationError(null);
      onSuccess();
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to submit assignment.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = textInput.trim().length > 0;
    const hasLink = linkInput.trim().length > 0;

    if (!hasText && !hasLink) {
      setValidationError("Please provide written response text, a link, or both.");
      return;
    }

    if (linkInput.trim()) {
      try {
        new URL(linkInput.trim());
      } catch {
        setValidationError("Please enter a valid URL (e.g. https://github.com/...)");
        return;
      }
    }

    setValidationError(null);
    submitMutation.mutate({
      text: textInput,
      linkUrl: linkInput.trim() || undefined,
    });
  };

  return (
    <Card className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" />
          {isEditing ? "Edit Your Submission" : "Submit Your Assignment"}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Provide your written answer and optional repository or demo URL.
        </p>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {isPastDue && allowLate && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            Notice: The deadline has passed. Your submission will be recorded as late.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Written Response</Label>
          <Textarea
            placeholder="Enter your written answer, analysis, or project documentation..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={6}
            className="rounded-xl text-xs resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Project Link (Optional)</Label>
          <Input
            type="url"
            placeholder="https://github.com/username/project or hosted demo URL"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            className="rounded-xl text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Must start with http:// or https://.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
          {isEditing ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs w-full sm:w-auto"
              onClick={onCancelEdit}
            >
              Cancel Edit
            </Button>
          ) : (
            <div className="text-[11px] text-muted-foreground">
              Max Points: {maxPoints} pts
            </div>
          )}

          <Button
            type="submit"
            size="sm"
            className="rounded-xl text-xs gap-1.5 w-full sm:w-auto"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending && (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            )}
            {isEditing ? "Update Submission" : "Submit Assignment"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AssignmentView({ assignmentId }: AssignmentViewProps) {
  const queryClient = useQueryClient();
  const [isEditingSubmission, setIsEditingSubmission] = React.useState(false);

  const {
    data: assignmentData,
    isLoading,
    isError,
  } = useQuery<StudentAssignmentData>({
    queryKey: ["student-assignment", assignmentId],
    queryFn: async () => {
      const res = await fetchApi<StudentAssignmentData>(
        `/api/assignments/${assignmentId}`
      );
      return res;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !assignmentData) {
    return (
      <Card className="max-w-md mx-auto mt-16 p-8 text-center rounded-2xl border-destructive/20 bg-destructive/5 text-destructive space-y-3">
        <AlertCircle className="w-10 h-10 mx-auto" />
        <h2 className="text-base font-bold text-foreground">Assignment Not Found</h2>
        <p className="text-xs text-muted-foreground">
          You may not be enrolled in this course or the assignment has been removed.
        </p>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" asChild>
          <Link href="/my-courses">Return to My Courses</Link>
        </Button>
      </Card>
    );
  }

  const { assignment, course, submission } = assignmentData;
  const dueDate = assignment.dueAt ? new Date(assignment.dueAt) : null;
  const isPastDue = dueDate ? new Date() > dueDate : false;
  const isSubmissionClosed = isPastDue && !assignment.allowLate && !submission;
  const isGraded = submission?.status === "GRADED";

  const handleSubmissionSuccess = () => {
    setIsEditingSubmission(false);
    queryClient.invalidateQueries({
      queryKey: ["student-assignment", assignmentId],
    });
    queryClient.invalidateQueries({ queryKey: ["student-learning"] });
    queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation Breadcrumb */}
      <Link
        href={`/learn/${course.slug}`}
        className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
        Back to Course Curriculum
      </Link>

      {/* Header Card */}
      <Card className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {course.title}
          </Badge>
          {assignment.isRequired ? (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              Required Assignment
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Optional Assignment
            </Badge>
          )}
          {dueDate && (
            <Badge
              variant="outline"
              className={`text-xs gap-1 ${
                isPastDue
                  ? "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5"
                  : "text-muted-foreground"
              }`}
            >
              <Calendar className="w-3 h-3" />
              Due {dueDate.toLocaleDateString()} at{" "}
              {dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Badge>
          )}
          {isPastDue && !assignment.allowLate && (
            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs">
              Submissions Closed
            </Badge>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {assignment.title}
          </h1>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-muted/40 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Max Score: {assignment.maxPoints} pts</span>
          </div>
        </div>
      </Card>

      {/* Assignment Instructions */}
      <Card className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
          <FileText className="w-4 h-4 text-primary" />
          Instructions & Requirements
        </h2>

        <MarkdownView
          content={assignment.instructions}
          className="text-xs sm:text-sm"
        />
      </Card>

      {/* Submission Section */}
      <div className="space-y-4">
        {submission && !isEditingSubmission ? (
          /* Already Submitted Card */
          <Card className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Your Submission
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted on {new Date(submission.submittedAt).toLocaleDateString()} at{" "}
                  {new Date(submission.submittedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {submission.isLate && (
                  <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs">
                    Submitted Late
                  </Badge>
                )}
                {isGraded ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold">
                    Graded: {submission.grade} / {assignment.maxPoints} pts
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-semibold">
                    Awaiting Instructor Review
                  </Badge>
                )}
              </div>
            </div>

            {/* Graded Feedback Card */}
            {isGraded && (
              <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Instructor Feedback & Grade
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {submission.grade} / {assignment.maxPoints} (
                    {Math.round(((submission.grade || 0) / assignment.maxPoints) * 100)}%)
                  </span>
                </div>

                {submission.feedback ? (
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {submission.feedback}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No written comments provided.
                  </p>
                )}
              </div>
            )}

            {/* Submitted Content Preview */}
            <div className="space-y-3 text-xs">
              <Label className="text-xs font-semibold text-foreground">Submitted Response</Label>
              {submission.text ? (
                <div className="p-4 rounded-xl border border-border bg-muted/20 whitespace-pre-wrap leading-relaxed">
                  {submission.text}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No written text submitted.</p>
              )}

              {submission.linkUrl && (
                <div className="pt-1">
                  <a
                    href={submission.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {submission.linkUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Edit / Resubmit button if not graded yet */}
            <div className="pt-2 flex items-center justify-between border-t border-border">
              <Button size="sm" variant="outline" className="rounded-xl text-xs" asChild>
                <Link href={`/learn/${course.slug}`}>
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Return to Course
                </Link>
              </Button>

              {!isGraded && (!isPastDue || assignment.allowLate) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs gap-1.5"
                  onClick={() => setIsEditingSubmission(true)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Submission
                </Button>
              )}
            </div>
          </Card>
        ) : isSubmissionClosed ? (
          <Card className="p-8 text-center space-y-3 rounded-2xl bg-card border border-border">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
            <h4 className="text-sm font-bold text-foreground">
              Submissions are Closed
            </h4>
            <p className="text-xs text-muted-foreground">
              The deadline for this assignment was {dueDate?.toLocaleDateString()} and late submissions are not accepted.
            </p>
          </Card>
        ) : (
          <SubmissionFormCard
            key={submission?._id ? `edit-${submission._id}` : "new-submission"}
            assignmentId={assignmentId}
            maxPoints={assignment.maxPoints}
            initialText={submission?.text || ""}
            initialLink={submission?.linkUrl || ""}
            isPastDue={isPastDue}
            allowLate={assignment.allowLate}
            isEditing={isEditingSubmission}
            onCancelEdit={() => setIsEditingSubmission(false)}
            onSuccess={handleSubmissionSuccess}
          />
        )}
      </div>
    </div>
  );
}
