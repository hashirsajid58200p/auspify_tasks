import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  type: "INCOME" | "EXPENSE";
  amountMinor: number;
  categoryId: Types.ObjectId;
  occurredOn: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["INCOME", "EXPENSE"],
      required: true,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    occurredOn: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      maxlength: 200,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes defined in PLAN.md
TransactionSchema.index({ userId: 1, occurredOn: -1 });
TransactionSchema.index({ userId: 1, type: 1, occurredOn: -1 });
TransactionSchema.index({ userId: 1, categoryId: 1 });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
