import { z } from "zod";

export const auditLogsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    action: z.string().trim().optional(),
    targetType: z.string().trim().optional(),
  })
  .strict();

export const adminUsersQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    role: z.enum(["JOB_SEEKER", "EMPLOYER", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
  })
  .strict();

export const updateUserSchema = z
  .object({
    role: z.enum(["JOB_SEEKER", "EMPLOYER", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  })
  .strict()
  .refine((data) => data.role !== undefined || data.status !== undefined, {
    message: "At least one of role or status must be provided",
  });

export const adminJobsQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
  })
  .strict();

export const moderateJobSchema = z
  .object({
    action: z.enum(["unpublish", "archive"]),
  })
  .strict();

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    description: z.string().trim().max(500).optional(),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one of name or description must be provided",
  });
