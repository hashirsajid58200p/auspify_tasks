"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  Percent,
  Download,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useReportSummary,
  useCategoryBreakdown,
  useMonthlyTrend,
} from "@/hooks/use-reports";
import dynamic from "next/dynamic";
import { useTransactions } from "@/hooks/use-transactions";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { DashboardBudgets } from "@/components/dashboard/dashboard-budgets";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";

const MonthlyTrendChart = dynamic(
  () =>
    import("@/components/dashboard/monthly-trend-chart").then(
      (mod) => mod.MonthlyTrendChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 sm:h-72 w-full bg-muted/20 animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground">
        Loading cash flow trend...
      </div>
    ),
  }
);

const CategoryDonutChart = dynamic(
  () =>
    import("@/components/dashboard/category-donut-chart").then(
      (mod) => mod.CategoryDonutChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 sm:h-72 w-full bg-muted/20 animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground">
        Loading distribution...
      </div>
    ),
  }
);
import { formatMoney } from "@/lib/money";
import {
  formatDateDisplay,
  getUtcStartOfMonth,
  getUtcEndOfMonth,
  toInputDateValue,
} from "@/lib/dates";
import { useAccount } from "@/hooks/use-account";

type PeriodOption = "this_month" | "last_month" | "three_months" | "year_to_date" | "all";

export default function DashboardPage() {
  const { data: user } = useAccount();
  const userName = user?.name || "User";
  const currency = user?.currency || "USD";

  const [period, setPeriod] = React.useState<PeriodOption>("this_month");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Compute date range for selected period
  const { startDate, endDate } = React.useMemo(() => {
    const now = new Date();
    const curYear = now.getUTCFullYear();
    const curMonth = now.getUTCMonth() + 1; // 1-12

    if (period === "this_month") {
      return {
        startDate: toInputDateValue(getUtcStartOfMonth(curYear, curMonth)),
        endDate: toInputDateValue(getUtcEndOfMonth(curYear, curMonth)),
      };
    }

    if (period === "last_month") {
      const lastMonthDate = new Date(Date.UTC(curYear, curMonth - 2, 1));
      const lmYear = lastMonthDate.getUTCFullYear();
      const lmMonth = lastMonthDate.getUTCMonth() + 1;
      return {
        startDate: toInputDateValue(getUtcStartOfMonth(lmYear, lmMonth)),
        endDate: toInputDateValue(getUtcEndOfMonth(lmYear, lmMonth)),
      };
    }

    if (period === "three_months") {
      const threeMonthsAgo = new Date(Date.UTC(curYear, curMonth - 3, 1));
      return {
        startDate: toInputDateValue(threeMonthsAgo),
        endDate: toInputDateValue(now),
      };
    }

    if (period === "year_to_date") {
      return {
        startDate: toInputDateValue(new Date(Date.UTC(curYear, 0, 1))),
        endDate: toInputDateValue(now),
      };
    }

    return { startDate: undefined, endDate: undefined };
  }, [period]);

  // Real data queries
  const { data: summary, isLoading: isSummaryLoading } = useReportSummary(
    startDate,
    endDate
  );
  const { data: breakdown = [], isLoading: isBreakdownLoading } =
    useCategoryBreakdown(startDate, endDate);
  const { data: trend = [], isLoading: isTrendLoading } = useMonthlyTrend(6);
  const { data: recentTx, isLoading: isRecentLoading } = useTransactions({
    page: 1,
    limit: 5,
  });

  const handleDownloadCsv = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const url = `/api/reports/export${params.toString() ? `?${params.toString()}` : ""}`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const balance = summary?.netBalanceMinor || 0;
  const isPositiveBalance = balance >= 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border/80 bg-card/60 shadow-xs">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
            Welcome back, <span className="italic">{userName}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time financial pulse aggregated directly from MongoDB.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCsv}
            className="text-xs font-medium h-9 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="text-xs font-medium h-9 gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Period Filter Selector */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border text-xs font-medium shrink-0">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md transition-all ${
              period === "this_month"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setPeriod("this_month")}
          >
            This Month
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md transition-all ${
              period === "last_month"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setPeriod("last_month")}
          >
            Last Month
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md transition-all ${
              period === "three_months"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setPeriod("three_months")}
          >
            Last 3 Months
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md transition-all ${
              period === "year_to_date"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setPeriod("year_to_date")}
          >
            Year to Date
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md transition-all ${
              period === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setPeriod("all")}
          >
            All Time
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Net Balance
            </CardTitle>
            <Wallet className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <div className="h-8 w-28 bg-muted/40 animate-pulse rounded-md" />
            ) : (
              <>
                <div
                  className={`text-2xl font-serif font-medium tracking-tight ${
                    isPositiveBalance
                      ? "text-foreground"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {formatMoney(balance, currency)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground font-medium">
                  <TrendingUp className="size-3.5 text-primary" />
                  <span>
                    {summary?.transactionCount || 0} transactions in period
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Income
            </CardTitle>
            <div className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <div className="h-8 w-28 bg-muted/40 animate-pulse rounded-md" />
            ) : (
              <>
                <div className="text-2xl font-serif font-medium tracking-tight text-emerald-600 dark:text-emerald-400">
                  +{formatMoney(summary?.totalIncomeMinor || 0, currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total incoming capital
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Expenses
            </CardTitle>
            <div className="size-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <div className="h-8 w-28 bg-muted/40 animate-pulse rounded-md" />
            ) : (
              <>
                <div className="text-2xl font-serif font-medium tracking-tight text-foreground">
                  {formatMoney(summary?.totalExpenseMinor || 0, currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total outgoing expenses
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Savings Rate
            </CardTitle>
            <div className="size-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Percent className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <div className="h-8 w-28 bg-muted/40 animate-pulse rounded-md" />
            ) : (
              <>
                <div className="text-2xl font-serif font-medium tracking-tight text-foreground">
                  {summary?.savingsRate || 0}%
                </div>
                <div className="mt-2 space-y-1">
                  <Progress
                    value={Math.max(0, Math.min(100, summary?.savingsRate || 0))}
                    className="h-1.5"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Target: 20% minimum recommended
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Span 2) */}
        <Card className="lg:col-span-2 shadow-xs border-border/80">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Monthly Cash Flow Trend
            </CardTitle>
            <CardDescription className="text-xs">
              Income vs. expense historical performance over the past 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={trend} isLoading={isTrendLoading} />
          </CardContent>
        </Card>

        {/* Category Breakdown Donut */}
        <Card className="shadow-xs border-border/80 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Expense Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown by category for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <CategoryDonutChart
              data={breakdown}
              isLoading={isBreakdownLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Financial Insights & Budget Targets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardInsights />
        <DashboardBudgets />
      </div>

      {/* Recent Transactions Section */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Recent Transactions
            </CardTitle>
            <CardDescription className="text-xs">
              Latest incoming and outgoing records.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1.5">
            <Link href="/transactions">
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isRecentLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-full rounded-lg bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          ) : !recentTx || recentTx.items.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No recent transactions recorded.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recentTx.items.map((tx) => {
                const isIncome = tx.type === "INCOME";
                const cat = tx.categoryId;
                return (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between py-3 hover:bg-muted/20 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${cat?.color || "#64748b"}20`,
                          color: cat?.color || "#64748b",
                        }}
                      >
                        {isIncome ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {cat?.name || "Uncategorized"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.note || formatDateDisplay(tx.occurredOn)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-serif text-sm font-semibold ${
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatMoney(tx.amountMinor, currency)}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1 py-0 mt-0.5 ${
                          isIncome
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isIncome ? "Income" : "Expense"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
