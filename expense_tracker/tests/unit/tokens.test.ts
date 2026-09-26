import { describe, it, expect, beforeAll } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/server/auth/tokens";

describe("JWT Tokens (jose)", () => {
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET =
      "test-access-secret-minimum-32-characters-long-key-for-auth";
    process.env.JWT_REFRESH_SECRET =
      "test-refresh-secret-minimum-32-characters-long-key-for-auth";
  });

  it("should mint and verify a valid access token", async () => {
    const userId = "64f1a2b3c4d5e6f7a8b9c0d1";
    const email = "user@example.com";

    const token = await signAccessToken(userId, email);
    expect(token).toBeDefined();

    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe(userId);
    expect(payload.email).toBe(email);
    expect(payload.type).toBe("access");
  });

  it("should mint and verify a valid refresh token", async () => {
    const userId = "64f1a2b3c4d5e6f7a8b9c0d1";
    const jti = "custom-jti-123";
    const familyId = "custom-family-456";

    const token = await signRefreshToken(userId, jti, familyId);
    expect(token).toBeDefined();

    const payload = await verifyRefreshToken(token);
    expect(payload.sub).toBe(userId);
    expect(payload.jti).toBe(jti);
    expect(payload.familyId).toBe(familyId);
    expect(payload.type).toBe("refresh");
  });

  it("should reject tampered tokens", async () => {
    const token = await signAccessToken("123", "test@test.com");
    const tampered = token.slice(0, -5) + "abcde";

    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });
});
