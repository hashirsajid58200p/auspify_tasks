"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCategories } from "@/hooks/use-categories";
import { useUpsertBudget } from "@/hooks/use-budgets";
import { BudgetProgressItem } from "@/server/services/budget";
import { toMinor, toMajor } from "@/lib/money";
import { Loader2 } from "lucide-react";

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: BudgetProgressItem | null;
  onSuccess?: () => void;
}

interface BudgetFormInnerProps {
  initialData?: BudgetProgressItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

function BudgetFormInner({
  initialData,
  onClose,
  onSuccess,
}: BudgetFormInnerProps) {
  const { data: categories = [] } = useCategories();
  const upsertMutation = useUpsertBudget();

  // Filter to expense categories only
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  const [categoryId, setCategoryId] = React.useState<string>(
    initialData?.categoryId || (expenseCategories[0]?._id ?? "")
  );
  const [limit, setLimit] = React.useState<string>(
    initialData ? toMajor(initialData.limitMinor).toFixed(2) : ""
  );
  const [error, setError] = React.useState<string | null>(null);

  const isSubmitting = upsertMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Please select an expense category");
      return;
    }

    let limitMinor: number;
    try {
      limitMinor = toMinor(limit);
      if (limitMinor <= 0) {
        setError("Budget limit must be greater than zero");
        return;
      }
    } catch {
      setError("Invalid amount format. Use e.g. 500.00");
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        categoryId,
        limitMinor,
      });

      toast.success(
        initialData
          ? "Budget limit updated successfully"
          : "Monthly budget created successfully"
      );
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save budget target";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      {error && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
          {error}
        </div>
      )}

      {/* Category selector */}
      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-medium text-foreground">
          Expense Category
        </Label>
        <Select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={Boolean(initialData)} // Don't change category on existing budget, update limit instead
        >
          {expenseCategories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </Select>
        {initialData && (
          <p className="text-[11px] text-muted-foreground">
            Category cannot be changed. Delete this budget to set up a new one.
          </p>
        )}
      </div>

      {/* Monthly Limit */}
      <div className="space-y-1.5">
        <Label htmlFor="limit" className="text-xs font-medium text-foreground">
          Monthly Spending Target ($ USD)
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-serif">
            $
          </span>
          <Input
            id="limit"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="pl-7 h-10 text-sm font-medium"
            required
            autoFocus
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Warnings trigger at 80% (amber) and 100% (destructive red).
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="text-xs h-9"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="text-xs h-9 bg-primary text-primary-foreground font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : initialData ? (
            "Update Target"
          ) : (
            "Set Target"
          )}
        </Button>
      </div>
    </form>
  );
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: BudgetFormDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleClose = () => onOpenChange(false);

  const title = initialData ? "Edit Budget Limit" : "Set Monthly Budget Target";
  const description = initialData
    ? `Adjust the monthly spending cap for ${initialData.categoryName}.`
    : "Choose an expense category and set a target monthly limit.";

  const formKey = initialData ? initialData.id : "new-budget";

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-normal text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
          <BudgetFormInner
            key={formKey}
            initialData={initialData}
            onClose={handleClose}
            onSuccess={onSuccess}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <DrawerHeader className="text-left px-1">
          <DrawerTitle className="font-serif text-xl font-normal text-foreground">
            {title}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <BudgetFormInner
          key={formKey}
          initialData={initialData}
          onClose={handleClose}
          onSuccess={onSuccess}
        />
      </DrawerContent>
    </Drawer>
  );
}
