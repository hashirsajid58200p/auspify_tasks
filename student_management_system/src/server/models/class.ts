import mongoose, { Document, Model, Schema } from "mongoose";

export interface IClass extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  gradeLevel: string;
  capacity: number;
  homeroomTeacherName: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    gradeLevel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 200,
      default: 30,
    },
    homeroomTeacherName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  },
);

export const Class: Model<IClass> =
  mongoose.models.Class || mongoose.model<IClass>("Class", ClassSchema);
