import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Category } from "@/server/models/category";
import { Transaction } from "@/server/models/transaction";
import {
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  listTransactions,
} from "@/server/services/transaction";
import {
  createTransactionSchema,
  transactionFilterSchema,
} from "@/validations/transaction";

describe("Multi-Tenant Isolation & NoSQL Injection Protection", () => {
  let mongoServer: MongoMemoryServer;
  let userAId: string;
  let userBId: string;
  let categoryAId: string;
  let categoryBId: string;

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

    // Create User A
    const userA = await User.create({
      name: "User A",
      email: "usera@example.com",
      passwordHash: "hashA",
    });
    userAId = userA._id.toString();

    // Create Category for User A
    const catA = await Category.create({
      userId: userA._id,
      name: "Dining",
      type: "EXPENSE",
      color: "#f97316",
    });
    categoryAId = catA._id.toString();

    // Create User B
    const userB = await User.create({
      name: "User B",
      email: "userb@example.com",
      passwordHash: "hashB",
    });
    userBId = userB._id.toString();

    // Create Category for User B
    const catB = await Category.create({
      userId: userB._id,
      name: "Freelance",
      type: "INCOME",
      color: "#06b6d4",
    });
    categoryBId = catB._id.toString();
  });

  it("should prevent User B from reading User A's transaction", async () => {
    const txA = await createTransaction(userAId, {
      type: "EXPENSE",
      amountMinor: 4500, // $45.00
      categoryId: categoryAId,
      occurredOn: "2026-09-24",
      note: "Team dinner",
    });

    // User A can read it
    const readByA = await getTransactionById(userAId, txA._id.toString());
    expect(readByA._id.toString()).toBe(txA._id.toString());

    // User B attempts to read it -> 404 NotFound
    await expect(
      getTransactionById(userBId, txA._id.toString())
    ).rejects.toThrow("Transaction not found");
  });

  it("should prevent User B from modifying or deleting User A's transaction", async () => {
    const txA = await createTransaction(userAId, {
      type: "EXPENSE",
      amountMinor: 2000,
      categoryId: categoryAId,
      occurredOn: "2026-09-24",
      note: "Secret expense",
    });

    // User B attempts to update User A's transaction
    await expect(
      updateTransaction(userBId, txA._id.toString(), {
        note: "Hacked by User B",
      })
    ).rejects.toThrow("Transaction not found");

    // User B attempts to delete User A's transaction
    await expect(
      deleteTransaction(userBId, txA._id.toString())
    ).rejects.toThrow("Transaction not found");

    // Verify transaction remains intact in DB
    const stillExists = await Transaction.findById(txA._id);
    expect(stillExists?.note).toBe("Secret expense");
  });

  it("should isolate listings so User B only sees their own transactions", async () => {
    // User A creates 2 transactions
    await createTransaction(userAId, {
      type: "EXPENSE",
      amountMinor: 1500,
      categoryId: categoryAId,
      occurredOn: "2026-09-20",
    });
    await createTransaction(userAId, {
      type: "EXPENSE",
      amountMinor: 2500,
      categoryId: categoryAId,
      occurredOn: "2026-09-21",
    });

    // User B creates 1 transaction
    await createTransaction(userBId, {
      type: "INCOME",
      amountMinor: 100000,
      categoryId: categoryBId,
      occurredOn: "2026-09-22",
    });

    const listA = await listTransactions(userAId, { page: 1, limit: 10 });
    expect(listA.items.length).toBe(2);
    expect(listA.meta.total).toBe(2);

    const listB = await listTransactions(userBId, { page: 1, limit: 10 });
    expect(listB.items.length).toBe(1);
    expect(listB.meta.total).toBe(1);
    expect(listB.items[0].type).toBe("INCOME");
  });

  it("should prevent assigning a transaction to another user's category", async () => {
    await expect(
      createTransaction(userAId, {
        type: "EXPENSE",
        amountMinor: 3000,
        categoryId: categoryBId, // Belongs to User B!
        occurredOn: "2026-09-24",
      })
    ).rejects.toThrow("Category not found for this user");
  });

  it("should reject NoSQL injection attempts via Zod strict schemas", () => {
    // 1. Attempt injection with object $ne in categoryId
    const injectionBody = {
      type: "EXPENSE",
      amountMinor: 1000,
      categoryId: { $ne: null },
      occurredOn: "2026-09-24",
    };
    const parsedInjection = createTransactionSchema.safeParse(injectionBody);
    expect(parsedInjection.success).toBe(false);

    // 2. Attempt negative or float amount
    const negativeAmount = {
      type: "EXPENSE",
      amountMinor: -500,
      categoryId: "64f1a2b3c4d5e6f7a8b9c0d1",
      occurredOn: "2026-09-24",
    };
    expect(createTransactionSchema.safeParse(negativeAmount).success).toBe(false);

    const floatAmount = {
      type: "EXPENSE",
      amountMinor: 12.34,
      categoryId: "64f1a2b3c4d5e6f7a8b9c0d1",
      occurredOn: "2026-09-24",
    };
    expect(createTransactionSchema.safeParse(floatAmount).success).toBe(false);

    // 3. Attempt injection in query filters
    const injectionQuery = {
      search: "test",
      categoryId: { $gt: "" },
    };
    expect(transactionFilterSchema.safeParse(injectionQuery).success).toBe(false);

    // 4. Attempt unrecognized extra fields (strict rejection)
    const extraField = {
      type: "EXPENSE",
      amountMinor: 1000,
      categoryId: "64f1a2b3c4d5e6f7a8b9c0d1",
      occurredOn: "2026-09-24",
      admin: true,
    };
    expect(createTransactionSchema.safeParse(extraField).success).toBe(false);
  });
});
