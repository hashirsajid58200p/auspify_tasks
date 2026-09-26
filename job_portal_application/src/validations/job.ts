import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createJobSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
    description: z
      .string()
      .trim()
      .min(30, "Job description must be at least 30 characters")
      .max(5000),
    categoryId: z.string().regex(objectIdRegex, "Invalid category ID"),
    type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]),
    locationType: z.enum(["ONSITE", "REMOTE", "HYBRID"]),
    location: z.string().trim().min(2, "Location is required").max(100),
    experienceLevel: z.enum(["ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE"]),
    skills: z
      .array(z.string().trim().min(1).max(40))
      .min(1, "At least one skill is required")
      .max(15, "Cannot specify more than 15 skills"),
    salaryMin: z.number().int().min(0, "Minimum salary cannot be negative"),
    salaryMax: z.number().int().min(0, "Maximum salary cannot be negative"),
    salaryCurrency: z.string().trim().length(3).default("USD"),
  })
  .strict()
  .refine((data) => data.salaryMax >= data.salaryMin, {
    message: "Maximum salary must be greater than or equal to minimum salary",
    path: ["salaryMax"],
  });

export const updateJobSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().min(30).max(5000).optional(),
    categoryId: z.string().regex(objectIdRegex, "Invalid category ID").optional(),
    type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]).optional(),
    locationType: z.enum(["ONSITE", "REMOTE", "HYBRID"]).optional(),
    location: z.string().trim().min(2).max(100).optional(),
    experienceLevel: z.enum(["ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE"]).optional(),
    skills: z.array(z.string().trim().min(1).max(40)).min(1).max(15).optional(),
    salaryMin: z.number().int().min(0).optional(),
    salaryMax: z.number().int().min(0).optional(),
    salaryCurrency: z.string().trim().length(3).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
        return data.salaryMax >= data.salaryMin;
      }
      return true;
    },
    {
      message: "Maximum salary must be greater than or equal to minimum salary",
      path: ["salaryMax"],
    },
  );

export const employerJobsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(["ALL", "DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).default("ALL"),
  })
  .strict();

export type CreateJobSchema = z.infer<typeof createJobSchema>;
export type UpdateJobSchema = z.infer<typeof updateJobSchema>;
export type EmployerJobsQuerySchema = z.infer<typeof employerJobsQuerySchema>;
