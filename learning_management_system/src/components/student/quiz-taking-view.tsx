"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Award,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Check,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { fetchApi, ApiClientError } from "@/lib/api-client";

interface QuizTakingViewProps {
  quizId: string;
}

interface SanitizedQuestion {
  id: string;
  type: "SINGLE" | "MULTIPLE" | "TRUE_FALSE";
  prompt: string;
  points: number;
  options: Array<{
    id: string;
    text: string;
  }>;
}

interface QuizStudentData {
  quiz: {
    _id: string;
    courseId: string;
    moduleId: string | null;
    title: string;
    description: string;
    timeLimitMin: number | null;
    passingPct: number;
    maxAttempts: number;
    isRequired: boolean;
    questionCount: number;
    questions: SanitizedQuestion[];
  };
  course: {
    _id: string;
    title: string;
    slug: string;
  };
  userStatus: {
    attemptsCount: number;
    maxAttempts: number;
    hasPassed: boolean;
    bestPercentage: number;
    activeAttempt: {
      _id: string;
      attemptNo: number;
      startedAt: string;
      expiresAt: string | null;
    } | null;
  };
}

interface AttemptReviewItem {
  id: string;
  type: "SINGLE" | "MULTIPLE" | "TRUE_FALSE";
  prompt: string;
  points: number;
  explanation?: string;
  selectedOptionIds: string[];
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

interface AttemptResultData {
  attemptId: string;
  status: "SUBMITTED" | "EXPIRED";
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passingPct: number;
  showAnswers: "AFTER_SUBMIT" | "NEVER";
  review: AttemptReviewItem[] | null;
}

function QuizTakingSession({
  quizId,
  quizData,
  onRefreshData,
}: {
  quizId: string;
  quizData: QuizStudentData;
  onRefreshData: () => void;
}) {
  const queryClient = useQueryClient();
  const initialActive = quizData.userStatus.activeAttempt;

  const [mode, setMode] = React.useState<"INTRO" | "TAKING" | "RESULT">(
    initialActive ? "TAKING" : "INTRO"
  );
  const [activeAttemptId, setActiveAttemptId] = React.useState<string | null>(
    initialActive ? initialActive._id : null
  );
  const [expiresAtDate, setExpiresAtDate] = React.useState<Date | null>(() => {
    return initialActive?.expiresAt ? new Date(initialActive.expiresAt) : null;
  });

  const [answers, setAnswers] = React.useState<Record<string, string[]>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = React.useState(0);
  const [submitConfirmOpen, setSubmitConfirmOpen] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<AttemptResultData | null>(null);

  // Time tracker for countdown
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (mode !== "TAKING" || !expiresAtDate) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, expiresAtDate]);

  const timeLeftSec = React.useMemo(() => {
    if (mode !== "TAKING" || !expiresAtDate) return null;
    return Math.max(0, Math.floor((expiresAtDate.getTime() - now) / 1000));
  }, [mode, expiresAtDate, now]);

  // Start attempt mutation
  const startMutation = useMutation({
    mutationFn: async () => {
      return await fetchApi<{
        attemptId: string;
        attemptNo: number;
        status: string;
        startedAt: string;
        expiresAt: string | null;
        resumed: boolean;
      }>(`/api/quizzes/${quizId}/attempts`, {
        method: "POST",
      });
    },
    onSuccess: (res) => {
      setActiveAttemptId(res.attemptId);
      setExpiresAtDate(res.expiresAt ? new Date(res.expiresAt) : null);
      setAnswers({});
      setCurrentQuestionIdx(0);
      setMode("TAKING");
      if (res.resumed) {
        toast.info("Resumed in-progress quiz attempt.");
      }
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to start quiz attempt.");
      }
    },
  });

  // Submit attempt mutation
  const submitMutation = useMutation({
    mutationFn: async (
      payloadAnswers: Array<{ questionId: string; selectedOptionIds: string[] }>
    ) => {
      if (!activeAttemptId) throw new Error("No active attempt found");
      return await fetchApi<AttemptResultData>(
        `/api/attempts/${activeAttemptId}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ answers: payloadAnswers }),
        }
      );
    },
    onSuccess: (result) => {
      setLastResult(result);
      setMode("RESULT");
      setActiveAttemptId(null);
      setExpiresAtDate(null);
      onRefreshData();
      queryClient.invalidateQueries({ queryKey: ["student-learning"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });

      if (result.status === "EXPIRED") {
        toast.error("Time expired! Your quiz was submitted automatically.");
      } else if (result.passed) {
        toast.success(`Congratulations! You passed with ${result.percentage}%.`);
      } else {
        toast.warning(
          `Quiz completed. Score: ${result.percentage}%. Passing is ${result.passingPct}%.`
        );
      }
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to submit quiz attempt.");
      }
    },
  });

  const handleSubmitAttempt = React.useCallback(() => {
    if (!quizData) return;
    const formattedAnswers = quizData.quiz.questions.map((q) => ({
      questionId: q.id,
      selectedOptionIds: answers[q.id] || [],
    }));
    submitMutation.mutate(formattedAnswers);
  }, [quizData, answers, submitMutation]);

  // Auto-submit when time expires
  const autoSubmittedRef = React.useRef(false);
  React.useEffect(() => {
    if (
      timeLeftSec !== null &&
      timeLeftSec <= 0 &&
      mode === "TAKING" &&
      !autoSubmittedRef.current
    ) {
      autoSubmittedRef.current = true;
      handleSubmitAttempt();
    }
  }, [timeLeftSec, mode, handleSubmitAttempt]);

  const { quiz, course, userStatus } = quizData;
  const questions = quiz.questions;
  const currentQ = questions[currentQuestionIdx];

  const handleSelectOption = (
    questionId: string,
    optionId: string,
    type: string
  ) => {
    setAnswers((prev) => {
      const currentSelected = prev[questionId] || [];
      if (type === "SINGLE" || type === "TRUE_FALSE") {
        return { ...prev, [questionId]: [optionId] };
      }
      if (currentSelected.includes(optionId)) {
        return {
          ...prev,
          [questionId]: currentSelected.filter((id) => id !== optionId),
        };
      } else {
        return {
          ...prev,
          [questionId]: [...currentSelected, optionId],
        };
      }
    });
  };

  const answeredCount = Object.values(answers).filter(
    (arr) => arr.length > 0
  ).length;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 1. INTRO VIEW
  if (mode === "INTRO") {
    const totalPoints = questions.reduce(
      (sum, q) => sum + (q.points || 1),
      0
    );
    const canAttempt =
      userStatus.maxAttempts === 0 ||
      userStatus.attemptsCount < userStatus.maxAttempts;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link
          href={`/learn/${course.slug}`}
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
          Back to Course Curriculum
        </Link>

        <Card className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {course.title}
              </Badge>
              {quiz.isRequired ? (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                  Required Quiz
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Practice Quiz
                </Badge>
              )}
              {userStatus.hasPassed && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                  Passed ({userStatus.bestPercentage}%)
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {quiz.title}
            </h1>

            {quiz.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {quiz.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-center space-y-1">
              <HelpCircle className="w-5 h-5 mx-auto text-primary" />
              <div className="text-xs text-muted-foreground font-medium">Questions</div>
              <div className="text-base font-bold text-foreground">
                {quiz.questionCount}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-center space-y-1">
              <Award className="w-5 h-5 mx-auto text-amber-500" />
              <div className="text-xs text-muted-foreground font-medium">Passing Score</div>
              <div className="text-base font-bold text-foreground">
                {quiz.passingPct}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-center space-y-1">
              <Clock className="w-5 h-5 mx-auto text-blue-500" />
              <div className="text-xs text-muted-foreground font-medium">Time Limit</div>
              <div className="text-base font-bold text-foreground">
                {quiz.timeLimitMin ? `${quiz.timeLimitMin} mins` : "Untimed"}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-center space-y-1">
              <RotateCcw className="w-5 h-5 mx-auto text-purple-500" />
              <div className="text-xs text-muted-foreground font-medium">Attempts</div>
              <div className="text-base font-bold text-foreground">
                {userStatus.maxAttempts === 0
                  ? "Unlimited"
                  : `${userStatus.attemptsCount} / ${userStatus.maxAttempts}`}
              </div>
            </div>
          </div>

          {userStatus.attemptsCount > 0 && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">Your Previous Record</span>
                <p className="text-muted-foreground">
                  Attempts completed: {userStatus.attemptsCount}
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-foreground">
                  {userStatus.bestPercentage}%
                </span>
                <p className="text-muted-foreground">Best Score</p>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Total Points: <span className="font-bold text-foreground">{totalPoints} pts</span>
            </div>

            {canAttempt ? (
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-xl text-xs font-semibold gap-2 h-11 px-8"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                {startMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {userStatus.activeAttempt
                  ? "Resume In-Progress Attempt"
                  : userStatus.attemptsCount > 0
                  ? "Retake Quiz"
                  : "Start Quiz"}
              </Button>
            ) : (
              <div className="text-xs text-destructive font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Maximum attempts reached for this quiz.
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // 2. RESULTS / REVIEW VIEW
  if (mode === "RESULT" && lastResult) {
    const isPassed = lastResult.passed;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link
          href={`/learn/${course.slug}`}
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
          Back to Course Curriculum
        </Link>

        <Card
          className={`p-6 sm:p-8 rounded-2xl border text-center space-y-4 ${
            isPassed
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-amber-500/10 border-amber-500/30"
          }`}
        >
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
              isPassed ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
            }`}
          >
            {isPassed ? (
              <Check className="w-8 h-8 stroke-[3]" />
            ) : (
              <XCircle className="w-8 h-8 stroke-[2.5]" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">
              {isPassed ? "Quiz Passed!" : "Quiz Not Passed"}
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {isPassed
                ? `Great job! You achieved ${lastResult.percentage}%, exceeding the passing threshold of ${lastResult.passingPct}%.`
                : `You scored ${lastResult.percentage}%. A minimum score of ${lastResult.passingPct}% is required to pass.`}
            </p>
          </div>

          <div className="inline-flex items-center gap-4 bg-card/80 backdrop-blur px-6 py-3 rounded-xl border border-border shadow-xs">
            <div className="text-center">
              <span className="text-xs text-muted-foreground font-medium">Points</span>
              <div className="text-lg font-bold text-foreground">
                {lastResult.score} / {lastResult.maxScore}
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <span className="text-xs text-muted-foreground font-medium">Grade</span>
              <div
                className={`text-lg font-bold ${
                  isPassed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {lastResult.percentage}%
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="sm" variant="outline" className="rounded-xl text-xs" asChild>
              <Link href={`/learn/${course.slug}`}>
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                Return to Course
              </Link>
            </Button>

            {(!quiz.maxAttempts || userStatus.attemptsCount < quiz.maxAttempts) && (
              <Button
                size="sm"
                className="rounded-xl text-xs gap-1.5"
                onClick={() => setMode("INTRO")}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Take Again
              </Button>
            )}
          </div>
        </Card>

        {lastResult.review && lastResult.review.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">
              Question Breakdown & Explanations
            </h3>

            {lastResult.review.map((q, idx) => {
              const selectedSet = new Set(q.selectedOptionIds);
              const correctSet = new Set(
                q.options.filter((o) => o.isCorrect).map((o) => o.id)
              );

              const isQuestionCorrect =
                selectedSet.size === correctSet.size &&
                [...selectedSet].every((id) => correctSet.has(id));

              return (
                <Card
                  key={q.id || idx}
                  className={`p-5 rounded-2xl border transition-colors ${
                    isQuestionCorrect
                      ? "border-emerald-500/30 bg-card"
                      : "border-destructive/30 bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isQuestionCorrect ? "default" : "destructive"}
                        className="text-[11px] font-semibold"
                      >
                        Q{idx + 1}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {isQuestionCorrect
                          ? `${q.points} / ${q.points} pts`
                          : `0 / ${q.points} pts`}
                      </span>
                    </div>

                    {isQuestionCorrect ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Correct
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[11px] gap-1">
                        <XCircle className="w-3 h-3" />
                        Incorrect
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-foreground mb-3">
                    {q.prompt}
                  </p>

                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isSelected = selectedSet.has(opt.id);
                      const isCorrect = opt.isCorrect;

                      let itemStyle =
                        "border-border bg-muted/20 text-muted-foreground";
                      if (isCorrect) {
                        itemStyle =
                          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium";
                      } else if (isSelected && !isCorrect) {
                        itemStyle =
                          "border-destructive/40 bg-destructive/10 text-destructive line-through";
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${itemStyle}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0 bg-current opacity-60" />
                            <span>{opt.text}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSelected && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5">
                                Your Choice
                              </Badge>
                            )}
                            {isCorrect && (
                              <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5 h-5">
                                Correct Answer
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1">
                      <span className="font-semibold text-foreground">Explanation:</span>
                      <p className="text-muted-foreground leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 3. TAKING VIEW
  if (!currentQ) return null;

  const currentAnswers = answers[currentQ.id] || [];
  const isUrgent = timeLeftSec !== null && timeLeftSec <= 60;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
            {quiz.title}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Question {currentQuestionIdx + 1} of {questions.length} ({answeredCount} answered)
          </p>
        </div>

        {timeLeftSec !== null && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-colors ${
              isUrgent
                ? "bg-destructive/10 text-destructive border-destructive/30 animate-pulse"
                : "bg-muted text-foreground border-border"
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isUrgent ? "text-destructive" : "text-primary"}`} />
            <span>{formatTimer(timeLeftSec)}</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Progress
          value={((currentQuestionIdx + 1) / questions.length) * 100}
          className="h-1.5 rounded-full"
        />
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {questions.map((q, idx) => {
            const hasAns = (answers[q.id] || []).length > 0;
            const isCurrent = idx === currentQuestionIdx;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center justify-center ${
                  isCurrent
                    ? "ring-2 ring-primary bg-primary text-primary-foreground"
                    : hasAns
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted/80 text-muted-foreground hover:bg-muted"
                }`}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      <Card className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="outline" className="text-xs">
            {currentQ.type === "SINGLE"
              ? "Single Choice"
              : currentQ.type === "MULTIPLE"
              ? "Multiple Choice"
              : "True / False"}
          </Badge>

          <span className="text-xs font-semibold text-muted-foreground">
            {currentQ.points} {currentQ.points === 1 ? "Point" : "Points"}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
          {currentQ.prompt}
        </h3>

        <div className="space-y-2.5">
          {currentQ.options.map((opt) => {
            const isSelected = currentAnswers.includes(opt.id);

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption(currentQ.id, opt.id, currentQ.type)}
                className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/40 shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-${
                      currentQ.type === "MULTIPLE" ? "md" : "full"
                    } border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>

        {currentAnswers.length > 0 && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-[11px] text-muted-foreground hover:text-destructive h-7 px-2"
              onClick={() =>
                setAnswers((prev) => ({
                  ...prev,
                  [currentQ.id]: [],
                }))
              }
            >
              Clear Selection
            </Button>
          </div>
        )}

        <div className="pt-4 flex items-center justify-between border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-1"
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentQuestionIdx < questions.length - 1 ? (
              <Button
                type="button"
                size="sm"
                className="rounded-xl text-xs gap-1"
                onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            ) : null}

            <AlertDialog
              open={submitConfirmOpen}
              onOpenChange={setSubmitConfirmOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Quiz
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base font-bold">
                    Submit Quiz Attempt?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-muted-foreground">
                    You have answered {answeredCount} of {questions.length} questions.
                    {answeredCount < questions.length && (
                      <span className="block mt-1 font-medium text-amber-600 dark:text-amber-400">
                        Warning: {questions.length - answeredCount} question(s) remain unanswered!
                      </span>
                    )}
                    Once submitted, your answers will be graded immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl text-xs">
                    Review Questions
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-xl text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      setSubmitConfirmOpen(false);
                      handleSubmitAttempt();
                    }}
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : null}
                    Confirm & Submit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function QuizTakingView({ quizId }: QuizTakingViewProps) {
  const {
    data: quizData,
    isLoading,
    isError,
    refetch,
  } = useQuery<QuizStudentData>({
    queryKey: ["student-quiz", quizId],
    queryFn: async () => {
      const res = await fetchApi<QuizStudentData>(`/api/quizzes/${quizId}`);
      return res;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6 animate-pulse">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !quizData) {
    return (
      <Card className="max-w-md mx-auto mt-16 p-8 text-center rounded-2xl border-destructive/20 bg-destructive/5 text-destructive space-y-3">
        <AlertCircle className="w-10 h-10 mx-auto" />
        <h2 className="text-base font-bold text-foreground">Quiz Not Found</h2>
        <p className="text-xs text-muted-foreground">
          You may not be enrolled in this course or the quiz has been removed.
        </p>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" asChild>
          <Link href="/my-courses">Return to My Courses</Link>
        </Button>
      </Card>
    );
  }

  return (
    <QuizTakingSession
      key={quizData.userStatus.activeAttempt?._id || "quiz-session"}
      quizId={quizId}
      quizData={quizData}
      onRefreshData={() => refetch()}
    />
  );
}
