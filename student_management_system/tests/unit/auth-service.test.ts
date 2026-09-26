import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "fs";
import path from "path";
import { User } from "@/server/models/user";
import { hashPassword } from "@/server/auth/password";
import { authenticateUser, changeUserPassword, getAuthRedirectUrl } from "@/server/services/auth";
import { UnauthorizedError, ForbiddenError, BadRequestError } from "@/server/http";

describe("Auth Service & Security Invariants", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret-minimum-32-characters-long-key-for-auth";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-minimum-32-characters-long-key-for-auth";

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
  });

  it("authenticates valid credentials and determines correct redirect URL", async () => {
    const rawPass = "SchoolStaffPass123!";
    const passwordHash = await hashPassword(rawPass);

    const user = await User.create({
      name: "Teacher Jane",
      email: "jane@school.org",
      passwordHash,
      role: "STAFF",
      status: "ACTIVE",
      mustChangePassword: true,
    });

    const result = await authenticateUser({
      email: "jane@school.org",
      password: rawPass,
    });

    expect(result.user.email).toBe("jane@school.org");
    expect(result.user.mustChangePassword).toBe(true);
    expect(result.redirectUrl).toBe("/change-password");
  });

  it("redirects to dashboard when mustChangePassword is false", async () => {
    expect(getAuthRedirectUrl(false)).toBe("/dashboard");
    expect(getAuthRedirectUrl(true)).toBe("/change-password");
  });

  it("rejects invalid password with generic error message", async () => {
    const rawPass = "ValidPass123!";
    const passwordHash = await hashPassword(rawPass);

    await User.create({
      name: "Admin User",
      email: "admin@school.org",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: false,
    });

    await expect(
      authenticateUser({
        email: "admin@school.org",
        password: "WrongPassword!",
      }),
    ).rejects.toThrow("Invalid email or password");
  });

  it("rejects non-existent user with generic error message", async () => {
    await expect(
      authenticateUser({
        email: "ghost@school.org",
        password: "AnyPassword123!",
      }),
    ).rejects.toThrow("Invalid email or password");
  });

  it("rejects suspended accounts immediately", async () => {
    const rawPass = "SuspendedPass123!";
    const passwordHash = await hashPassword(rawPass);

    await User.create({
      name: "Suspended Staff",
      email: "suspended@school.org",
      passwordHash,
      role: "STAFF",
      status: "SUSPENDED",
    });

    await expect(
      authenticateUser({
        email: "suspended@school.org",
        password: rawPass,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("changes user password and clears mustChangePassword flag", async () => {
    const oldPass = "TempPass123!";
    const newPass = "NewPermanentPass123!";
    const passwordHash = await hashPassword(oldPass);

    const user = await User.create({
      name: "Staff Jane",
      email: "staff.jane@school.org",
      passwordHash,
      role: "STAFF",
      status: "ACTIVE",
      mustChangePassword: true,
    });

    const res = await changeUserPassword(user._id.toString(), oldPass, newPass);
    expect(res.success).toBe(true);

    const updated = await User.findById(user._id);
    expect(updated?.mustChangePassword).toBe(false);

    // Reject wrong current password
    await expect(
      changeUserPassword(user._id.toString(), "WrongPass123!", "AnotherPass123!"),
    ).rejects.toThrow(BadRequestError);

    // Reject same password
    await expect(changeUserPassword(user._id.toString(), newPass, newPass)).rejects.toThrow(
      BadRequestError,
    );
  });

  it("verifies that no public registration route exists anywhere in src/app/api", () => {
    const registerPath = path.resolve(process.cwd(), "src/app/api/auth/register");
    expect(fs.existsSync(registerPath)).toBe(false);
  });
});
