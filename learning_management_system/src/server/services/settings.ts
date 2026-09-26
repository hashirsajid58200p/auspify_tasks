import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { User } from "@/server/models/user";
import { Session } from "@/server/models/session";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { NotFoundError, BadRequestError, UnauthorizedError } from "@/server/http";

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new NotFoundError("User not found");
  }

  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (input.name && input.name.trim()) {
    user.name = input.name.trim();
  }

  if (input.bio !== undefined) {
    user.bio = input.bio.trim();
  }

  await user.save();

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio || "",
  };
}

export async function changeUserPassword(
  userId: string,
  input: ChangePasswordInput
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new NotFoundError("User not found");
  }

  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Verify current password
  const isValid = await verifyPassword(user.passwordHash, input.currentPassword);
  if (!isValid) {
    throw new BadRequestError("Current password does not match");
  }

  if (input.newPassword.length < 8) {
    throw new BadRequestError("New password must be at least 8 characters");
  }

  // Hash new password using Argon2id
  user.passwordHash = await hashPassword(input.newPassword);
  await user.save();

  return { success: true };
}

export async function getUserSessions(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new NotFoundError("User not found");
  }

  await connectToDatabase();

  const sessions = await Session.find({
    userId: new Types.ObjectId(userId),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastUsedAt: -1 })
    .lean();

  return sessions.map((s) => ({
    id: s._id.toString(),
    userAgent: s.userAgent || "Unknown device or browser",
    lastUsedAt: s.lastUsedAt,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
  }));
}

export async function revokeUserSession(userId: string, sessionId: string) {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(sessionId)) {
    throw new NotFoundError("Session not found");
  }

  await connectToDatabase();

  const session = await Session.findOne({
    _id: new Types.ObjectId(sessionId),
    userId: new Types.ObjectId(userId),
  });

  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // Revoke session family
  await Session.updateMany(
    { familyId: session.familyId, revokedAt: null },
    { revokedAt: new Date() }
  );

  return { success: true };
}
