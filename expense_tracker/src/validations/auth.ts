import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Please provide a valid email address").max(255),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .max(128, "Password must be at most 128 characters"),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email("Please provide a valid email address").max(255),
    password: z.string().min(1, "Password is required").max(128),
  })
  .strict();

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
