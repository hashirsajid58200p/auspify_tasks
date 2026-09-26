"use client";

import { StudentDetail } from "@/types/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { School, UserCheck, Calendar, MapPin, Phone, Mail, FileText } from "lucide-react";

interface StudentProfileCardsProps {
  student: StudentDetail;
}

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

export function StudentProfileCards({ student }: StudentProfileCardsProps) {
  const age = calculateAge(student.dob);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Academic Cohort Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <School className="h-4 w-4 text-primary" />
            Academic & Class Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3.5 text-sm">
          <div className="flex justify-between py-1.5 border-b text-xs">
            <span className="text-muted-foreground">Class Cohort</span>
            <span className="font-medium text-foreground">
              {student.class?.name || "Unassigned"}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b text-xs">
            <span className="text-muted-foreground">Grade Level</span>
            <span className="font-medium text-foreground">{student.class?.gradeLevel || "—"}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b text-xs">
            <span className="text-muted-foreground">Homeroom Teacher</span>
            <span className="font-medium text-foreground">
              {student.class?.homeroomTeacherName || "—"}
            </span>
          </div>
          <div className="flex justify-between py-1.5 text-xs">
            <span className="text-muted-foreground">Enrollment Date</span>
            <span className="font-medium text-foreground">
              {formatDate(student.enrollmentDate)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Guardian & Emergency card (PII) */}
      <Card className="shadow-xs border-primary/20 bg-primary/2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <UserCheck className="h-4 w-4 text-primary" />
            Guardian & Emergency Contact (Confidential)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3.5 text-sm">
          <div className="flex justify-between py-1.5 border-b text-xs">
            <span className="text-muted-foreground">Guardian Name</span>
            <span className="font-semibold text-foreground">{student.guardianName}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b text-xs">
            <span className="text-muted-foreground">Guardian Phone</span>
            <a
              href={`tel:${student.guardianPhone}`}
              className="font-medium text-primary hover:underline flex items-center gap-1 font-mono"
            >
              <Phone className="h-3.5 w-3.5" />
              {student.guardianPhone}
            </a>
          </div>
          <div className="flex justify-between items-center py-1.5 text-xs">
            <span className="text-muted-foreground">Guardian Email</span>
            <a
              href={`mailto:${student.guardianEmail}`}
              className="font-medium text-primary hover:underline flex items-center gap-1"
            >
              <Mail className="h-3.5 w-3.5" />
              {student.guardianEmail}
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Personal Details Card (PII) */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Personal & Demographic Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3.5 text-sm">
          <div className="flex justify-between py-1.5 border-b text-xs">
            <span className="text-muted-foreground">Date of Birth</span>
            <span className="font-medium text-foreground">
              {formatDate(student.dob)} {age !== null && `(${age} years old)`}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b text-xs">
            <span className="text-muted-foreground">Gender</span>
            <span className="font-medium text-foreground capitalize">
              {student.gender.toLowerCase()}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b text-xs">
            <span className="text-muted-foreground">Student Email</span>
            <span className="font-medium text-foreground">{student.email || "—"}</span>
          </div>
          <div className="flex justify-between py-1.5 text-xs">
            <span className="text-muted-foreground">Student Phone</span>
            <span className="font-medium text-foreground">{student.phone || "—"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Residential Address & Administrative Notes */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Residence & Administrative Remarks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3.5 text-sm">
          <div className="py-1 border-b text-xs space-y-1">
            <span className="text-muted-foreground block">Home Address</span>
            <p className="font-medium text-foreground">
              {student.address || "No residential address provided."}
            </p>
          </div>
          <div className="py-1 text-xs space-y-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Confidential Notes
            </span>
            <p className="text-muted-foreground italic bg-muted/50 p-2.5 rounded-md border text-xs">
              {student.notes || "No special accommodations or notes recorded."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
