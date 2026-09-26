import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ICompany extends Document {
  _id: mongoose.Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  description: string;
  location: string;
  industry: string;
  size: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    logoUrl: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    industry: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    size: {
      type: String,
      required: true,
      trim: true,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      default: "11-50",
    },
  },
  {
    timestamps: true,
  },
);

export const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);
