import { z } from "zod";
import { isValidThumbnailUrl } from "@/lib/thumbnail";
import { isValidVideoUrl } from "@/lib/video";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

export const courseLevelEnum = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
]);

export const createCourseSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
    summary: z.string().trim().min(10, "Summary must be at least 10 characters").max(300, "Summary cannot exceed 300 characters"),
    description: z.string().trim().max(10000, "Description cannot exceed 10,000 characters").optional().default(""),
    categoryId: objectIdSchema,
    level: courseLevelEnum.default("BEGINNER"),
    thumbnailUrl: z
      .string()
      .trim()
      .url("Invalid thumbnail URL format")
      .refine(isValidThumbnailUrl, "Thumbnail must be hosted on an allowed domain (Unsplash, Cloudinary, Pexels, YouTube)")
      .optional()
      .or(z.literal("")),
  })
  .strict();

export const updateCourseSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(100).optional(),
    summary: z.string().trim().min(10, "Summary must be at least 10 characters").max(300).optional(),
    description: z.string().trim().max(10000).optional(),
    categoryId: objectIdSchema.optional(),
    level: courseLevelEnum.optional(),
    thumbnailUrl: z
      .string()
      .trim()
      .url("Invalid thumbnail URL format")
      .refine(isValidThumbnailUrl, "Thumbnail must be hosted on an allowed domain")
      .optional()
      .or(z.literal("")),
  })
  .strict();

export const courseStatusActionSchema = z
  .object({
    action: z.enum(["PUBLISH", "UNPUBLISH", "ARCHIVE"]),
  })
  .strict();

export const createModuleSchema = z
  .object({
    title: z.string().trim().min(2, "Module title must be at least 2 characters").max(100),
    order: z.number().int().min(0).optional(),
  })
  .strict();

export const updateModuleSchema = z
  .object({
    moduleId: objectIdSchema,
    title: z.string().trim().min(2, "Module title must be at least 2 characters").max(100).optional(),
    order: z.number().int().min(0).optional(),
  })
  .strict();

export const reorderModulesSchema = z
  .object({
    moduleIds: z.array(objectIdSchema).min(1, "At least one module ID required"),
  })
  .strict();

export const createLessonSchema = z
  .object({
    moduleId: objectIdSchema,
    title: z.string().trim().min(2, "Lesson title must be at least 2 characters").max(120),
    type: z.enum(["VIDEO", "TEXT"]).default("TEXT"),
    content: z.string().max(30000, "Content cannot exceed 30,000 characters").optional().default(""),
    videoUrl: z.string().trim().optional().or(z.literal("")),
    durationMin: z.number().int().min(0).max(600).default(0),
    isPreview: z.boolean().default(false),
  })
  .strict()
  .refine(
    (data) => {
      if (data.type === "VIDEO") {
        return !!data.videoUrl && isValidVideoUrl(data.videoUrl);
      }
      return true;
    },
    {
      message: "Valid YouTube or Vimeo URL is required for VIDEO lessons",
      path: ["videoUrl"],
    }
  );

export const updateLessonSchema = z
  .object({
    lessonId: objectIdSchema,
    title: z.string().trim().min(2).max(120).optional(),
    type: z.enum(["VIDEO", "TEXT"]).optional(),
    content: z.string().max(30000).optional(),
    videoUrl: z.string().trim().optional().or(z.literal("")),
    durationMin: z.number().int().min(0).max(600).optional(),
    isPreview: z.boolean().optional(),
    moduleId: objectIdSchema.optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.type === "VIDEO" && data.videoUrl) {
        return isValidVideoUrl(data.videoUrl);
      }
      return true;
    },
    {
      message: "Valid YouTube or Vimeo URL is required when specifying video type",
      path: ["videoUrl"],
    }
  );

export const reorderLessonsSchema = z
  .object({
    moduleId: objectIdSchema,
    lessonIds: z.array(objectIdSchema).min(1, "At least one lesson ID required"),
  })
  .strict();

export const catalogQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    categoryId: objectIdSchema.optional(),
    level: courseLevelEnum.optional(),
    sort: z.enum(["newest", "popular", "title"]).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict();

export type CreateCourseSchema = z.input<typeof createCourseSchema>;
export type UpdateCourseSchema = z.input<typeof updateCourseSchema>;
export type CourseStatusActionSchema = z.input<typeof courseStatusActionSchema>;
export type CreateModuleSchema = z.input<typeof createModuleSchema>;
export type UpdateModuleSchema = z.input<typeof updateModuleSchema>;
export type ReorderModulesSchema = z.input<typeof reorderModulesSchema>;
export type CreateLessonSchema = z.input<typeof createLessonSchema>;
export type UpdateLessonSchema = z.input<typeof updateLessonSchema>;
export type ReorderLessonsSchema = z.input<typeof reorderLessonsSchema>;
export type CatalogQuerySchema = z.infer<typeof catalogQuerySchema>;

