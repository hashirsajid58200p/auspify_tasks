import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/server/auth/cookies";
import { verifyAccessToken } from "@/server/auth/tokens";
import { connectToDatabase } from "@/server/db";
import { User, UserRole, UserStatus } from "@/server/models/user";

export interface ServerSessionUser {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  isDemo: boolean;
}

export function getUserInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Enforces authentication and optional role restrictions inside Server Component layouts.
 * Loads user role, status, and mustChangePassword directly from MongoDB on every request.
 * Rejects suspended users immediately.
 */
export async function requireServerUser(allowedRoles?: UserRole[]): Promise<ServerSessionUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (!token) {
    if (refreshToken) {
      redirect("/api/auth/refresh");
    }
    redirect("/login");
  }

  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    if (refreshToken) {
      redirect("/api/auth/refresh");
    }
    redirect("/login");
  }

  await connectToDatabase();
  const user = await User.findById(payload.sub)
    .select("_id email name role status mustChangePassword isDemo")
    .lean();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "SUSPENDED") {
    redirect("/login?error=suspended");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }

  return {
    id: user._id.toString(),
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    isDemo: user.isDemo,
  };
}
