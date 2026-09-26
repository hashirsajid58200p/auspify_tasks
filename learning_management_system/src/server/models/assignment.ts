import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IAssignment extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId?: Types.ObjectId;
  title: string;
  instructions: string;
  dueAt?: Date;
  maxPoints: number;
  allowLate: boolean;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    instructions: {
      type: String,
      required: true,
      default: "",
    },
    dueAt: {
      type: Date,
      default: null,
    },
    maxPoints: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
    },
    allowLate: {
      type: Boolean,
      default: true,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// CourseId index
AssignmentSchema.index({ courseId: 1 });

export const Assignment: Model<IAssignment> =
  mongoose.models.Assignment ||
  mongoose.model<IAssignment>("Assignment", AssignmentSchema);
