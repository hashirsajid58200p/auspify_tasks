import { User, IUser, UserRole, UserStatus } from "@/server/models/user";
import { hashPassword, verifyPassword, verifyDummyPassword } from "@/server/auth/password";
import { createSession, AuthTokens } from "@/server/auth/session";
import { ConflictError, UnauthorizedError, ForbiddenError, NotFoundError } from "@/server/http";
import { connectToDatabase } from "@/server/db";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult extends AuthTokens {
  redirectUrl: string;
}

export function getRoleRedirectUrl(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "INSTRUCTOR":
      return "/instructor";
    case "STUDENT":
    default:
      return "/dashboard";
  }
}

export async function registerUser(
  input: RegisterInput,
  meta?: { userAgent?: string; ipHash?: string }
): Promise<AuthResult> {
  await connectToDatabase();

  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  // Register always creates a STUDENT and ignores any injected role field (Rule 2 & 8)
  const user = await User.create({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: "STUDENT",
    status: "ACTIVE",
    isDemo: false,
  });

  const session = await createSession(user, meta);
  return {
    ...session,
    redirectUrl: "/dashboard",
  };
}

export async function authenticateUser(
  input: LoginInput,
  meta?: { userAgent?: string; ipHash?: string }
): Promise<AuthResult> {
  await connectToDatabase();

  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // Timing attack mitigation
    await verifyDummyPassword(input.password);
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await verifyPassword(user.passwordHash, input.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.status === "SUSPENDED") {
    throw new ForbiddenError("Account is suspended. Please contact support.");
  }

  const session = await createSession(user, meta);
  return {
    ...session,
    redirectUrl: getRoleRedirectUrl(user.role),
  };
}

export async function getUserProfile(userId: string) {
  await connectToDatabase();
  const user = await User.findById(userId).select("_id name email role status bio isDemo createdAt");
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    bio: user.bio || "",
    isDemo: user.isDemo,
    createdAt: user.createdAt,
  };
}
