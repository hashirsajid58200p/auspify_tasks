import crypto from "crypto";

/**
 * Normalizes a title into a clean URL-safe slug.
 * Optionally appends a random alphanumeric suffix to ensure global uniqueness.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // separate accent characters
    .replace(/[\u0300-\u036f]/g, "") // remove accent characters
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric chars
    .replace(/[\s_-]+/g, "-") // collapse whitespace and underscores into single hyphens
    .replace(/^-+|-+$/g, ""); // trim leading and trailing hyphens
}

export function generateCourseSlug(title: string): string {
  const base = slugify(title) || "untitled-course";
  const suffix = crypto.randomBytes(3).toString("hex"); // 6-character hex suffix
  return `${base}-${suffix}`;
}
