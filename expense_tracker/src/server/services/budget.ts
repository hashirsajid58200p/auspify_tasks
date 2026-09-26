import mongoose from "mongoose";
import { Budget } from "@/server/models/budget";
import { Category } from "@/server/models/category";
import { Transaction } from "@/server/models/transaction";
import { connectToDatabase } from "@/server/db";

export interface BudgetProgressItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  limitMinor: number;
  spentMinor: number;
  remainingMinor: number;
  percentage: number;
  isWarning: boolean; // >= 80% and < 100%
  isExceeded: boolean; // >= 100%
  createdAt: string;
  updatedAt: string;
}

export interface BudgetOverview {
  month: string;
  totalBudgetedMinor: number;
  totalSpentMinor: number;
  totalRemainingMinor: number;
  overallPercentage: number;
  isWarning: boolean;
  isExceeded: boolean;
  budgets: BudgetProgressItem[];
}

export async function listBudgetsWithProgress(
  userId: string,
  month?: string
): Promise<BudgetOverview> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Default to current UTC month YYYY-MM
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const [yearStr, monthStr] = targetMonth.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
  const nextMonthStart = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));

  // 1. Fetch all user budgets
  const budgets = await Budget.find({ userId: userObjectId })
    .populate("categoryId")
    .sort({ limitMinor: -1 });

  // 2. Fetch expenses for this month grouped by category
  const expenseAgg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        type: "EXPENSE",
        occurredOn: {
          $gte: startDate,
          $lt: nextMonthStart,
        },
      },
    },
    {
      $group: {
        _id: "$categoryId",
        spentMinor: { $sum: "$amountMinor" },
      },
    },
  ]);

  const spentMap = new Map<string, number>();
  for (const item of expenseAgg) {
    if (item._id) {
      spentMap.set(item._id.toString(), item.spentMinor);
    }
  }

  let totalBudgetedMinor = 0;
  let totalSpentMinor = 0;

  const items: BudgetProgressItem[] = [];

  for (const b of budgets) {
     
    const cat = b.categoryId as any;
    if (!cat) continue; // If category was deleted or missing

    const categoryIdStr = cat._id ? cat._id.toString() : b.categoryId.toString();
    const spentMinor = spentMap.get(categoryIdStr) || 0;
    const limitMinor = b.limitMinor;

    const remainingMinor = Math.max(0, limitMinor - spentMinor);
    const percentage =
      limitMinor > 0 ? Math.round((spentMinor / limitMinor) * 1000) / 10 : 0;

    const isExceeded = spentMinor >= limitMinor;
    const isWarning = !isExceeded && percentage >= 80;

    totalBudgetedMinor += limitMinor;
    totalSpentMinor += spentMinor;

    items.push({
      id: b._id.toString(),
      categoryId: categoryIdStr,
      categoryName: cat.name || "Unknown",
      categoryColor: cat.color || "#888888",
      categoryIcon: cat.icon || "Folder",
      limitMinor,
      spentMinor,
      remainingMinor,
      percentage,
      isWarning,
      isExceeded,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    });
  }

  const totalRemainingMinor = Math.max(0, totalBudgetedMinor - totalSpentMinor);
  const overallPercentage =
    totalBudgetedMinor > 0
      ? Math.round((totalSpentMinor / totalBudgetedMinor) * 1000) / 10
      : 0;

  return {
    month: targetMonth,
    totalBudgetedMinor,
    totalSpentMinor,
    totalRemainingMinor,
    overallPercentage,
    isWarning: overallPercentage >= 80 && overallPercentage < 100,
    isExceeded: overallPercentage >= 100,
    budgets: items,
  };
}

export async function upsertBudget(
  userId: string,
  input: { categoryId: string; limitMinor: number }
): Promise<BudgetProgressItem> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const categoryObjectId = new mongoose.Types.ObjectId(input.categoryId);

  // Verify category exists and belongs to this user
  const category = await Category.findOne({
    _id: categoryObjectId,
    userId: userObjectId,
  });

  if (!category) {
    throw new Error("Category not found or does not belong to user");
  }

  const budget = await Budget.findOneAndUpdate(
    {
      userId: userObjectId,
      categoryId: categoryObjectId,
    },
    {
      $set: {
        limitMinor: input.limitMinor,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  ).populate("categoryId");

  // Fetch current month's spending for this category
  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  const spentAgg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        categoryId: categoryObjectId,
        type: "EXPENSE",
        occurredOn: { $gte: startDate, $lt: nextMonthStart },
      },
    },
    {
      $group: {
        _id: null,
        spentMinor: { $sum: "$amountMinor" },
      },
    },
  ]);

  const spentMinor = spentAgg[0]?.spentMinor || 0;
  const limitMinor = budget.limitMinor;
  const remainingMinor = Math.max(0, limitMinor - spentMinor);
  const percentage =
    limitMinor > 0 ? Math.round((spentMinor / limitMinor) * 1000) / 10 : 0;

  return {
    id: budget._id.toString(),
    categoryId: category._id.toString(),
    categoryName: category.name,
    categoryColor: category.color,
    categoryIcon: category.icon,
    limitMinor,
    spentMinor,
    remainingMinor,
    percentage,
    isWarning: percentage >= 80 && percentage < 100,
    isExceeded: percentage >= 100,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}

export async function deleteBudget(
  userId: string,
  budgetId: string
): Promise<boolean> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  if (!mongoose.Types.ObjectId.isValid(budgetId)) {
    return false;
  }

  const result = await Budget.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(budgetId),
    userId: userObjectId,
  });

  return !!result;
}
