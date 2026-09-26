"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { MonthlyTrendItem } from "@/server/services/report";
import { formatMoney, toMajor } from "@/lib/money";

interface MonthlyTrendChartProps {
  data: MonthlyTrendItem[];
  isLoading?: boolean;
}

export function MonthlyTrendChart({ data, isLoading }: MonthlyTrendChartProps) {
  if (isLoading) {
    return (
      <div className="h-72 w-full flex items-center justify-center bg-muted/20 animate-pulse rounded-xl">
        <p className="text-xs text-muted-foreground">Loading trend analytics...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
        <p className="text-xs text-muted-foreground">No historical trend data available.</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.month,
    income: toMajor(item.incomeMinor),
    expense: toMajor(item.expenseMinor),
    incomeMinor: item.incomeMinor,
    expenseMinor: item.expenseMinor,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const inc = payload[0]?.payload?.incomeMinor || 0;
                const exp = payload[0]?.payload?.expenseMinor || 0;
                const net = inc - exp;
                return (
                  <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs space-y-1.5 min-w-[140px]">
                    <div className="font-semibold text-foreground border-b border-border/60 pb-1">
                      {payload[0]?.payload?.name}
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Income:</span>
                      <span>{formatMoney(inc)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
                      <span>Expense:</span>
                      <span>{formatMoney(exp)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-border/40 text-foreground">
                      <span>Net:</span>
                      <span className={net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {formatMoney(net)}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#incomeGradient)"
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#expenseGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
