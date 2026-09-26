"use client";

import Link from "next/link";
import { StudentListItem } from "@/types/student";
import { StudentStatusBadge } from "./student-status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Eye, Trash2, Calendar, School } from "lucide-react";

interface StudentCardProps {
  student: StudentListItem;
  onEdit: (student: StudentListItem) => void;
  onDelete: (student: StudentListItem) => void;
}

function formatDate(val: Date | string | undefined): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function StudentCard({ student, onEdit, onDelete }: StudentCardProps) {
  const initials = `${student.firstName[0] || ""}${student.lastName[0] || ""}`.toUpperCase();

  return (
    <Card className="shadow-xs hover:border-foreground/20 transition-colors">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border shrink-0">
              <AvatarImage
                src={student.photoUrl}
                alt={`${student.firstName} ${student.lastName}`}
              />
              <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/students/${student.id}`}
                className="font-semibold text-base text-foreground hover:underline block leading-tight"
              >
                {student.firstName} {student.lastName}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.2 rounded-sm border">
                  {student.studentId}
                </span>
                <StudentStatusBadge status={student.status} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              asChild
              title="View Profile"
            >
              <Link href={`/students/${student.id}`} aria-label={`View ${student.firstName}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(student)}
              title="Edit Student"
              aria-label={`Edit ${student.firstName}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(student)}
              title="Delete Student"
              aria-label={`Delete ${student.firstName}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 text-xs space-y-2 border-t mt-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <School className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground font-medium">{student.className || "Unassigned"}</span>
          </span>
          {student.classGradeLevel && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {student.classGradeLevel}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Enrolled: {formatDate(student.enrollmentDate)}</span>
          </span>
          <span className="capitalize">{student.gender.toLowerCase()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
