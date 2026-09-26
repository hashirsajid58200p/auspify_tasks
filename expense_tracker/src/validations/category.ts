import { z } from "zod";
import { objectIdSchema } from "./transaction";

export const createCategorySchema = z
  .object({
    name: z.string().min(1, "Name is required").max(50, "Name cannot exceed 50 characters").trim(),
    type: z.enum(["INCOME", "EXPENSE"]),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid 6-character hex code (e.g. #3b82f6)")
      .default("#64748b"),
    icon: z.string().min(1).max(50).default("tag"),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    name: z.string().min(1).max(50).trim().optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
    icon: z.string().min(1).max(50).optional(),
  })
  .strict();

export const deleteCategorySchema = z
  .object({
    reassignToCategoryId: objectIdSchema.optional(),
  })
  .strict();

export type CreateCategoryInput = z.input<typeof createCategorySchema>;
export type UpdateCategoryInput = z.input<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.input<typeof deleteCategorySchema>;
