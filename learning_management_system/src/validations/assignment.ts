import { z } from "zod";
import { objectIdSchema } from "./course";

export const createAssignmentSchema = z
  .object({
    moduleId: objectIdSchema.optional(),
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
    instructions: z
      .string()
      .trim()
      .min(10, "Instructions must be at least 10 characters")
      .max(20000),
    dueAt: z.string().datetime().optional().nullable(),
    maxPoints: z.number().int().min(1).max(1000).default(100),
    allowLate: z.boolean().default(true),
    isRequired: z.boolean().default(true),
  })
  .strict();

export const updateAssignmentSchema = z
  .object({
    moduleId: objectIdSchema.optional().nullable(),
    title: z.string().trim().min(3).max(120).optional(),
    instructions: z.string().trim().min(10).max(20000).optional(),
    dueAt: z.string().datetime().optional().nullable(),
    maxPoints: z.number().int().min(1).max(1000).optional(),
    allowLate: z.boolean().optional(),
    isRequired: z.boolean().optional(),
  })
  .strict();

export const submitAssignmentSchema = z
  .object({
    text: z.string().trim().max(10000).optional().default(""),
    linkUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  })
  .strict()
  .refine(
    (data) => {
      const hasText = !!data.text && data.text.trim().length > 0;
      const hasLink = !!data.linkUrl && data.linkUrl.trim().length > 0;
      return hasText || hasLink;
    },
    {
      message: "Please provide written submission text, a valid URL, or both.",
      path: ["text"],
    }
  );

export const gradeSubmissionSchema = z
  .object({
    grade: z.number().min(0, "Grade cannot be negative"),
    feedback: z.string().trim().max(2000).optional().default(""),
  })
  .strict();

export type CreateAssignmentSchema = z.input<typeof createAssignmentSchema>;
export type UpdateAssignmentSchema = z.input<typeof updateAssignmentSchema>;
export type SubmitAssignmentSchema = z.infer<typeof submitAssignmentSchema>;
export type GradeSubmissionSchema = z.infer<typeof gradeSubmissionSchema>;
