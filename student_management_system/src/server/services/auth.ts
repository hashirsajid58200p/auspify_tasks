import { User, UserRole, UserStatus } from "@/server/models/user";
import { hashPassword, verifyPassword, verifyDummyPassword } from "@/server/auth/password";
import { createSession, AuthTokens, revokeAllUserSessions } from "@/server/auth/session";
import { UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } from "@/server/http";
import { connectToDatabase } from "@/server/db";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult extends AuthTokens {
  redirectUrl: string;
}

export function getAuthRedirectUrl(mustChangePassword: boolean): string {
  if (mustChangePassword) {
    return "/change-password";
  }
  return "/dashboard";
}

export async function authenticateUser(
  input: LoginInput,
  meta?: { userAgent?: string; ipHash?: string },
): Promise<AuthResult> {
  await connectToDatabase();

  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // Mitigate timing attacks with dummy argon2id verification
    await verifyDummyPassword(input.password);
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await verifyPassword(user.passwordHash, input.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.status === "SUSPENDED") {
    throw new ForbiddenError("Account is suspended. Please contact administrator.");
  }

  const session = await createSession(user, meta);
  return {
    ...session,
    redirectUrl: getAuthRedirectUrl(user.mustChangePassword),
  };
}

export async function getUserProfile(userId: string) {
  await connectToDatabase();
  const user = await User.findById(userId).select(
    "_id name email role status mustChangePassword isDemo createdAt",
  );
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    isDemo: user.isDemo,
    createdAt: user.createdAt,
  };
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.status === "SUSPENDED") {
    throw new ForbiddenError("Account is suspended.");
  }

  const isCurrentValid = await verifyPassword(user.passwordHash, currentPassword);
  if (!isCurrentValid) {
    throw new BadRequestError("Current password is incorrect");
  }

  if (currentPassword === newPassword) {
    throw new BadRequestError("New password must be different from current password");
  }

  const newHash = await hashPassword(newPassword);
  user.passwordHash = newHash;
  user.mustChangePassword = false;
  await user.save();

  return {
    success: true,
    message: "Password changed successfully",
  };
}
