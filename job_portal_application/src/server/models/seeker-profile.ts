import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ISeekerLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  resumeUrl?: string;
}

export interface ISeekerProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: Types.ObjectId;
  headline?: string;
  bio?: string;
  skills: string[];
  experienceYears?: number;
  location?: string;
  links: ISeekerLinks;
  createdAt: Date;
  updatedAt: Date;
}

const SeekerLinksSchema = new Schema<ISeekerLinks>(
  {
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
  },
  { _id: false },
);

const SeekerProfileSchema = new Schema<ISeekerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
      max: 70,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    links: {
      type: SeekerLinksSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

export const SeekerProfile: Model<ISeekerProfile> =
  mongoose.models.SeekerProfile ||
  mongoose.model<ISeekerProfile>("SeekerProfile", SeekerProfileSchema);
