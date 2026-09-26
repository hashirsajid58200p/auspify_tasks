"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  ArrowDownRight,
  ArrowUpRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  useTransactions,
  useDeleteTransaction,
  TransactionItem,
} from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useAccount } from "@/hooks/use-account";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { formatMoney } from "@/lib/money";
import { formatDateDisplay } from "@/lib/dates";

export default function TransactionsPage() {
  const { data: user } = useAccount();
  const currency = user?.currency || "USD";

  // Filters state
  const [type, setType] = React.useState<"INCOME" | "EXPENSE" | undefined>(
    undefined
  );
  const [categoryId, setCategoryId] = React.useState<string | undefined>(
    undefined
  );
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] =
    React.useState<TransactionItem | null>(null);

  // Data fetching
  const { data: categories = [] } = useCategories();
  const { data, isLoading, isError, error, refetch } = useTransactions({
    type,
    categoryId,
    search: search.trim() || undefined,
    page,
    limit: 15,
  });

  const deleteMutation = useDeleteTransaction();

  const handleEdit = (tx: TransactionItem) => {
    setEditingTransaction(tx);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Transaction deleted");
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete transaction"
        );
      }
    }
  };

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const handleClearFilters = () => {
    setType(undefined);
    setCategoryId(undefined);
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(type || categoryId || search);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border/80 bg-card/60 shadow-xs">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
            Transaction Ledger
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete record of your income streams and expenditures.
          </p>
        </div>
        <div>
          <Button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto h-10 gap-2 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search note or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-10"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border shrink-0">
              <button
                type="button"
                onClick={() => {
                  setType(undefined);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  type === undefined
                    ? "bg-background text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("INCOME");
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  type === "INCOME"
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("EXPENSE");
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  type === "EXPENSE"
                    ? "bg-background text-rose-600 dark:text-rose-400 shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Expense
              </button>
            </div>

            {/* Category Dropdown */}
            <div className="w-full md:w-48 shrink-0">
              <Select
                value={categoryId || ""}
                onChange={(e) => {
                  setCategoryId(e.target.value || undefined);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} ({cat.type.toLowerCase()})
                  </option>
                ))}
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Display */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 w-full rounded-xl bg-muted/40 animate-pulse border border-border"
            />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center border-destructive/20 bg-destructive/5">
          <p className="text-sm font-medium text-destructive">
            {error instanceof Error ? error.message : "Failed to load transactions."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      ) : !data || data.items.length === 0 ? (
        /* Empty State */
        <Card className="border-border/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-medium text-foreground">
            No transactions found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
            {hasActiveFilters
              ? "No transactions match your current search and filter criteria."
              : "You haven't recorded any income or expenses yet."}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button size="sm" onClick={handleOpenAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              <span>Record First Transaction</span>
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* Desktop Table View (>= 1024px) */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Note</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.items.map((tx) => {
                  const isIncome = tx.type === "INCOME";
                  const cat = tx.categoryId;
                  return (
                    <tr
                      key={tx._id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateDisplay(tx.occurredOn)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || "#64748b" }}
                          />
                          <span className="font-medium text-foreground">
                            {cat?.name || "Uncategorized"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {tx.note || <span className="italic text-muted-foreground/50">No note</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant="outline"
                          className={
                            isIncome
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }
                        >
                          {isIncome ? "Income" : "Expense"}
                        </Badge>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-serif text-base font-semibold whitespace-nowrap ${
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatMoney(tx.amountMinor, currency)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEdit(tx)}
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(tx._id)}
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< 1024px) */}
          <div className="lg:hidden space-y-3">
            {data.items.map((tx) => {
              const isIncome = tx.type === "INCOME";
              const cat = tx.categoryId;
              return (
                <Card
                  key={tx._id}
                  className="border-border/80 shadow-xs hover:border-border transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || "#64748b" }}
                          />
                          <span className="font-semibold text-sm text-foreground">
                            {cat?.name || "Uncategorized"}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            • {formatDateDisplay(tx.occurredOn)}
                          </span>
                        </div>
                        {tx.note && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {tx.note}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-serif text-base font-semibold ${
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
                          className={`text-[10px] px-1.5 py-0 mt-1 ${
                            isIncome
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isIncome ? "Income" : "Expense"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/40">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => handleEdit(tx)}
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(tx._id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
              <div>
                Showing {(data.meta.page - 1) * data.meta.limit + 1} to{" "}
                {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of{" "}
                {data.meta.total} records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <span className="font-mono text-xs">
                  {data.meta.page} / {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.meta.page >= data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Transaction Modal (Dialog on Desktop, Drawer on Mobile) */}
      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingTransaction}
      />
    </div>
  );
}
