import mongoose from "mongoose";
import { User, IUser } from "@/server/models/user";
import { AuditLog } from "@/server/models/audit-log";
import { hashPassword } from "@/server/auth/password";
import { revokeAllUserSessions } from "@/server/auth/session";
import { connectToDatabase } from "@/server/db";
import { assertNotSelf, assertNotLastAdmin } from "@/server/policies/roles";
import { CreateStaffInput, UpdateStaffInput } from "@/validations/staff";
import { BadRequestError, ConflictError, NotFoundError } from "@/server/http";
import { StaffUserItem } from "@/types/staff";

function toStaffItem(user: IUser): StaffUserItem {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    isDemo: user.isDemo,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listStaffUsers(): Promise<StaffUserItem[]> {
  await connectToDatabase();

  const users = await User.find()
    .select("_id name email role status mustChangePassword isDemo createdAt updatedAt")
    .sort({ role: 1, name: 1 })
    .lean<IUser[]>();

  return users.map(toStaffItem);
}

export async function createStaffUser(
  input: CreateStaffInput,
  actorId: string,
): Promise<StaffUserItem> {
  await connectToDatabase();

  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ConflictError("A user with this email address already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const newUser = await User.create({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: input.role || "STAFF",
    status: "ACTIVE",
    mustChangePassword: true,
    isDemo: false,
  });

  await AuditLog.create({
    actorId: new mongoose.Types.ObjectId(actorId),
    action: "CREATE_STAFF_USER",
    targetType: "USER",
    targetId: newUser._id.toString(),
    meta: {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    },
  });

  return toStaffItem(newUser);
}

export async function updateStaffUser(
  targetId: string,
  input: UpdateStaffInput,
  actor: { id: string; role: string },
): Promise<StaffUserItem> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    throw new BadRequestError("Invalid user ID format");
  }

  // Domain Safeguard: Users cannot modify their own role or status
  assertNotSelf(actor.id, targetId, "modify role or status of");

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    throw new NotFoundError("Staff member not found");
  }

  const oldRole = targetUser.role;
  const oldStatus = targetUser.status;

  // Domain Safeguard: Cannot demote or suspend the last active administrator
  const willDemote = input.role && input.role !== "ADMIN" && oldRole === "ADMIN";
  const willSuspend = input.status && input.status === "SUSPENDED" && oldRole === "ADMIN";

  if (willDemote || willSuspend) {
    const activeAdminCount = await User.countDocuments({
      role: "ADMIN",
      status: "ACTIVE",
    });
    assertNotLastAdmin(activeAdminCount);
  }

  if (input.role) targetUser.role = input.role;
  if (input.status) targetUser.status = input.status;

  await targetUser.save();

  // Domain Safeguard: Revoke all active sessions immediately upon account suspension
  if (targetUser.status === "SUSPENDED") {
    await revokeAllUserSessions(targetId);
  }

  await AuditLog.create({
    actorId: new mongoose.Types.ObjectId(actor.id),
    action: "UPDATE_STAFF_ROLE_STATUS",
    targetType: "USER",
    targetId: targetUser._id.toString(),
    meta: {
      email: targetUser.email,
      oldRole,
      newRole: targetUser.role,
      oldStatus,
      newStatus: targetUser.status,
    },
  });

  return toStaffItem(targetUser);
}
