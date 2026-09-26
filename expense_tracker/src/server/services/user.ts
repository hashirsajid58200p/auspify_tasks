import { User, IUser } from "@/server/models/user";
import { hashPassword, verifyPassword, verifyDummyPassword } from "@/server/auth/password";
import { createSession, AuthTokens } from "@/server/auth/session";
import { seedDefaultCategories } from "./category";
import { ConflictError, UnauthorizedError, NotFoundError } from "@/server/http";
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currency: string;
  locale: string;
  isDemo: boolean;
  createdAt: Date;
}

export async function registerUser(
  input: RegisterInput,
  meta?: { userAgent?: string; ipHash?: string }
): Promise<AuthTokens> {
  await connectToDatabase();

  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
    currency: "USD",
    locale: "en-US",
    isDemo: false,
  });

  // Seed default income and expense categories
  await seedDefaultCategories(user._id.toString());

  // Create initial session & mint tokens
  return createSession(user, meta);
}

export async function authenticateUser(
  input: LoginInput,
  meta?: { userAgent?: string; ipHash?: string }
): Promise<AuthTokens> {
  await connectToDatabase();

  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // Run dummy hash to prevent timing enumeration
    await verifyDummyPassword(input.password);
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await verifyPassword(user.passwordHash, input.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return createSession(user, meta);
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  await connectToDatabase();
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    currency: user.currency,
    locale: user.locale,
    isDemo: user.isDemo,
    createdAt: user.createdAt,
  };
}
