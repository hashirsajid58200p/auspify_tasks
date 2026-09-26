import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Course } from "@/server/models/course";
import { Category } from "@/server/models/category";
import { Session } from "@/server/models/session";
import { AuditLog } from "@/server/models/audit-log";
import {
  updateUserRole,
  toggleUserStatus,
  getPlatformStats,
  moderateCourseStatus,
  deleteAdminCategory,
} from "@/server/services/admin";
import { ForbiddenError, BadRequestError } from "@/server/http";

describe("Admin Service & Safeguards", () => {
  let mongoServer: MongoMemoryServer;
  let adminA: any;
  let adminB: any;
  let regularStudent: any;
  let sampleCategory: any;
  let sampleCourse: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Category.deleteMany({});
    await Session.deleteMany({});
    await AuditLog.deleteMany({});

    adminA = await User.create({
      name: "Admin Alice",
      email: "alice@lms.local",
      passwordHash: "hash-alice",
      role: "ADMIN",
      status: "ACTIVE",
      isDemo: false,
    });

    adminB = await User.create({
      name: "Admin Bob",
      email: "bob@lms.local",
      passwordHash: "hash-bob",
      role: "ADMIN",
      status: "ACTIVE",
      isDemo: false,
    });

    regularStudent = await User.create({
      name: "Student Stan",
      email: "stan@lms.local",
      passwordHash: "hash-stan",
      role: "STUDENT",
      status: "ACTIVE",
      isDemo: false,
    });

    sampleCategory = await Category.create({
      name: "Design",
      slug: "design",
      description: "UI/UX Design",
    });

    sampleCourse = await Course.create({
      title: "UI Design Mastery",
      slug: "ui-design-mastery",
      summary: "Learn UI design from scratch.",
      instructorId: adminA._id,
      categoryId: sampleCategory._id,
      status: "DRAFT",
      level: "BEGINNER",
    });
  });

  it("should prevent an administrator from modifying their own role or suspending self (assertNotSelf)", async () => {
    const adminAId = adminA._id.toString();

    // Self role change attempt
    await expect(
      updateUserRole(adminAId, adminAId, "STUDENT")
    ).rejects.toThrow(ForbiddenError);

    // Self suspension attempt
    await expect(
      toggleUserStatus(adminAId, adminAId, "SUSPENDED")
    ).rejects.toThrow(ForbiddenError);
  });

  it("should prevent demoting or suspending the last active administrator (assertNotLastAdmin)", async () => {
    // Delete Admin B so only Admin A remains
    await User.deleteOne({ _id: adminB._id });

    const adminAId = adminA._id.toString();

    // Fake an external actor attempting to demote Admin A
    const externalActorId = new Types.ObjectId().toString();

    await expect(
      updateUserRole(externalActorId, adminAId, "STUDENT")
    ).rejects.toThrow(/last active administrator/);

    await expect(
      toggleUserStatus(externalActorId, adminAId, "SUSPENDED")
    ).rejects.toThrow(/last active administrator/);
  });

  it("should allow demoting an admin when multiple active admins exist", async () => {
    const adminAId = adminA._id.toString();
    const adminBId = adminB._id.toString();

    const updated = await updateUserRole(adminAId, adminBId, "INSTRUCTOR");
    expect(updated.role).toBe("INSTRUCTOR");

    const reloadedB = await User.findById(adminB._id);
    expect(reloadedB?.role).toBe("INSTRUCTOR");
  });

  it("should revoke all user sessions upon role change and account suspension", async () => {
    const studentId = regularStudent._id.toString();
    const adminAId = adminA._id.toString();

    // Create 2 active sessions for the student
    await Session.create([
      {
        userId: regularStudent._id,
        familyId: "fam-1",
        jti: "jti-1",
        expiresAt: new Date(Date.now() + 100000),
      },
      {
        userId: regularStudent._id,
        familyId: "fam-2",
        jti: "jti-2",
        expiresAt: new Date(Date.now() + 100000),
      },
    ]);

    let activeSessions = await Session.countDocuments({
      userId: regularStudent._id,
      revokedAt: null,
    });
    expect(activeSessions).toBe(2);

    // 1. Role Change -> revokes sessions
    await updateUserRole(adminAId, studentId, "INSTRUCTOR");

    activeSessions = await Session.countDocuments({
      userId: regularStudent._id,
      revokedAt: null,
    });
    expect(activeSessions).toBe(0);

    // Create a new active session
    await Session.create({
      userId: regularStudent._id,
      familyId: "fam-3",
      jti: "jti-3",
      expiresAt: new Date(Date.now() + 100000),
    });

    // 2. Suspension -> revokes sessions
    await toggleUserStatus(adminAId, studentId, "SUSPENDED");

    activeSessions = await Session.countDocuments({
      userId: regularStudent._id,
      revokedAt: null,
    });
    expect(activeSessions).toBe(0);
  });

  it("should write immutable audit log records for administrative mutations", async () => {
    const adminAId = adminA._id.toString();
    const studentId = regularStudent._id.toString();

    await updateUserRole(adminAId, studentId, "INSTRUCTOR");
    await toggleUserStatus(adminAId, studentId, "SUSPENDED");
    await moderateCourseStatus(adminAId, sampleCourse._id.toString(), "PUBLISHED");

    const logs = await AuditLog.find({}).sort({ createdAt: 1 });
    expect(logs.length).toBe(3);

    expect(logs[0].action).toBe("USER_ROLE_UPDATED");
    expect(logs[0].actorId.toString()).toBe(adminAId);
    expect(logs[0].targetId).toBe(studentId);

    expect(logs[1].action).toBe("USER_STATUS_UPDATED");
    expect(logs[1].targetId).toBe(studentId);

    expect(logs[2].action).toBe("COURSE_MODERATED");
    expect(logs[2].targetId).toBe(sampleCourse._id.toString());
  });

  it("should block deleting a category if courses are assigned to it", async () => {
    const adminAId = adminA._id.toString();
    const catId = sampleCategory._id.toString();

    // Should reject because sampleCourse is assigned to sampleCategory
    await expect(
      deleteAdminCategory(adminAId, catId)
    ).rejects.toThrow(/currently categorized under it/);

    // Remove course and try again
    await Course.deleteMany({});
    const res = await deleteAdminCategory(adminAId, catId);
    expect(res.success).toBe(true);

    const checkCat = await Category.findById(sampleCategory._id);
    expect(checkCat).toBeNull();
  });
});
