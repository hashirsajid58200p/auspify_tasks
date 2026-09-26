"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, PieChart } from "lucide-react";

interface DashboardChartsProps {
  byClass: Array<{
    id: string;
    name: string;
    gradeLevel: string;
    capacity: number;
    enrolledCount: number;
    activeCount: number;
    utilizationPercent: number;
  }>;
  byStatus: {
    active: number;
    inactive: number;
    graduated: number;
    transferred: number;
  };
  totalStudents: number;
}

export function DashboardCharts({ byClass, byStatus, totalStudents }: DashboardChartsProps) {
  const statusItems = [
    {
      label: "Active",
      count: byStatus.active,
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Inactive",
      count: byStatus.inactive,
      color: "bg-zinc-400",
      textColor: "text-zinc-600 dark:text-zinc-400",
    },
    {
      label: "Graduated",
      count: byStatus.graduated,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Transferred",
      count: byStatus.transferred,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Class Cohort Capacities */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Class Enrollment Distribution
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              {byClass.length} Classes
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {byClass.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No classes created yet.</p>
          ) : (
            byClass.map((c) => (
              <div key={c.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{c.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                      {c.gradeLevel}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{c.enrolledCount}</strong> / {c.capacity}{" "}
                    seats ({c.utilizationPercent}%)
                  </span>
                </div>
                <Progress value={c.utilizationPercent} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Enrollment Status Breakdown */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Enrollment Status Breakdown
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              {totalStudents} Total Records
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {totalStudents === 0 ? (
            <p className="text-muted-foreground text-center py-6">No students registered yet.</p>
          ) : (
            statusItems.map((item) => {
              const percent =
                totalStudents > 0 ? Math.round((item.count / totalStudents) * 100) : 0;

              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="font-medium text-foreground text-sm">{item.label}</span>
                    </div>
                    <span className="text-muted-foreground">
                      <strong className={item.textColor}>{item.count}</strong> students ({percent}%)
                    </span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
