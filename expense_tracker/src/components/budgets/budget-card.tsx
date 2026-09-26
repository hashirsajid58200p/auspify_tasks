"use client";

import * as React from "react";
import { BudgetProgressItem } from "@/server/services/budget";
import { formatMoney } from "@/lib/money";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetCardProps {
  item: BudgetProgressItem;
  currency?: string;
  onEdit: (item: BudgetProgressItem) => void;
  onDelete: (item: BudgetProgressItem) => void;
}

export function BudgetCard({
  item,
  currency = "USD",
  onEdit,
  onDelete,
}: BudgetCardProps) {
  let statusBadge = (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
      <CheckCircle2 className="w-3 h-3" />
      On Track
    </span>
  );
  let indicatorColor = "bg-emerald-500";
  let statusTextColor = "text-muted-foreground";

  if (item.isExceeded) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20 animate-pulse">
        <AlertCircle className="w-3 h-3" />
        Over Budget
      </span>
    );
    indicatorColor = "bg-destructive";
    statusTextColor = "text-destructive font-medium";
  } else if (item.isWarning) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
        <AlertTriangle className="w-3 h-3" />
        Near Cap (80%+)
      </span>
    );
    indicatorColor = "bg-amber-500";
    statusTextColor = "text-amber-600 dark:text-amber-400 font-medium";
  }

  return (
    <div className="group relative rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-border hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: item.categoryColor }}
          />
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              {item.categoryName}
            </h3>
            <p className="text-[11px] text-muted-foreground">Monthly Cap</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {statusBadge}
          <div className="flex items-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.categoryName} budget`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.categoryName} budget`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress & Amounts */}
      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-foreground text-sm">
            {formatMoney(item.spentMinor, currency)}
          </span>
          <span className="text-muted-foreground">
            of {formatMoney(item.limitMinor, currency)}
          </span>
        </div>

        <Progress
          value={Math.min(100, item.percentage)}
          indicatorClassName={indicatorColor}
          className="h-2 bg-muted/70"
        />

        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span className={cn(statusTextColor)}>
            {item.isExceeded
              ? `${formatMoney(item.spentMinor - item.limitMinor, currency)} over limit`
              : `${formatMoney(item.remainingMinor, currency)} remaining`}
          </span>
          <span className="font-medium text-foreground font-mono">
            {item.percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}
