import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface ICourse extends Document {
  _id: Types.ObjectId;
  instructorId: Types.ObjectId;
  title: string;
  slug: string;
  summary: string;
  description: string;
  thumbnailUrl?: string | null;
  categoryId: Types.ObjectId;
  level: CourseLevel;
  status: CourseStatus;
  lessonCount: number;
  enrollmentCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
    thumbnailUrl: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"],
      default: "BEGINNER",
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      required: true,
      index: true,
    },
    lessonCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on status and categoryId
CourseSchema.index({ status: 1, categoryId: 1 });

// Full text search index on title and summary
CourseSchema.index({ title: "text", summary: "text" });

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);
