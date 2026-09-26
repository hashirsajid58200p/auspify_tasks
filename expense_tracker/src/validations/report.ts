import { z } from "zod";

export const reportFilterSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .strict();

export const trendFilterSchema = z
  .object({
    months: z.coerce.number().int().min(1).max(24).default(6),
  })
  .strict();

export type ReportFilterInput = z.input<typeof reportFilterSchema>;
export type TrendFilterInput = z.input<typeof trendFilterSchema>;
