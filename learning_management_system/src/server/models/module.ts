import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IModule extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
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
  },
  {
    timestamps: true,
  }
);

// Compound index on courseId and order
ModuleSchema.index({ courseId: 1, order: 1 });

export const Module: Model<IModule> =
  mongoose.models.Module || mongoose.model<IModule>("Module", ModuleSchema);
