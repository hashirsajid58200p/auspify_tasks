import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Category } from "@/server/models/category";
import { Transaction } from "@/server/models/transaction";
import {
  getSummaryMetrics,
  getCategoryBreakdown,
  getMonthlyTrend,
  generateTransactionsCsv,
  sanitizeCsvField,
} from "@/server/services/report";
import { toUtcMidnight } from "@/lib/dates";

describe("Report Aggregations & CSV Security", () => {
  describe("sanitizeCsvField (CSV Injection / Formula Injection Defense)", () => {
    it("safely handles null and undefined", () => {
      expect(sanitizeCsvField(null)).toBe('""');
      expect(sanitizeCsvField(undefined)).toBe('""');
    });

    it("escapes normal strings and quotes", () => {
      expect(sanitizeCsvField("Regular Text")).toBe('"Regular Text"');
      expect(sanitizeCsvField('He said "Hello"')).toBe('"He said ""Hello"""');
      expect(sanitizeCsvField(1234.56)).toBe('"1234.56"');
    });

    it("neutralizes dangerous formula characters by prefixing with a single quote", () => {
      expect(sanitizeCsvField("=SUM(A1:A10)")).toBe("\"'=SUM(A1:A10)\"");
      expect(sanitizeCsvField("+2+5")).toBe("\"'+2+5\"");
      expect(sanitizeCsvField("-cmd|' /C calc'!A0")).toBe("\"'-cmd|' /C calc'!A0\"");
      expect(sanitizeCsvField("@SUM(1,2)")).toBe("\"'@SUM(1,2)\"");
      expect(sanitizeCsvField("\tTabbedVal")).toBe("\"'\tTabbedVal\"");
      expect(sanitizeCsvField("\rCarriageVal")).toBe("\"'\rCarriageVal\"");
    });
  });

  describe("MongoDB Aggregation Pipelines", () => {
    let mongoServer: MongoMemoryServer;
    let userAId: string;
    let userBId: string;
    let catHousingA: string;
    let catFoodA: string;
    let catFoodB: string;

    beforeAll(async () => {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      process.env.MONGODB_URI = uri;
      await mongoose.connect(uri);
    });

    afterAll(async () => {
      await mongoose.disconnect();
      await mongoServer.stop();
    });

    beforeEach(async () => {
      await User.deleteMany({});
      await Category.deleteMany({});
      await Transaction.deleteMany({});

      const userA = await User.create({
        name: "User A",
        email: "usera@example.com",
        passwordHash: "hashA",
      });
      userAId = userA._id.toString();

      const userB = await User.create({
        name: "User B",
        email: "userb@example.com",
        passwordHash: "hashB",
      });
      userBId = userB._id.toString();

      const housingA = await Category.create({
        userId: userA._id,
        name: "Housing",
        type: "EXPENSE",
        color: "#3b82f6",
        icon: "Home",
      });
      catHousingA = housingA._id.toString();

      const foodA = await Category.create({
        userId: userA._id,
        name: "Food",
        type: "EXPENSE",
        color: "#f59e0b",
        icon: "Utensils",
      });
      catFoodA = foodA._id.toString();

      const foodB = await Category.create({
        userId: userB._id,
        name: "Food B",
        type: "EXPENSE",
        color: "#ef4444",
        icon: "Utensils",
      });
      catFoodB = foodB._id.toString();

      // Seed User A Transactions
      // Current year month: 2026-03
      // Income: 500,000 minor ($5,000)
      await Transaction.create({
        userId: userA._id,
        amountMinor: 500000,
        type: "INCOME",
        categoryId: catHousingA,
        occurredOn: toUtcMidnight("2026-03-01"),
        note: "Monthly Salary",
      });

      // Expense 1: 150,000 minor ($1,500) Housing
      await Transaction.create({
        userId: userA._id,
        amountMinor: 150000,
        type: "EXPENSE",
        categoryId: catHousingA,
        occurredOn: toUtcMidnight("2026-03-05"),
        note: "Rent payment",
      });

      // Expense 2: 50,000 minor ($500) Food
      await Transaction.create({
        userId: userA._id,
        amountMinor: 50000,
        type: "EXPENSE",
        categoryId: catFoodA,
        occurredOn: toUtcMidnight("2026-03-10"),
        note: "=SUM(1+1)", // dangerous formula note to test CSV escaping
      });

      // Expense 3 (Prior month): 40,000 minor ($400) Food in 2026-02
      await Transaction.create({
        userId: userA._id,
        amountMinor: 40000,
        type: "EXPENSE",
        categoryId: catFoodA,
        occurredOn: toUtcMidnight("2026-02-15"),
        note: "Groceries Feb",
      });

      // Seed User B Transactions (must never leak into User A)
      await Transaction.create({
        userId: userB._id,
        amountMinor: 1000000,
        type: "INCOME",
        categoryId: catFoodB,
        occurredOn: toUtcMidnight("2026-03-01"),
        note: "User B Salary",
      });
      await Transaction.create({
        userId: userB._id,
        amountMinor: 800000,
        type: "EXPENSE",
        categoryId: catFoodB,
        occurredOn: toUtcMidnight("2026-03-02"),
        note: "User B Big Purchase",
      });
    });

    describe("getSummaryMetrics", () => {
      it("calculates total income, expense, net balance, and savings rate for all time", async () => {
        const summary = await getSummaryMetrics(userAId);

        expect(summary.totalIncomeMinor).toBe(500000);
        expect(summary.totalExpenseMinor).toBe(240000); // 150k + 50k + 40k
        expect(summary.netBalanceMinor).toBe(260000); // 500k - 240k
        // Savings rate = (260000 / 500000) * 100 = 52.0%
        expect(summary.savingsRate).toBe(52);
        expect(summary.transactionCount).toBe(4);
      });

      it("respects date filtering (e.g. only March 2026)", async () => {
        const summary = await getSummaryMetrics(
          userAId,
          "2026-03-01",
          "2026-03-31"
        );

        expect(summary.totalIncomeMinor).toBe(500000);
        expect(summary.totalExpenseMinor).toBe(200000); // 150k + 50k (excludes Feb's 40k)
        expect(summary.netBalanceMinor).toBe(300000);
        // Savings rate = (300000 / 500000) * 100 = 60.0%
        expect(summary.savingsRate).toBe(60);
        expect(summary.transactionCount).toBe(3);
      });

      it("returns zeros safely for a user with no transactions", async () => {
        const freshUser = await User.create({
          name: "Fresh User",
          email: "fresh@example.com",
          passwordHash: "hash",
        });

        const summary = await getSummaryMetrics(freshUser._id.toString());
        expect(summary).toEqual({
          totalIncomeMinor: 0,
          totalExpenseMinor: 0,
          netBalanceMinor: 0,
          savingsRate: 0,
          transactionCount: 0,
        });
      });
    });

    describe("getCategoryBreakdown", () => {
      it("groups expenses by category sorted descending by total amount", async () => {
        const breakdown = await getCategoryBreakdown(userAId);

        expect(breakdown).toHaveLength(2);
        // Housing: 150,000 / 240,000 = 62.5%
        expect(breakdown[0].name).toBe("Housing");
        expect(breakdown[0].totalMinor).toBe(150000);
        expect(breakdown[0].percentage).toBe(62.5);
        expect(breakdown[0].count).toBe(1);

        // Food: 90,000 (50k + 40k) / 240,000 = 37.5%
        expect(breakdown[1].name).toBe("Food");
        expect(breakdown[1].totalMinor).toBe(90000);
        expect(breakdown[1].percentage).toBe(37.5);
        expect(breakdown[1].count).toBe(2);
      });

      it("filters by date range correctly", async () => {
        const breakdown = await getCategoryBreakdown(
          userAId,
          "2026-03-01",
          "2026-03-31"
        );

        expect(breakdown).toHaveLength(2);
        // Total March expenses: 200,000 (Housing 150k, Food 50k)
        expect(breakdown[0].name).toBe("Housing");
        expect(breakdown[0].totalMinor).toBe(150000);
        expect(breakdown[0].percentage).toBe(75);

        expect(breakdown[1].name).toBe("Food");
        expect(breakdown[1].totalMinor).toBe(50000);
        expect(breakdown[1].percentage).toBe(25);
      });

      it("never includes another user's categories or data", async () => {
        const userBBreakdown = await getCategoryBreakdown(userBId);
        expect(userBBreakdown).toHaveLength(1);
        expect(userBBreakdown[0].name).toBe("Food B");
        expect(userBBreakdown[0].totalMinor).toBe(800000);
      });
    });

    describe("getMonthlyTrend", () => {
      it("groups income and expenses by year-month", async () => {
        const trend = await getMonthlyTrend(userAId, 12);

        // Expect entries for 2026-02 and 2026-03
        const feb = trend.find((t) => t.month === "2026-02");
        const mar = trend.find((t) => t.month === "2026-03");

        expect(feb).toBeDefined();
        expect(feb?.incomeMinor).toBe(0);
        expect(feb?.expenseMinor).toBe(40000);
        expect(feb?.netMinor).toBe(-40000);

        expect(mar).toBeDefined();
        expect(mar?.incomeMinor).toBe(500000);
        expect(mar?.expenseMinor).toBe(200000);
        expect(mar?.netMinor).toBe(300000);
      });
    });

    describe("generateTransactionsCsv", () => {
      it("generates valid CSV lines and protects against formula injection", async () => {
        const csv = await generateTransactionsCsv(userAId);

        expect(csv).toContain("Date,Type,Category,Amount,Currency,Note");
        // Contains March salary
        expect(csv).toContain('"INCOME","Housing","5000.00","USD","Monthly Salary"');
        // Contains sanitized formula injection note
        expect(csv).toContain("\"'=SUM(1+1)\"");
        // Does not contain User B data
        expect(csv).not.toContain("User B Salary");
      });
    });
  });
});
