"use client";

import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CategoryBreakdownItem } from "@/server/services/report";
import { formatMoney } from "@/lib/money";

interface CategoryDonutChartProps {
  data: CategoryBreakdownItem[];
  isLoading?: boolean;
}

export function CategoryDonutChart({ data, isLoading }: CategoryDonutChartProps) {
  if (isLoading) {
    return (
      <div className="h-72 w-full flex items-center justify-center bg-muted/20 animate-pulse rounded-xl">
        <p className="text-xs text-muted-foreground">Loading category distribution...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
        <p className="text-xs text-muted-foreground">No expense data recorded for this period.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as CategoryBreakdownItem;
                  return (
                    <div className="rounded-lg border border-border bg-card p-2.5 shadow-md text-xs space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {formatMoney(item.totalMinor)} ({item.percentage}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="totalMinor"
            >
              {data.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top 4 Categories Legend */}
      <div className="mt-2 space-y-1.5 pt-2 border-t border-border/40">
        {data.slice(0, 4).map((cat) => (
          <div
            key={cat.categoryId}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="truncate font-medium text-foreground">
                {cat.name}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono">
              <span className="text-muted-foreground">{cat.percentage}%</span>
              <span className="font-medium text-foreground">
                {formatMoney(cat.totalMinor)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
