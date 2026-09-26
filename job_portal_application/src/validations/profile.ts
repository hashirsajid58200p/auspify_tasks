import { z } from "zod";
import { isValidHttpsUrl } from "./company";

export const seekerProfileSchema = z
  .object({
    headline: z
      .string()
      .trim()
      .max(150, "Headline cannot exceed 150 characters")
      .optional()
      .default(""),
    bio: z.string().trim().max(2000, "Bio cannot exceed 2000 characters").optional().default(""),
    skills: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Skill cannot be empty")
          .max(40, "Skill cannot exceed 40 characters"),
      )
      .max(15, "Cannot specify more than 15 skills")
      .optional()
      .default([]),
    experienceYears: z
      .number()
      .int()
      .min(0, "Experience years cannot be negative")
      .max(70, "Experience years cannot exceed 70")
      .optional()
      .default(0),
    location: z
      .string()
      .trim()
      .max(100, "Location cannot exceed 100 characters")
      .optional()
      .default(""),
    links: z
      .object({
        linkedin: z
          .string()
          .trim()
          .max(255)
          .refine(isValidHttpsUrl, "LinkedIn profile must be a valid https:// URL")
          .optional()
          .or(z.literal("")),
        github: z
          .string()
          .trim()
          .max(255)
          .refine(isValidHttpsUrl, "GitHub profile must be a valid https:// URL")
          .optional()
          .or(z.literal("")),
        portfolio: z
          .string()
          .trim()
          .max(255)
          .refine(isValidHttpsUrl, "Portfolio must be a valid https:// URL")
          .optional()
          .or(z.literal("")),
        resumeUrl: z
          .string()
          .trim()
          .max(500)
          .refine(isValidHttpsUrl, "Resume link must be a valid https:// URL")
          .optional()
          .or(z.literal("")),
      })
      .strict()
      .optional()
      .default({}),
  })
  .strict();

export type SeekerProfileInput = z.infer<typeof seekerProfileSchema>;
