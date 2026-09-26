import { ForbiddenError } from "@/server/http";

export type UserRole = "JOB_SEEKER" | "EMPLOYER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface PolicyUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  isDemo?: boolean;
}

export function requireRole(user: PolicyUser | undefined, ...allowedRoles: UserRole[]): void {
  if (!user) {
    throw new ForbiddenError("Forbidden: Authentication required");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(`Forbidden: Required role ${allowedRoles.join(" or ")}`);
  }
}

export function assertNotSelf(actorId: string, targetId: string, action = "modify"): void {
  if (actorId === targetId) {
    throw new ForbiddenError(`Cannot ${action} your own administrative account`);
  }
}

export function assertNotLastAdmin(activeAdminCount: number): void {
  if (activeAdminCount <= 1) {
    throw new ForbiddenError(
      "Operation rejected: Cannot remove or demote the last active administrator",
    );
  }
}
