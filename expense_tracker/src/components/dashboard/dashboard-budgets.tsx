"use client";

import * as React from "react";
import Link from "next/link";
import { useBudgets } from "@/hooks/use-budgets";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/money";
import { Target, ChevronRight, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardBudgets() {
  const { data: overview, isLoading } = useBudgets();

  if (isLoading) {
    return (
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <div className="h-5 w-32 bg-muted/40 animate-pulse rounded" />
          <div className="h-3 w-48 bg-muted/30 animate-pulse rounded mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl border border-border/40 bg-muted/20 animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const budgets = overview?.budgets || [];

  return (
    <Card className="shadow-xs border-border/80 flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Target className="size-3.5" />
            </div>
            <CardTitle className="text-base font-semibold">
              Monthly Budget Limits
            </CardTitle>
          </div>
          <Link
            href="/budgets"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
          >
            Manage <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <CardDescription className="text-xs">
          Active category spending caps with warnings at 80% and alerts at 100%.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {budgets.length === 0 ? (
          <div className="py-6 text-center space-y-2 border border-dashed border-border/80 rounded-xl bg-muted/10">
            <p className="text-xs text-muted-foreground">
              No category budget targets configured for this month.
            </p>
            <Link
              href="/budgets"
              className="inline-block text-xs font-medium text-primary hover:underline"
            >
              + Set Up Monthly Budgets
            </Link>
          </div>
        ) : (
          budgets.slice(0, 4).map((b) => {
            let indicator = "bg-emerald-500";
            if (b.isExceeded) indicator = "bg-destructive";
            else if (b.isWarning) indicator = "bg-amber-500";

            return (
              <div key={b.id} className="space-y-1.5 p-2.5 rounded-lg border border-border/50 bg-card/60">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: b.categoryColor }}
                    />
                    <span className="font-medium text-foreground truncate">
                      {b.categoryName}
                    </span>
                    {b.isExceeded && (
                      <AlertCircle className="size-3 text-destructive shrink-0" />
                    )}
                    {b.isWarning && (
                      <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 text-[11px] shrink-0 font-medium">
                    <span className={cn(b.isExceeded ? "text-destructive font-semibold" : "text-foreground")}>
                      {formatMoney(b.spentMinor)}
                    </span>
                    <span className="text-muted-foreground">
                      / {formatMoney(b.limitMinor)}
                    </span>
                  </div>
                </div>

                <Progress
                  value={Math.min(100, b.percentage)}
                  indicatorClassName={indicator}
                  className="h-1.5 bg-muted"
                />

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {b.isExceeded
                      ? `${formatMoney(b.spentMinor - b.limitMinor)} over limit`
                      : `${formatMoney(b.remainingMinor)} remaining`}
                  </span>
                  <span className="font-mono font-medium">{b.percentage}%</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
