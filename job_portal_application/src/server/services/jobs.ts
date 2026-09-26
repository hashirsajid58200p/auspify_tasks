import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Job, IJob } from "@/server/models/job";
import { Company } from "@/server/models/company";
import { Category } from "@/server/models/category";
import { Application } from "@/server/models/application";
import { CreateJobSchema, UpdateJobSchema, EmployerJobsQuerySchema } from "@/validations/job";
import { generateJobSlug } from "@/lib/slug";
import { assertJobOwner } from "@/server/policies/job-access";
import { BadRequestError, NotFoundError, ValidationError } from "@/server/http";

export interface PaginatedJobs<T> {
  jobs: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function sanitizeSkills(skills: string[]): string[] {
  const cleaned = skills.map((s) => s.trim()).filter((s) => s.length > 0);
  return Array.from(new Set(cleaned)).slice(0, 15);
}

export async function createJob(employerIdStr: string, data: CreateJobSchema): Promise<IJob> {
  await connectToDatabase();
  const employerId = new Types.ObjectId(employerIdStr);

  const company = await Company.findOne({ ownerId: employerId });
  if (!company) {
    throw new BadRequestError(
      "You must set up your company profile before creating a job listing.",
    );
  }

  const category = await Category.findById(data.categoryId);
  if (!category) {
    throw new BadRequestError("The selected category does not exist.");
  }

  let slug = generateJobSlug(data.title);
  while (await Job.exists({ slug })) {
    slug = generateJobSlug(data.title);
  }

  const skills = sanitizeSkills(data.skills);

  const job = await Job.create({
    employerId,
    companyId: company._id,
    title: data.title.trim(),
    slug,
    description: data.description.trim(),
    categoryId: category._id,
    type: data.type,
    locationType: data.locationType,
    location: data.location.trim(),
    experienceLevel: data.experienceLevel,
    skills,
    salaryMin: data.salaryMin,
    salaryMax: data.salaryMax,
    salaryCurrency: data.salaryCurrency,
    status: "DRAFT",
    applicationCount: 0,
    viewCount: 0,
  });

  return job;
}

export async function getEmployerJobs(
  employerIdStr: string,
  query: EmployerJobsQuerySchema,
): Promise<PaginatedJobs<IJob>> {
  await connectToDatabase();
  const employerId = new Types.ObjectId(employerIdStr);

  const filter: Record<string, unknown> = { employerId };
  if (query.status && query.status !== "ALL") {
    filter.status = query.status;
  }

  const page = Math.max(1, query.page);
  const limit = Math.min(50, Math.max(1, query.limit));
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate("categoryId", "name slug")
      .populate("companyId", "name slug logoUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return {
    jobs: jobs as unknown as IJob[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getEmployerJobById(employerIdStr: string, jobId: string): Promise<IJob> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(jobId)) {
    throw new NotFoundError("Job not found");
  }

  const job = await Job.findById(jobId)
    .populate("categoryId", "name slug")
    .populate("companyId", "name slug logoUrl website location description industry size");

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  assertJobOwner(job.employerId, employerIdStr);
  return job;
}

export async function updateEmployerJob(
  employerIdStr: string,
  jobId: string,
  data: UpdateJobSchema,
): Promise<IJob> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(jobId)) {
    throw new NotFoundError("Job not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError("Job not found");
  }

  assertJobOwner(job.employerId, employerIdStr);

  if (data.categoryId) {
    const category = await Category.findById(data.categoryId);
    if (!category) {
      throw new BadRequestError("The selected category does not exist.");
    }
    // If job was published and category changes, adjust counters
    if (job.status === "PUBLISHED" && job.categoryId.toString() !== data.categoryId) {
      await Category.findByIdAndUpdate(job.categoryId, { $inc: { jobCount: -1 } });
      await Category.findByIdAndUpdate(category._id, { $inc: { jobCount: 1 } });
    }
    job.categoryId = category._id;
  }

  if (data.title !== undefined) job.title = data.title.trim();
  if (data.description !== undefined) job.description = data.description.trim();
  if (data.type !== undefined) job.type = data.type;
  if (data.locationType !== undefined) job.locationType = data.locationType;
  if (data.location !== undefined) job.location = data.location.trim();
  if (data.experienceLevel !== undefined) job.experienceLevel = data.experienceLevel;
  if (data.skills !== undefined) job.skills = sanitizeSkills(data.skills);
  if (data.salaryMin !== undefined) job.salaryMin = data.salaryMin;
  if (data.salaryMax !== undefined) job.salaryMax = data.salaryMax;
  if (data.salaryCurrency !== undefined) job.salaryCurrency = data.salaryCurrency;

  await job.save();
  return job;
}

export async function deleteEmployerJob(
  employerIdStr: string,
  jobId: string,
): Promise<{ success: boolean }> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(jobId)) {
    throw new NotFoundError("Job not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError("Job not found");
  }

  assertJobOwner(job.employerId, employerIdStr);

  // Business Rule: A job with any applications cannot be deleted, only archived
  const hasApplications =
    job.applicationCount > 0 || (await Application.exists({ jobId: job._id }));

  if (hasApplications) {
    throw new BadRequestError(
      "Cannot delete a job that has applications. Please archive it instead.",
    );
  }

  if (job.status === "PUBLISHED") {
    await Category.findByIdAndUpdate(job.categoryId, { $inc: { jobCount: -1 } });
  }

  await Job.findByIdAndDelete(job._id);
  return { success: true };
}

export async function publishEmployerJob(employerIdStr: string, jobId: string): Promise<IJob> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(jobId)) {
    throw new NotFoundError("Job not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError("Job not found");
  }

  assertJobOwner(job.employerId, employerIdStr);

  // Publishing prerequisites validation
  const company = await Company.findById(job.companyId);
  if (!company || !company.name || !company.description || !company.location) {
    throw new ValidationError(
      "Cannot publish job: Your company profile must have name, description, and location filled in.",
    );
  }

  if (
    !job.title ||
    !job.description ||
    !job.categoryId ||
    !job.type ||
    !job.location ||
    !job.skills ||
    job.skills.length === 0
  ) {
    throw new ValidationError(
      "Cannot publish job: Title, description, category, type, location, and at least one skill are required.",
    );
  }

  if (job.status !== "PUBLISHED") {
    job.status = "PUBLISHED";
    job.publishedAt = new Date();
    await job.save();

    await Category.findByIdAndUpdate(job.categoryId, { $inc: { jobCount: 1 } });
  }

  return job;
}

export async function closeEmployerJob(employerIdStr: string, jobId: string): Promise<IJob> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(jobId)) {
    throw new NotFoundError("Job not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError("Job not found");
  }

  assertJobOwner(job.employerId, employerIdStr);

  if (job.status === "PUBLISHED") {
    await Category.findByIdAndUpdate(job.categoryId, { $inc: { jobCount: -1 } });
  }

  job.status = "CLOSED";
  job.closesAt = new Date();
  await job.save();

  return job;
}

export async function reopenEmployerJob(employerIdStr: string, jobId: string): Promise<IJob> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(jobId)) {
    throw new NotFoundError("Job not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError("Job not found");
  }

  assertJobOwner(job.employerId, employerIdStr);

  if (job.status !== "PUBLISHED") {
    job.status = "PUBLISHED";
    await job.save();

    await Category.findByIdAndUpdate(job.categoryId, { $inc: { jobCount: 1 } });
  }

  return job;
}

export async function archiveEmployerJob(employerIdStr: string, jobId: string): Promise<IJob> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(jobId)) {
    throw new NotFoundError("Job not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError("Job not found");
  }

  assertJobOwner(job.employerId, employerIdStr);

  if (job.status === "PUBLISHED") {
    await Category.findByIdAndUpdate(job.categoryId, { $inc: { jobCount: -1 } });
  }

  job.status = "ARCHIVED";
  await job.save();

  return job;
}
