import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ILessonProgress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  completedAt: Date;
}

const LessonProgressSchema = new Schema<ILessonProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Unique compound index on userId and lessonId (idempotent completions)
LessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

// Compound index on userId and courseId
LessonProgressSchema.index({ userId: 1, courseId: 1 });

export const LessonProgress: Model<ILessonProgress> =
  mongoose.models.LessonProgress ||
  mongoose.model<ILessonProgress>("LessonProgress", LessonProgressSchema);
