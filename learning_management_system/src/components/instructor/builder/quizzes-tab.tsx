"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ListChecks,
  Plus,
  Clock,
  Award,
  Layers,
  Edit2,
  Trash2,
  Loader2,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { QuizModal, QuizFormData } from "@/components/instructor/builder/quiz-modal";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { IModule } from "@/server/models/module";

interface QuizzesTabProps {
  courseId: string;
  modules: Array<{ id?: string; _id?: unknown; title: string }>;
}

interface QuizItem {
  _id: string;
  courseId: string;
  moduleId?: string | null;
  title: string;
  description?: string;
  timeLimitMin?: number | null;
  passingPct: number;
  maxAttempts: number;
  shuffle: boolean;
  showAnswers: "AFTER_SUBMIT" | "NEVER";
  isRequired: boolean;
  questions: Array<{
    id: string;
    type: "SINGLE" | "MULTIPLE" | "TRUE_FALSE";
    prompt: string;
    points: number;
    explanation?: string;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
  createdAt: string;
}

export function QuizzesTab({ courseId, modules }: QuizzesTabProps) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedQuiz, setSelectedQuiz] = React.useState<QuizFormData | null>(null);
  const [deleteQuizId, setDeleteQuizId] = React.useState<string | null>(null);

  const {
    data: quizzes,
    isLoading,
    isError,
  } = useQuery<QuizItem[]>({
    queryKey: ["instructor-quizzes", courseId],
    queryFn: async () => {
      const res = await fetchApi<QuizItem[]>(
        `/api/instructor/courses/${courseId}/quizzes`
      );
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (quizId: string) => {
      return await fetchApi(
        `/api/instructor/courses/${courseId}/quizzes/${quizId}`,
        {
          method: "DELETE",
        }
      );
    },
    onSuccess: () => {
      toast.success("Quiz deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["instructor-quizzes", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
      setDeleteQuizId(null);
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete quiz.");
      }
      setDeleteQuizId(null);
    },
  });

  const handleOpenCreate = () => {
    setSelectedQuiz(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (quiz: QuizItem) => {
    setSelectedQuiz({
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description || "",
      moduleId: quiz.moduleId || null,
      timeLimitMin: quiz.timeLimitMin || null,
      passingPct: quiz.passingPct,
      maxAttempts: quiz.maxAttempts,
      shuffle: quiz.shuffle,
      showAnswers: quiz.showAnswers,
      isRequired: quiz.isRequired,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        points: q.points,
        explanation: q.explanation || "",
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      })),
    });
    setModalOpen(true);
  };

  const moduleMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of modules) {
      const id = (m.id || m._id)?.toString();
      if (id) {
        map.set(id, m.title);
      }
    }
    return map;
  }, [modules]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-pulse">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center rounded-2xl border-destructive/20 bg-destructive/5 text-destructive max-w-md mx-auto">
        <p className="text-xs">Failed to load quizzes. Please refresh.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            Course Quizzes ({quizzes?.length || 0})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add knowledge checks and assessments with automated grading.
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-xl text-xs gap-1.5 self-start sm:self-auto shrink-0"
          onClick={handleOpenCreate}
        >
          <Plus className="w-3.5 h-3.5" />
          Create Quiz
        </Button>
      </div>

      {/* Quizzes List */}
      {!quizzes || quizzes.length === 0 ? (
        <Card className="p-10 text-center rounded-2xl border-dashed border-border bg-card/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No Quizzes Created Yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Reinforce learning with timed or untimed quizzes, custom passing thresholds, and automatic grading.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs gap-1.5"
            onClick={handleOpenCreate}
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Quiz
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {quizzes.map((quiz) => {
            const totalPoints = quiz.questions.reduce((acc, q) => acc + (q.points || 1), 0);
            const moduleName = quiz.moduleId ? moduleMap.get(quiz.moduleId) : null;

            return (
              <Card
                key={quiz._id}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {moduleName ? (
                      <Badge variant="secondary" className="text-[11px] font-normal gap-1">
                        <Layers className="w-3 h-3 text-muted-foreground" />
                        {moduleName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-muted-foreground">
                        Course-Level
                      </Badge>
                    )}
                    {quiz.isRequired ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px]">
                        Required
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[11px]">
                        Optional
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-foreground truncate">
                    {quiz.title}
                  </h3>

                  {quiz.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {quiz.description}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-primary" />
                      {quiz.questions.length} Question{quiz.questions.length === 1 ? "" : "s"} ({totalPoints} pt{totalPoints === 1 ? "" : "s"})
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      Passing: {quiz.passingPct}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      {quiz.timeLimitMin ? `${quiz.timeLimitMin} min limit` : "Untimed"}
                    </span>
                    <span className="flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 text-purple-500" />
                      {quiz.maxAttempts > 0 ? `${quiz.maxAttempts} max attempts` : "Unlimited attempts"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenEdit(quiz)}
                    title="Edit Quiz"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteQuizId(quiz._id)}
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deleteQuizId}
        onOpenChange={(open) => !open && setDeleteQuizId(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Delete Quiz
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this quiz? Note: Quizzes with existing student attempts cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteQuizId && deleteMutation.mutate(deleteQuizId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quiz Modal */}
      <QuizModal
        courseId={courseId}
        modules={modules}
        quiz={selectedQuiz}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
