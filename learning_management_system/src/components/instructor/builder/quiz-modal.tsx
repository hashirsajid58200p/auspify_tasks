"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ListChecks,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { QuestionType, ShowAnswersMode } from "@/server/models/quiz";

export interface QuizOptionDraft {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionDraft {
  id: string;
  type: QuestionType;
  prompt: string;
  options: QuizOptionDraft[];
  points: number;
  explanation: string;
}

export interface QuizFormData {
  _id?: string;
  title: string;
  description: string;
  moduleId: string | null;
  timeLimitMin: number | null;
  passingPct: number;
  maxAttempts: number;
  shuffle: boolean;
  showAnswers: ShowAnswersMode;
  isRequired: boolean;
  questions: QuizQuestionDraft[];
}

interface QuizModalProps {
  courseId: string;
  modules: Array<{ id?: string; _id?: unknown; title: string }>;
  quiz: QuizFormData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateId(): string {
  return "opt_" + Math.random().toString(36).substring(2, 9);
}

function createDefaultQuestion(): QuizQuestionDraft {
  return {
    id: "q_" + Math.random().toString(36).substring(2, 9),
    type: "SINGLE",
    prompt: "",
    points: 1,
    explanation: "",
    options: [
      { id: generateId(), text: "Option 1", isCorrect: true },
      { id: generateId(), text: "Option 2", isCorrect: false },
    ],
  };
}

interface QuizFormProps {
  courseId: string;
  modules: Array<{ id?: string; _id?: unknown; title: string }>;
  quiz: QuizFormData | null;
  onClose: () => void;
}

function QuizForm({ courseId, modules, quiz, onClose }: QuizFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!quiz?._id;

  const [formData, setFormData] = React.useState<QuizFormData>(() => {
    if (quiz) {
      return {
        _id: quiz._id,
        title: quiz.title || "",
        description: quiz.description || "",
        moduleId: quiz.moduleId || null,
        timeLimitMin: quiz.timeLimitMin ?? null,
        passingPct: quiz.passingPct ?? 70,
        maxAttempts: quiz.maxAttempts ?? 0,
        shuffle: !!quiz.shuffle,
        showAnswers: quiz.showAnswers || "AFTER_SUBMIT",
        isRequired: quiz.isRequired ?? true,
        questions:
          quiz.questions && quiz.questions.length > 0
            ? quiz.questions.map((q) => ({
                id: q.id || generateId(),
                type: q.type,
                prompt: q.prompt,
                points: q.points || 1,
                explanation: q.explanation || "",
                options: q.options.map((o) => ({
                  id: o.id || generateId(),
                  text: o.text,
                  isCorrect: !!o.isCorrect,
                })),
              }))
            : [createDefaultQuestion()],
      };
    }
    return {
      title: "",
      description: "",
      moduleId: null,
      timeLimitMin: null,
      passingPct: 70,
      maxAttempts: 0,
      shuffle: false,
      showAnswers: "AFTER_SUBMIT",
      isRequired: true,
      questions: [createDefaultQuestion()],
    };
  });

  const [validationError, setValidationError] = React.useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (payload: QuizFormData) => {
      const url = isEditing
        ? `/api/instructor/courses/${courseId}/quizzes/${quiz!._id}`
        : `/api/instructor/courses/${courseId}/quizzes`;
      const method = isEditing ? "PATCH" : "POST";

      const bodyPayload = {
        title: payload.title,
        description: payload.description || undefined,
        moduleId: payload.moduleId || undefined,
        timeLimitMin: payload.timeLimitMin ? Number(payload.timeLimitMin) : null,
        passingPct: Number(payload.passingPct),
        maxAttempts: Number(payload.maxAttempts),
        shuffle: payload.shuffle,
        showAnswers: payload.showAnswers,
        isRequired: payload.isRequired,
        questions: payload.questions.map((q) => ({
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          points: Number(q.points),
          explanation: q.explanation || undefined,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        })),
      };

      return await fetchApi(url, {
        method,
        body: JSON.stringify(bodyPayload),
      });
    },
    onSuccess: () => {
      toast.success(isEditing ? "Quiz updated successfully." : "Quiz created successfully.");
      queryClient.invalidateQueries({ queryKey: ["instructor-quizzes", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save quiz.");
      }
    },
  });

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setValidationError("Quiz title is required.");
      return false;
    }
    if (formData.questions.length === 0) {
      setValidationError("At least one question is required.");
      return false;
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.prompt.trim()) {
        setValidationError(`Question #${i + 1} prompt cannot be empty.`);
        return false;
      }
      if (q.options.length < 2) {
        setValidationError(`Question #${i + 1} must have at least 2 options.`);
        return false;
      }
      const emptyOpt = q.options.some((o) => !o.text.trim());
      if (emptyOpt) {
        setValidationError(`Question #${i + 1} contains empty options.`);
        return false;
      }

      const correctCount = q.options.filter((o) => o.isCorrect).length;
      if (q.type === "SINGLE" || q.type === "TRUE_FALSE") {
        if (correctCount !== 1) {
          setValidationError(`Question #${i + 1} (${q.type}) must have exactly one correct option selected.`);
          return false;
        }
      } else if (q.type === "MULTIPLE") {
        if (correctCount < 1) {
          setValidationError(`Question #${i + 1} (Multiple Choice) must have at least one correct option selected.`);
          return false;
        }
      }
    }

    setValidationError(null);
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    saveMutation.mutate(formData);
  };

  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, createDefaultQuestion()],
    }));
  };

  const handleRemoveQuestion = (idx: number) => {
    if (formData.questions.length <= 1) {
      toast.error("A quiz must have at least one question.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  const handleQuestionChange = (
    idx: number,
    field: keyof QuizQuestionDraft,
    value: unknown
  ) => {
    setFormData((prev) => {
      const nextQuestions = [...prev.questions];
      const target = { ...nextQuestions[idx], [field]: value };

      if (field === "type") {
        if (value === "TRUE_FALSE") {
          target.options = [
            { id: generateId(), text: "True", isCorrect: true },
            { id: generateId(), text: "False", isCorrect: false },
          ];
        } else if (target.options.length < 2) {
          target.options = [
            { id: generateId(), text: "Option 1", isCorrect: true },
            { id: generateId(), text: "Option 2", isCorrect: false },
          ];
        }
      }

      nextQuestions[idx] = target;
      return { ...prev, questions: nextQuestions };
    });
  };

  const handleAddOption = (qIdx: number) => {
    setFormData((prev) => {
      const nextQuestions = [...prev.questions];
      const q = nextQuestions[qIdx];
      if (q.options.length >= 8) {
        toast.error("Maximum 8 options per question.");
        return prev;
      }
      q.options = [
        ...q.options,
        { id: generateId(), text: `Option ${q.options.length + 1}`, isCorrect: false },
      ];
      return { ...prev, questions: nextQuestions };
    });
  };

  const handleRemoveOption = (qIdx: number, oIdx: number) => {
    setFormData((prev) => {
      const nextQuestions = [...prev.questions];
      const q = nextQuestions[qIdx];
      if (q.options.length <= 2) {
        toast.error("Minimum 2 options required.");
        return prev;
      }
      q.options = q.options.filter((_, i) => i !== oIdx);
      return { ...prev, questions: nextQuestions };
    });
  };

  const handleOptionTextChange = (qIdx: number, oIdx: number, text: string) => {
    setFormData((prev) => {
      const nextQuestions = [...prev.questions];
      nextQuestions[qIdx].options[oIdx].text = text;
      return { ...prev, questions: nextQuestions };
    });
  };

  const handleOptionCorrectToggle = (qIdx: number, oIdx: number) => {
    setFormData((prev) => {
      const nextQuestions = [...prev.questions];
      const q = nextQuestions[qIdx];

      if (q.type === "SINGLE" || q.type === "TRUE_FALSE") {
        q.options = q.options.map((opt, i) => ({
          ...opt,
          isCorrect: i === oIdx,
        }));
      } else {
        q.options = q.options.map((opt, i) =>
          i === oIdx ? { ...opt, isCorrect: !opt.isCorrect } : opt
        );
      }

      return { ...prev, questions: nextQuestions };
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" />
          {isEditing ? "Edit Quiz" : "Create New Quiz"}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Configure quiz rules, timing, scoring, and question options.
        </DialogDescription>
      </DialogHeader>

      {validationError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 mt-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="space-y-6 pt-2">
        {/* Basic Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold">Quiz Title *</Label>
            <Input
              placeholder="e.g. Module 1 Knowledge Check"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold">Description / Instructions</Label>
            <Textarea
              placeholder="Brief instructions for students taking this quiz..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={2}
              className="rounded-xl text-xs resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Associated Module</Label>
            <Select
              value={formData.moduleId || "none"}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  moduleId: val === "none" ? null : val,
                }))
              }
            >
              <SelectTrigger className="rounded-xl text-xs">
                <SelectValue placeholder="Select module (optional)" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none" className="text-xs">
                  None (Course-Level Quiz)
                </SelectItem>
                {modules.map((m) => {
                  const id = (m.id || m._id)?.toString();
                  if (!id) return null;
                  return (
                    <SelectItem key={id} value={id} className="text-xs">
                      {m.title}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Passing Score (%)</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={formData.passingPct}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  passingPct: parseInt(e.target.value) || 70,
                }))
              }
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Time Limit (Minutes)
            </Label>
            <Input
              type="number"
              min={1}
              max={360}
              placeholder="Leave blank for untimed"
              value={formData.timeLimitMin ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  timeLimitMin: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Max Attempts (0 = Unlimited)
            </Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={formData.maxAttempts}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxAttempts: parseInt(e.target.value) || 0,
                }))
              }
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Show Correct Answers</Label>
            <Select
              value={formData.showAnswers}
              onValueChange={(val: ShowAnswersMode) =>
                setFormData((prev) => ({ ...prev, showAnswers: val }))
              }
            >
              <SelectTrigger className="rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="AFTER_SUBMIT" className="text-xs">
                  After Submission
                </SelectItem>
                <SelectItem value="NEVER" className="text-xs">
                  Never (Hide Explanations)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col justify-end space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRequired"
                checked={formData.isRequired}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    isRequired: checked === true,
                  }))
                }
              />
              <label
                htmlFor="isRequired"
                className="text-xs font-medium cursor-pointer"
              >
                Required for Course Completion
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="shuffle"
                checked={formData.shuffle}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    shuffle: checked === true,
                  }))
                }
              />
              <label
                htmlFor="shuffle"
                className="text-xs font-medium cursor-pointer"
              >
                Shuffle Questions for Students
              </label>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Questions ({formData.questions.length})
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Build single choice, multiple choice, or true/false questions.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl text-xs gap-1 h-8"
              onClick={handleAddQuestion}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Question
            </Button>
          </div>

          <div className="space-y-4">
            {formData.questions.map((q, qIdx) => (
              <Card
                key={q.id || qIdx}
                className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[11px] font-semibold">
                    Question #{qIdx + 1}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Points:
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={q.points}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIdx,
                            "points",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-16 h-7 text-xs rounded-lg px-2"
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={() => handleRemoveQuestion(qIdx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs font-medium">Prompt *</Label>
                    <Input
                      placeholder="Enter question text..."
                      value={q.prompt}
                      onChange={(e) =>
                        handleQuestionChange(qIdx, "prompt", e.target.value)
                      }
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Question Type</Label>
                    <Select
                      value={q.type}
                      onValueChange={(val: QuestionType) =>
                        handleQuestionChange(qIdx, "type", val)
                      }
                    >
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="SINGLE" className="text-xs">
                          Single Choice
                        </SelectItem>
                        <SelectItem value="MULTIPLE" className="text-xs">
                          Multiple Choice
                        </SelectItem>
                        <SelectItem value="TRUE_FALSE" className="text-xs">
                          True / False
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {q.type === "SINGLE"
                        ? "Select the single correct answer:"
                        : q.type === "MULTIPLE"
                        ? "Check all answers that apply:"
                        : "Select True or False:"}
                    </Label>
                    {q.type !== "TRUE_FALSE" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] text-primary hover:bg-primary/5 px-2"
                        onClick={() => handleAddOption(qIdx)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Option
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={opt.id || oIdx}
                        className="flex items-center gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => handleOptionCorrectToggle(qIdx, oIdx)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            opt.isCorrect
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                          title={
                            opt.isCorrect
                              ? "Correct Answer"
                              : "Mark as Correct"
                          }
                        >
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              opt.isCorrect ? "fill-emerald-500/20" : ""
                            }`}
                          />
                        </button>

                        <Input
                          placeholder={`Option ${oIdx + 1}`}
                          value={opt.text}
                          disabled={q.type === "TRUE_FALSE"}
                          onChange={(e) =>
                            handleOptionTextChange(qIdx, oIdx, e.target.value)
                          }
                          className={`rounded-xl text-xs ${
                            opt.isCorrect
                              ? "border-emerald-500/50 bg-emerald-500/5"
                              : ""
                          }`}
                        />

                        {q.type !== "TRUE_FALSE" && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg shrink-0"
                            onClick={() => handleRemoveOption(qIdx, oIdx)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Explanation (optional feedback displayed after grading)
                  </Label>
                  <Input
                    placeholder="Why is this the correct answer?"
                    value={q.explanation}
                    onChange={(e) =>
                      handleQuestionChange(qIdx, "explanation", e.target.value)
                    }
                    className="rounded-xl text-xs"
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl text-xs"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="rounded-xl text-xs gap-1.5"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          {isEditing ? "Save Quiz Changes" : "Create Quiz"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function QuizModal({
  courseId,
  modules,
  quiz,
  open,
  onOpenChange,
}: QuizModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        {open && (
          <QuizForm
            key={quiz?._id || "new-quiz"}
            courseId={courseId}
            modules={modules}
            quiz={quiz}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
