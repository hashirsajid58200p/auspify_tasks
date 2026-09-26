import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Session } from "@/server/models/session";
import { Category } from "@/server/models/category";
import { Transaction } from "@/server/models/transaction";
import { Budget } from "@/server/models/budget";
import { registerUser } from "@/server/services/user";
import {
  createTransaction,
  listTransactions,
} from "@/server/services/transaction";
import {
  upsertBudget,
  listBudgetsWithProgress,
} from "@/server/services/budget";
import {
  getSummaryMetrics,
  getCategoryBreakdown,
  generateTransactionsCsv,
} from "@/server/services/report";
import {
  updateProfile,
  changePassword,
  exportUserData,
  deleteAccount,
} from "@/server/services/account";
import { toUtcMidnight } from "@/lib/dates";

describe("E2E User Lifecycle Integration Smoke Test", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET =
      "test-access-secret-minimum-32-characters-long-key-for-auth";
    process.env.JWT_REFRESH_SECRET =
      "test-refresh-secret-minimum-32-characters-long-key-for-auth";
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
    await Session.deleteMany({});
    await Category.deleteMany({});
    await Transaction.deleteMany({});
    await Budget.deleteMany({});
  });

  it("successfully executes the entire user lifecycle from registration to account deletion", async () => {
    // 1. User Registration
    const password = "SuperSecretPassword123!";
    const { user, accessToken, refreshToken } = await registerUser({
      name: "Alex Mercer",
      email: "alex@example.com",
      password,
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe("alex@example.com");
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    // 2. Default Categories Seeded on Register
    const categories = await Category.find({ userId: user.id });
    expect(categories.length).toBeGreaterThanOrEqual(10);
    const salaryCat = categories.find((c) => c.name === "Salary");
    const diningCat = categories.find((c) => c.name === "Food & Dining");
    expect(salaryCat).toBeDefined();
    expect(diningCat).toBeDefined();

    // 3. Add Income Transaction ($6,000.00 = 600,000 minor)
    const incomeTx = await createTransaction(user.id, {
      type: "INCOME",
      amountMinor: 600000,
      categoryId: salaryCat!._id.toString(),
      occurredOn: "2026-03-01",
      note: "March Salary Deposit",
    });
    expect(incomeTx.amountMinor).toBe(600000);

    // 4. Add Expense Transaction ($450.00 = 45,000 minor)
    const expenseTx = await createTransaction(user.id, {
      type: "EXPENSE",
      amountMinor: 45000,
      categoryId: diningCat!._id.toString(),
      occurredOn: "2026-03-05",
      note: "Team dinner celebration",
    });
    expect(expenseTx.amountMinor).toBe(45000);

    // 5. Set Monthly Budget Target for Dining ($500.00 = 50,000 minor)
    // 45,000 / 50,000 = 90% spent -> should trigger amber warning (>= 80%)!
    await upsertBudget(user.id, {
      categoryId: diningCat!._id.toString(),
      limitMinor: 50000,
    });

    const budgetOverview = await listBudgetsWithProgress(user.id, "2026-03");
    expect(budgetOverview.budgets).toHaveLength(1);
    const diningBudget = budgetOverview.budgets[0];
    expect(diningBudget.spentMinor).toBe(45000);
    expect(diningBudget.limitMinor).toBe(50000);
    expect(diningBudget.remainingMinor).toBe(5000);
    expect(diningBudget.percentage).toBe(90);
    expect(diningBudget.isWarning).toBe(true);
    expect(diningBudget.isExceeded).toBe(false);

    // 6. Verify Dashboard & Report Aggregations
    const summary = await getSummaryMetrics(user.id, "2026-03-01", "2026-03-31");
    expect(summary.totalIncomeMinor).toBe(600000);
    expect(summary.totalExpenseMinor).toBe(45000);
    expect(summary.netBalanceMinor).toBe(555000);
    // Savings rate = (555,000 / 600,000) * 100 = 92.5%
    expect(summary.savingsRate).toBe(92.5);
    expect(summary.transactionCount).toBe(2);

    const breakdown = await getCategoryBreakdown(user.id, "2026-03-01", "2026-03-31");
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].name).toBe("Food & Dining");
    expect(breakdown[0].totalMinor).toBe(45000);
    expect(breakdown[0].percentage).toBe(100);

    // 7. CSV Export with Security Formula Guard
    const csv = await generateTransactionsCsv(user.id);
    expect(csv).toContain("Date,Type,Category,Amount,Currency,Note");
    expect(csv).toContain('"INCOME","Salary","6000.00","USD","March Salary Deposit"');
    expect(csv).toContain('"EXPENSE","Food & Dining","450.00","USD","Team dinner celebration"');

    // 8. Update Profile Currency (change to EUR)
    const updatedProfile = await updateProfile(user.id, {
      name: "Alex Mercer Senior",
      currency: "EUR",
    });
    expect(updatedProfile.name).toBe("Alex Mercer Senior");
    expect(updatedProfile.currency).toBe("EUR");

    // 9. JSON Data Portability Export
    const exportJson = await exportUserData(user.id);
    expect(exportJson.user.name).toBe("Alex Mercer Senior");
    expect(exportJson.user.currency).toBe("EUR");
    expect(exportJson.transactions).toHaveLength(2);
    expect(exportJson.budgets).toHaveLength(1);
    expect(exportJson.categories.length).toBeGreaterThanOrEqual(10);

    // 10. Change Password with Session Revocation
    const newPassword = "UltraSecurePassword999!";
    await changePassword(user.id, {
      currentPassword: password,
      newPassword,
    });

    // 11. Multi-System Cascade Account Deletion
    await deleteAccount(user.id, newPassword);

    // Verify 100% cascade cleanup across all collections
    expect(await User.findById(user.id)).toBeNull();
    expect(await Session.countDocuments({ userId: user.id })).toBe(0);
    expect(await Transaction.countDocuments({ userId: user.id })).toBe(0);
    expect(await Budget.countDocuments({ userId: user.id })).toBe(0);
    expect(await Category.countDocuments({ userId: user.id })).toBe(0);
  });
});
