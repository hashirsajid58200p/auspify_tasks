"use client";

import Link from "next/link";
import { StudentListItem } from "@/types/student";
import { StudentStatusBadge } from "./student-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Eye, Trash2, ArrowUpDown } from "lucide-react";

interface StudentTableProps {
  students: StudentListItem[];
  sortField: string;
  onSort: (field: string) => void;
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

export function StudentTable({ students, sortField, onSort, onEdit, onDelete }: StudentTableProps) {
  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[280px]">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 text-xs font-semibold"
                onClick={() => onSort("lastName")}
              >
                Student Name
                <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </TableHead>
            <TableHead className="w-[140px]">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 text-xs font-semibold"
                onClick={() => onSort("studentId")}
              >
                Student ID
                <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </TableHead>
            <TableHead>Class</TableHead>
            <TableHead className="w-[120px]">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 text-xs font-semibold"
                onClick={() => onSort("status")}
              >
                Status
                <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </TableHead>
            <TableHead className="w-[140px]">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 text-xs font-semibold"
                onClick={() => onSort("enrollmentDate")}
              >
                Enrolled
                <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </TableHead>
            <TableHead className="w-[110px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const initials =
              `${student.firstName[0] || ""}${student.lastName[0] || ""}`.toUpperCase();

            return (
              <TableRow key={student.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border shrink-0">
                      <AvatarImage
                        src={student.photoUrl}
                        alt={`${student.firstName} ${student.lastName}`}
                      />
                      <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <Link
                        href={`/students/${student.id}`}
                        className="font-semibold text-foreground hover:underline block truncate"
                      >
                        {student.firstName} {student.lastName}
                      </Link>
                      <span className="text-xs text-muted-foreground capitalize">
                        {student.gender.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-sm border">
                    {student.studentId}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="font-medium text-foreground text-sm">
                      {student.className || "Unassigned"}
                    </div>
                    {student.classGradeLevel && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                        {student.classGradeLevel}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StudentStatusBadge status={student.status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDate(student.enrollmentDate)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      asChild
                      title="View Details"
                    >
                      <Link
                        href={`/students/${student.id}`}
                        aria-label={`View ${student.firstName}`}
                      >
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
