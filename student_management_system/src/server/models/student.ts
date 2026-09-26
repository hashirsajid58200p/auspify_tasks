import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type StudentStatus = "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";
export type StudentGender = "MALE" | "FEMALE" | "OTHER";

export interface IStudent extends Document {
  _id: Types.ObjectId;
  studentId: string;
  firstName: string;
  lastName: string;
  dob: Date;
  gender: StudentGender;
  classId: Types.ObjectId;
  enrollmentDate: Date;
  status: StudentStatus;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  phone?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    enrollmentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"],
      default: "ACTIVE",
      required: true,
      index: true,
    },
    guardianName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    guardianPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    guardianEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for class and status filtering
StudentSchema.index({ classId: 1, status: 1 });

// Text index for full-text search across firstName, lastName, studentId
StudentSchema.index(
  {
    firstName: "text",
    lastName: "text",
    studentId: "text",
  },
  {
    weights: {
      studentId: 10,
      lastName: 5,
      firstName: 3,
    },
    name: "StudentTextIndex",
  },
);

export const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
