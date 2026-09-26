import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ISavedJob extends Document {
  _id: mongoose.Types.ObjectId;
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  savedAt: Date;
}

const SavedJobSchema = new Schema<ISavedJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

// Unique index to prevent duplicate bookmarks
SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Compound index for sorted user bookmarks
SavedJobSchema.index({ userId: 1, savedAt: -1 });

export const SavedJob: Model<ISavedJob> =
  mongoose.models.SavedJob || mongoose.model<ISavedJob>("SavedJob", SavedJobSchema);
