import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const applyJobSchema = z
  .object({
    jobId: z.string().regex(objectIdRegex, "Invalid job ID"),
    coverLetter: z
      .string()
      .trim()
      .max(2000, "Cover letter cannot exceed 2000 characters")
      .optional()
      .default(""),
  })
  .strict();

export const updateApplicationStatusSchema = z
  .object({
    status: z.enum(["UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED"]),
  })
  .strict();

export type ApplyJobInput = z.infer<typeof applyJobSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
