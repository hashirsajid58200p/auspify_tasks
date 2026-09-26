import mongoose from "mongoose";
import { Transaction } from "@/server/models/transaction";
import { Budget } from "@/server/models/budget";
import { connectToDatabase } from "@/server/db";
import { formatMoney } from "@/lib/money";

export interface FinancialInsight {
  id: string;
  type: "positive" | "warning" | "neutral" | "danger";
  title: string;
  message: string;
  metric?: string;
}

export async function getFinancialInsights(
  userId: string,
  currency = "USD"
): Promise<FinancialInsight[]> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth(); // 0-indexed

  const curMonthStart = new Date(Date.UTC(currentYear, currentMonth, 1));
  const curMonthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 1));

  const prevMonthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
  const prevMonthEnd = curMonthStart;

  // 1. Current Month Aggregations (Income, Expense, Category Breakdown)
  const currentAgg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        occurredOn: { $gte: curMonthStart, $lt: curMonthEnd },
      },
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amountMinor" },
      },
    },
  ]);

  let curIncome = 0;
  let curExpense = 0;
  for (const item of currentAgg) {
    if (item._id === "INCOME") curIncome = item.total;
    if (item._id === "EXPENSE") curExpense = item.total;
  }

  // 2. Previous Month Aggregations
  const prevAgg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        type: "EXPENSE",
        occurredOn: { $gte: prevMonthStart, $lt: prevMonthEnd },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amountMinor" },
      },
    },
  ]);

  const prevExpense = prevAgg[0]?.total || 0;

  // 3. Top Category in Current Month
  const topCatAgg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        type: "EXPENSE",
        occurredOn: { $gte: curMonthStart, $lt: curMonthEnd },
      },
    },
    {
      $group: {
        _id: "$categoryId",
        total: { $sum: "$amountMinor" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
  ]);

  // 4. Budget Overages
  const budgets = await Budget.find({ userId: userObjectId }).populate("categoryId");
  const catExpensesAgg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        type: "EXPENSE",
        occurredOn: { $gte: curMonthStart, $lt: curMonthEnd },
      },
    },
    {
      $group: {
        _id: "$categoryId",
        total: { $sum: "$amountMinor" },
      },
    },
  ]);

  const catExpenseMap = new Map<string, number>();
  for (const item of catExpensesAgg) {
    if (item._id) catExpenseMap.set(item._id.toString(), item.total);
  }

  const insights: FinancialInsight[] = [];

  // Insight 1: Month-over-Month Spending Shift
  if (prevExpense > 0 && curExpense > 0) {
    const diff = curExpense - prevExpense;
    const pct = Math.round((diff / prevExpense) * 100);

    if (pct > 15) {
      insights.push({
        id: "mom-increase",
        type: "warning",
        title: "Month-over-Month Surge",
        message: `Your spending this month is up ${Math.abs(
          pct
        )}% (${formatMoney(diff, currency)} more) compared to last month. Keep an eye on recent purchases.`,
        metric: `+${pct}%`,
      });
    } else if (pct < -10) {
      insights.push({
        id: "mom-decrease",
        type: "positive",
        title: "Disciplined Spending",
        message: `Great discipline! Spending is down ${Math.abs(
          pct
        )}% compared to this point last month (${formatMoney(Math.abs(diff), currency)} saved).`,
        metric: `${pct}%`,
      });
    } else {
      insights.push({
        id: "mom-steady",
        type: "neutral",
        title: "Consistent Spending Pace",
        message: `Your spending is tracking within ${Math.abs(
          pct
        )}% of last month's pace.`,
        metric: `${pct >= 0 ? "+" : ""}${pct}%`,
      });
    }
  }

  // Insight 2: Top Expense Category
  if (topCatAgg.length > 0 && curExpense > 0) {
    const topCat = topCatAgg[0];
    const catName = topCat.category?.name || "Uncategorized";
    const catTotal = topCat.total;
    const catPct = Math.round((catTotal / curExpense) * 100);

    insights.push({
      id: "top-category",
      type: catPct > 50 ? "warning" : "neutral",
      title: `Top Outflow: ${catName}`,
      message: `${catName} is your largest expense category this month at ${formatMoney(
        catTotal,
        currency
      )}, representing ${catPct}% of total expenditures.`,
      metric: `${catPct}%`,
    });
  }

  // Insight 3: Savings Rate
  if (curIncome > 0) {
    const savingsMinor = curIncome - curExpense;
    const rate = Math.round((savingsMinor / curIncome) * 1000) / 10;

    if (rate >= 20) {
      insights.push({
        id: "savings-rate-healthy",
        type: "positive",
        title: "Healthy Savings Rate",
        message: `You are saving ${rate}% of your income this month (${formatMoney(
          savingsMinor,
          currency
        )} net). You are exceeding the standard 20% benchmark!`,
        metric: `${rate}%`,
      });
    } else if (rate > 0) {
      insights.push({
        id: "savings-rate-moderate",
        type: "neutral",
        title: "Positive Net Cash Flow",
        message: `Your savings rate is currently ${rate}%. Trimming non-essential costs could help hit the ideal 20% target.`,
        metric: `${rate}%`,
      });
    } else {
      insights.push({
        id: "savings-rate-deficit",
        type: "danger",
        title: "Negative Cash Flow Alert",
        message: `Your expenses currently exceed your income by ${formatMoney(
          Math.abs(savingsMinor),
          currency
        )}. Watch discretionary outflows.`,
        metric: `${rate}%`,
      });
    }
  }

  // Insight 4: Budget Threshold Warnings
  for (const b of budgets) {
     
    const cat = b.categoryId as any;
    if (!cat) continue;

    const spent = catExpenseMap.get(cat._id.toString()) || 0;
    const limit = b.limitMinor;

    if (spent >= limit) {
      insights.push({
        id: `budget-exceeded-${b._id}`,
        type: "danger",
        title: `${cat.name} Budget Exceeded`,
        message: `You have spent ${formatMoney(spent, currency)} against your ${formatMoney(
          limit,
          currency
        )} limit (${formatMoney(spent - limit, currency)} over).`,
        metric: `${Math.round((spent / limit) * 100)}%`,
      });
    } else if (spent >= limit * 0.8) {
      insights.push({
        id: `budget-warning-${b._id}`,
        type: "warning",
        title: `${cat.name} Budget at 80%+`,
        message: `You have reached ${Math.round(
          (spent / limit) * 100
        )}% of your ${cat.name} budget with ${formatMoney(
          limit - spent,
          currency
        )} remaining.`,
        metric: `${Math.round((spent / limit) * 100)}%`,
      });
    }
  }

  return insights;
}
