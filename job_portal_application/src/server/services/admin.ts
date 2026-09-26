import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { User, IUser, UserRole, UserStatus } from "@/server/models/user";
import { Job, IJob, JobStatus } from "@/server/models/job";
import { Category, ICategory } from "@/server/models/category";
import { Application } from "@/server/models/application";
import { AuditLog } from "@/server/models/audit-log";
import { Session } from "@/server/models/session";
import { writeAuditLog } from "./audit";
import { BadRequestError, ConflictError, NotFoundError } from "@/server/http";
import { slugify } from "@/lib/slug";

export interface PlatformStats {
  users: {
    total: number;
    seekers: number;
    employers: number;
    admins: number;
    suspended: number;
  };
  jobs: {
    total: number;
    published: number;
    draft: number;
    closed: number;
    archived: number;
  };
  applications: {
    total: number;
  };
  categories: {
    total: number;
  };
  auditLogs: {
    total: number;
  };
}

export async function getPlatformStats(): Promise<PlatformStats> {
  await connectToDatabase();

  const [
    totalUsers,
    seekers,
    employers,
    admins,
    suspendedUsers,
    totalJobs,
    publishedJobs,
    draftJobs,
    closedJobs,
    archivedJobs,
    totalApplications,
    totalCategories,
    totalAuditLogs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "JOB_SEEKER" }),
    User.countDocuments({ role: "EMPLOYER" }),
    User.countDocuments({ role: "ADMIN" }),
    User.countDocuments({ status: "SUSPENDED" }),
    Job.countDocuments(),
    Job.countDocuments({ status: "PUBLISHED" }),
    Job.countDocuments({ status: "DRAFT" }),
    Job.countDocuments({ status: "CLOSED" }),
    Job.countDocuments({ status: "ARCHIVED" }),
    Application.countDocuments(),
    Category.countDocuments(),
    AuditLog.countDocuments(),
  ]);

  return {
    users: {
      total: totalUsers,
      seekers,
      employers,
      admins,
      suspended: suspendedUsers,
    },
    jobs: {
      total: totalJobs,
      published: publishedJobs,
      draft: draftJobs,
      closed: closedJobs,
      archived: archivedJobs,
    },
    applications: {
      total: totalApplications,
    },
    categories: {
      total: totalCategories,
    },
    auditLogs: {
      total: totalAuditLogs,
    },
  };
}

export interface SearchAdminUsersParams {
  q?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function searchAdminUsers(params?: SearchAdminUsersParams) {
  await connectToDatabase();

  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(50, Math.max(1, params?.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (params?.q && params.q.trim()) {
    const escaped = params.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }

  if (params?.role) {
    filter.role = params.role;
  }

  if (params?.status) {
    filter.status = params.status;
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function updateUserStatusAndRole(
  actorId: string,
  targetUserId: string,
  updates: { role?: UserRole; status?: UserStatus },
) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(targetUserId)) {
    throw new NotFoundError("User not found");
  }

  const targetObjectId = new Types.ObjectId(targetUserId);
  const targetUser = await User.findById(targetObjectId);

  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  const isSelf = actorId === targetUserId;

  // Safeguard 1: Self-demote and self-suspend protection
  if (isSelf) {
    if (updates.role && updates.role !== "ADMIN") {
      throw new BadRequestError("Administrators cannot demote their own account");
    }
    if (updates.status === "SUSPENDED") {
      throw new BadRequestError("Administrators cannot suspend their own account");
    }
  }

  // Safeguard 2: Last active admin protection
  const isDemotingOrSuspendingAdmin =
    targetUser.role === "ADMIN" &&
    targetUser.status === "ACTIVE" &&
    ((updates.role && updates.role !== "ADMIN") || updates.status === "SUSPENDED");

  if (isDemotingOrSuspendingAdmin) {
    const activeAdminCount = await User.countDocuments({
      role: "ADMIN",
      status: "ACTIVE",
    });

    if (activeAdminCount <= 1) {
      throw new BadRequestError("Cannot demote or suspend the last remaining active administrator");
    }
  }

  const previousRole = targetUser.role;
  const previousStatus = targetUser.status;

  if (updates.role) {
    targetUser.role = updates.role;
  }

  if (updates.status) {
    targetUser.status = updates.status;
  }

  await targetUser.save();

  // Safeguard 3: Revoke all active sessions on role or status change
  await Session.deleteMany({ userId: targetObjectId });

  // Record audit log entry
  await writeAuditLog({
    actorId,
    action: "USER_MODERATION",
    targetType: "User",
    targetId: targetUserId,
    meta: {
      targetEmail: targetUser.email,
      previousRole,
      newRole: targetUser.role,
      previousStatus,
      newStatus: targetUser.status,
    },
  });

  return {
    _id: targetUser._id,
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
    status: targetUser.status,
    isDemo: targetUser.isDemo,
    createdAt: targetUser.createdAt,
    updatedAt: targetUser.updatedAt,
  };
}

export interface SearchAdminJobsParams {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function searchAdminJobs(params?: SearchAdminJobsParams) {
  await connectToDatabase();

  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(50, Math.max(1, params?.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (params?.q && params.q.trim()) {
    const escaped = params.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { location: { $regex: escaped, $options: "i" } },
    ];
  }

  if (params?.status) {
    filter.status = params.status;
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate("employerId", "name email")
      .populate("companyId", "name slug logoUrl")
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return {
    jobs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function moderateJob(actorId: string, jobId: string, action: "unpublish" | "archive") {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(jobId)) {
    throw new NotFoundError("Job not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError("Job not found");
  }

  const previousStatus = job.status;
  const newStatus: JobStatus = action === "unpublish" ? "DRAFT" : "ARCHIVED";

  if (previousStatus === newStatus) {
    return job;
  }

  job.status = newStatus;
  await job.save();

  // If was PUBLISHED and is now DRAFT or ARCHIVED, decrement Category.jobCount
  if (previousStatus === "PUBLISHED") {
    await Category.findByIdAndUpdate(job.categoryId, {
      $inc: { jobCount: -1 },
    });
  }

  await writeAuditLog({
    actorId,
    action: action === "unpublish" ? "JOB_UNPUBLISH" : "JOB_ARCHIVE",
    targetType: "Job",
    targetId: jobId,
    meta: {
      jobTitle: job.title,
      previousStatus,
      newStatus,
    },
  });

  return job;
}

export async function adminCreateCategory(
  actorId: string,
  data: { name: string; description?: string },
) {
  await connectToDatabase();

  const slug = slugify(data.name);
  if (!slug) {
    throw new BadRequestError("Invalid category name");
  }

  const existing = await Category.findOne({ slug });
  if (existing) {
    throw new ConflictError("Category with this name or slug already exists");
  }

  const category = await Category.create({
    name: data.name.trim(),
    slug,
    description: data.description?.trim() || "",
    jobCount: 0,
  });

  await writeAuditLog({
    actorId,
    action: "CATEGORY_CREATE",
    targetType: "Category",
    targetId: category._id.toString(),
    meta: {
      name: category.name,
      slug: category.slug,
    },
  });

  return category;
}

export async function adminUpdateCategory(
  actorId: string,
  categoryId: string,
  data: { name?: string; description?: string },
) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(categoryId)) {
    throw new NotFoundError("Category not found");
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundError("Category not found");
  }

  if (data.name && data.name.trim() !== category.name) {
    const newSlug = slugify(data.name);
    const existing = await Category.findOne({
      slug: newSlug,
      _id: { $ne: category._id },
    });
    if (existing) {
      throw new ConflictError("Category with this name or slug already exists");
    }
    category.name = data.name.trim();
    category.slug = newSlug;
  }

  if (data.description !== undefined) {
    category.description = data.description.trim();
  }

  await category.save();

  await writeAuditLog({
    actorId,
    action: "CATEGORY_UPDATE",
    targetType: "Category",
    targetId: categoryId,
    meta: {
      name: category.name,
      slug: category.slug,
    },
  });

  return category;
}

export async function adminDeleteCategory(actorId: string, categoryId: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(categoryId)) {
    throw new NotFoundError("Category not found");
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundError("Category not found");
  }

  // Guard: cannot delete category if jobs are associated
  if (category.jobCount > 0) {
    throw new BadRequestError(
      "Cannot delete category with associated jobs. Reassign or delete the jobs first.",
    );
  }

  const jobsWithCategory = await Job.countDocuments({ categoryId: category._id });
  if (jobsWithCategory > 0) {
    throw new BadRequestError(
      "Cannot delete category with associated jobs. Reassign or delete the jobs first.",
    );
  }

  await Category.findByIdAndDelete(category._id);

  await writeAuditLog({
    actorId,
    action: "CATEGORY_DELETE",
    targetType: "Category",
    targetId: categoryId,
    meta: {
      name: category.name,
      slug: category.slug,
    },
  });

  return { success: true };
}
