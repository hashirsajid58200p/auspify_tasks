import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Session } from "@/server/models/session";
import { User } from "@/server/models/user";
import {
  createSession,
  rotateSession,
  revokeSessionByJti,
  revokeAllUserSessions,
} from "@/server/auth/session";
import { UnauthorizedError } from "@/server/http";

describe("Session Management & Replay Attack Defense", () => {
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
  });

  it("should create a new session and mint initial access and refresh tokens", async () => {
    const user = await User.create({
      name: "Job Seeker",
      email: "seeker@example.com",
      passwordHash: "dummyhash",
      role: "JOB_SEEKER",
      status: "ACTIVE",
    });

    const tokens = await createSession(user, { userAgent: "Vitest Agent" });

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.user.email).toBe("seeker@example.com");
    expect(tokens.user.role).toBe("JOB_SEEKER");

    const sessionDoc = await Session.findOne({ userId: user._id });
    expect(sessionDoc).toBeDefined();
    expect(sessionDoc?.revokedAt).toBeNull();
    expect(sessionDoc?.userAgent).toBe("Vitest Agent");
  });

  it("should rotate session and invalidate previous refresh token", async () => {
    const user = await User.create({
      name: "Employer",
      email: "employer@example.com",
      passwordHash: "dummyhash",
      role: "EMPLOYER",
      status: "ACTIVE",
    });

    const initial = await createSession(user);
    const initialSession = await Session.findOne({ userId: user._id });
    const initialJti = initialSession?.jti;

    const rotated = await rotateSession(initial.refreshToken);
    expect(rotated.refreshToken).not.toBe(initial.refreshToken);

    const oldSession = await Session.findOne({ jti: initialJti });
    expect(oldSession?.revokedAt).toBeInstanceOf(Date);
    expect(oldSession?.replacedByJti).toBeDefined();

    const newSession = await Session.findOne({ jti: oldSession?.replacedByJti });
    expect(newSession).toBeDefined();
    expect(newSession?.familyId).toBe(oldSession?.familyId);
    expect(newSession?.revokedAt).toBeNull();
  });

  it("should detect replay attack outside grace window and revoke entire session family", async () => {
    const user = await User.create({
      name: "Attacked User",
      email: "victim@example.com",
      passwordHash: "dummyhash",
      role: "JOB_SEEKER",
      status: "ACTIVE",
    });

    const initial = await createSession(user);
    await rotateSession(initial.refreshToken);

    // Simulate attacker attempting to reuse old refresh token 15 seconds after revocation
    const oldSession = await Session.findOne({ revokedAt: { $ne: null } });
    expect(oldSession).toBeDefined();

    if (oldSession) {
      oldSession.revokedAt = new Date(Date.now() - 15 * 1000);
      await oldSession.save();
    }

    await expect(rotateSession(initial.refreshToken)).rejects.toThrow(UnauthorizedError);

    // Verify all sessions in that family have been revoked
    const unrevokedCount = await Session.countDocuments({
      familyId: oldSession?.familyId,
      revokedAt: null,
    });
    expect(unrevokedCount).toBe(0);
  });

  it("should revoke session family when logging out by JTI", async () => {
    const user = await User.create({
      name: "Logout User",
      email: "logout@example.com",
      passwordHash: "dummyhash",
      role: "JOB_SEEKER",
      status: "ACTIVE",
    });

    const initial = await createSession(user);
    await rotateSession(initial.refreshToken);

    const latestSession = await Session.findOne({ revokedAt: null });
    expect(latestSession).toBeDefined();
    await revokeSessionByJti(latestSession!.jti);

    const activeSessions = await Session.find({
      userId: user._id,
      revokedAt: null,
    });
    expect(activeSessions.length).toBe(0);
  });

  it("should revoke all user sessions across multiple devices", async () => {
    const user = await User.create({
      name: "Multi Device",
      email: "multi@example.com",
      passwordHash: "dummyhash",
      role: "JOB_SEEKER",
      status: "ACTIVE",
    });

    // Create 3 sessions with distinct family IDs (simulating 3 devices)
    await createSession(user);
    await createSession(user);
    await createSession(user);

    expect(await Session.countDocuments({ userId: user._id, revokedAt: null })).toBe(3);

    await revokeAllUserSessions(user._id);

    expect(await Session.countDocuments({ userId: user._id, revokedAt: null })).toBe(0);
  });
});
