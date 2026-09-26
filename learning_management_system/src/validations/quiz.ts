import { z } from "zod";
import { objectIdSchema } from "./course";

export const questionTypeEnum = z.enum(["SINGLE", "MULTIPLE", "TRUE_FALSE"]);
export const showAnswersModeEnum = z.enum(["AFTER_SUBMIT", "NEVER"]);

export const quizOptionSchema = z
  .object({
    id: z.string().min(1, "Option ID required"),
    text: z.string().trim().min(1, "Option text cannot be empty").max(300),
    isCorrect: z.boolean(),
  })
  .strict();

export const quizQuestionSchema = z
  .object({
    id: z.string().min(1, "Question ID required"),
    type: questionTypeEnum,
    prompt: z.string().trim().min(3, "Prompt must be at least 3 characters").max(1000),
    options: z.array(quizOptionSchema).min(2, "At least 2 options required").max(10),
    points: z.number().int().min(1, "Points must be at least 1").max(100).default(1),
    explanation: z.string().trim().max(1000).optional().default(""),
  })
  .strict()
  .refine(
    (data) => {
      const correctCount = data.options.filter((o) => o.isCorrect).length;
      if (data.type === "SINGLE" || data.type === "TRUE_FALSE") {
        return correctCount === 1;
      }
      if (data.type === "MULTIPLE") {
        return correctCount >= 1;
      }
      return false;
    },
    {
      message:
        "Single choice and True/False questions must have exactly one correct option. Multiple choice must have at least one.",
      path: ["options"],
    }
  );

export const createQuizSchema = z
  .object({
    moduleId: objectIdSchema.optional(),
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
    description: z.string().trim().max(1000).optional().default(""),
    timeLimitMin: z.number().int().min(1).max(360).optional().nullable(),
    passingPct: z.number().int().min(1).max(100).default(70),
    maxAttempts: z.number().int().min(0).max(50).default(0), // 0 = unlimited
    shuffle: z.boolean().default(false),
    showAnswers: showAnswersModeEnum.default("AFTER_SUBMIT"),
    isRequired: z.boolean().default(true),
    questions: z
      .array(quizQuestionSchema)
      .min(1, "At least one question required")
      .max(50, "Maximum 50 questions per quiz"),
  })
  .strict();

export const updateQuizSchema = z
  .object({
    moduleId: objectIdSchema.optional().nullable(),
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    timeLimitMin: z.number().int().min(1).max(360).optional().nullable(),
    passingPct: z.number().int().min(1).max(100).optional(),
    maxAttempts: z.number().int().min(0).max(50).optional(),
    shuffle: z.boolean().optional(),
    showAnswers: showAnswersModeEnum.optional(),
    isRequired: z.boolean().optional(),
    questions: z.array(quizQuestionSchema).min(1).max(50).optional(),
  })
  .strict();

export const submitQuizAttemptSchema = z
  .object({
    answers: z.array(
      z.object({
        questionId: z.string().min(1),
        selectedOptionIds: z.array(z.string()),
      }).strict()
    ),
  })
  .strict();

export type CreateQuizSchema = z.input<typeof createQuizSchema>;
export type UpdateQuizSchema = z.input<typeof updateQuizSchema>;
export type SubmitQuizAttemptSchema = z.infer<typeof submitQuizAttemptSchema>;
