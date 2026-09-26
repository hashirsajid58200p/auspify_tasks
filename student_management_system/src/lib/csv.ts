/**
 * Escapes a single CSV cell value to guard against CSV Formula Injection.
 * Cells starting with '=', '+', '-', or '@' are prepended with a single quote.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  // Guard against CSV formula injection (DDE attacks)
  const startsWithDangerousChar = /^[=+\-@]/.test(str);
  const sanitized = startsWithDangerousChar ? `'${str}` : str;

  // Escape quotes and wrap in quotes if containing comma, newline, or quote
  if (sanitized.includes(",") || sanitized.includes('"') || sanitized.includes("\n")) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }

  return sanitized;
}

export function generateCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(","));
  return [headerLine, ...rowLines].join("\r\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
