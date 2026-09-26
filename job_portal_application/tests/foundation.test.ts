import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { slugify, generateJobSlug, generateCompanySlug } from "@/lib/slug";
import { requireRole, assertNotSelf, assertNotLastAdmin } from "@/server/policies/roles";
import { BadRequestError, NotFoundError, ForbiddenError } from "@/server/http";

describe("Day 1 Foundation & Architecture", () => {
  it("merges tailwind class names properly", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("loads environment configuration with valid defaults", () => {
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.MONGODB_DB).toBe("jobportal");
  });

  it("generates clean URL-safe slugs", () => {
    expect(slugify("Senior Full-Stack Engineer / React & Node.js")).toBe(
      "senior-full-stack-engineer-react-nodejs",
    );
    expect(generateJobSlug("Frontend Architect")).toMatch(/^frontend-architect-[a-f0-9]{6}$/);
    expect(generateCompanySlug("Stripe Inc.")).toMatch(/^stripe-inc-[a-f0-9]{4}$/);
  });

  it("instantiates standard HTTP error types with proper status codes", () => {
    const badReq = new BadRequestError("Invalid parameter");
    expect(badReq.statusCode).toBe(400);
    expect(badReq.code).toBe("BAD_REQUEST");

    const notFound = new NotFoundError();
    expect(notFound.statusCode).toBe(404);
    expect(notFound.code).toBe("NOT_FOUND");
  });

  it("enforces role policies properly", () => {
    const seeker = {
      userId: "user-1",
      email: "seeker@example.com",
      name: "Seeker",
      role: "JOB_SEEKER" as const,
      status: "ACTIVE" as const,
    };

    expect(() => requireRole(seeker, "JOB_SEEKER")).not.toThrow();
    expect(() => requireRole(seeker, "EMPLOYER")).toThrow(ForbiddenError);
    expect(() => requireRole(undefined, "JOB_SEEKER")).toThrow(ForbiddenError);

    // Safeguards
    expect(() => assertNotSelf("admin-1", "admin-2")).not.toThrow();
    expect(() => assertNotSelf("admin-1", "admin-1")).toThrow(ForbiddenError);
    expect(() => assertNotLastAdmin(2)).not.toThrow();
    expect(() => assertNotLastAdmin(1)).toThrow(ForbiddenError);
  });
});
