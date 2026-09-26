import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters"),
  })
  .strict();

export const deleteAccountSchema = z
  .object({
    password: z.string().optional(),
  })
  .strict();

export const updateAccountSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  })
  .strict();
