"use client";

import * as React from "react";
import {
  Download,
  Calendar,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  PieChart as PieIcon,
  Percent,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  useReportSummary,
  useCategoryBreakdown,
  useMonthlyTrend,
} from "@/hooks/use-reports";
import { useAccount } from "@/hooks/use-account";
import { formatMoney } from "@/lib/money";
import {
  getUtcStartOfMonth,
  getUtcEndOfMonth,
  toInputDateValue,
} from "@/lib/dates";

type PeriodPreset = "this_month" | "last_month" | "three_months" | "year_to_date" | "custom";

export default function ReportsPage() {
  const { data: user } = useAccount();
  const currency = user?.currency || "USD";

  const [preset, setPreset] = React.useState<PeriodPreset>("this_month");

  // Custom date picker state
  const [customStart, setCustomStart] = React.useState("");
  const [customEnd, setCustomEnd] = React.useState("");

  const { startDate, endDate } = React.useMemo(() => {
    if (preset === "custom") {
      return {
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
      };
    }

    const now = new Date();
    const curYear = now.getUTCFullYear();
    const curMonth = now.getUTCMonth() + 1;

    if (preset === "this_month") {
      return {
        startDate: toInputDateValue(getUtcStartOfMonth(curYear, curMonth)),
        endDate: toInputDateValue(getUtcEndOfMonth(curYear, curMonth)),
      };
    }

    if (preset === "last_month") {
      const lastMonthDate = new Date(Date.UTC(curYear, curMonth - 2, 1));
      const lmYear = lastMonthDate.getUTCFullYear();
      const lmMonth = lastMonthDate.getUTCMonth() + 1;
      return {
        startDate: toInputDateValue(getUtcStartOfMonth(lmYear, lmMonth)),
        endDate: toInputDateValue(getUtcEndOfMonth(lmYear, lmMonth)),
      };
    }

    if (preset === "three_months") {
      const threeMonthsAgo = new Date(Date.UTC(curYear, curMonth - 3, 1));
      return {
        startDate: toInputDateValue(threeMonthsAgo),
        endDate: toInputDateValue(now),
      };
    }

    if (preset === "year_to_date") {
      return {
        startDate: toInputDateValue(new Date(Date.UTC(curYear, 0, 1))),
        endDate: toInputDateValue(now),
      };
    }

    return { startDate: undefined, endDate: undefined };
  }, [preset, customStart, customEnd]);

  const { data: summary, isLoading: isSummaryLoading } = useReportSummary(
    startDate,
    endDate
  );
  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategoryBreakdown(startDate, endDate);
  const { data: trend = [], isLoading: isTrendLoading } = useMonthlyTrend(12);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const url = `/api/reports/export?${params.toString()}`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financial-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border/80 bg-card/60 shadow-xs">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
            Financial Reports
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregated financial health, category distribution, and historical statements.
          </p>
        </div>
        <div>
          <Button
            onClick={handleExportCsv}
            className="w-full sm:w-auto h-10 gap-2 font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Statement (CSV)</span>
          </Button>
        </div>
      </div>

      {/* Preset & Custom Date Filter */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border text-xs font-medium">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md transition-all ${
                  preset === "this_month"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setPreset("this_month")}
              >
                This Month
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md transition-all ${
                  preset === "last_month"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setPreset("last_month")}
              >
                Last Month
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md transition-all ${
                  preset === "three_months"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setPreset("three_months")}
              >
                Last 3 Months
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md transition-all ${
                  preset === "year_to_date"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setPreset("year_to_date")}
              >
                Year to Date
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md transition-all ${
                  preset === "custom"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setPreset("custom")}
              >
                Custom Range
              </button>
            </div>

            {preset === "custom" && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="start" className="text-xs text-muted-foreground">
                    From
                  </Label>
                  <Input
                    id="start"
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-8 text-xs w-36"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="end" className="text-xs text-muted-foreground">
                    To
                  </Label>
                  <Input
                    id="end"
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-8 text-xs w-36"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Inflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <div className="h-8 w-24 bg-muted/40 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-serif font-medium text-emerald-600 dark:text-emerald-400">
                +{formatMoney(summary?.totalIncomeMinor || 0, currency)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Outflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <div className="h-8 w-24 bg-muted/40 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-serif font-medium text-foreground">
                {formatMoney(summary?.totalExpenseMinor || 0, currency)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Net Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <div className="h-8 w-24 bg-muted/40 animate-pulse rounded" />
            ) : (
              <div
                className={`text-2xl font-serif font-medium ${
                  (summary?.netBalanceMinor || 0) >= 0
                    ? "text-foreground"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {formatMoney(summary?.netBalanceMinor || 0, currency)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Savings Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <div className="h-8 w-24 bg-muted/40 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-serif font-medium text-foreground">
                {summary?.savingsRate || 0}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Category Table */}
      <Card className="shadow-xs border-border/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Spending by Category
          </CardTitle>
          <CardDescription className="text-xs">
            Detailed breakdown of expenses across designated categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCategoriesLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-muted/30 animate-pulse rounded" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No expense records found for this timeframe.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Transactions</th>
                    <th className="py-3 px-4">Share (%)</th>
                    <th className="py-3 px-4 text-right">Total Expensed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {categories.map((cat) => (
                    <tr key={cat.categoryId} className="hover:bg-muted/20">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium text-foreground">
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground font-mono">
                        {cat.count}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 max-w-xs">
                          <Progress value={cat.percentage} className="h-2 flex-1" />
                          <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                            {cat.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-serif font-semibold text-foreground">
                        {formatMoney(cat.totalMinor, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly History Table */}
      <Card className="shadow-xs border-border/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Monthly Performance Archive
          </CardTitle>
          <CardDescription className="text-xs">
            12-month trailing cash flow totals calculated via UTC aggregations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTrendLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-muted/30 animate-pulse rounded" />
              ))}
            </div>
          ) : trend.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No historical data available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4 text-right">Inflow</th>
                    <th className="py-3 px-4 text-right">Outflow</th>
                    <th className="py-3 px-4 text-right">Net Cash Flow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {trend.map((row) => (
                    <tr key={row.month} className="hover:bg-muted/20">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-foreground">
                        {row.month}
                      </td>
                      <td className="py-3 px-4 text-right font-serif text-emerald-600 dark:text-emerald-400 font-medium">
                        +{formatMoney(row.incomeMinor, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-serif text-foreground font-medium">
                        {formatMoney(row.expenseMinor, currency)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-serif font-semibold ${
                          row.netMinor >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatMoney(row.netMinor, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
