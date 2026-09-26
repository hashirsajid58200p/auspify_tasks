"use client";

import { ClassWithCounts } from "@/types/class";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Edit2, Trash2 } from "lucide-react";

interface ClassTableProps {
  classes: ClassWithCounts[];
  onEdit: (cls: ClassWithCounts) => void;
  onDelete: (cls: ClassWithCounts) => void;
}

export function ClassTable({ classes, onEdit, onDelete }: ClassTableProps) {
  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[200px]">Class Name</TableHead>
            <TableHead className="w-[120px]">Grade</TableHead>
            <TableHead>Homeroom Teacher</TableHead>
            <TableHead className="w-[220px]">Capacity & Enrollment</TableHead>
            <TableHead className="w-[100px] text-center">Active</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((cls) => {
            const percentFilled = Math.min(
              100,
              Math.round((cls.enrolledCount / cls.capacity) * 100),
            );

            return (
              <TableRow key={cls.id} className="group">
                <TableCell className="font-semibold text-foreground">{cls.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-medium text-xs">
                    {cls.gradeLevel}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground font-medium">
                  {cls.homeroomTeacherName}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {cls.enrolledCount} / {cls.capacity}
                      </span>
                      <span className="text-muted-foreground">{percentFilled}%</span>
                    </div>
                    <Progress value={percentFilled} className="h-1.5" />
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">
                  <Badge
                    variant={cls.activeCount > 0 ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {cls.activeCount}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(cls)}
                      title="Edit Class"
                      aria-label={`Edit ${cls.name}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(cls)}
                      title="Delete Class"
                      aria-label={`Delete ${cls.name}`}
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
