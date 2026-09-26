import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const ALLOWED_PHOTO_HOSTS = [
  "images.unsplash.com",
  "plus.unsplash.com",
  "res.cloudinary.com",
  "images.pexels.com",
  "dummyimage.com",
  "placehold.co",
];

const photoUrlValidator = z
  .string()
  .url("Photo URL must be a valid URL")
  .startsWith("https://", "Photo URL must use HTTPS")
  .refine(
    (url) => {
      if (!url) return true;
      try {
        const parsed = new URL(url);
        return ALLOWED_PHOTO_HOSTS.includes(parsed.hostname);
      } catch {
        return false;
      }
    },
    {
      message: `Photo host must be one of: ${ALLOWED_PHOTO_HOSTS.join(", ")}`,
    },
  )
  .optional()
  .or(z.literal(""));

export const createStudentSchema = z
  .object({
    studentId: z
      .string()
      .trim()
      .min(1, "Student ID is required")
      .max(50, "Student ID cannot exceed 50 characters"),
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Valid date of birth is required",
    }),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
      errorMap: () => ({ message: "Gender must be MALE, FEMALE, or OTHER" }),
    }),
    classId: z.string().regex(objectIdRegex, "Invalid class ID format"),
    enrollmentDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Valid enrollment date is required",
      })
      .optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"]).default("ACTIVE"),
    guardianName: z.string().trim().min(1, "Guardian name is required").max(100),
    guardianPhone: z.string().trim().min(1, "Guardian phone is required").max(50),
    guardianEmail: z.string().trim().email("Valid guardian email is required").max(255),
    phone: z.string().trim().max(50).optional().or(z.literal("")),
    email: z.string().trim().email("Invalid student email").max(255).optional().or(z.literal("")),
    address: z.string().trim().max(500).optional().or(z.literal("")),
    photoUrl: photoUrlValidator,
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .strict();

export const updateStudentSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    dob: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    classId: z.string().regex(objectIdRegex, "Invalid class ID format").optional(),
    enrollmentDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"]).optional(),
    guardianName: z.string().trim().min(1).max(100).optional(),
    guardianPhone: z.string().trim().min(1).max(50).optional(),
    guardianEmail: z.string().trim().email().max(255).optional(),
    phone: z.string().trim().max(50).optional().or(z.literal("")),
    email: z.string().trim().email().max(255).optional().or(z.literal("")),
    address: z.string().trim().max(500).optional().or(z.literal("")),
    photoUrl: photoUrlValidator,
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .strict();

export const studentQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    classId: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"]).optional(),
    sort: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQueryInput = z.infer<typeof studentQuerySchema>;
