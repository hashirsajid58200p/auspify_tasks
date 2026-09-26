/**
 * Normalizes any date string or Date object to UTC Midnight.
 * This guarantees transaction dates never shift when queried across different client timezones.
 */
export function toUtcMidnight(input: Date | string | number): Date {
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date provided to toUtcMidnight: ${input}`);
  }

  // If input is an ISO string or YYYY-MM-DD, parse components
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    const parts = input.slice(0, 10).split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
}

export function getUtcEndOfDay(input: Date | string | number): Date {
  const start = toUtcMidnight(input);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function getUtcStartOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}

export function getUtcEndOfMonth(year: number, month: number): Date {
  // Day 0 of next month is the last day of this month
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

export function toInputDateValue(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(
  date: Date | string,
  locale = "en-US"
): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}
