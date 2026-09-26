import { describe, it, expect } from "vitest";
import {
  toUtcMidnight,
  getUtcEndOfDay,
  toInputDateValue,
  formatDateDisplay,
} from "@/lib/dates";

describe("Date Normalization & UTC Preservation", () => {
  it("should normalize ISO date string to UTC midnight", () => {
    const d = toUtcMidnight("2026-09-24T18:45:00.000Z");
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(8); // September (0-indexed)
    expect(d.getUTCDate()).toBe(24);
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
    expect(d.getUTCSeconds()).toBe(0);
    expect(d.getUTCMilliseconds()).toBe(0);
  });

  it("should normalize YYYY-MM-DD calendar input to UTC midnight", () => {
    const d = toUtcMidnight("2026-12-01");
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(11); // December
    expect(d.getUTCDate()).toBe(1);
    expect(d.getUTCHours()).toBe(0);
  });

  it("should return correct UTC end of day", () => {
    const end = getUtcEndOfDay("2026-05-10");
    expect(end.getUTCFullYear()).toBe(2026);
    expect(end.getUTCMonth()).toBe(4);
    expect(end.getUTCDate()).toBe(10);
    expect(end.getUTCHours()).toBe(23);
    expect(end.getUTCMinutes()).toBe(59);
    expect(end.getUTCSeconds()).toBe(59);
    expect(end.getUTCMilliseconds()).toBe(999);
  });

  it("should convert Date to HTML date input string YYYY-MM-DD", () => {
    const d = new Date(Date.UTC(2026, 3, 5)); // April 5, 2026
    expect(toInputDateValue(d)).toBe("2026-04-05");
  });

  it("should format date nicely for UI display", () => {
    const d = new Date(Date.UTC(2026, 8, 24));
    const formatted = formatDateDisplay(d);
    expect(formatted).toContain("Sep 24, 2026");
  });
});
