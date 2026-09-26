import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Job } from "@/server/models/job";
import { Company } from "@/server/models/company";
import { SeekerProfile } from "@/server/models/seeker-profile";
import { SavedJob } from "@/server/models/saved-job";
import { Application } from "@/server/models/application";
import { Session } from "@/server/models/session";
import { AuditLog } from "@/server/models/audit-log";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  changePassword,
  updateAccountName,
  deleteAccount,
  listUserSessions,
  revokeOtherUserSessions,
} from "@/server/services/settings";
import { BadRequestError } from "@/server/http";

describe("Settings Service, Password & Account Deletion Safeguards", () => {
  let mongoServer: MongoMemoryServer;
  let seekerId: Types.ObjectId;
  let employerId: Types.ObjectId;
  let adminId: Types.ObjectId;

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
    await Job.deleteMany({});
    await Company.deleteMany({});
    await SeekerProfile.deleteMany({});
    await SavedJob.deleteMany({});
    await Application.deleteMany({});
    await Session.deleteMany({});
    await AuditLog.deleteMany({});

    seekerId = new Types.ObjectId();
    employerId = new Types.ObjectId();
    adminId = new Types.ObjectId();

    const passwordHash = await hashPassword("OldPassword123!");

    await User.create([
      {
        _id: seekerId,
        name: "Seeker Sam",
        email: "sam@seeker.test",
        passwordHash,
        role: "JOB_SEEKER",
        status: "ACTIVE",
      },
      {
        _id: employerId,
        name: "Employer Evan",
        email: "evan@employer.test",
        passwordHash,
        role: "EMPLOYER",
        status: "ACTIVE",
      },
      {
        _id: adminId,
        name: "Admin Arthur",
        email: "arthur@admin.test",
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    ]);
  });

  describe("Password Change", () => {
    it("rejects when current password is wrong", async () => {
      await expect(
        changePassword(seekerId.toString(), {
          currentPassword: "WrongPassword999!",
          newPassword: "NewSecretPassword123!",
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("successfully changes password, hashes with argon2id, revokes sessions, and logs audit", async () => {
      // Seed a session
      await Session.create({
        userId: seekerId,
        familyId: "fam-s",
        jti: "jti-s",
        expiresAt: new Date(Date.now() + 100000),
      });

      const res = await changePassword(seekerId.toString(), {
        currentPassword: "OldPassword123!",
        newPassword: "NewSecretPassword123!",
      });

      expect(res.success).toBe(true);

      const updatedUser = await User.findById(seekerId);
      const isNewValid = await verifyPassword(updatedUser!.passwordHash, "NewSecretPassword123!");
      expect(isNewValid).toBe(true);

      // Sessions should be revoked
      expect(await Session.countDocuments({ userId: seekerId })).toBe(0);

      // Audit log check
      const audit = await AuditLog.findOne({
        action: "PASSWORD_CHANGE",
        targetId: seekerId.toString(),
      });
      expect(audit).toBeDefined();
    });
  });

  describe("Account Deletion Safeguards", () => {
    it("safeguard 1: prevents deleting the last active admin account", async () => {
      await expect(deleteAccount(adminId.toString())).rejects.toThrow(BadRequestError);

      const user = await User.findById(adminId);
      expect(user).toBeDefined();
    });

    it("safeguard 2: prevents an employer with active published jobs from deleting account", async () => {
      await Job.create({
        title: "Active Published Job",
        slug: "active-published-job",
        employerId,
        companyId: new Types.ObjectId(),
        categoryId: new Types.ObjectId(),
        type: "FULL_TIME",
        location: "NYC",
        locationType: "ONSITE",
        experienceLevel: "MID",
        salaryMin: 90000,
        salaryMax: 130000,
        description: "Test job description",
        skills: ["React"],
        status: "PUBLISHED",
      });

      await expect(deleteAccount(employerId.toString())).rejects.toThrow(
        "Cannot delete account while you have active published jobs",
      );

      const user = await User.findById(employerId);
      expect(user).toBeDefined();
    });

    it("allows employer deletion once published jobs are archived or closed", async () => {
      await Job.create({
        title: "Archived Job",
        slug: "archived-job",
        employerId,
        companyId: new Types.ObjectId(),
        categoryId: new Types.ObjectId(),
        type: "FULL_TIME",
        location: "NYC",
        locationType: "ONSITE",
        experienceLevel: "MID",
        salaryMin: 90000,
        salaryMax: 130000,
        description: "Test job description",
        skills: ["React"],
        status: "ARCHIVED",
      });

      await Company.create({
        ownerId: employerId,
        name: "Evan Corp",
        slug: "evan-corp",
        description: "A great company",
        industry: "Technology",
        location: "NYC",
      });

      const res = await deleteAccount(employerId.toString());
      expect(res.success).toBe(true);

      expect(await User.findById(employerId)).toBeNull();
      expect(await Job.countDocuments({ employerId })).toBe(0);
      expect(await Company.countDocuments({ ownerId: employerId })).toBe(0);
    });

    it("allows job seeker to delete account and cleans up profile, saved jobs, and applications", async () => {
      await SeekerProfile.create({
        userId: seekerId,
        headline: "Software Engineer",
        skills: ["Node.js"],
      });

      await SavedJob.create({
        userId: seekerId,
        jobId: new Types.ObjectId(),
      });

      await Application.create({
        jobId: new Types.ObjectId(),
        seekerId,
        employerId: new Types.ObjectId(),
        profileSnapshot: {
          name: "Seeker Sam",
          email: "sam@seeker.test",
          headline: "SE",
          bio: "",
          skills: [],
          experienceYears: 2,
          location: "NYC",
          links: {},
        },
        status: "SUBMITTED",
        statusHistory: [{ status: "SUBMITTED", changedBy: seekerId, changedAt: new Date() }],
      });

      const res = await deleteAccount(seekerId.toString());
      expect(res.success).toBe(true);

      expect(await User.findById(seekerId)).toBeNull();
      expect(await SeekerProfile.countDocuments({ userId: seekerId })).toBe(0);
      expect(await SavedJob.countDocuments({ userId: seekerId })).toBe(0);
      expect(await Application.countDocuments({ seekerId })).toBe(0);
    });
  });

  describe("Device Sessions", () => {
    it("lists active device sessions and revokes other sessions", async () => {
      await Session.create([
        {
          userId: seekerId,
          familyId: "fam-1",
          jti: "jti-1",
          userAgent: "Mozilla Chrome",
          expiresAt: new Date(Date.now() + 100000),
        },
        {
          userId: seekerId,
          familyId: "fam-2",
          jti: "jti-2",
          userAgent: "Safari Mobile",
          expiresAt: new Date(Date.now() + 100000),
        },
      ]);

      const sessions = await listUserSessions(seekerId.toString());
      expect(sessions.length).toBe(2);

      await revokeOtherUserSessions(seekerId.toString(), "jti-1");
      const remaining = await listUserSessions(seekerId.toString());
      expect(remaining.length).toBe(1);
      expect(remaining[0].jti).toBe("jti-1");
    });
  });
});
