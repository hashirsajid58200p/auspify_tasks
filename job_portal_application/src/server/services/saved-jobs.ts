import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { SavedJob, ISavedJob } from "@/server/models/saved-job";
import { Job } from "@/server/models/job";
import { NotFoundError, BadRequestError } from "@/server/http";

export async function saveJob(userId: string, jobId: string): Promise<ISavedJob> {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(jobId)) {
    throw new BadRequestError("Invalid job ID");
  }

  const jobObjectId = new Types.ObjectId(jobId);
  const userObjectId = new Types.ObjectId(userId);

  // Job must exist and be PUBLISHED
  const job = await Job.findOne({ _id: jobObjectId, status: "PUBLISHED" });
  if (!job) {
    throw new NotFoundError("Job not found or not published");
  }

  // Find or create saved job (idempotent)
  const existing = await SavedJob.findOne({ userId: userObjectId, jobId: jobObjectId });
  if (existing) {
    return existing;
  }

  const saved = await SavedJob.create({
    userId: userObjectId,
    jobId: jobObjectId,
    savedAt: new Date(),
  });

  return saved;
}

export async function unsaveJob(userId: string, jobId: string): Promise<boolean> {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(jobId)) {
    throw new BadRequestError("Invalid job ID");
  }

  const res = await SavedJob.deleteOne({
    userId: new Types.ObjectId(userId),
    jobId: new Types.ObjectId(jobId),
  });

  return res.deletedCount > 0;
}

export async function getSavedJobs(userId: string): Promise<any[]> {
  await connectToDatabase();

  const userObjectId = new Types.ObjectId(userId);
  const savedJobs = await SavedJob.find({ userId: userObjectId })
    .sort({ savedAt: -1 })
    .populate({
      path: "jobId",
      populate: [
        { path: "companyId", select: "name slug logoUrl location industry" },
        { path: "categoryId", select: "name slug" },
      ],
    })
    .lean();

  // Filter out any bookmarks whose underlying job was deleted
  return savedJobs
    .filter((sj) => sj.jobId !== null)
    .map((sj: any) => ({
      _id: sj._id.toString(),
      savedAt: sj.savedAt,
      job: sj.jobId,
    }));
}

export async function isJobSaved(userId: string, jobId: string): Promise<boolean> {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(jobId)) return false;

  const count = await SavedJob.countDocuments({
    userId: new Types.ObjectId(userId),
    jobId: new Types.ObjectId(jobId),
  });

  return count > 0;
}
