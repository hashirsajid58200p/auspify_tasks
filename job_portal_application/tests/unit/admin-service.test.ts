import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Job } from "@/server/models/job";
import { Category } from "@/server/models/category";
import { Session } from "@/server/models/session";
import { AuditLog } from "@/server/models/audit-log";
import {
  getPlatformStats,
  updateUserStatusAndRole,
  moderateJob,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "@/server/services/admin";
import { BadRequestError, ConflictError } from "@/server/http";

describe("Admin Service Safeguards, Moderation & Audit Logs", () => {
  let mongoServer: MongoMemoryServer;
  let adminA: Types.ObjectId;
  let adminB: Types.ObjectId;
  let employerA: Types.ObjectId;

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
    await Category.deleteMany({});
    await Session.deleteMany({});
    await AuditLog.deleteMany({});

    adminA = new Types.ObjectId();
    adminB = new Types.ObjectId();
    employerA = new Types.ObjectId();

    await User.create([
      {
        _id: adminA,
        name: "Admin Alice",
        email: "alice@admin.test",
        passwordHash: "hash123",
        role: "ADMIN",
        status: "ACTIVE",
      },
      {
        _id: adminB,
        name: "Admin Bob",
        email: "bob@admin.test",
        passwordHash: "hash456",
        role: "ADMIN",
        status: "ACTIVE",
      },
      {
        _id: employerA,
        name: "Employer Emma",
        email: "emma@corp.test",
        passwordHash: "hash789",
        role: "EMPLOYER",
        status: "ACTIVE",
      },
    ]);
  });

  describe("Admin Safeguards", () => {
    it("safeguard 1: prevents an admin from demoting their own account", async () => {
      await expect(
        updateUserStatusAndRole(adminA.toString(), adminA.toString(), {
          role: "EMPLOYER",
        }),
      ).rejects.toThrow(BadRequestError);

      const user = await User.findById(adminA);
      expect(user?.role).toBe("ADMIN");
    });

    it("safeguard 1: prevents an admin from suspending their own account", async () => {
      await expect(
        updateUserStatusAndRole(adminA.toString(), adminA.toString(), {
          status: "SUSPENDED",
        }),
      ).rejects.toThrow(BadRequestError);

      const user = await User.findById(adminA);
      expect(user?.status).toBe("ACTIVE");
    });

    it("safeguard 2: allows demoting or suspending an admin if another active admin exists", async () => {
      // Alice suspends Bob while Alice is also active
      const updated = await updateUserStatusAndRole(adminA.toString(), adminB.toString(), {
        status: "SUSPENDED",
      });
      expect(updated.status).toBe("SUSPENDED");

      const userB = await User.findById(adminB);
      expect(userB?.status).toBe("SUSPENDED");
    });

    it("safeguard 2: protects the last remaining active admin from demotion or suspension", async () => {
      // Suspend Bob first, leaving Alice as the sole active admin
      await User.findByIdAndUpdate(adminB, { status: "SUSPENDED" });

      // Now Bob tries to demote Alice or someone else tries to suspend Alice
      await expect(
        updateUserStatusAndRole(adminB.toString(), adminA.toString(), {
          status: "SUSPENDED",
        }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        updateUserStatusAndRole(adminB.toString(), adminA.toString(), {
          role: "JOB_SEEKER",
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("safeguard 3: revokes all active sessions on role or status change", async () => {
      // Seed active session for employerA
      await Session.create({
        userId: employerA,
        familyId: "fam-1",
        jti: "jti-1",
        expiresAt: new Date(Date.now() + 100000),
      });

      expect(await Session.countDocuments({ userId: employerA })).toBe(1);

      // Admin suspends employerA
      await updateUserStatusAndRole(adminA.toString(), employerA.toString(), {
        status: "SUSPENDED",
      });

      // Session must be deleted/revoked immediately
      expect(await Session.countDocuments({ userId: employerA })).toBe(0);
    });

    it("writes an audit log entry on user moderation", async () => {
      await updateUserStatusAndRole(adminA.toString(), employerA.toString(), {
        role: "JOB_SEEKER",
      });

      const audit = await AuditLog.findOne({
        action: "USER_MODERATION",
        targetId: employerA.toString(),
      });

      expect(audit).toBeDefined();
      expect(audit?.actorId?.toString()).toBe(adminA.toString());
      expect((audit?.meta as any)?.newRole).toBe("JOB_SEEKER");
    });
  });

  describe("Job Moderation & Category Counters", () => {
    it("unpublishing a published job moves it to DRAFT and decrements category jobCount", async () => {
      const category = await Category.create({
        name: "Software",
        slug: "software",
        jobCount: 1,
      });

      const job = await Job.create({
        title: "Senior Full Stack Dev",
        slug: "senior-dev-123",
        employerId: employerA,
        companyId: new Types.ObjectId(),
        categoryId: category._id,
        type: "FULL_TIME",
        location: "Remote",
        locationType: "REMOTE",
        experienceLevel: "SENIOR",
        salaryMin: 80000,
        salaryMax: 120000,
        description: "Great role",
        skills: ["TypeScript"],
        status: "PUBLISHED",
      });

      await moderateJob(adminA.toString(), job._id.toString(), "unpublish");

      const updatedJob = await Job.findById(job._id);
      expect(updatedJob?.status).toBe("DRAFT");

      const updatedCat = await Category.findById(category._id);
      expect(updatedCat?.jobCount).toBe(0);

      const audit = await AuditLog.findOne({
        action: "JOB_UNPUBLISH",
        targetId: job._id.toString(),
      });
      expect(audit).toBeDefined();
    });

    it("archiving a published job moves it to ARCHIVED and decrements category jobCount", async () => {
      const category = await Category.create({
        name: "DevOps",
        slug: "devops",
        jobCount: 1,
      });

      const job = await Job.create({
        title: "DevOps Engineer",
        slug: "devops-eng-123",
        employerId: employerA,
        companyId: new Types.ObjectId(),
        categoryId: category._id,
        type: "FULL_TIME",
        location: "Remote",
        locationType: "REMOTE",
        experienceLevel: "MID",
        salaryMin: 70000,
        salaryMax: 100000,
        description: "Cloud role",
        skills: ["Kubernetes"],
        status: "PUBLISHED",
      });

      await moderateJob(adminA.toString(), job._id.toString(), "archive");

      const updatedJob = await Job.findById(job._id);
      expect(updatedJob?.status).toBe("ARCHIVED");

      const updatedCat = await Category.findById(category._id);
      expect(updatedCat?.jobCount).toBe(0);

      const audit = await AuditLog.findOne({
        action: "JOB_ARCHIVE",
        targetId: job._id.toString(),
      });
      expect(audit).toBeDefined();
    });
  });

  describe("Category Management", () => {
    it("creates a category and writes an audit log", async () => {
      const cat = await adminCreateCategory(adminA.toString(), {
        name: "Data Science",
        description: "Machine Learning and Analytics",
      });

      expect(cat.name).toBe("Data Science");
      expect(cat.slug).toBe("data-science");

      const audit = await AuditLog.findOne({
        action: "CATEGORY_CREATE",
        targetId: cat._id.toString(),
      });
      expect(audit).toBeDefined();
    });

    it("rejects creating duplicate category slugs", async () => {
      await adminCreateCategory(adminA.toString(), { name: "Design" });
      await expect(adminCreateCategory(adminA.toString(), { name: "Design" })).rejects.toThrow(
        ConflictError,
      );
    });

    it("blocks deleting a category when associated jobs exist", async () => {
      const cat = await Category.create({
        name: "Security",
        slug: "security",
        jobCount: 1,
      });

      await expect(adminDeleteCategory(adminA.toString(), cat._id.toString())).rejects.toThrow(
        BadRequestError,
      );
    });

    it("deletes a category with 0 jobs and writes an audit log", async () => {
      const cat = await Category.create({
        name: "Old Category",
        slug: "old-category",
        jobCount: 0,
      });

      const res = await adminDeleteCategory(adminA.toString(), cat._id.toString());
      expect(res.success).toBe(true);

      const check = await Category.findById(cat._id);
      expect(check).toBeNull();

      const audit = await AuditLog.findOne({
        action: "CATEGORY_DELETE",
        targetId: cat._id.toString(),
      });
      expect(audit).toBeDefined();
    });
  });

  describe("Platform Stats", () => {
    it("returns accurate counts across users, jobs, and audits", async () => {
      const stats = await getPlatformStats();
      expect(stats.users.admins).toBe(2);
      expect(stats.users.employers).toBe(1);
      expect(stats.users.total).toBe(3);
    });
  });
});
