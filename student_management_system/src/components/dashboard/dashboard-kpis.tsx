"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, CheckCircle2, Layers } from "lucide-react";

interface DashboardKpisProps {
  totals: {
    students: number;
    classes: number;
    capacity: number;
    utilizationPercent: number;
  };
  activeCount: number;
}

export function DashboardKpis({ totals, activeCount }: DashboardKpisProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="shadow-xs">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Students
            </p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{totals.students}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Enrolled overall</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Attending
            </p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Currently active</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Class Cohorts
            </p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{totals.classes}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Grade sections</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Seat Utilization
            </p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{totals.utilizationPercent}%</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totals.students} / {totals.capacity} seats
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
