import crypto from "crypto";

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateJobSlug(title: string): string {
  const base = slugify(title) || "untitled-job";
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
}

export function generateCompanySlug(name: string): string {
  const base = slugify(name) || "company";
  const suffix = crypto.randomBytes(2).toString("hex");
  return `${base}-${suffix}`;
}
