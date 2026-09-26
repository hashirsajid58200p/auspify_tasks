"use client";

import { Card, CardContent } from "@/components/ui/card";
import { School, Users, GraduationCap, Layers } from "lucide-react";

interface ClassMetricsProps {
  stats: {
    totalClasses: number;
    totalEnrolled: number;
    totalActive: number;
    overallUtilization: number;
  };
}

export function ClassMetrics({ stats }: ClassMetricsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="shadow-xs">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Classes
            </p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{stats.totalClasses}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <School className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Enrolled Students
            </p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{stats.totalEnrolled}</h3>
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
              Active Students
            </p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{stats.totalActive}</h3>
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
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{stats.overallUtilization}%</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
