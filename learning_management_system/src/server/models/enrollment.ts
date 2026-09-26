import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "DROPPED";

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: EnrollmentStatus;
  progressPct: number;
  lastLessonId?: Types.ObjectId;
  lastAccessedAt: Date;
  enrolledAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
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
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "DROPPED"],
      default: "ACTIVE",
      required: true,
      index: true,
    },
    progressPct: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastLessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index on userId and courseId (ensures idempotent enrollments)
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Secondary index on courseId
EnrollmentSchema.index({ courseId: 1 });

export const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment ||
  mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);
