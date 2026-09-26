import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ICategory extends Document {
  userId: Types.ObjectId;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: ["INCOME", "EXPENSE"],
      required: true,
    },
    color: {
      type: String,
      required: true,
      default: "#64748b",
    },
    icon: {
      type: String,
      required: true,
      default: "tag",
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Unique on (userId, name, type)
CategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);
