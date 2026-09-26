import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type SubmissionStatus = "SUBMITTED" | "GRADED";

export interface ISubmission extends Document {
  _id: Types.ObjectId;
  assignmentId: Types.ObjectId;
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  text?: string;
  linkUrl?: string;
  isLate: boolean;
  status: SubmissionStatus;
  grade?: number;
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
  gradedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      maxlength: 10000,
      default: "",
    },
    linkUrl: {
      type: String,
      trim: true,
      default: null,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "GRADED"],
      default: "SUBMITTED",
      required: true,
      index: true,
    },
    grade: {
      type: Number,
      default: null,
      min: 0,
    },
    feedback: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index on assignmentId and userId (one submission per student, resubmission modifies it)
SubmissionSchema.index({ assignmentId: 1, userId: 1 }, { unique: true });

// Compound index on courseId and status (fast grading queue lookup)
SubmissionSchema.index({ courseId: 1, status: 1 });

export const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);
