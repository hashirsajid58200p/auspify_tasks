import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type JobType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
export type JobLocationType = "ONSITE" | "REMOTE" | "HYBRID";
export type JobExperienceLevel = "ENTRY" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
export type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  employerId: Types.ObjectId;
  companyId: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  categoryId: Types.ObjectId;
  type: JobType;
  locationType: JobLocationType;
  location: string;
  experienceLevel: JobExperienceLevel;
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  status: JobStatus;
  applicationCount: number;
  viewCount: number;
  publishedAt?: Date;
  closesAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"],
      required: true,
    },
    locationType: {
      type: String,
      enum: ["ONSITE", "REMOTE", "HYBRID"],
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    experienceLevel: {
      type: String,
      enum: ["ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE"],
      required: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    salaryMin: {
      type: Number,
      required: true,
      min: 0,
    },
    salaryMax: {
      type: Number,
      required: true,
      min: 0,
    },
    salaryCurrency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"],
      default: "DRAFT",
      required: true,
      index: true,
    },
    applicationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    publishedAt: {
      type: Date,
    },
    closesAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for catalog queries
JobSchema.index({ status: 1, categoryId: 1, type: 1, locationType: 1 });

// Full text search index
JobSchema.index(
  { title: "text", description: "text", skills: "text" },
  { weights: { title: 5, skills: 3, description: 1 } },
);

export const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);
