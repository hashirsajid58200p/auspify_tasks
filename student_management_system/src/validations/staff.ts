import { z } from "zod";

export const createStaffSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().trim().email("Valid email is required").max(255),
    password: z.string().min(8, "Temporary password must be at least 8 characters").max(100),
    role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
  })
  .strict();

export const updateStaffSchema = z
  .object({
    role: z.enum(["ADMIN", "STAFF"]).optional(),
    status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  })
  .strict();

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
