"use client";

import { ClassWithCounts } from "@/types/class";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Edit2, Trash2, Users, GraduationCap } from "lucide-react";

interface ClassCardProps {
  cls: ClassWithCounts;
  onEdit: (cls: ClassWithCounts) => void;
  onDelete: (cls: ClassWithCounts) => void;
}

export function ClassCard({ cls, onEdit, onDelete }: ClassCardProps) {
  const percentFilled = Math.min(100, Math.round((cls.enrolledCount / cls.capacity) * 100));

  return (
    <Card className="shadow-xs hover:border-foreground/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="outline" className="mb-1 text-xs">
              {cls.gradeLevel}
            </Badge>
            <CardTitle className="text-base font-semibold tracking-tight">{cls.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(cls)}
              aria-label={`Edit ${cls.name}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(cls)}
              aria-label={`Delete ${cls.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <GraduationCap className="h-4 w-4 shrink-0" />
          <span>
            Homeroom:{" "}
            <strong className="text-foreground font-medium">{cls.homeroomTeacherName}</strong>
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>Enrollment</span>
            </span>
            <span className="font-medium text-foreground">
              {cls.enrolledCount} / {cls.capacity}{" "}
              <span className="text-muted-foreground font-normal">({percentFilled}%)</span>
            </span>
          </div>
          <Progress value={percentFilled} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-1 border-t text-xs text-muted-foreground">
          <span>
            Active Students: <strong className="text-foreground">{cls.activeCount}</strong>
          </span>
          <span>
            Open Seats:{" "}
            <strong className="text-foreground">
              {Math.max(0, cls.capacity - cls.enrolledCount)}
            </strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
