import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { User, IUser, UserRole, UserStatus } from "@/server/models/user";
import { Course, CourseStatus } from "@/server/models/course";
import { Category, ICategory } from "@/server/models/category";
import { Enrollment } from "@/server/models/enrollment";
import { Certificate } from "@/server/models/certificate";
import { AuditLog } from "@/server/models/audit-log";
import { assertNotSelf, assertNotLastAdmin } from "@/server/policies/roles";
import { revokeAllUserSessions } from "@/server/auth/session";
import { recordAuditLog } from "@/server/services/audit";
import { NotFoundError, BadRequestError } from "@/server/http";

export interface GetUsersQuery {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface GetCoursesQuery {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface GetAuditLogsQuery {
  action?: string;
  page?: number;
  limit?: number;
}

export async function getPlatformStats() {
  await connectToDatabase();

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    studentsCount,
    instructorsCount,
    adminsCount,
    totalCourses,
    publishedCourses,
    draftCourses,
    archivedCourses,
    totalEnrollments,
    completedEnrollments,
    totalCertificates,
    totalAuditLogs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "ACTIVE" }),
    User.countDocuments({ status: "SUSPENDED" }),
    User.countDocuments({ role: "STUDENT" }),
    User.countDocuments({ role: "INSTRUCTOR" }),
    User.countDocuments({ role: "ADMIN" }),
    Course.countDocuments(),
    Course.countDocuments({ status: "PUBLISHED" }),
    Course.countDocuments({ status: "DRAFT" }),
    Course.countDocuments({ status: "ARCHIVED" }),
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ status: "COMPLETED" }),
    Certificate.countDocuments(),
    AuditLog.countDocuments(),
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      students: studentsCount,
      instructors: instructorsCount,
      admins: adminsCount,
    },
    courses: {
      total: totalCourses,
      published: publishedCourses,
      draft: draftCourses,
      archived: archivedCourses,
    },
    enrollments: {
      total: totalEnrollments,
      completed: completedEnrollments,
    },
    certificates: {
      total: totalCertificates,
    },
    auditLogs: {
      total: totalAuditLogs,
    },
  };
}

export async function getAdminUsers(query: GetUsersQuery) {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};

  if (query.role && ["STUDENT", "INSTRUCTOR", "ADMIN"].includes(query.role)) {
    filter.role = query.role;
  }

  if (query.status && ["ACTIVE", "SUSPENDED"].includes(query.status)) {
    filter.status = query.status;
  }

  if (query.search && query.search.trim()) {
    const searchRegex = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-passwordHash")
      .lean(),
  ]);

  return {
    data: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      isDemo: u.isDemo,
      createdAt: u.createdAt,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function updateUserRole(
  actorId: string,
  targetUserId: string,
  newRole: UserRole
) {
  if (!Types.ObjectId.isValid(targetUserId)) {
    throw new NotFoundError("User not found");
  }

  assertNotSelf(actorId, targetUserId, "change role of");

  await connectToDatabase();

  const target = await User.findById(targetUserId);
  if (!target) {
    throw new NotFoundError("User not found");
  }

  if (target.role === newRole) {
    return target;
  }

  // Safeguard: Protect the last active admin from demotion
  if (target.role === "ADMIN" && newRole !== "ADMIN") {
    const activeAdmins = await User.countDocuments({
      role: "ADMIN",
      status: "ACTIVE",
    });
    assertNotLastAdmin(activeAdmins);
  }

  const oldRole = target.role;
  target.role = newRole;
  await target.save();

  // Security requirement: Revoke target's sessions on role change
  await revokeAllUserSessions(target._id);

  // Record audit event
  await recordAuditLog({
    actorId,
    action: "USER_ROLE_UPDATED",
    targetType: "USER",
    targetId: targetUserId,
    meta: {
      oldRole,
      newRole,
      targetEmail: target.email,
    },
  });

  return {
    id: target._id.toString(),
    name: target.name,
    email: target.email,
    role: target.role,
    status: target.status,
  };
}

export async function toggleUserStatus(
  actorId: string,
  targetUserId: string,
  newStatus: UserStatus
) {
  if (!Types.ObjectId.isValid(targetUserId)) {
    throw new NotFoundError("User not found");
  }

  assertNotSelf(
    actorId,
    targetUserId,
    newStatus === "SUSPENDED" ? "suspend" : "modify status of"
  );

  await connectToDatabase();

  const target = await User.findById(targetUserId);
  if (!target) {
    throw new NotFoundError("User not found");
  }

  if (target.status === newStatus) {
    return target;
  }

  // Safeguard: Protect the last active admin from suspension
  if (target.role === "ADMIN" && newStatus === "SUSPENDED") {
    const activeAdmins = await User.countDocuments({
      role: "ADMIN",
      status: "ACTIVE",
    });
    assertNotLastAdmin(activeAdmins);
  }

  const oldStatus = target.status;
  target.status = newStatus;
  await target.save();

  // Security requirement: If suspended, revoke all active sessions immediately
  if (newStatus === "SUSPENDED") {
    await revokeAllUserSessions(target._id);
  }

  // Record audit event
  await recordAuditLog({
    actorId,
    action: "USER_STATUS_UPDATED",
    targetType: "USER",
    targetId: targetUserId,
    meta: {
      oldStatus,
      newStatus,
      targetEmail: target.email,
    },
  });

  return {
    id: target._id.toString(),
    name: target.name,
    email: target.email,
    role: target.role,
    status: target.status,
  };
}

export async function getAdminCourses(query: GetCoursesQuery) {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};

  if (query.status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(query.status)) {
    filter.status = query.status;
  }

  if (query.search && query.search.trim()) {
    const searchRegex = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.title = searchRegex;
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const [total, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ instructorId: { _id: Types.ObjectId; name: string; email: string } }>(
        "instructorId",
        "name email"
      )
      .populate<{ categoryId: { _id: Types.ObjectId; name: string } }>(
        "categoryId",
        "name"
      )
      .lean(),
  ]);

  return {
    data: courses.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      slug: c.slug,
      status: c.status,
      level: c.level,
      enrollmentCount: c.enrollmentCount,
      instructor: {
        id: c.instructorId?._id?.toString() || "",
        name: c.instructorId?.name || "Unknown Instructor",
        email: c.instructorId?.email || "",
      },
      category: {
        id: c.categoryId?._id?.toString() || "",
        name: c.categoryId?.name || "Uncategorized",
      },
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function moderateCourseStatus(
  actorId: string,
  courseId: string,
  newStatus: CourseStatus
) {
  if (!Types.ObjectId.isValid(courseId)) {
    throw new NotFoundError("Course not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  const oldStatus = course.status;
  course.status = newStatus;
  await course.save();

  await recordAuditLog({
    actorId,
    action: "COURSE_MODERATED",
    targetType: "COURSE",
    targetId: courseId,
    meta: {
      courseTitle: course.title,
      oldStatus,
      newStatus,
    },
  });

  return {
    id: course._id.toString(),
    title: course.title,
    status: course.status,
  };
}

export async function getAdminAuditLogs(query: GetAuditLogsQuery) {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (query.action && query.action.trim()) {
    filter.action = query.action.trim();
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ actorId: { _id: Types.ObjectId; name: string; email: string; role: string } }>(
        "actorId",
        "name email role"
      )
      .lean(),
  ]);

  return {
    data: logs.map((l) => ({
      id: l._id.toString(),
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      meta: l.meta,
      createdAt: l.createdAt,
      actor: {
        id: l.actorId?._id?.toString() || "",
        name: l.actorId?.name || "System / Admin",
        email: l.actorId?.email || "",
        role: l.actorId?.role || "ADMIN",
      },
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function createAdminCategory(
  actorId: string,
  input: { name: string; slug: string; description?: string }
) {
  await connectToDatabase();

  const existing = await Category.findOne({ slug: input.slug.trim().toLowerCase() });
  if (existing) {
    throw new BadRequestError("A category with this slug already exists");
  }

  const cat = await Category.create({
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    description: input.description?.trim() || null,
  });

  await recordAuditLog({
    actorId,
    action: "CATEGORY_CREATED",
    targetType: "CATEGORY",
    targetId: cat._id.toString(),
    meta: { name: cat.name, slug: cat.slug },
  });

  return {
    id: cat._id.toString(),
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
  };
}

export async function updateAdminCategory(
  actorId: string,
  categoryId: string,
  input: { name?: string; slug?: string; description?: string }
) {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new NotFoundError("Category not found");
  }

  await connectToDatabase();

  const cat = await Category.findById(categoryId);
  if (!cat) {
    throw new NotFoundError("Category not found");
  }

  if (input.slug && input.slug !== cat.slug) {
    const existing = await Category.findOne({
      slug: input.slug.trim().toLowerCase(),
      _id: { $ne: cat._id },
    });
    if (existing) {
      throw new BadRequestError("A category with this slug already exists");
    }
    cat.slug = input.slug.trim().toLowerCase();
  }

  if (input.name) cat.name = input.name.trim();
  if (input.description !== undefined) cat.description = input.description.trim() || undefined;

  await cat.save();

  await recordAuditLog({
    actorId,
    action: "CATEGORY_UPDATED",
    targetType: "CATEGORY",
    targetId: cat._id.toString(),
    meta: { name: cat.name, slug: cat.slug },
  });

  return {
    id: cat._id.toString(),
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
  };
}

export async function deleteAdminCategory(actorId: string, categoryId: string) {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new NotFoundError("Category not found");
  }

  await connectToDatabase();

  const cat = await Category.findById(categoryId);
  if (!cat) {
    throw new NotFoundError("Category not found");
  }

  // Guard: Cannot delete category if courses are assigned to it
  const courseCount = await Course.countDocuments({ categoryId: cat._id });
  if (courseCount > 0) {
    throw new BadRequestError(
      `Cannot delete category: ${courseCount} course(s) are currently categorized under it.`
    );
  }

  await cat.deleteOne();

  await recordAuditLog({
    actorId,
    action: "CATEGORY_DELETED",
    targetType: "CATEGORY",
    targetId: categoryId,
    meta: { name: cat.name, slug: cat.slug },
  });

  return { success: true };
}
