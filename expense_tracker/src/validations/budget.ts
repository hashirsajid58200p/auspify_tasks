import { z } from "zod";
import { MAX_AMOUNT_MINOR } from "@/lib/money";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const upsertBudgetSchema = z
  .object({
    categoryId: z
      .string()
      .regex(objectIdRegex, "Invalid category ID format"),
    limitMinor: z
      .number()
      .int("Limit must be an integer (minor units)")
      .positive("Budget limit must be greater than zero")
      .max(MAX_AMOUNT_MINOR, "Budget limit exceeds maximum allowable amount"),
  })
  .strict();

export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;

export const budgetQuerySchema = z
  .object({
    month: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format")
      .optional(),
  })
  .strict();

export type BudgetQueryInput = z.infer<typeof budgetQuerySchema>;
