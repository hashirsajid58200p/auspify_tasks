import mongoose from "mongoose";
import { Transaction } from "@/server/models/transaction";
import { connectToDatabase } from "@/server/db";
import { toUtcMidnight, getUtcEndOfDay } from "@/lib/dates";
import { toMajor } from "@/lib/money";

export interface SummaryMetrics {
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  netBalanceMinor: number;
  savingsRate: number; // percentage, e.g. 45.5
  transactionCount: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  totalMinor: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrendItem {
  month: string; // YYYY-MM
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
}

export async function getSummaryMetrics(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<SummaryMetrics> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const match: Record<string, any> = {
    userId: userObjectId,
  };

  if (startDate || endDate) {
    match.occurredOn = {};
    if (startDate) match.occurredOn.$gte = toUtcMidnight(startDate);
    if (endDate) match.occurredOn.$lte = getUtcEndOfDay(endDate);
  }

  const result = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalIncomeMinor: {
          $sum: {
            $cond: [{ $eq: ["$type", "INCOME"] }, "$amountMinor", 0],
          },
        },
        totalExpenseMinor: {
          $sum: {
            $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amountMinor", 0],
          },
        },
        transactionCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalIncomeMinor: 1,
        totalExpenseMinor: 1,
        transactionCount: 1,
        netBalanceMinor: {
          $subtract: ["$totalIncomeMinor", "$totalExpenseMinor"],
        },
        savingsRate: {
          $cond: [
            { $gt: ["$totalIncomeMinor", 0] },
            {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ["$totalIncomeMinor", "$totalExpenseMinor"] },
                    "$totalIncomeMinor",
                  ],
                },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
  ]);

  if (!result || result.length === 0) {
    return {
      totalIncomeMinor: 0,
      totalExpenseMinor: 0,
      netBalanceMinor: 0,
      savingsRate: 0,
      transactionCount: 0,
    };
  }

  const row = result[0];
  return {
    totalIncomeMinor: row.totalIncomeMinor || 0,
    totalExpenseMinor: row.totalExpenseMinor || 0,
    netBalanceMinor: row.netBalanceMinor || 0,
    savingsRate: Math.round((row.savingsRate || 0) * 10) / 10,
    transactionCount: row.transactionCount || 0,
  };
}

export async function getCategoryBreakdown(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<CategoryBreakdownItem[]> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const match: Record<string, any> = {
    userId: userObjectId,
    type: "EXPENSE",
  };

  if (startDate || endDate) {
    match.occurredOn = {};
    if (startDate) match.occurredOn.$gte = toUtcMidnight(startDate);
    if (endDate) match.occurredOn.$lte = getUtcEndOfDay(endDate);
  }

  const results = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$categoryId",
        totalMinor: { $sum: "$amountMinor" },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    { $sort: { totalMinor: -1 } },
  ]);

  const totalExpense = results.reduce((acc, curr) => acc + curr.totalMinor, 0);

  return results.map((item) => ({
    categoryId: item._id.toString(),
    name: item.category.name,
    color: item.category.color,
    icon: item.category.icon,
    totalMinor: item.totalMinor,
    percentage:
      totalExpense > 0
        ? Math.round((item.totalMinor / totalExpense) * 1000) / 10
        : 0,
    count: item.count,
  }));
}

export async function getMonthlyTrend(
  userId: string,
  months = 6
): Promise<MonthlyTrendItem[]> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const now = new Date();
  const startDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1)
  );

  const results = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        occurredOn: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$occurredOn",
            timezone: "UTC",
          },
        },
        incomeMinor: {
          $sum: {
            $cond: [{ $eq: ["$type", "INCOME"] }, "$amountMinor", 0],
          },
        },
        expenseMinor: {
          $sum: {
            $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amountMinor", 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return results.map((item) => ({
    month: item._id,
    incomeMinor: item.incomeMinor,
    expenseMinor: item.expenseMinor,
    netMinor: item.incomeMinor - item.expenseMinor,
  }));
}

/**
 * Escapes values for CSV export and protects against CSV Injection / Formula Injection
 * (=, +, -, @, \t, \r are prefixed with a single quote ')
 */
export function sanitizeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);

  // Formula injection check: if first char is =, +, -, @, or tab
  const dangerousPrefixes = ["=", "+", "-", "@", "\t", "\r"];
  const safeStr = dangerousPrefixes.some((p) => str.startsWith(p))
    ? `'${str}`
    : str;

  // Escape quotes
  const escaped = safeStr.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function generateTransactionsCsv(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<string> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const query: Record<string, any> = {
    userId: userObjectId,
  };

  if (startDate || endDate) {
    query.occurredOn = {};
    if (startDate) query.occurredOn.$gte = toUtcMidnight(startDate);
    if (endDate) query.occurredOn.$lte = getUtcEndOfDay(endDate);
  }

  const items = await Transaction.find(query)
    .sort({ occurredOn: -1 })
    .populate("categoryId", "name");

  const headers = ["Date", "Type", "Category", "Amount", "Currency", "Note"];
  const rows: string[] = [headers.join(",")];

  for (const item of items) {
    const categoryName = (item.categoryId as unknown as { name?: string })?.name || "Uncategorized";
    const dateStr = item.occurredOn.toISOString().slice(0, 10);
    const amountStr = toMajor(item.amountMinor).toFixed(2);

    rows.push(
      [
        sanitizeCsvField(dateStr),
        sanitizeCsvField(item.type),
        sanitizeCsvField(categoryName),
        sanitizeCsvField(amountStr),
        sanitizeCsvField("USD"),
        sanitizeCsvField(item.note || ""),
      ].join(",")
    );
  }

  return rows.join("\r\n");
}
