import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { User } from "@/server/models/user";
import { Session } from "@/server/models/session";
import { Job } from "@/server/models/job";
import { Company } from "@/server/models/company";
import { SeekerProfile } from "@/server/models/seeker-profile";
import { SavedJob } from "@/server/models/saved-job";
import { Application } from "@/server/models/application";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { writeAuditLog } from "./audit";
import { BadRequestError, NotFoundError } from "@/server/http";

export async function changePassword(
  userIdStr: string,
  data: { currentPassword: string; newPassword: string },
) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userIdStr)) {
    throw new NotFoundError("User not found");
  }

  const user = await User.findById(userIdStr);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isCurrentValid = await verifyPassword(user.passwordHash, data.currentPassword);
  if (!isCurrentValid) {
    throw new BadRequestError("Current password is incorrect");
  }

  const newHash = await hashPassword(data.newPassword);
  user.passwordHash = newHash;
  await user.save();

  // Revoke all sessions so all devices re-authenticate
  await Session.deleteMany({ userId: user._id });

  await writeAuditLog({
    actorId: user._id,
    action: "PASSWORD_CHANGE",
    targetType: "User",
    targetId: user._id.toString(),
    meta: { email: user.email },
  });

  return { success: true };
}

export async function updateAccountName(userIdStr: string, name: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userIdStr)) {
    throw new NotFoundError("User not found");
  }

  const user = await User.findById(userIdStr);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  user.name = name.trim();
  await user.save();

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export async function listUserSessions(userIdStr: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userIdStr)) {
    throw new NotFoundError("User not found");
  }

  const userId = new Types.ObjectId(userIdStr);
  const sessions = await Session.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastUsedAt: -1 })
    .lean();

  return sessions.map((s) => ({
    id: s._id.toString(),
    jti: s.jti,
    userAgent: s.userAgent || "Unknown Device",
    createdAt: s.createdAt,
    lastUsedAt: s.lastUsedAt,
    expiresAt: s.expiresAt,
  }));
}

export async function revokeUserSession(userIdStr: string, jti: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userIdStr)) {
    throw new NotFoundError("User not found");
  }

  const userId = new Types.ObjectId(userIdStr);
  await Session.deleteMany({ userId, jti });

  return { success: true };
}

export async function revokeOtherUserSessions(userIdStr: string, currentJti?: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userIdStr)) {
    throw new NotFoundError("User not found");
  }

  const userId = new Types.ObjectId(userIdStr);
  const filter: Record<string, unknown> = { userId };
  if (currentJti) {
    filter.jti = { $ne: currentJti };
  }

  await Session.deleteMany(filter);

  return { success: true };
}

export async function deleteAccount(userIdStr: string, passwordConfirm?: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userIdStr)) {
    throw new NotFoundError("User not found");
  }

  const userId = new Types.ObjectId(userIdStr);
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // If password confirmation is provided, verify it
  if (passwordConfirm) {
    const isPasswordValid = await verifyPassword(user.passwordHash, passwordConfirm);
    if (!isPasswordValid) {
      throw new BadRequestError("Invalid password confirmation");
    }
  }

  // Safeguard 1: Last active admin protection
  if (user.role === "ADMIN" && user.status === "ACTIVE") {
    const activeAdminCount = await User.countDocuments({
      role: "ADMIN",
      status: "ACTIVE",
    });

    if (activeAdminCount <= 1) {
      throw new BadRequestError(
        "Cannot delete account: you are the last active administrator on the platform",
      );
    }
  }

  // Safeguard 2: Employer with published jobs rule
  if (user.role === "EMPLOYER") {
    const publishedCount = await Job.countDocuments({
      employerId: userId,
      status: "PUBLISHED",
    });

    if (publishedCount > 0) {
      throw new BadRequestError(
        "Cannot delete account while you have active published jobs. Please close or archive all listings first.",
      );
    }

    // Clean up employer data
    await Promise.all([
      Job.deleteMany({ employerId: userId }),
      Company.deleteOne({ ownerId: userId }),
    ]);
  }

  // Clean up seeker data
  if (user.role === "JOB_SEEKER") {
    await Promise.all([
      SeekerProfile.deleteOne({ userId }),
      SavedJob.deleteMany({ userId }),
      Application.deleteMany({ seekerId: userId }),
    ]);
  }

  // Revoke all sessions and delete user
  await Promise.all([
    Session.deleteMany({ userId }),
    User.findByIdAndDelete(userId),
    writeAuditLog({
      actorId: null,
      action: "ACCOUNT_DELETED",
      targetType: "User",
      targetId: userIdStr,
      meta: {
        email: user.email,
        role: user.role,
      },
    }),
  ]);

  return { success: true };
}
