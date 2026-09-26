import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  verifyDummyPassword,
} from "@/server/auth/password";

describe("Password Security (argon2id)", () => {
  it("should hash a password and verify it correctly", async () => {
    const raw = "SuperSecret123!";
    const hash = await hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash.startsWith("$argon2id$")).toBe(true);

    const match = await verifyPassword(hash, raw);
    expect(match).toBe(true);

    const fail = await verifyPassword(hash, "WrongPassword!");
    expect(fail).toBe(false);
  });

  it("should reject passwords shorter than 8 characters", async () => {
    await expect(hashPassword("short")).rejects.toThrow(
      "Password must be between 8 and 128 characters"
    );
  });

  it("should safely evaluate dummy password verification for timing attack mitigation", async () => {
    const result = await verifyDummyPassword("AnyPasswordAttempt");
    expect(result).toBe(false);
  });
});
