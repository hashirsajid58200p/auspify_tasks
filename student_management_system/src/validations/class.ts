import { z } from "zod";

export const createClassSchema = z
  .object({
    name: z.string().trim().min(1, "Class name is required").max(100),
    gradeLevel: z.string().trim().min(1, "Grade level is required").max(50),
    capacity: z
      .number()
      .int()
      .min(1, "Capacity must be at least 1")
      .max(200, "Capacity cannot exceed 200")
      .default(30),
    homeroomTeacherName: z.string().trim().min(1, "Homeroom teacher name is required").max(100),
  })
  .strict();

export const updateClassSchema = z
  .object({
    name: z.string().trim().min(1, "Class name cannot be empty").max(100).optional(),
    gradeLevel: z.string().trim().min(1, "Grade level cannot be empty").max(50).optional(),
    capacity: z
      .number()
      .int()
      .min(1, "Capacity must be at least 1")
      .max(200, "Capacity cannot exceed 200")
      .optional(),
    homeroomTeacherName: z
      .string()
      .trim()
      .min(1, "Homeroom teacher name cannot be empty")
      .max(100)
      .optional(),
  })
  .strict();

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
