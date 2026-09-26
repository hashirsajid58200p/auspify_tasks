import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { escapeCsvCell, generateCsv } from "@/lib/csv";
import {
  requireRole,
  assertNotSelf,
  assertNotLastAdmin,
  PolicyForbiddenError,
} from "@/server/policies/roles";

describe("Day 1 Foundation & Architecture", () => {
  it("merges tailwind class names properly", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("loads environment configuration with valid defaults", () => {
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.MONGODB_DB).toBe("studentms");
  });

  it("escapes CSV cells starting with dangerous formula injection characters", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
    expect(escapeCsvCell("+SUM(A1:A10)")).toBe("'+SUM(A1:A10)");
    expect(escapeCsvCell("-2+3")).toBe("'-2+3");
    expect(escapeCsvCell("@dangerous")).toBe("'@dangerous");
    expect(escapeCsvCell("Normal Name")).toBe("Normal Name");
    expect(escapeCsvCell('Hello, "World"')).toBe('"Hello, ""World"""');
  });

  it("generates formatted CSV output properly", () => {
    const headers = ["Student ID", "Name", "Score"];
    const rows = [
      ["STU-001", "John Doe", 95],
      ["STU-002", "=CMD|' /C calc'!A0", 88],
    ];
    const csv = generateCsv(headers, rows);
    expect(csv).toContain("Student ID,Name,Score");
    expect(csv).toContain("STU-001,John Doe,95");
    expect(csv).toContain("STU-002,'=CMD|' /C calc'!A0,88");
  });

  it("enforces role policies properly", () => {
    const staff = {
      userId: "user-staff",
      email: "staff@school.org",
      name: "Staff Member",
      role: "STAFF" as const,
      status: "ACTIVE" as const,
    };

    const admin = {
      userId: "user-admin",
      email: "admin@school.org",
      name: "Admin User",
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
    };

    const suspended = {
      userId: "user-suspended",
      email: "suspended@school.org",
      name: "Suspended Staff",
      role: "STAFF" as const,
      status: "SUSPENDED" as const,
    };

    // Role checks
    expect(() => requireRole(staff, "STAFF")).not.toThrow();
    expect(() => requireRole(staff, "ADMIN")).toThrow(PolicyForbiddenError);
    expect(() => requireRole(admin, "ADMIN")).not.toThrow();
    expect(() => requireRole(undefined, "STAFF")).toThrow(PolicyForbiddenError);

    // Suspended check
    expect(() => requireRole(suspended, "STAFF")).toThrow(PolicyForbiddenError);

    // Safeguards
    expect(() => assertNotSelf("admin-1", "admin-2")).not.toThrow();
    expect(() => assertNotSelf("admin-1", "admin-1")).toThrow(PolicyForbiddenError);
    expect(() => assertNotLastAdmin(2)).not.toThrow();
    expect(() => assertNotLastAdmin(1)).toThrow(PolicyForbiddenError);
  });
});
