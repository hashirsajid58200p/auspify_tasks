import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Job, IJob } from "@/server/models/job";
import { Company, ICompany } from "@/server/models/company";
import { PublicJobsQueryInput } from "@/validations/catalog";
import { NotFoundError } from "@/server/http";

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export interface CatalogJobsResult {
  jobs: IJob[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function searchPublishedJobs(
  params: Partial<PublicJobsQueryInput> = {},
): Promise<CatalogJobsResult> {
  await connectToDatabase();

  // Strict PUBLISHED filter at all times
  const filter: any = {
    status: "PUBLISHED",
  };

  if (params.q) {
    const escaped = escapeRegex(params.q);
    filter.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { skills: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
      { location: { $regex: escaped, $options: "i" } },
    ];
  }

  if (params.categoryId) {
    filter.categoryId = new Types.ObjectId(params.categoryId);
  }

  if (params.type) {
    filter.type = params.type;
  }

  if (params.locationType) {
    filter.locationType = params.locationType;
  }

  if (params.experienceLevel) {
    filter.experienceLevel = params.experienceLevel;
  }

  if (params.salaryMin !== undefined && params.salaryMin > 0) {
    filter.salaryMax = { $gte: params.salaryMin };
  }

  if (params.salaryMax !== undefined && params.salaryMax > 0) {
    filter.salaryMin = { ...(filter.salaryMin || {}), $lte: params.salaryMax };
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 10));
  const skip = (page - 1) * limit;

  let sortOption: Record<string, 1 | -1> = { publishedAt: -1, createdAt: -1 };
  if (params.sort === "salary") {
    sortOption = { salaryMax: -1, createdAt: -1 };
  } else if (params.sort === "views") {
    sortOption = { viewCount: -1, createdAt: -1 };
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("companyId", "name slug logoUrl location industry size website")
      .populate("categoryId", "name slug")
      .lean(),
    Job.countDocuments(filter),
  ]);

  return {
    jobs: jobs as unknown as IJob[],
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getPublishedJobBySlug(slug: string): Promise<IJob> {
  await connectToDatabase();

  const job = await Job.findOneAndUpdate(
    { slug, status: "PUBLISHED" },
    { $inc: { viewCount: 1 } },
    { returnDocument: "after" },
  )
    .populate("companyId", "name slug logoUrl location industry size website description")
    .populate("categoryId", "name slug")
    .lean();

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  return job as unknown as IJob;
}

export interface PublicCompanyResult {
  company: ICompany;
  jobs: IJob[];
}

export async function getPublicCompanyBySlug(slug: string): Promise<PublicCompanyResult> {
  await connectToDatabase();

  const company = await Company.findOne({ slug }).lean();

  if (!company) {
    throw new NotFoundError("Company not found");
  }

  const jobs = await Job.find({
    companyId: company._id,
    status: "PUBLISHED",
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .populate("categoryId", "name slug")
    .lean();

  return {
    company: company as unknown as ICompany,
    jobs: jobs as unknown as IJob[],
  };
}

export async function getFeaturedPublishedJobs(limit = 4): Promise<IJob[]> {
  await connectToDatabase();

  const jobs = await Job.find({ status: "PUBLISHED" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .populate("companyId", "name slug logoUrl location industry")
    .populate("categoryId", "name slug")
    .lean();

  return jobs as unknown as IJob[];
}
