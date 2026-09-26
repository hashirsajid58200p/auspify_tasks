"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  AlertCircle,
  Loader2,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApi, ApiClientError } from "@/lib/api-client";

export interface AssignmentFormData {
  _id?: string;
  title: string;
  instructions: string;
  moduleId: string | null;
  dueAt: string | null;
  maxPoints: number;
  allowLate: boolean;
  isRequired: boolean;
}

interface AssignmentModalProps {
  courseId: string;
  modules: Array<{ id?: string; _id?: unknown; title: string }>;
  assignment: AssignmentFormData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AssignmentFormProps {
  courseId: string;
  modules: Array<{ id?: string; _id?: unknown; title: string }>;
  assignment: AssignmentFormData | null;
  onClose: () => void;
}

function AssignmentForm({
  courseId,
  modules,
  assignment,
  onClose,
}: AssignmentFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!assignment?._id;

  const [formData, setFormData] = React.useState<AssignmentFormData>(() => {
    if (assignment) {
      let formattedDueAt = "";
      if (assignment.dueAt) {
        try {
          const d = new Date(assignment.dueAt);
          formattedDueAt = d.toISOString().slice(0, 16);
        } catch {
          formattedDueAt = "";
        }
      }

      return {
        _id: assignment._id,
        title: assignment.title || "",
        instructions: assignment.instructions || "",
        moduleId: assignment.moduleId || null,
        dueAt: formattedDueAt || null,
        maxPoints: assignment.maxPoints ?? 100,
        allowLate: assignment.allowLate ?? true,
        isRequired: assignment.isRequired ?? true,
      };
    }
    return {
      title: "",
      instructions: "",
      moduleId: null,
      dueAt: null,
      maxPoints: 100,
      allowLate: true,
      isRequired: true,
    };
  });

  const [validationError, setValidationError] = React.useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (payload: AssignmentFormData) => {
      const url = isEditing
        ? `/api/instructor/courses/${courseId}/assignments/${assignment!._id}`
        : `/api/instructor/courses/${courseId}/assignments`;
      const method = isEditing ? "PATCH" : "POST";

      const bodyPayload = {
        title: payload.title.trim(),
        instructions: payload.instructions.trim(),
        moduleId: payload.moduleId || undefined,
        dueAt: payload.dueAt ? new Date(payload.dueAt).toISOString() : null,
        maxPoints: Number(payload.maxPoints),
        allowLate: payload.allowLate,
        isRequired: payload.isRequired,
      };

      return await fetchApi(url, {
        method,
        body: JSON.stringify(bodyPayload),
      });
    },
    onSuccess: () => {
      toast.success(
        isEditing
          ? "Assignment updated successfully."
          : "Assignment created successfully."
      );
      queryClient.invalidateQueries({ queryKey: ["instructor-assignments", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-builder", courseId] });
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save assignment.");
      }
    },
  });

  const validateForm = (): boolean => {
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setValidationError("Assignment title must be at least 3 characters.");
      return false;
    }
    if (!formData.instructions.trim() || formData.instructions.trim().length < 10) {
      setValidationError("Instructions must be at least 10 characters.");
      return false;
    }
    if (formData.maxPoints < 1 || formData.maxPoints > 1000) {
      setValidationError("Max points must be between 1 and 1000.");
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    saveMutation.mutate(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          {isEditing ? "Edit Assignment" : "Create New Assignment"}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Provide instructions, grading scale, and deadlines for students.
        </DialogDescription>
      </DialogHeader>

      {validationError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 mt-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Assignment Title *</Label>
          <Input
            placeholder="e.g. Build a REST API with Express"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="rounded-xl text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  None (Course-Level Assignment)
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
            <Label className="text-xs font-semibold">Max Points</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={formData.maxPoints}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxPoints: parseInt(e.target.value) || 100,
                }))
              }
              className="rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Instructions (Markdown supported) *</Label>
          <Textarea
            placeholder="Write detailed assignment prompt, submission requirements, and rubrics..."
            value={formData.instructions}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, instructions: e.target.value }))
            }
            rows={6}
            className="rounded-xl text-xs resize-y font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Due Date (Optional)</Label>
            <Input
              type="datetime-local"
              value={formData.dueAt || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dueAt: e.target.value || null,
                }))
              }
              className="rounded-xl text-xs"
            />
          </div>

          <div className="flex flex-col justify-end space-y-3 pb-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="asgnIsRequired"
                checked={formData.isRequired}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    isRequired: checked === true,
                  }))
                }
              />
              <label
                htmlFor="asgnIsRequired"
                className="text-xs font-medium cursor-pointer"
              >
                Required for Course Completion
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowLate"
                checked={formData.allowLate}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    allowLate: checked === true,
                  }))
                }
              />
              <label
                htmlFor="allowLate"
                className="text-xs font-medium cursor-pointer"
              >
                Allow Late Submissions
              </label>
            </div>
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
          {isEditing ? "Save Assignment Changes" : "Create Assignment"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function AssignmentModal({
  courseId,
  modules,
  assignment,
  open,
  onOpenChange,
}: AssignmentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        {open && (
          <AssignmentForm
            key={assignment?._id || "new-assignment"}
            courseId={courseId}
            modules={modules}
            assignment={assignment}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
