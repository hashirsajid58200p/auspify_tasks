import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRateLimit extends Document {
  key: string;
  count: number;
  resetAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      required: true,
      default: 1,
    },
    resetAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

// TTL index on resetAt
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
