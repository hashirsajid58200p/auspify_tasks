"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api-client";
import { ClassWithCounts } from "@/types/class";
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
import { AlertCircle } from "lucide-react";

interface DeleteClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classToDelete: ClassWithCounts | null;
}

export function DeleteClassDialog({ open, onOpenChange, classToDelete }: DeleteClassDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean; message: string }>(`/api/classes/${id}`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success(data.message || "Class deleted successfully.");
      onOpenChange(false);
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete class.");
      }
    },
  });

  if (!classToDelete) return null;

  const hasStudents = classToDelete.enrolledCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasStudents && <AlertCircle className="h-5 w-5 text-destructive shrink-0" />}
            {hasStudents ? "Cannot Delete Class" : "Delete Class"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 pt-2">
            {hasStudents ? (
              <span className="block text-foreground/90 font-medium">
                Class <span className="font-semibold">{classToDelete.name}</span> cannot be deleted
                because{" "}
                <span className="font-bold text-destructive">{classToDelete.enrolledCount}</span>{" "}
                student(s) are currently enrolled in it.
              </span>
            ) : (
              <span>
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-foreground">{classToDelete.name}</span>? This
                action cannot be undone.
              </span>
            )}

            {hasStudents && (
              <span className="block text-xs text-muted-foreground bg-muted p-2.5 rounded-md border">
                <strong>Policy Requirement:</strong> A class cannot be removed while active or
                historical student records reference it. Please reassign those students to a
                different class first.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={mutation.isPending}>
            {hasStudents ? "Close" : "Cancel"}
          </AlertDialogCancel>
          {!hasStudents && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                mutation.mutate(classToDelete.id);
              }}
              disabled={mutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {mutation.isPending ? "Deleting..." : "Delete Class"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
