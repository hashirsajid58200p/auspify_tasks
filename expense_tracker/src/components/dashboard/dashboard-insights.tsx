"use client";

import * as React from "react";
import { useInsights } from "@/hooks/use-insights";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardInsights() {
  const { data: insights = [], isLoading } = useInsights();

  if (isLoading) {
    return (
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <div className="h-5 w-32 bg-muted/40 animate-pulse rounded" />
          <div className="h-3 w-48 bg-muted/30 animate-pulse rounded mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl border border-border/40 bg-muted/20 animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-xs border-border/80 flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-3.5" />
            </div>
            <CardTitle className="text-base font-semibold">
              Financial Intelligence
            </CardTitle>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Real-time
          </span>
        </div>
        <CardDescription className="text-xs">
          Automated heuristics tracking spending shifts, savings targets, and anomalies.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 flex-1">
        {insights.slice(0, 3).map((insight) => {
          let icon = <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />;
          let cardBg = "bg-card hover:bg-muted/30";
          let borderColor = "border-border/70";

          if (insight.type === "danger") {
            icon = <AlertCircle className="size-4 text-destructive shrink-0" />;
            cardBg = "bg-destructive/5 hover:bg-destructive/10";
            borderColor = "border-destructive/20";
          } else if (insight.type === "warning") {
            icon = <AlertTriangle className="size-4 text-amber-500 shrink-0" />;
            cardBg = "bg-amber-500/5 hover:bg-amber-500/10";
            borderColor = "border-amber-500/20";
          } else if (insight.type === "positive") {
            icon = <TrendingDown className="size-4 text-emerald-500 shrink-0" />;
            cardBg = "bg-emerald-500/5 hover:bg-emerald-500/10";
            borderColor = "border-emerald-500/20";
          } else {
            icon = <TrendingUp className="size-4 text-primary shrink-0" />;
          }

          return (
            <div
              key={insight.id}
              className={cn(
                "p-3 rounded-xl border transition-colors flex items-start gap-3",
                cardBg,
                borderColor
              )}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-foreground truncate">
                    {insight.title}
                  </h4>
                  {insight.metric && (
                    <span className="text-[11px] font-mono font-medium text-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/60">
                      {insight.metric}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {insight.message}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
