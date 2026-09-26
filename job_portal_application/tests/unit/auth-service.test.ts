import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Session } from "@/server/models/session";
import { SeekerProfile } from "@/server/models/seeker-profile";
import { registerUser, authenticateUser } from "@/server/services/auth";
import { requireUser } from "@/server/auth/session";
import { hashPassword } from "@/server/auth/password";
import { signAccessToken } from "@/server/auth/tokens";
import { ConflictError, ForbiddenError, UnauthorizedError } from "@/server/http";

describe("Auth Service & Role Enforcement", () => {
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
    await Session.deleteMany({});
    await SeekerProfile.deleteMany({});
  });

  describe("Registration Security & Role Assignment", () => {
    it("should register a job seeker and initialize seeker profile", async () => {
      const result = await registerUser({
        name: "Jane Candidate",
        email: "jane@example.com",
        password: "ValidPassword123!",
        role: "JOB_SEEKER",
      });

      expect(result.user.role).toBe("JOB_SEEKER");
      expect(result.redirectUrl).toBe("/dashboard");

      const savedUser = await User.findById(result.user.id);
      expect(savedUser).toBeDefined();
      expect(savedUser?.role).toBe("JOB_SEEKER");
      expect(savedUser?.status).toBe("ACTIVE");

      const profile = await SeekerProfile.findOne({ userId: savedUser?._id });
      expect(profile).toBeDefined();
    });

    it("should register an employer and set redirect to /employer/dashboard", async () => {
      const result = await registerUser({
        name: "Acme Corp Recruiter",
        email: "recruiter@acme.com",
        password: "ValidPassword123!",
        role: "EMPLOYER",
      });

      expect(result.user.role).toBe("EMPLOYER");
      expect(result.redirectUrl).toBe("/employer/dashboard");
    });

    it("should ignore any injected ADMIN role and enforce default JOB_SEEKER", async () => {
      const input = {
        name: "Hacker Attempt",
        email: "hacker@example.com",
        password: "Password123!",
        role: "ADMIN",
      } as unknown as { name: string; email: string; password: string };

      const result = await registerUser(input);

      expect(result.user.role).toBe("JOB_SEEKER");
      expect(result.redirectUrl).toBe("/dashboard");

      const savedUser = await User.findById(result.user.id);
      expect(savedUser?.role).toBe("JOB_SEEKER");
    });

    it("should reject duplicate email registration with ConflictError", async () => {
      await registerUser({
        name: "Original",
        email: "dupe@example.com",
        password: "Password123!",
      });

      await expect(
        registerUser({
          name: "Duplicate",
          email: "dupe@example.com",
          password: "AnotherPassword123!",
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("Authentication & Role Redirection", () => {
    it("should authenticate seeker and redirect to /dashboard", async () => {
      await registerUser({
        name: "Seeker User",
        email: "seeker@example.com",
        password: "Password123!",
        role: "JOB_SEEKER",
      });

      const result = await authenticateUser({
        email: "seeker@example.com",
        password: "Password123!",
      });

      expect(result.user.role).toBe("JOB_SEEKER");
      expect(result.redirectUrl).toBe("/dashboard");
    });

    it("should authenticate employer and redirect to /employer/dashboard", async () => {
      await registerUser({
        name: "Employer User",
        email: "employer@example.com",
        password: "Password123!",
        role: "EMPLOYER",
      });

      const result = await authenticateUser({
        email: "employer@example.com",
        password: "Password123!",
      });

      expect(result.user.role).toBe("EMPLOYER");
      expect(result.redirectUrl).toBe("/employer/dashboard");
    });

    it("should authenticate admin and redirect to /admin", async () => {
      const passwordHash = await hashPassword("AdminPass123!");
      await User.create({
        name: "Platform Admin",
        email: "admin@example.com",
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      });

      const result = await authenticateUser({
        email: "admin@example.com",
        password: "AdminPass123!",
      });

      expect(result.user.role).toBe("ADMIN");
      expect(result.redirectUrl).toBe("/admin");
    });

    it("should reject suspended users on login with ForbiddenError", async () => {
      const passwordHash = await hashPassword("SuspendedPass123!");
      await User.create({
        name: "Suspended Seeker",
        email: "bad@example.com",
        passwordHash,
        role: "JOB_SEEKER",
        status: "SUSPENDED",
      });

      await expect(
        authenticateUser({
          email: "bad@example.com",
          password: "SuspendedPass123!",
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("should reject invalid passwords with generic UnauthorizedError", async () => {
      await registerUser({
        name: "Candidate",
        email: "generic@example.com",
        password: "RealPassword123!",
      });

      await expect(
        authenticateUser({
          email: "generic@example.com",
          password: "WrongPassword123!",
        }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("requireUser Policy Check", () => {
    it("should reject suspended users even with a previously issued valid token", async () => {
      const user = await User.create({
        name: "User To Suspend",
        email: "active-to-suspend@example.com",
        passwordHash: "dummyhash",
        role: "JOB_SEEKER",
        status: "ACTIVE",
      });

      const token = await signAccessToken(user._id.toString(), user.email);

      // Admin suspends user in database
      await User.findByIdAndUpdate(user._id, { status: "SUSPENDED" });

      const fakeReq = new Request("http://localhost/api/test", {
        headers: {
          cookie: `access_token=${token}`,
        },
      });

      await expect(requireUser(fakeReq)).rejects.toThrow(ForbiddenError);
    });

    it("should return live user data from database when active", async () => {
      const user = await User.create({
        name: "Live Candidate",
        email: "live@example.com",
        passwordHash: "dummyhash",
        role: "JOB_SEEKER",
        status: "ACTIVE",
      });

      const token = await signAccessToken(user._id.toString(), user.email);

      const fakeReq = new Request("http://localhost/api/test", {
        headers: {
          cookie: `access_token=${token}`,
        },
      });

      const currentUser = await requireUser(fakeReq);
      expect(currentUser.userId).toBe(user._id.toString());
      expect(currentUser.role).toBe("JOB_SEEKER");
      expect(currentUser.status).toBe("ACTIVE");
    });
  });
});
