import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().email("Please provide a valid email address").max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    role: z.enum(["JOB_SEEKER", "EMPLOYER"]).default("JOB_SEEKER"),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email("Please provide a valid email address").max(255),
    password: z.string().min(1, "Password is required").max(128),
  })
  .strict();

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
