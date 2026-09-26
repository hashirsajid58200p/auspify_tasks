"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api-client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface DeleteStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  } | null;
  onSuccess?: () => void;
}

function DeleteStudentContent({
  student,
  onClose,
  onSuccess,
}: {
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [typedConfirmation, setTypedConfirmation] = React.useState("");

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean; message: string }>(`/api/students/${id}`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(data.message || "Student removed successfully.");
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete student record.");
      }
    },
  });

  const fullName = `${student.firstName} ${student.lastName}`.trim();
  const isMatch =
    typedConfirmation.trim().toLowerCase() === student.studentId.toLowerCase() ||
    typedConfirmation.trim().toLowerCase() === fullName.toLowerCase();

  const handleDelete = () => {
    if (!isMatch) return;
    mutation.mutate(student.id);
  };

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          Delete Student Record
        </AlertDialogTitle>
        <AlertDialogDescription className="space-y-3 pt-2 text-left">
          <span className="block text-foreground/90">
            You are about to delete{" "}
            <strong className="font-semibold text-foreground">{fullName}</strong> (
            <span className="font-mono text-xs">{student.studentId}</span>). This will permanently
            purge the student record and record an audit log entry.
          </span>

          <span className="block text-xs bg-muted p-2.5 rounded-md border text-muted-foreground">
            To prevent accidental deletion, please type the student&apos;s ID (
            <strong className="text-foreground">{student.studentId}</strong>) or full name (
            <strong className="text-foreground">{fullName}</strong>) below to confirm:
          </span>

          <div className="space-y-1.5 pt-2">
            <Label htmlFor="confirmationInput" className="text-xs font-medium">
              Type <span className="font-mono">{student.studentId}</span> to confirm:
            </Label>
            <Input
              id="confirmationInput"
              placeholder={student.studentId}
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              autoComplete="off"
              className="font-mono text-sm"
            />
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter className="gap-2 sm:gap-0">
        <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={!isMatch || mutation.isPending}
        >
          {mutation.isPending ? "Deleting..." : "Permanently Delete"}
        </Button>
      </AlertDialogFooter>
    </>
  );
}

export function DeleteStudentDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: DeleteStudentDialogProps) {
  if (!student) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        {open && (
          <DeleteStudentContent
            key={student.id}
            student={student}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
