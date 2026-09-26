import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Session } from "@/server/models/session";
import { AuditLog } from "@/server/models/audit-log";
import { listStaffUsers, createStaffUser, updateStaffUser } from "@/server/services/staff";
import { authenticateUser } from "@/server/services/auth";
import { hashPassword } from "@/server/auth/password";
import { PolicyForbiddenError } from "@/server/policies/roles";
import { ForbiddenError, ConflictError } from "@/server/http";

describe("Staff Management & Role Security Invariants", () => {
  let mongoServer: MongoMemoryServer;
  let adminUser: { id: string; role: "ADMIN"; status: "ACTIVE" };
  let staffUser: { id: string; role: "STAFF"; status: "ACTIVE" };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    process.env.JWT_ACCESS_SECRET = "test-access-secret-minimum-32-characters-long-key-for-auth";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-minimum-32-characters-long-key-for-auth";
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await AuditLog.deleteMany({});
    await Session.deleteMany({});
    await User.deleteMany({});

    const adminHash = await hashPassword("AdminSecretPass123!");
    const createdAdmin = await User.create({
      name: "Primary Admin",
      email: "primary.admin@school.org",
      passwordHash: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
    });

    const staffHash = await hashPassword("StaffSecretPass123!");
    const createdStaff = await User.create({
      name: "Standard Staff",
      email: "standard.staff@school.org",
      passwordHash: staffHash,
      role: "STAFF",
      status: "ACTIVE",
    });

    adminUser = {
      id: createdAdmin._id.toString(),
      role: "ADMIN",
      status: "ACTIVE",
    };

    staffUser = {
      id: createdStaff._id.toString(),
      role: "STAFF",
      status: "ACTIVE",
    };
  });

  it("lists staff users and omits password hashes", async () => {
    const list = await listStaffUsers();
    expect(list.length).toBe(2);

    for (const u of list) {
      expect((u as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
      expect(u.id).toBeDefined();
      expect(u.email).toBeDefined();
    }
  });

  it("creates a new staff member with mustChangePassword: true and audit log", async () => {
    const created = await createStaffUser(
      {
        name: "New Teacher",
        email: "new.teacher@school.org",
        password: "TempPassForTeacher123!",
        role: "STAFF",
      },
      adminUser.id,
    );

    expect(created.email).toBe("new.teacher@school.org");
    expect(created.mustChangePassword).toBe(true);
    expect(created.status).toBe("ACTIVE");

    // Check audit log
    const auditLogs = await AuditLog.find({ targetId: created.id });
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].action).toBe("CREATE_STAFF_USER");
  });

  it("rejects duplicate email on staff creation", async () => {
    await expect(
      createStaffUser(
        {
          name: "Duplicate User",
          email: "primary.admin@school.org",
          password: "TempPassForTeacher123!",
          role: "STAFF",
        },
        adminUser.id,
      ),
    ).rejects.toThrow(ConflictError);
  });

  it("blocks user from self-promoting or modifying own role/status (Mandatory Rule)", async () => {
    // Staff trying to self-promote to ADMIN
    await expect(updateStaffUser(staffUser.id, { role: "ADMIN" }, staffUser)).rejects.toThrow(
      PolicyForbiddenError,
    );

    // Admin trying to self-demote or self-suspend
    await expect(updateStaffUser(adminUser.id, { status: "SUSPENDED" }, adminUser)).rejects.toThrow(
      PolicyForbiddenError,
    );
  });

  it("blocks demoting or suspending the last active administrator", async () => {
    // Only 1 admin exists currently (adminUser)
    // Create a 2nd admin so we can test trying to demote the only remaining one
    const secondAdmin = await createStaffUser(
      {
        name: "Second Admin",
        email: "second.admin@school.org",
        password: "TempPassForAdmin123!",
        role: "ADMIN",
      },
      adminUser.id,
    );

    // Now there are 2 admins. Demoting secondAdmin by adminUser should succeed:
    const demoted = await updateStaffUser(secondAdmin.id, { role: "STAFF" }, adminUser);
    expect(demoted.role).toBe("STAFF");

    // Now only 1 admin remains (adminUser).
    // If another admin existed, they couldn't demote adminUser either:
    await expect(
      updateStaffUser(
        adminUser.id,
        { role: "STAFF" },
        { id: secondAdmin.id, role: "ADMIN" }, // hypothetical second actor
      ),
    ).rejects.toThrow(PolicyForbiddenError);
  });

  it("suspending a staff account immediately revokes all active sessions (Mandatory Rule)", async () => {
    // 1. Create an active session for standard staff
    await Session.create({
      userId: new mongoose.Types.ObjectId(staffUser.id),
      familyId: "fam-test-123",
      jti: "jti-active-session",
      expiresAt: new Date(Date.now() + 86400000),
      lastUsedAt: new Date(),
    });

    const activeSessionsBefore = await Session.find({
      userId: staffUser.id,
      revokedAt: null,
    });
    expect(activeSessionsBefore.length).toBe(1);

    // 2. Admin suspends staff account
    await updateStaffUser(staffUser.id, { status: "SUSPENDED" }, adminUser);

    // 3. Verify session was revoked in database
    const activeSessionsAfter = await Session.find({
      userId: staffUser.id,
      revokedAt: null,
    });
    expect(activeSessionsAfter.length).toBe(0);

    const revokedSession = await Session.findOne({ jti: "jti-active-session" });
    expect(revokedSession?.revokedAt).not.toBeNull();

    // 4. Verify login is immediately rejected with ForbiddenError
    await expect(
      authenticateUser({
        email: "standard.staff@school.org",
        password: "StaffSecretPass123!",
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
