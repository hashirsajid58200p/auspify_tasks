export const MAX_AMOUNT_MINOR = 100_000_000_00; // $100,000,000.00 in minor units

/**
 * Converts a decimal string or number (e.g., "12.34" or 12.34) into integer minor units (cents).
 * Avoids IEEE-754 floating-point inaccuracies by splitting string or rounding properly.
 */
export function toMinor(amount: string | number): number {
  if (typeof amount === "number") {
    if (!Number.isFinite(amount) || isNaN(amount)) {
      throw new Error("Invalid number provided to toMinor");
    }
    // Fixed to 2 decimal places to eliminate float imprecision before multiplying
    const fixed = amount.toFixed(2);
    return Math.round(parseFloat(fixed) * 100);
  }

  const clean = amount.trim().replace(/,/g, "");
  if (!clean || !/^-?\d+(\.\d{1,2})?$/.test(clean)) {
    throw new Error(`Invalid monetary string format: "${amount}"`);
  }

  const parts = clean.split(".");
  const whole = parseInt(parts[0], 10);
  const fraction = parts[1] ? parts[1].padEnd(2, "0").slice(0, 2) : "00";
  const fracNum = parseInt(fraction, 10);

  const sign = whole < 0 || clean.startsWith("-") ? -1 : 1;
  const result = Math.abs(whole) * 100 + fracNum;
  return sign * result;
}

/**
 * Converts integer minor units back to decimal float (only for display/calculations at edges).
 */
export function toMajor(minor: number): number {
  if (!Number.isInteger(minor)) {
    throw new Error(`toMajor expected integer minor units, received ${minor}`);
  }
  return minor / 100;
}

/**
 * Formats integer minor units into a localized currency string.
 */
export function formatMoney(
  minor: number,
  currency = "USD",
  locale = "en-US"
): string {
  const major = toMajor(minor);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    // Fallback if currency code or locale is unsupported
    return `$${major.toFixed(2)}`;
  }
}
