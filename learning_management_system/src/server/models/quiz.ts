import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type QuestionType = "SINGLE" | "MULTIPLE" | "TRUE_FALSE";
export type ShowAnswersMode = "AFTER_SUBMIT" | "NEVER";

export interface IQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface IQuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: IQuizOption[];
  points: number;
  explanation?: string;
}

export interface IQuiz extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId?: Types.ObjectId;
  title: string;
  description?: string;
  timeLimitMin?: number;
  passingPct: number;
  maxAttempts: number;
  shuffle: boolean;
  showAnswers: ShowAnswersMode;
  isRequired: boolean;
  questions: IQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizOptionSchema = new Schema<IQuizOption>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["SINGLE", "MULTIPLE", "TRUE_FALSE"],
      required: true,
      default: "SINGLE",
    },
    prompt: { type: String, required: true, trim: true },
    options: [QuizOptionSchema],
    points: { type: Number, required: true, default: 1, min: 1 },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      default: "",
    },
    timeLimitMin: {
      type: Number,
      default: 0,
      min: 0,
    },
    passingPct: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    maxAttempts: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
    },
    shuffle: {
      type: Boolean,
      default: false,
    },
    showAnswers: {
      type: String,
      enum: ["AFTER_SUBMIT", "NEVER"],
      default: "AFTER_SUBMIT",
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    questions: {
      type: [QuizQuestionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// CourseId index
QuizSchema.index({ courseId: 1 });

export const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);
