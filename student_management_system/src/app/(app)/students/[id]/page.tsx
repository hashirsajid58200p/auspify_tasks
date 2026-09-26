"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { StudentDetail } from "@/types/student";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { StudentProfileCards } from "@/components/students/student-profile-cards";
import { StudentFormDialog } from "@/components/students/student-form-dialog";
import { DeleteStudentDialog } from "@/components/students/delete-student-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Edit2, Trash2, AlertCircle, RefreshCw } from "lucide-react";

function calculateAge(dobVal: Date | string | undefined): number | null {
  if (!dobVal) return null;
  const d = new Date(dobVal);
  if (isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function formatDate(val: Date | string | undefined): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const {
    data: student,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<StudentDetail>({
    queryKey: ["student", id],
    queryFn: () => api.get<StudentDetail>(`/api/students/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-56 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/students">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Students
          </Link>
        </Button>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h3 className="font-semibold text-lg">Unable to load student record</h3>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "The requested student could not be found."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = `${student.firstName[0] || ""}${student.lastName[0] || ""}`.toUpperCase();
  const age = calculateAge(student.dob);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href="/students">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Student Directory
          </Link>
        </Button>
      </div>

      {/* Main Profile Header Banner */}
      <Card className="shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-border shadow-xs shrink-0">
                <AvatarImage
                  src={student.photoUrl}
                  alt={`${student.firstName} ${student.lastName}`}
                />
                <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
                    {student.firstName} {student.lastName}
                  </h1>
                  <StudentStatusBadge status={student.status} />
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-sm border">
                    {student.studentId}
                  </span>
                  <span>•</span>
                  <span>{student.gender}</span>
                  <span>•</span>
                  <span>{student.class?.name || "Unassigned"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <Edit2 className="h-4 w-4 mr-1.5" /> Edit Profile
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <StudentProfileCards student={student} />

      {/* Dialogs */}
      <StudentFormDialog open={isEditOpen} onOpenChange={setIsEditOpen} studentToEdit={student} />
      <DeleteStudentDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        student={student}
        onSuccess={() => router.push("/students")}
      />
    </div>
  );
}
