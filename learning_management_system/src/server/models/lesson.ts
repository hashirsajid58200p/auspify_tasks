import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type LessonType = "VIDEO" | "TEXT";

export interface ILesson extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId;
  title: string;
  order: number;
  type: LessonType;
  videoUrl?: string | null;
  content?: string;
  durationMin: number;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    type: {
      type: String,
      enum: ["VIDEO", "TEXT"],
      required: true,
      default: "TEXT",
    },
    videoUrl: {
      type: String,
      trim: true,
      default: null,
    },
    content: {
      type: String,
      default: "",
    },
    durationMin: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on courseId, moduleId, and order
LessonSchema.index({ courseId: 1, moduleId: 1, order: 1 });

export const Lesson: Model<ILesson> =
  mongoose.models.Lesson || mongoose.model<ILesson>("Lesson", LessonSchema);
