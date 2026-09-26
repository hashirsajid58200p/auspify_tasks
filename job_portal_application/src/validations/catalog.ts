import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const publicJobsQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional().default(""),
    categoryId: z.string().regex(objectIdRegex, "Invalid category ID").optional().or(z.literal("")),
    type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]).optional().or(z.literal("")),
    locationType: z.enum(["ONSITE", "REMOTE", "HYBRID"]).optional().or(z.literal("")),
    experienceLevel: z
      .enum(["ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE"])
      .optional()
      .or(z.literal("")),
    salaryMin: z.coerce.number().int().min(0).optional(),
    salaryMax: z.coerce.number().int().min(0).optional(),
    sort: z.enum(["newest", "salary", "views"]).optional().default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export type PublicJobsQueryInput = z.infer<typeof publicJobsQuerySchema>;
