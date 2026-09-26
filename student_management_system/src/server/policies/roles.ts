export type UserRole = "ADMIN" | "STAFF";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface PolicyUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword?: boolean;
  isDemo?: boolean;
}

export class PolicyForbiddenError extends Error {
  statusCode: number;
  code: string;

  constructor(message = "Forbidden") {
    super(message);
    this.name = "PolicyForbiddenError";
    this.statusCode = 403;
    this.code = "FORBIDDEN";
  }
}

export function requireRole(user: PolicyUser | undefined, ...allowedRoles: UserRole[]): void {
  if (!user) {
    throw new PolicyForbiddenError("Forbidden: Authentication required");
  }

  if (user.status !== "ACTIVE") {
    throw new PolicyForbiddenError("Forbidden: Account is suspended");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new PolicyForbiddenError(`Forbidden: Required role ${allowedRoles.join(" or ")}`);
  }
}

export function assertNotSelf(actorId: string, targetId: string, action = "modify"): void {
  if (actorId === targetId) {
    throw new PolicyForbiddenError(`Cannot ${action} your own account`);
  }
}

export function assertNotLastAdmin(activeAdminCount: number): void {
  if (activeAdminCount <= 1) {
    throw new PolicyForbiddenError(
      "Operation rejected: Cannot remove or demote the last active administrator",
    );
  }
}
