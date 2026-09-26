import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Job, IJob } from "@/server/models/job";
import { Company, ICompany } from "@/server/models/company";
import { Application } from "@/server/models/application";
import { SavedJob } from "@/server/models/saved-job";

export interface SeekerDashboardData {
  metrics: {
    totalApplications: number;
    activeReviews: number; // under_review, shortlisted, interview
    offersCount: number;
    savedJobsCount: number;
  };
  funnel: {
    submitted: number;
    underReview: number;
    shortlisted: number;
    interview: number;
    offered: number;
    rejected: number;
    withdrawn: number;
  };
  recentApplications: any[];
  recentSavedJobs: any[];
}

export interface EmployerDashboardData {
  metrics: {
    activeJobs: number;
    totalApplicants: number;
    totalViews: number;
    draftJobs: number;
    closedJobs: number;
  };
  funnel: {
    submitted: number;
    underReview: number;
    shortlisted: number;
    interview: number;
    offered: number;
    rejected: number;
  };
  jobsNeedingAttention: IJob[];
  recentJobs: IJob[];
  company: ICompany | null;
}

export async function getSeekerDashboardData(seekerIdStr: string): Promise<SeekerDashboardData> {
  await connectToDatabase();
  const seekerId = new Types.ObjectId(seekerIdStr);

  const [applications, savedJobsCount, recentSaved] = await Promise.all([
    Application.find({ seekerId })
      .sort({ appliedAt: -1 })
      .populate({
        path: "jobId",
        populate: [
          { path: "companyId", select: "name slug logoUrl location" },
          { path: "categoryId", select: "name slug" },
        ],
      })
      .lean(),
    SavedJob.countDocuments({ userId: seekerId }),
    SavedJob.find({ userId: seekerId })
      .sort({ savedAt: -1 })
      .limit(3)
      .populate({
        path: "jobId",
        populate: [
          { path: "companyId", select: "name slug logoUrl location" },
          { path: "categoryId", select: "name slug" },
        ],
      })
      .lean(),
  ]);

  const funnel = {
    submitted: 0,
    underReview: 0,
    shortlisted: 0,
    interview: 0,
    offered: 0,
    rejected: 0,
    withdrawn: 0,
  };

  for (const app of applications) {
    switch (app.status) {
      case "SUBMITTED":
        funnel.submitted += 1;
        break;
      case "UNDER_REVIEW":
        funnel.underReview += 1;
        break;
      case "SHORTLISTED":
        funnel.shortlisted += 1;
        break;
      case "INTERVIEW":
        funnel.interview += 1;
        break;
      case "OFFERED":
        funnel.offered += 1;
        break;
      case "REJECTED":
        funnel.rejected += 1;
        break;
      case "WITHDRAWN":
        funnel.withdrawn += 1;
        break;
    }
  }

  const activeReviews = funnel.underReview + funnel.shortlisted + funnel.interview;

  return {
    metrics: {
      totalApplications: applications.length,
      activeReviews,
      offersCount: funnel.offered,
      savedJobsCount,
    },
    funnel,
    recentApplications: applications.slice(0, 5),
    recentSavedJobs: recentSaved.filter((sj) => sj.jobId !== null),
  };
}

export async function getEmployerDashboardData(
  employerIdStr: string,
): Promise<EmployerDashboardData> {
  await connectToDatabase();
  const employerId = new Types.ObjectId(employerIdStr);

  const [
    activeJobs,
    draftJobs,
    closedJobs,
    aggregates,
    recentJobs,
    company,
    applications,
    needingAttention,
  ] = await Promise.all([
    Job.countDocuments({ employerId, status: "PUBLISHED" }),
    Job.countDocuments({ employerId, status: "DRAFT" }),
    Job.countDocuments({ employerId, status: "CLOSED" }),
    Job.aggregate([
      { $match: { employerId } },
      {
        $group: {
          _id: null,
          totalApplicants: { $sum: "$applicationCount" },
          totalViews: { $sum: "$viewCount" },
        },
      },
    ]),
    Job.find({ employerId })
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Company.findOne({ ownerId: employerId }).lean(),
    Application.find({ employerId }).select("status").lean(),
    Job.find({ employerId, status: "PUBLISHED", applicationCount: 0 }).limit(5).lean(),
  ]);

  const stats = aggregates[0] || { totalApplicants: 0, totalViews: 0 };

  const funnel = {
    submitted: 0,
    underReview: 0,
    shortlisted: 0,
    interview: 0,
    offered: 0,
    rejected: 0,
  };

  for (const app of applications) {
    switch (app.status) {
      case "SUBMITTED":
        funnel.submitted += 1;
        break;
      case "UNDER_REVIEW":
        funnel.underReview += 1;
        break;
      case "SHORTLISTED":
        funnel.shortlisted += 1;
        break;
      case "INTERVIEW":
        funnel.interview += 1;
        break;
      case "OFFERED":
        funnel.offered += 1;
        break;
      case "REJECTED":
        funnel.rejected += 1;
        break;
    }
  }

  return {
    metrics: {
      activeJobs,
      totalApplicants: stats.totalApplicants || 0,
      totalViews: stats.totalViews || 0,
      draftJobs,
      closedJobs,
    },
    funnel,
    jobsNeedingAttention: needingAttention as unknown as IJob[],
    recentJobs: recentJobs as unknown as IJob[],
    company: company as unknown as ICompany | null,
  };
}
