import { describe, it, expect } from "vitest";
import { toMinor, toMajor, formatMoney } from "@/lib/money";

describe("Financial Precision & Money Helpers", () => {
  it("should convert decimal strings to exact integer minor units without float bugs", () => {
    expect(toMinor("12.34")).toBe(1234);
    expect(toMinor("0.05")).toBe(5);
    expect(toMinor("100")).toBe(10000);
    expect(toMinor("100.00")).toBe(10000);
    expect(toMinor("1,250.75")).toBe(125075);
  });

  it("should convert numbers to minor units", () => {
    expect(toMinor(19.99)).toBe(1999);
    expect(toMinor(0.1)).toBe(10);
  });

  it("should convert integer minor units back to major units", () => {
    expect(toMajor(1234)).toBe(12.34);
    expect(toMajor(5)).toBe(0.05);
    expect(toMajor(10000)).toBe(100);
  });

  it("should format minor units to currency strings", () => {
    const formattedUsd = formatMoney(123456, "USD", "en-US");
    expect(formattedUsd).toContain("1,234.56");
    expect(formattedUsd).toContain("$");
  });

  it("should reject invalid money formats", () => {
    expect(() => toMinor("invalid")).toThrow();
    expect(() => toMinor("12.345")).toThrow(); // More than 2 decimal places
    expect(() => toMinor("")).toThrow();
  });
});
