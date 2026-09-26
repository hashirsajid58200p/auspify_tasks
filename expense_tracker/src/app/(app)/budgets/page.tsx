"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  useBudgets,
  useDeleteBudget,
} from "@/hooks/use-budgets";
import { useAccount } from "@/hooks/use-account";
import { BudgetProgressItem } from "@/server/services/budget";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { formatMoney } from "@/lib/money";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus,
  Target,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function BudgetsPage() {
  const { data: user } = useAccount();
  const currency = user?.currency || "USD";

  const [currentMonth, setCurrentMonth] = React.useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );

  const { data: overview, isLoading, refetch } = useBudgets(currentMonth);
  const deleteMutation = useDeleteBudget();

  // Dialog states
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingBudget, setEditingBudget] =
    React.useState<BudgetProgressItem | null>(null);

  const [deleteTarget, setDeleteTarget] =
    React.useState<BudgetProgressItem | null>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 2, 1));
    setCurrentMonth(date.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const date = new Date(Date.UTC(y, m, 1));
    setCurrentMonth(date.toISOString().slice(0, 7));
  };

  const monthLabel = React.useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, 1));
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }, [currentMonth]);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: BudgetProgressItem) => {
    setEditingBudget(item);
    setFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Removed ${deleteTarget.categoryName} budget`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete budget");
    }
  };

  const budgets = overview?.budgets || [];
  const totalBudgeted = overview?.totalBudgetedMinor || 0;
  const totalSpent = overview?.totalSpentMinor || 0;
  const totalRemaining = overview?.totalRemainingMinor || 0;
  const overallPercentage = overview?.overallPercentage || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border/80 bg-card/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
              Monthly Budgets
            </h2>
            <div className="flex items-center gap-1 ml-3 px-2 py-1 rounded-lg border border-border bg-background/80 text-xs font-medium text-foreground">
              <button
                onClick={handlePrevMonth}
                className="hover:text-primary p-0.5"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 min-w-[100px] text-center font-sans">
                {monthLabel}
              </span>
              <button
                onClick={handleNextMonth}
                className="hover:text-primary p-0.5"
                aria-label="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time spending targets with automated alert thresholds at 80%
            and 100%.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-10 px-4 text-xs font-medium bg-primary text-primary-foreground shadow-xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Set Budget Target
        </Button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-xl border border-border/60 bg-card/40 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {/* Overall Health Card */}
          {budgets.length > 0 && (
            <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Monthly Cap
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-normal text-foreground">
                      {formatMoney(totalSpent, currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatMoney(totalBudgeted, currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">Remaining</span>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(totalRemaining, currency)}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">Used</span>
                    <p className="text-sm font-semibold font-mono text-foreground">
                      {overallPercentage}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Progress
                  value={Math.min(100, overallPercentage)}
                  indicatorClassName={
                    overallPercentage >= 100
                      ? "bg-destructive"
                      : overallPercentage >= 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }
                  className="h-2.5 bg-muted"
                />
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>Progress towards total monthly budget</span>
                  {overallPercentage >= 100 ? (
                    <span className="text-destructive font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Exceeded overall budget
                    </span>
                  ) : overallPercentage >= 80 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Approaching monthly cap
                    </span>
                  ) : (
                    <span>Healthy spending pace</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Budget Cards Grid */}
          {budgets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map((item) => (
                <BudgetCard
                  key={item.id}
                  item={item}
                  currency={currency}
                  onEdit={handleOpenEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-semibold text-foreground">
                  No budgets configured for {monthLabel}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Establish spending limits on your expense categories to keep
                  track of your financial discipline and avoid overspending.
                </p>
              </div>
              <Button
                onClick={handleOpenCreate}
                className="text-xs h-9 font-medium bg-primary text-primary-foreground gap-1.5 mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Set First Budget
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Form Modal */}
      <BudgetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editingBudget}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-normal text-foreground">
              Delete Budget Target
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove the monthly budget for{" "}
              <strong className="text-foreground">
                {deleteTarget?.categoryName}
              </strong>
              ? Your past transactions will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="text-xs h-8"
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="text-xs h-8"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Deleting...
                </>
              ) : (
                "Delete Budget"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
