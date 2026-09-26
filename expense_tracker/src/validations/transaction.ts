import { z } from "zod";
import { MAX_AMOUNT_MINOR } from "@/lib/money";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid 24-character hexadecimal ObjectId");

export const createTransactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"], {
      required_error: "Type is required (INCOME or EXPENSE)",
    }),
    amountMinor: z
      .number({ required_error: "Amount is required" })
      .int("Amount must be an integer minor units (cents)")
      .positive("Amount must be greater than zero")
      .max(MAX_AMOUNT_MINOR, "Amount exceeds maximum limit"),
    categoryId: objectIdSchema,
    occurredOn: z.string().min(1, "Date is required"),
    note: z.string().max(200, "Note cannot exceed 200 characters").optional().default(""),
  })
  .strict();

export const updateTransactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    amountMinor: z
      .number()
      .int("Amount must be an integer minor units (cents)")
      .positive("Amount must be greater than zero")
      .max(MAX_AMOUNT_MINOR, "Amount exceeds maximum limit")
      .optional(),
    categoryId: objectIdSchema.optional(),
    occurredOn: z.string().optional(),
    note: z.string().max(200, "Note cannot exceed 200 characters").optional(),
  })
  .strict();

export const transactionFilterSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    categoryId: objectIdSchema.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type CreateTransactionInput = z.input<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.input<typeof updateTransactionSchema>;
export type TransactionFilterInput = z.input<typeof transactionFilterSchema>;
