"use client";

import Link from "next/link";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";

interface RecentRegistrationsProps {
  students: Array<{
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    className?: string;
    classGradeLevel?: string;
    status: string;
    enrollmentDate: Date | string;
    photoUrl?: string;
  }>;
}

export function RecentRegistrations({ students }: RecentRegistrationsProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Recently Enrolled Students
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
          <Link href="/students">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-muted-foreground text-center py-6 text-xs">
            No student enrollments recorded yet.
          </p>
        ) : (
          <div className="divide-y text-xs">
            {students.map((s) => {
              const initials = `${s.firstName[0] || ""}${s.lastName[0] || ""}`.toUpperCase();

              return (
                <div key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 border shrink-0">
                      <AvatarImage src={s.photoUrl} alt={`${s.firstName} ${s.lastName}`} />
                      <AvatarFallback className="text-[10px] font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 truncate">
                      <Link
                        href={`/students/${s.id}`}
                        className="font-semibold text-foreground hover:underline block truncate"
                      >
                        {s.firstName} {s.lastName}
                      </Link>
                      <span className="text-muted-foreground block truncate">
                        {s.className ? `${s.className} • ` : ""}
                        <span className="font-mono text-[11px]">{s.studentId}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StudentStatusBadge status={s.status} />
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7 text-xs px-2 hidden sm:inline-flex"
                    >
                      <Link href={`/students/${s.id}`}>Details</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
