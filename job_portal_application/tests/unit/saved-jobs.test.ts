import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { SavedJob } from "@/server/models/saved-job";
import { Job } from "@/server/models/job";
import { Company } from "@/server/models/company";
import { Category } from "@/server/models/category";
import { saveJob, unsaveJob, getSavedJobs, isJobSaved } from "@/server/services/saved-jobs";
import { NotFoundError, BadRequestError } from "@/server/http";

describe("Saved Jobs Service", () => {
  let mongoServer: MongoMemoryServer;
  let publishedJobId: mongoose.Types.ObjectId;
  let draftJobId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await SavedJob.deleteMany({});
    await Job.deleteMany({});
    await Company.deleteMany({});
    await Category.deleteMany({});

    const employerId = new Types.ObjectId();
    const cat = await Category.create({ name: "Engineering", slug: "engineering" });
    const comp = await Company.create({
      ownerId: employerId,
      name: "Acme Corp",
      slug: "acme-corp",
      description: "Acme software development",
      location: "San Francisco, CA",
      industry: "Technology",
      size: "11-50",
    });

    const pubJob = await Job.create({
      employerId,
      companyId: comp._id,
      categoryId: cat._id,
      title: "Backend Engineer",
      slug: "backend-engineer",
      description: "Golang and MongoDB engineer.",
      type: "FULL_TIME",
      locationType: "REMOTE",
      location: "Remote",
      experienceLevel: "MID",
      skills: ["Go", "MongoDB"],
      salaryMin: 110000,
      salaryMax: 140000,
      status: "PUBLISHED",
      publishedAt: new Date(),
    });
    publishedJobId = pubJob._id;

    const draftJob = await Job.create({
      employerId,
      companyId: comp._id,
      categoryId: cat._id,
      title: "Draft Job",
      slug: "draft-job",
      description: "Draft job.",
      type: "FULL_TIME",
      locationType: "REMOTE",
      location: "Remote",
      experienceLevel: "MID",
      skills: ["Go"],
      salaryMin: 90000,
      salaryMax: 100000,
      status: "DRAFT",
    });
    draftJobId = draftJob._id;
  });

  it("should successfully save a published job", async () => {
    const userId = new Types.ObjectId().toString();
    const saved = await saveJob(userId, publishedJobId.toString());

    expect(saved).toBeDefined();
    expect(saved.jobId.toString()).toBe(publishedJobId.toString());

    const isSaved = await isJobSaved(userId, publishedJobId.toString());
    expect(isSaved).toBe(true);
  });

  it("should be idempotent when saving the same job multiple times", async () => {
    const userId = new Types.ObjectId().toString();
    await saveJob(userId, publishedJobId.toString());
    const savedAgain = await saveJob(userId, publishedJobId.toString());

    expect(savedAgain).toBeDefined();
    const count = await SavedJob.countDocuments({
      userId: new Types.ObjectId(userId),
      jobId: publishedJobId,
    });
    expect(count).toBe(1);
  });

  it("should reject saving a non-existent or non-published job", async () => {
    const userId = new Types.ObjectId().toString();
    await expect(saveJob(userId, draftJobId.toString())).rejects.toThrow(NotFoundError);
    await expect(saveJob(userId, new Types.ObjectId().toString())).rejects.toThrow(NotFoundError);
  });

  it("should reject invalid ObjectId format", async () => {
    const userId = new Types.ObjectId().toString();
    await expect(saveJob(userId, "not-an-objectid")).rejects.toThrow(BadRequestError);
  });

  it("should unsave a job correctly", async () => {
    const userId = new Types.ObjectId().toString();
    await saveJob(userId, publishedJobId.toString());

    const removed = await unsaveJob(userId, publishedJobId.toString());
    expect(removed).toBe(true);

    const isSaved = await isJobSaved(userId, publishedJobId.toString());
    expect(isSaved).toBe(false);
  });

  it("should retrieve saved jobs with populated job details", async () => {
    const userId = new Types.ObjectId().toString();
    await saveJob(userId, publishedJobId.toString());

    const list = await getSavedJobs(userId);
    expect(list.length).toBe(1);
    expect(list[0].job.title).toBe("Backend Engineer");
    expect(list[0].job.companyId.name).toBe("Acme Corp");
  });
});
