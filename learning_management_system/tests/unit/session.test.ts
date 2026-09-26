import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Session } from "@/server/models/session";
import {
  createSession,
  rotateSession,
  revokeSessionByJti,
  revokeAllUserSessions,
} from "@/server/auth/session";

describe("Session Management & Refresh Rotation", () => {
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
  });

  it("should create an active session and issue valid tokens", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      passwordHash: "dummyhash",
      role: "STUDENT",
      status: "ACTIVE",
    });

    const tokens = await createSession(user);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.user.id).toBe(user._id.toString());
    expect(tokens.user.role).toBe("STUDENT");

    const activeSessions = await Session.find({ userId: user._id });
    expect(activeSessions.length).toBe(1);
    expect(activeSessions[0].revokedAt).toBeNull();
  });

  it("should rotate refresh token and revoke the previous token", async () => {
    const user = await User.create({
      name: "Test User",
      email: "rotate@example.com",
      passwordHash: "dummyhash",
      role: "STUDENT",
      status: "ACTIVE",
    });

    const initial = await createSession(user);
    const rotated = await rotateSession(initial.refreshToken);

    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(initial.refreshToken);

    const allSessions = await Session.find({ userId: user._id });
    expect(allSessions.length).toBe(2);

    const revokedSession = allSessions.find((s) => s.revokedAt !== null);
    expect(revokedSession).toBeDefined();
    expect(revokedSession?.replacedByJti).toBeDefined();
  });

  it("should detect reuse of a revoked token outside grace window and revoke the entire family", async () => {
    const user = await User.create({
      name: "Test User",
      email: "reuse@example.com",
      passwordHash: "dummyhash",
      role: "STUDENT",
      status: "ACTIVE",
    });

    const initial = await createSession(user);
    await rotateSession(initial.refreshToken);

    // Artificially age the revoked session past the 10s grace window
    await Session.updateOne(
      { replacedByJti: { $ne: null } },
      { revokedAt: new Date(Date.now() - 30 * 1000) }
    );

    // Attempt to reuse old initial refresh token
    await expect(rotateSession(initial.refreshToken)).rejects.toThrow(
      "Token reuse detected. Session terminated."
    );

    // All sessions in that family should now be revoked
    const remainingActive = await Session.find({
      userId: user._id,
      revokedAt: null,
    });
    expect(remainingActive.length).toBe(0);
  });

  it("should allow concurrent refresh within grace window (e.g. multiple tabs)", async () => {
    const user = await User.create({
      name: "Tab User",
      email: "tabs@example.com",
      passwordHash: "dummyhash",
      role: "STUDENT",
      status: "ACTIVE",
    });

    const initial = await createSession(user);
    const firstRotation = await rotateSession(initial.refreshToken);

    // Immediate second rotation using same initial token within 10s grace window
    const secondRotation = await rotateSession(initial.refreshToken);
    expect(secondRotation.accessToken).toBeDefined();
    expect(secondRotation.user.email).toBe(user.email);
  });

  it("should revoke session family by JTI on logout", async () => {
    const user = await User.create({
      name: "Logout User",
      email: "logout@example.com",
      passwordHash: "dummyhash",
      role: "STUDENT",
      status: "ACTIVE",
    });

    const initial = await createSession(user);
    const rotated = await rotateSession(initial.refreshToken);

    // Revoke by latest session JTI
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
      role: "STUDENT",
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
