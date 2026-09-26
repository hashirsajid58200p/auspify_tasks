"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api-client";
import { ClassWithCounts } from "@/types/class";
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
import { Label } from "@/components/ui/label";

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classToEdit?: ClassWithCounts | null;
}

function ClassFormContent({
  classToEdit,
  onClose,
}: {
  classToEdit?: ClassWithCounts | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!classToEdit;

  const [name, setName] = React.useState(classToEdit?.name || "");
  const [gradeLevel, setGradeLevel] = React.useState(classToEdit?.gradeLevel || "");
  const [capacity, setCapacity] = React.useState(
    classToEdit ? classToEdit.capacity.toString() : "30",
  );
  const [homeroomTeacherName, setHomeroomTeacherName] = React.useState(
    classToEdit?.homeroomTeacherName || "",
  );
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      const parsedCapacity = parseInt(capacity, 10);
      const payload = {
        name: name.trim(),
        gradeLevel: gradeLevel.trim(),
        capacity: isNaN(parsedCapacity) ? 30 : parsedCapacity,
        homeroomTeacherName: homeroomTeacherName.trim(),
      };

      if (isEditing && classToEdit) {
        return api.patch<ClassWithCounts>(`/api/classes/${classToEdit.id}`, payload);
      } else {
        return api.post<ClassWithCounts>("/api/classes", payload);
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success(
        isEditing
          ? `Class "${saved.name}" updated successfully.`
          : `Class "${saved.name}" created successfully.`,
      );
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        }
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred while saving the class.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Class" : "Create New Class"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update class details, capacity limit, and assigned homeroom teacher."
            : "Add a new class group to organize student enrollment and homerooms."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="className">
            Class Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="className"
            placeholder="e.g. Grade 10 - Alpha"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="gradeLevel">
              Grade Level <span className="text-destructive">*</span>
            </Label>
            <Input
              id="gradeLevel"
              placeholder="e.g. Grade 10"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              required
            />
            {fieldErrors.gradeLevel && (
              <p className="text-xs text-destructive">{fieldErrors.gradeLevel[0]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="capacity">
              Max Capacity <span className="text-destructive">*</span>
            </Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="200"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
            {fieldErrors.capacity && (
              <p className="text-xs text-destructive">{fieldErrors.capacity[0]}</p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="homeroomTeacher">
            Homeroom Teacher <span className="text-destructive">*</span>
          </Label>
          <Input
            id="homeroomTeacher"
            placeholder="e.g. Ms. Sarah Robinson"
            value={homeroomTeacherName}
            onChange={(e) => setHomeroomTeacherName(e.target.value)}
            required
          />
          {fieldErrors.homeroomTeacherName && (
            <p className="text-xs text-destructive">{fieldErrors.homeroomTeacherName[0]}</p>
          )}
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Class"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ClassFormDialog({ open, onOpenChange, classToEdit }: ClassFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        {open && (
          <ClassFormContent
            key={classToEdit ? classToEdit.id : "create-new"}
            classToEdit={classToEdit}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
