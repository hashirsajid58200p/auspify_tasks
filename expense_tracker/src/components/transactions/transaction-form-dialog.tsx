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
import { useCategories, CategoryItem } from "@/hooks/use-categories";
import {
  useCreateTransaction,
  useUpdateTransaction,
  TransactionItem,
} from "@/hooks/use-transactions";
import { toMinor, toMajor } from "@/lib/money";
import { toInputDateValue } from "@/lib/dates";
import { Loader2 } from "lucide-react";

interface TransactionFormInnerProps {
  initialData?: TransactionItem | null;
  categories: CategoryItem[];
  onClose: () => void;
  onSuccess?: () => void;
}

function TransactionFormInner({
  initialData,
  categories,
  onClose,
  onSuccess,
}: TransactionFormInnerProps) {
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const [type, setType] = React.useState<"INCOME" | "EXPENSE">(
    initialData?.type || "EXPENSE"
  );
  const [amount, setAmount] = React.useState(
    initialData ? toMajor(initialData.amountMinor).toFixed(2) : ""
  );

  const initialCatId = initialData
    ? typeof initialData.categoryId === "object"
      ? initialData.categoryId._id
      : initialData.categoryId
    : "";

  const [categoryId, setCategoryId] = React.useState(initialCatId);
  const [occurredOn, setOccurredOn] = React.useState(
    initialData
      ? toInputDateValue(initialData.occurredOn)
      : toInputDateValue(new Date())
  );
  const [note, setNote] = React.useState(initialData?.note || "");
  const [error, setError] = React.useState<string | null>(null);

  // Available categories for selected type
  const availableCategories = React.useMemo(() => {
    return categories.filter((c) => c.type === type);
  }, [categories, type]);

  // Derived selected category ID (if current selection doesn't match available, pick first available)
  const effectiveCategoryId = availableCategories.some((c) => c._id === categoryId)
    ? categoryId
    : availableCategories[0]?._id || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let amountMinor: number;
    try {
      amountMinor = toMinor(amount);
      if (amountMinor <= 0) {
        setError("Amount must be greater than zero");
        return;
      }
    } catch {
      setError("Please enter a valid monetary amount (e.g. 24.50)");
      return;
    }

    if (!effectiveCategoryId) {
      setError("Please select a category");
      return;
    }

    try {
      if (initialData) {
        await updateMutation.mutateAsync({
          id: initialData._id,
          data: {
            type,
            amountMinor,
            categoryId: effectiveCategoryId,
            occurredOn,
            note,
          },
        });
        toast.success("Transaction updated successfully");
      } else {
        await createMutation.mutateAsync({
          type,
          amountMinor,
          categoryId: effectiveCategoryId,
          occurredOn,
          note,
        });
        toast.success("Transaction added successfully");
      }

      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save transaction";
      setError(msg);
      toast.error(msg);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
          {error}
        </div>
      )}

      {/* Type Selector (Segmented control) */}
      <div className="space-y-1.5">
        <Label>Transaction Type</Label>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted/60 border border-border">
          <button
            type="button"
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              type === "EXPENSE"
                ? "bg-background text-rose-600 dark:text-rose-400 shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setType("EXPENSE")}
          >
            Expense
          </button>
          <button
            type="button"
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              type === "INCOME"
                ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setType("INCOME")}
          >
            Income
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount ($)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
            $
          </span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className="pl-7 text-base font-semibold"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Select
          id="category"
          value={effectiveCategoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          disabled={isPending}
        >
          {availableCategories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="occurredOn">Date</Label>
        <Input
          id="occurredOn"
          type="date"
          value={occurredOn}
          onChange={(e) => setOccurredOn(e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <Label htmlFor="note">Note (Optional)</Label>
        <Input
          id="note"
          type="text"
          maxLength={200}
          placeholder="Coffee with team, groceries, etc."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          className="w-full h-11 text-sm font-medium shadow-sm transition-all"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : initialData ? (
            "Update Transaction"
          ) : (
            "Add Transaction"
          )}
        </Button>
      </div>
    </form>
  );
}

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TransactionItem | null;
  onSuccess?: () => void;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: TransactionFormDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { data: categories = [] } = useCategories();

  const handleClose = () => onOpenChange(false);

  const inner = (
    <TransactionFormInner
      key={initialData ? initialData._id : "new-tx"}
      initialData={initialData}
      categories={categories}
      onClose={handleClose}
      onSuccess={onSuccess}
    />
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {initialData ? "Edit Transaction" : "New Transaction"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {initialData
                ? "Update your existing transaction details."
                : "Record an income or expense with category and date."}
            </DialogDescription>
          </DialogHeader>
          {inner}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-4 pt-2 max-h-[90vh]">
        <DrawerHeader className="text-left px-0 pb-2">
          <DrawerTitle className="font-serif text-xl">
            {initialData ? "Edit Transaction" : "New Transaction"}
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            {initialData
              ? "Update your existing transaction details."
              : "Record an income or expense with category and date."}
          </DrawerDescription>
        </DrawerHeader>
        {inner}
      </DrawerContent>
    </Drawer>
  );
}
