import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Category } from "@/server/models/category";
import { Transaction } from "@/server/models/transaction";
import { Budget } from "@/server/models/budget";
import {
  listBudgetsWithProgress,
  upsertBudget,
  deleteBudget,
} from "@/server/services/budget";
import { toUtcMidnight } from "@/lib/dates";

describe("Budget Service & Progress Calculation", () => {
  let mongoServer: MongoMemoryServer;
  let userAId: string;
  let userBId: string;
  let catHousingA: string;
  let catDiningA: string;
  let catDiningB: string;

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
    await Budget.deleteMany({});

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

    const housing = await Category.create({
      userId: userA._id,
      name: "Housing",
      type: "EXPENSE",
      color: "#3b82f6",
    });
    catHousingA = housing._id.toString();

    const diningA = await Category.create({
      userId: userA._id,
      name: "Dining",
      type: "EXPENSE",
      color: "#f59e0b",
    });
    catDiningA = diningA._id.toString();

    const diningB = await Category.create({
      userId: userB._id,
      name: "Dining",
      type: "EXPENSE",
      color: "#ef4444",
    });
    catDiningB = diningB._id.toString();
  });

  it("upserts budget targets and prevents cross-user category access", async () => {
    // User A sets budget for Housing ($1,500.00 = 150000 minor)
    const budgetA = await upsertBudget(userAId, {
      categoryId: catHousingA,
      limitMinor: 150000,
    });

    expect(budgetA.categoryName).toBe("Housing");
    expect(budgetA.limitMinor).toBe(150000);

    // Updating existing budget limit
    const updatedA = await upsertBudget(userAId, {
      categoryId: catHousingA,
      limitMinor: 180000,
    });
    expect(updatedA.id).toBe(budgetA.id);
    expect(updatedA.limitMinor).toBe(180000);

    // User A cannot set budget on User B's category
    await expect(
      upsertBudget(userAId, {
        categoryId: catDiningB,
        limitMinor: 50000,
      })
    ).rejects.toThrow("Category not found");
  });

  it("calculates spending progress, remaining amounts, and alert thresholds (80% and 100%)", async () => {
    const targetMonth = "2026-03";

    // Set Dining budget to $500.00 (50,000 minor)
    await upsertBudget(userAId, {
      categoryId: catDiningA,
      limitMinor: 50000,
    });

    // 1. Initial state (0 spent): On track
    let overview = await listBudgetsWithProgress(userAId, targetMonth);
    expect(overview.budgets).toHaveLength(1);
    expect(overview.budgets[0].spentMinor).toBe(0);
    expect(overview.budgets[0].remainingMinor).toBe(50000);
    expect(overview.budgets[0].percentage).toBe(0);
    expect(overview.budgets[0].isWarning).toBe(false);
    expect(overview.budgets[0].isExceeded).toBe(false);

    // 2. Add transaction: $420.00 (42,000 minor) -> 84% spent -> Warning trigger!
    await Transaction.create({
      userId: userAId,
      amountMinor: 42000,
      type: "EXPENSE",
      categoryId: catDiningA,
      occurredOn: toUtcMidnight("2026-03-10"),
    });

    overview = await listBudgetsWithProgress(userAId, targetMonth);
    const diningBudget = overview.budgets[0];
    expect(diningBudget.spentMinor).toBe(42000);
    expect(diningBudget.remainingMinor).toBe(8000);
    expect(diningBudget.percentage).toBe(84);
    expect(diningBudget.isWarning).toBe(true);
    expect(diningBudget.isExceeded).toBe(false);

    // 3. Add transaction: $100.00 (10,000 minor) -> total 52,000 minor -> 104% spent -> Exceeded trigger!
    await Transaction.create({
      userId: userAId,
      amountMinor: 10000,
      type: "EXPENSE",
      categoryId: catDiningA,
      occurredOn: toUtcMidnight("2026-03-15"),
    });

    overview = await listBudgetsWithProgress(userAId, targetMonth);
    const exceededBudget = overview.budgets[0];
    expect(exceededBudget.spentMinor).toBe(52000);
    expect(exceededBudget.remainingMinor).toBe(0);
    expect(exceededBudget.percentage).toBe(104);
    expect(exceededBudget.isWarning).toBe(false);
    expect(exceededBudget.isExceeded).toBe(true);
  });

  it("enforces multi-tenant isolation so User B data does not contaminate User A budgets", async () => {
    const targetMonth = "2026-03";

    // User A budget: $100
    await upsertBudget(userAId, {
      categoryId: catDiningA,
      limitMinor: 10000,
    });

    // User B budget: $500
    await upsertBudget(userBId, {
      categoryId: catDiningB,
      limitMinor: 50000,
    });

    // User B spends $450 in Dining B
    await Transaction.create({
      userId: userBId,
      amountMinor: 45000,
      type: "EXPENSE",
      categoryId: catDiningB,
      occurredOn: toUtcMidnight("2026-03-12"),
    });

    // User A's Dining budget must remain at $0 spent
    const overviewA = await listBudgetsWithProgress(userAId, targetMonth);
    expect(overviewA.budgets).toHaveLength(1);
    expect(overviewA.budgets[0].spentMinor).toBe(0);
    expect(overviewA.budgets[0].percentage).toBe(0);

    // User B cannot delete User A's budget
    const budgetA = overviewA.budgets[0];
    const deleteAttempt = await deleteBudget(userBId, budgetA.id);
    expect(deleteAttempt).toBe(false);

    // User A can delete their own budget
    const deleteSuccess = await deleteBudget(userAId, budgetA.id);
    expect(deleteSuccess).toBe(true);
  });
});
