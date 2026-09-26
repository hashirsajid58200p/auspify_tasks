import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import {
  Application,
  IApplication,
  ApplicationStatus,
  IProfileSnapshot,
} from "@/server/models/application";
import { Job } from "@/server/models/job";
import { SeekerProfile } from "@/server/models/seeker-profile";
import { CurrentUser } from "@/server/auth/session";
import { ApplyJobInput } from "@/validations/application";
import { NotFoundError, ConflictError, BadRequestError } from "@/server/http";
import { assertApplicationAccess } from "@/server/policies/application-access";

const VALID_EMPLOYER_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFERED", "REJECTED"],
  OFFERED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

const WITHDRAWABLE_STATUSES: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
];

export async function applyToJob(
  seekerId: string,
  input: { jobId: string; coverLetter?: string },
): Promise<IApplication> {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(input.jobId)) {
    throw new BadRequestError("Invalid job ID");
  }

  const jobObjectId = new Types.ObjectId(input.jobId);
  const seekerObjectId = new Types.ObjectId(seekerId);

  // Job must exist and be PUBLISHED
  const job = await Job.findOne({ _id: jobObjectId, status: "PUBLISHED" });
  if (!job) {
    throw new NotFoundError("Job not found or not currently accepting applications");
  }

  // Pre-check for duplicate application
  const existingApp = await Application.findOne({
    jobId: jobObjectId,
    seekerId: seekerObjectId,
  });
  if (existingApp) {
    throw new ConflictError("You have already applied for this position");
  }

  // Capture live candidate profile snapshot
  const profile = await SeekerProfile.findOne({ userId: seekerObjectId });

  const profileSnapshot: IProfileSnapshot = {
    headline: profile?.headline || "",
    bio: profile?.bio || "",
    skills: profile?.skills || [],
    experienceYears: profile?.experienceYears || 0,
    location: profile?.location || "",
    links: profile?.links
      ? {
          linkedin: profile.links.linkedin || "",
          github: profile.links.github || "",
          portfolio: profile.links.portfolio || "",
          resumeUrl: profile.links.resumeUrl || "",
        }
      : {},
  };

  const now = new Date();

  try {
    const application = await Application.create({
      jobId: job._id,
      employerId: job.employerId,
      seekerId: seekerObjectId,
      profileSnapshot,
      coverLetter: input.coverLetter?.trim() || "",
      status: "SUBMITTED",
      statusHistory: [
        {
          status: "SUBMITTED",
          changedAt: now,
          changedBy: seekerObjectId,
        },
      ],
      appliedAt: now,
    });

    // Atomically increment job application count
    await Job.updateOne({ _id: job._id }, { $inc: { applicationCount: 1 } });

    return application;
  } catch (err: any) {
    // Unique index compound violation check
    if (err.code === 11000) {
      throw new ConflictError("You have already applied for this position");
    }
    throw err;
  }
}

export async function transitionApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  actor: CurrentUser,
): Promise<IApplication> {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(applicationId)) {
    throw new BadRequestError("Invalid application ID");
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    throw new NotFoundError("Application not found");
  }

  // Verify access (returns 404 for foreign users)
  assertApplicationAccess(application, actor);

  const actorObjectId = new Types.ObjectId(actor.userId);

  // Candidate Actions
  if (actor.role === "JOB_SEEKER") {
    if (newStatus !== "WITHDRAWN") {
      throw new BadRequestError("Candidates can only withdraw applications");
    }

    if (!WITHDRAWABLE_STATUSES.includes(application.status)) {
      throw new BadRequestError(
        `Application cannot be withdrawn once ${application.status.toLowerCase()}`,
      );
    }
  }

  // Employer Actions
  if (actor.role === "EMPLOYER") {
    if (newStatus === "WITHDRAWN") {
      throw new BadRequestError("Only the applicant can withdraw an application");
    }

    const allowed = VALID_EMPLOYER_TRANSITIONS[application.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from ${application.status} to ${newStatus}`,
      );
    }
  }

  // Admin Actions can move or reject with audit log
  if (actor.role === "ADMIN") {
    if (application.status === newStatus) {
      throw new BadRequestError(`Application is already in status ${newStatus}`);
    }
  }

  // Apply state change
  application.status = newStatus;
  application.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: actorObjectId,
  });

  await application.save();
  return application;
}

export async function withdrawApplication(
  applicationId: string,
  actor: CurrentUser,
): Promise<IApplication> {
  return transitionApplicationStatus(applicationId, "WITHDRAWN", actor);
}

export async function getSeekerApplications(seekerId: string): Promise<any[]> {
  await connectToDatabase();

  const applications = await Application.find({
    seekerId: new Types.ObjectId(seekerId),
  })
    .sort({ appliedAt: -1 })
    .populate({
      path: "jobId",
      populate: [
        { path: "companyId", select: "name slug logoUrl location" },
        { path: "categoryId", select: "name slug" },
      ],
    })
    .lean();

  return applications;
}

export async function getApplicationById(applicationId: string, actor: CurrentUser): Promise<any> {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(applicationId)) {
    throw new BadRequestError("Invalid application ID");
  }

  const application = await Application.findById(applicationId);

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  // Enforce access control before populating
  assertApplicationAccess(application, actor);

  await application.populate([
    {
      path: "jobId",
      populate: [
        { path: "companyId", select: "name slug logoUrl location industry size website" },
        { path: "categoryId", select: "name slug" },
      ],
    },
    { path: "seekerId", select: "name email" },
  ]);

  return application;
}

export async function getJobApplicants(
  jobId: string,
  employerId: string,
): Promise<{ job: any; applications: any[] }> {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(jobId)) {
    throw new BadRequestError("Invalid job ID");
  }

  const jobObjectId = new Types.ObjectId(jobId);
  const employerObjectId = new Types.ObjectId(employerId);

  // Job must belong to this employer; return 404 if not found (anti-enumeration)
  const job = await Job.findOne({
    _id: jobObjectId,
    employerId: employerObjectId,
  }).lean();

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  const applications = await Application.find({ jobId: jobObjectId })
    .sort({ appliedAt: -1 })
    .populate("seekerId", "name email")
    .lean();

  return {
    job,
    applications,
  };
}
