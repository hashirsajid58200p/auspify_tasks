import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ISession extends Document {
  userId: Types.ObjectId;
  familyId: string;
  jti: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByJti?: string;
  userAgent?: string | null;
  ipHash?: string | null;
  createdAt: Date;
  lastUsedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    jti: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedByJti: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipHash: {
      type: String,
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Compound index for user session lookup
SessionSchema.index({ userId: 1, expiresAt: 1 });

// TTL index on expiresAt
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
