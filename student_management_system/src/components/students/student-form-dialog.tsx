"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api-client";
import { ClassWithCounts } from "@/types/class";
import { StudentDetail, StudentListItem } from "@/types/student";
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
import { Textarea } from "@/components/ui/textarea";

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentToEdit?: StudentDetail | StudentListItem | null;
  onSuccess?: () => void;
}

function formatDateForInput(dateVal: Date | string | undefined): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function StudentFormContent({
  studentToEdit,
  classes,
  onClose,
  onSuccess,
}: {
  studentToEdit?: StudentDetail | StudentListItem | null;
  classes: ClassWithCounts[];
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!studentToEdit;
  const detail = studentToEdit as StudentDetail | undefined;

  const [studentId, setStudentId] = React.useState(studentToEdit?.studentId || "");
  const [firstName, setFirstName] = React.useState(studentToEdit?.firstName || "");
  const [lastName, setLastName] = React.useState(studentToEdit?.lastName || "");
  const [dob, setDob] = React.useState(formatDateForInput(detail?.dob) || "2008-01-01");
  const [gender, setGender] = React.useState(studentToEdit?.gender || "MALE");
  const [classId, setClassId] = React.useState(studentToEdit?.classId || classes[0]?.id || "");
  const [enrollmentDate, setEnrollmentDate] = React.useState(
    formatDateForInput(studentToEdit?.enrollmentDate) || formatDateForInput(new Date()),
  );
  const [status, setStatus] = React.useState(studentToEdit?.status || "ACTIVE");
  const [guardianName, setGuardianName] = React.useState(detail?.guardianName || "");
  const [guardianPhone, setGuardianPhone] = React.useState(detail?.guardianPhone || "");
  const [guardianEmail, setGuardianEmail] = React.useState(detail?.guardianEmail || "");
  const [phone, setPhone] = React.useState(detail?.phone || "");
  const [email, setEmail] = React.useState(detail?.email || "");
  const [address, setAddress] = React.useState(detail?.address || "");
  const [photoUrl, setPhotoUrl] = React.useState(studentToEdit?.photoUrl || "");
  const [notes, setNotes] = React.useState(detail?.notes || "");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob,
        gender,
        classId,
        enrollmentDate,
        status,
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        guardianEmail: guardianEmail.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        address: address.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (!isEditing) {
        payload.studentId = studentId.trim();
        return api.post<StudentDetail>("/api/students", payload);
      } else {
        return api.patch<StudentDetail>(`/api/students/${studentToEdit.id}`, payload);
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["student", studentToEdit?.id] });
      toast.success(
        isEditing
          ? `Student "${saved.firstName} ${saved.lastName}" updated successfully.`
          : `Student "${saved.firstName} ${saved.lastName}" registered successfully.`,
      );
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred while saving student.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
      <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
        <DialogTitle>{isEditing ? "Edit Student Profile" : "Register New Student"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? `Update details and contact records for student ${studentToEdit.studentId}.`
            : "Enroll a new student and record guardian contact information."}
        </DialogDescription>
      </DialogHeader>

      <div className="overflow-y-auto px-6 py-3 space-y-6">
        {/* Section 1: Academic & Identification */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1.5">
            Student Identification & Class
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="studentId">
                Student ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="studentId"
                placeholder="e.g. STU-2024-001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={isEditing}
                required
              />
              {fieldErrors.studentId && (
                <p className="text-xs text-destructive">{fieldErrors.studentId[0]}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="classId">
                Assigned Class <span className="text-destructive">*</span>
              </Label>
              <select
                id="classId"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="" disabled>
                  Select a class...
                </option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id} className="bg-popover text-popover-foreground">
                    {c.name} ({c.gradeLevel})
                  </option>
                ))}
              </select>
              {fieldErrors.classId && (
                <p className="text-xs text-destructive">{fieldErrors.classId[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              {fieldErrors.firstName && (
                <p className="text-xs text-destructive">{fieldErrors.firstName[0]}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              {fieldErrors.lastName && (
                <p className="text-xs text-destructive">{fieldErrors.lastName[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="dob">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
              {fieldErrors.dob && <p className="text-xs text-destructive">{fieldErrors.dob[0]}</p>}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="gender">
                Gender <span className="text-destructive">*</span>
              </Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="MALE" className="bg-popover text-popover-foreground">
                  Male
                </option>
                <option value="FEMALE" className="bg-popover text-popover-foreground">
                  Female
                </option>
                <option value="OTHER" className="bg-popover text-popover-foreground">
                  Other
                </option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="ACTIVE" className="bg-popover text-popover-foreground">
                  Active
                </option>
                <option value="INACTIVE" className="bg-popover text-popover-foreground">
                  Inactive
                </option>
                <option value="GRADUATED" className="bg-popover text-popover-foreground">
                  Graduated
                </option>
                <option value="TRANSFERRED" className="bg-popover text-popover-foreground">
                  Transferred
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Guardian Details */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1.5">
            Guardian & Emergency Contacts (Confidential PII)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="guardianName">
                Guardian Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guardianName"
                placeholder="Parent/Guardian name"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                required
              />
              {fieldErrors.guardianName && (
                <p className="text-xs text-destructive">{fieldErrors.guardianName[0]}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="guardianPhone">
                Guardian Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guardianPhone"
                placeholder="+1-555-0100"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                required
              />
              {fieldErrors.guardianPhone && (
                <p className="text-xs text-destructive">{fieldErrors.guardianPhone[0]}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="guardianEmail">
                Guardian Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guardianEmail"
                type="email"
                placeholder="guardian@example.com"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                required
              />
              {fieldErrors.guardianEmail && (
                <p className="text-xs text-destructive">{fieldErrors.guardianEmail[0]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Optional Contact, Address, & Notes */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1.5">
            Residence, Photo & Notes
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="address">Residential Address</Label>
              <Input
                id="address"
                placeholder="123 Street Name, City, Postal Code"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="photoUrl">Photo URL (HTTPS Unsplash/Pexels)</Label>
              <Input
                id="photoUrl"
                placeholder="https://images.unsplash.com/..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
              {fieldErrors.photoUrl && (
                <p className="text-xs text-destructive">{fieldErrors.photoUrl[0]}</p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes / Special Considerations</Label>
            <Textarea
              id="notes"
              placeholder="Medical notes, academic accommodations, or administrative comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>

      <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? isEditing
              ? "Saving..."
              : "Registering..."
            : isEditing
              ? "Save Changes"
              : "Register Student"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function StudentFormDialog({
  open,
  onOpenChange,
  studentToEdit,
  onSuccess,
}: StudentFormDialogProps) {
  const { data: classes = [] } = useQuery<ClassWithCounts[]>({
    queryKey: ["classes"],
    queryFn: () => api.get<ClassWithCounts[]>("/api/classes"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] p-0 overflow-hidden">
        {open && (
          <StudentFormContent
            key={studentToEdit ? studentToEdit.id : "create-student"}
            studentToEdit={studentToEdit}
            classes={classes}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
