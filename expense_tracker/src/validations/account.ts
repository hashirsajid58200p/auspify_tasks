import { z } from "zod";

export const ALLOWED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "PKR",
  "INR",
  "CHF",
  "CNY",
  "AED",
  "SAR",
] as const;

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .optional(),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .refine(
        (val) => (ALLOWED_CURRENCIES as readonly string[]).includes(val),
        {
          message: `Currency must be one of: ${ALLOWED_CURRENCIES.join(", ")}`,
        }
      )
      .optional(),
    locale: z.string().trim().max(20).optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(10, "New password must be at least 10 characters")
      .max(128, "New password must not exceed 128 characters"),
  })
  .strict();

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z
  .object({
    password: z.string().min(1, "Current password is required to delete account"),
    confirmation: z.literal("DELETE", {
      errorMap: () => ({ message: 'You must type "DELETE" to confirm' }),
    }),
  })
  .strict();

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
