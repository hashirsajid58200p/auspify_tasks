import { z } from "zod";

export const ALLOWED_LOGO_HOSTS = [
  "images.unsplash.com",
  "plus.unsplash.com",
  "res.cloudinary.com",
  "images.pexels.com",
  "dummyimage.com",
  "placehold.co",
];

export function isValidLogoUrl(urlStr: string): boolean {
  if (!urlStr) return true;
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_LOGO_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

export function isValidHttpsUrl(urlStr: string): boolean {
  if (!urlStr) return true;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const companySchema = z
  .object({
    name: z.string().trim().min(2, "Company name must be at least 2 characters").max(100),
    website: z
      .string()
      .trim()
      .max(255)
      .refine(isValidHttpsUrl, "Website must be a valid https:// URL")
      .optional()
      .or(z.literal("")),
    logoUrl: z
      .string()
      .trim()
      .max(500)
      .refine(
        isValidLogoUrl,
        `Logo must be https:// and hosted on: ${ALLOWED_LOGO_HOSTS.join(", ")}`,
      )
      .optional()
      .or(z.literal("")),
    description: z.string().trim().min(20, "Description must be at least 20 characters").max(2000),
    location: z.string().trim().min(2, "Location is required").max(100),
    industry: z.string().trim().min(2, "Industry is required").max(100),
    size: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]),
  })
  .strict();

export type CompanySchema = z.infer<typeof companySchema>;
