import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export interface IQuizAttemptAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  quizId: Types.ObjectId;
  courseId: Types.ObjectId;
  attemptNo: number;
  status: AttemptStatus;
  answers: IQuizAttemptAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  startedAt: Date;
  expiresAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptAnswerSchema = new Schema<IQuizAttemptAnswer>(
  {
    questionId: { type: String, required: true },
    selectedOptionIds: { type: [String], default: [] },
  },
  { _id: false }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    attemptNo: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "EXPIRED"],
      default: "IN_PROGRESS",
      required: true,
      index: true,
    },
    answers: {
      type: [QuizAttemptAnswerSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index preventing parallel race conditions on attempts
QuizAttemptSchema.index({ quizId: 1, userId: 1, attemptNo: 1 }, { unique: true });

// Secondary compound index on userId and courseId
QuizAttemptSchema.index({ userId: 1, courseId: 1 });

export const QuizAttempt: Model<IQuizAttempt> =
  mongoose.models.QuizAttempt ||
  mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);
