import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IBudget extends Document {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  limitMinor: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    limitMinor: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index on (userId, categoryId)
BudgetSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

export const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);
