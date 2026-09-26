import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const saveJobSchema = z
  .object({
    jobId: z.string().regex(objectIdRegex, "Invalid job ID"),
  })
  .strict();

export type SaveJobInput = z.infer<typeof saveJobSchema>;
