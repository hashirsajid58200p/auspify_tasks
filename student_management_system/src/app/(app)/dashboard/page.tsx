"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { DashboardMetrics } from "@/server/services/dashboard";
import { DashboardKpis } from "@/components/dashboard/dashboard-kpis";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { RecentRegistrations } from "@/components/dashboard/recent-registrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, GraduationCap, AlertCircle, RefreshCw, Plus } from "lucide-react";

export default function DashboardPage() {
  const {
    data: metrics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardMetrics>("/api/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 mt-6">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <h3 className="font-semibold text-lg">Failed to load dashboard metrics</h3>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "An error occurred while loading dashboard."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Institutional Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time enrollment statistics, class capacity utilization, and recent registrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/students">
              <Users className="h-4 w-4 mr-1.5" /> All Students
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/classes">
              <Plus className="h-4 w-4 mr-1.5" /> Classes
            </Link>
          </Button>
        </div>
      </div>

      {/* Real KPI Metrics */}
      <DashboardKpis totals={metrics.totals} activeCount={metrics.byStatus.active} />

      {/* Visual Distributions & Charts */}
      <DashboardCharts
        byClass={metrics.byClass}
        byStatus={metrics.byStatus}
        totalStudents={metrics.totals.students}
      />

      {/* Recent Activity Table */}
      <RecentRegistrations students={metrics.recentStudents} />
    </div>
  );
}
