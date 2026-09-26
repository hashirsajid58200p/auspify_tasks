import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().email("Please enter a valid email address").max(255),
    password: z.string().min(1, "Password is required").max(128),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .max(128, "Password must not exceed 128 characters"),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
