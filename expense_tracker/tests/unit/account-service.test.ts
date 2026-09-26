import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Session } from "@/server/models/session";
import { Category } from "@/server/models/category";
import { Transaction } from "@/server/models/transaction";
import { Budget } from "@/server/models/budget";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  updateProfile,
  changePassword,
  exportUserData,
  deleteAccount,
} from "@/server/services/account";
import { toUtcMidnight } from "@/lib/dates";

describe("Account Service, Security & Cascade Deletion", () => {
  let mongoServer: MongoMemoryServer;
  let normalUserId: string;
  let demoUserId: string;
  const initialPassword = "StrongPassword123!";

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
    await Session.deleteMany({});
    await Category.deleteMany({});
    await Transaction.deleteMany({});
    await Budget.deleteMany({});

    const passwordHash = await hashPassword(initialPassword);

    const normalUser = await User.create({
      name: "Normal User",
      email: "normal@example.com",
      passwordHash,
      currency: "USD",
      isDemo: false,
    });
    normalUserId = normalUser._id.toString();

    const demoUser = await User.create({
      name: "Demo Evaluator",
      email: "demo@example.com",
      passwordHash,
      currency: "USD",
      isDemo: true,
    });
    demoUserId = demoUser._id.toString();
  });

  describe("updateProfile", () => {
    it("updates display name and preferred currency", async () => {
      const updated = await updateProfile(normalUserId, {
        name: "Updated Name",
        currency: "EUR",
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.currency).toBe("EUR");

      const dbUser = await User.findById(normalUserId);
      expect(dbUser?.currency).toBe("EUR");
    });
  });

  describe("changePassword & Session Revocation", () => {
    it("strictly blocks password changes for demo accounts", async () => {
      await expect(
        changePassword(demoUserId, {
          currentPassword: initialPassword,
          newPassword: "BrandNewPassword123!",
        })
      ).rejects.toThrow("Demo account password cannot be modified");
    });

    it("rejects password changes with incorrect current password", async () => {
      await expect(
        changePassword(normalUserId, {
          currentPassword: "WrongPassword999!",
          newPassword: "BrandNewPassword123!",
        })
      ).rejects.toThrow("Incorrect current password");
    });

    it("updates password hash and revokes all other sessions", async () => {
      // Create 2 active sessions for normalUser
      const session1 = await Session.create({
        userId: normalUserId,
        familyId: "family-1",
        jti: "jti-1",
        expiresAt: new Date(Date.now() + 100000),
      });

      const session2 = await Session.create({
        userId: normalUserId,
        familyId: "family-2",
        jti: "jti-2",
        expiresAt: new Date(Date.now() + 100000),
      });

      const newPassword = "BrandNewPassword123!";
      // Pass family-1 as current active family
      await changePassword(
        normalUserId,
        {
          currentPassword: initialPassword,
          newPassword,
        },
        "family-1"
      );

      // Verify new password verifies with argon2id
      const user = await User.findById(normalUserId);
      const isNewValid = await verifyPassword(user!.passwordHash, newPassword);
      expect(isNewValid).toBe(true);

      // Verify session 2 is revoked while session 1 remains active
      const s1 = await Session.findById(session1._id);
      const s2 = await Session.findById(session2._id);

      expect(s1?.revokedAt).toBeNull();
      expect(s2?.revokedAt).not.toBeNull();
    });
  });

  describe("exportUserData", () => {
    it("returns complete structured data export and strips password hashes", async () => {
      const cat = await Category.create({
        userId: normalUserId,
        name: "Groceries",
        type: "EXPENSE",
        color: "#10b981",
      });

      await Transaction.create({
        userId: normalUserId,
        amountMinor: 2500,
        type: "EXPENSE",
        categoryId: cat._id,
        occurredOn: toUtcMidnight("2026-03-01"),
        note: "Weekly market",
      });

      await Budget.create({
        userId: normalUserId,
        categoryId: cat._id,
        limitMinor: 10000,
      });

      const exportData = await exportUserData(normalUserId);

      expect(exportData.user.email).toBe("normal@example.com");
      // Must not leak password hash
       
      expect((exportData.user as any).passwordHash).toBeUndefined();
      expect(exportData.categories).toHaveLength(1);
      expect(exportData.transactions).toHaveLength(1);
      expect(exportData.budgets).toHaveLength(1);
    });
  });

  describe("deleteAccount (Cascade Cleanup)", () => {
    it("strictly blocks deletion of demo accounts", async () => {
      await expect(
        deleteAccount(demoUserId, initialPassword)
      ).rejects.toThrow("Demo account cannot be deleted");
    });

    it("rejects deletion with incorrect password", async () => {
      await expect(
        deleteAccount(normalUserId, "WrongPassword!")
      ).rejects.toThrow("Incorrect password");
    });

    it("cascades and purges user, sessions, transactions, budgets, and categories completely", async () => {
      const cat = await Category.create({
        userId: normalUserId,
        name: "Test Cat",
        type: "EXPENSE",
        color: "#3b82f6",
      });

      await Transaction.create({
        userId: normalUserId,
        amountMinor: 5000,
        type: "EXPENSE",
        categoryId: cat._id,
        occurredOn: toUtcMidnight("2026-03-01"),
      });

      await Budget.create({
        userId: normalUserId,
        categoryId: cat._id,
        limitMinor: 20000,
      });

      await Session.create({
        userId: normalUserId,
        familyId: "fam",
        jti: "jti",
        expiresAt: new Date(Date.now() + 10000),
      });

      // Execute cascade deletion
      await deleteAccount(normalUserId, initialPassword);

      // Verify all collections are cleaned up
      expect(await User.findById(normalUserId)).toBeNull();
      expect(await Session.countDocuments({ userId: normalUserId })).toBe(0);
      expect(await Transaction.countDocuments({ userId: normalUserId })).toBe(0);
      expect(await Budget.countDocuments({ userId: normalUserId })).toBe(0);
      expect(await Category.countDocuments({ userId: normalUserId })).toBe(0);
    });
  });
});
