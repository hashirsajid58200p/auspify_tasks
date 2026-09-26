import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { ISeekerLinks } from "./seeker-profile";

export type ApplicationStatus =
  "SUBMITTED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN";

export interface IProfileSnapshot {
  headline?: string;
  bio?: string;
  skills: string[];
  experienceYears?: number;
  location?: string;
  links?: ISeekerLinks;
}

export interface IStatusHistoryItem {
  status: ApplicationStatus;
  changedAt: Date;
  changedBy: Types.ObjectId;
}

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  jobId: Types.ObjectId;
  employerId: Types.ObjectId;
  seekerId: Types.ObjectId;
  profileSnapshot: IProfileSnapshot;
  coverLetter?: string;
  status: ApplicationStatus;
  statusHistory: IStatusHistoryItem[];
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSnapshotSchema = new Schema<IProfileSnapshot>(
  {
    headline: { type: String, default: "" },
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },
    location: { type: String, default: "" },
    links: {
      type: Map,
      of: String,
      default: () => ({}),
    },
  },
  { _id: false },
);

const StatusHistorySchema = new Schema<IStatusHistoryItem>(
  {
    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "UNDER_REVIEW",
        "SHORTLISTED",
        "INTERVIEW",
        "OFFERED",
        "REJECTED",
        "WITHDRAWN",
      ],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false },
);

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seekerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profileSnapshot: {
      type: ProfileSnapshotSchema,
      required: true,
    },
    coverLetter: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "UNDER_REVIEW",
        "SHORTLISTED",
        "INTERVIEW",
        "OFFERED",
        "REJECTED",
        "WITHDRAWN",
      ],
      default: "SUBMITTED",
      required: true,
      index: true,
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate applications per user per job
ApplicationSchema.index({ jobId: 1, seekerId: 1 }, { unique: true });

// Compound index for employer review workflow
ApplicationSchema.index({ employerId: 1, status: 1 });

export const Application: Model<IApplication> =
  mongoose.models.Application || mongoose.model<IApplication>("Application", ApplicationSchema);
