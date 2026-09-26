import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { requireRole, assertNotSelf, assertNotLastAdmin } from "@/server/policies/roles";
import { assertResourceOwner } from "@/server/policies/ownership";
import { assertJobOwner } from "@/server/policies/job-access";
import { assertCompanyOwner } from "@/server/policies/company-access";
import { assertApplicationAccess } from "@/server/policies/application-access";
import { CurrentUser } from "@/server/auth/session";
import { ForbiddenError, NotFoundError } from "@/server/http";

describe("Policy Matrix & Access Control (Section 13 Security Checklist)", () => {
  const createMockUser = (
    id: string,
    role: "JOB_SEEKER" | "EMPLOYER" | "ADMIN",
    status: "ACTIVE" | "SUSPENDED" = "ACTIVE",
  ): CurrentUser => ({
    userId: id,
    email: `${role.toLowerCase()}@jobportal.local`,
    name: `${role} User`,
    role,
    status,
    isDemo: false,
  });

  const seekerA = createMockUser("64f1a2b3c4d5e6f7a8b9c001", "JOB_SEEKER");
  const seekerB = createMockUser("64f1a2b3c4d5e6f7a8b9c002", "JOB_SEEKER");
  const employerA = createMockUser("64f1a2b3c4d5e6f7a8b9c003", "EMPLOYER");
  const employerB = createMockUser("64f1a2b3c4d5e6f7a8b9c004", "EMPLOYER");
  const adminUser = createMockUser("64f1a2b3c4d5e6f7a8b9c005", "ADMIN");

  describe("Role Matrix: Role Requirements across Endpoint Groups", () => {
    it("Unauthenticated caller is blocked on all protected route groups", () => {
      expect(() => requireRole(undefined, "JOB_SEEKER")).toThrow(ForbiddenError);
      expect(() => requireRole(undefined, "EMPLOYER")).toThrow(ForbiddenError);
      expect(() => requireRole(undefined, "ADMIN")).toThrow(ForbiddenError);
    });

    it("JOB_SEEKER permissions matrix", () => {
      // Allowed: Seeker routes
      expect(() => requireRole(seekerA, "JOB_SEEKER")).not.toThrow();

      // Blocked: Employer routes (structural block: employer cannot apply, seeker cannot post jobs)
      expect(() => requireRole(seekerA, "EMPLOYER")).toThrow(ForbiddenError);

      // Blocked: Admin routes
      expect(() => requireRole(seekerA, "ADMIN")).toThrow(ForbiddenError);
    });

    it("EMPLOYER permissions matrix", () => {
      // Allowed: Employer routes
      expect(() => requireRole(employerA, "EMPLOYER")).not.toThrow();

      // Blocked: Seeker apply routes (employers structurally cannot apply to any job)
      expect(() => requireRole(employerA, "JOB_SEEKER")).toThrow(ForbiddenError);

      // Blocked: Admin moderation routes
      expect(() => requireRole(employerA, "ADMIN")).toThrow(ForbiddenError);
    });

    it("ADMIN permissions matrix", () => {
      // Allowed: Admin routes
      expect(() => requireRole(adminUser, "ADMIN")).not.toThrow();

      // Blocked: Seeker apply routes
      expect(() => requireRole(adminUser, "JOB_SEEKER")).toThrow(ForbiddenError);

      // Blocked: Direct Employer routes (admins moderate, they do not own company hiring pipelines directly)
      expect(() => requireRole(adminUser, "EMPLOYER")).toThrow(ForbiddenError);
    });
  });

  describe("Tenant Isolation & Anti-Enumeration (404 Rule)", () => {
    it("Employer B cannot read or edit Employer A's job (returns 404, not 403)", () => {
      const mockJob = {
        _id: new Types.ObjectId(),
        employerId: new Types.ObjectId(employerA.userId),
      } as any;

      // Employer A accesses own job -> OK
      expect(() => assertJobOwner(mockJob.employerId, employerA.userId)).not.toThrow();

      // Employer B accesses Employer A's job -> 404 NOT_FOUND
      expect(() => assertJobOwner(mockJob.employerId, employerB.userId)).toThrow(NotFoundError);

      // Seeker accesses Employer A's job management -> 404 NOT_FOUND
      expect(() => assertJobOwner(mockJob.employerId, seekerA.userId)).toThrow(NotFoundError);
    });

    it("Employer B cannot read or edit Employer A's company (returns 404, not 403)", () => {
      const mockCompany = {
        _id: new Types.ObjectId(),
        ownerId: new Types.ObjectId(employerA.userId),
      } as any;

      expect(() => assertCompanyOwner(mockCompany.ownerId, employerA.userId)).not.toThrow();
      expect(() => assertCompanyOwner(mockCompany.ownerId, employerB.userId)).toThrow(
        NotFoundError,
      );
      expect(() => assertCompanyOwner(mockCompany.ownerId, seekerA.userId)).toThrow(NotFoundError);
    });

    it("Seeker B cannot read Seeker A's application (returns 404, not 403)", () => {
      const mockApp = {
        _id: new Types.ObjectId(),
        seekerId: new Types.ObjectId(seekerA.userId),
        employerId: new Types.ObjectId(employerA.userId),
      } as any;

      // Seeker A (applicant) -> OK
      expect(() => assertApplicationAccess(mockApp, seekerA)).not.toThrow();

      // Employer A (job owner) -> OK
      expect(() => assertApplicationAccess(mockApp, employerA)).not.toThrow();

      // Admin -> OK
      expect(() => assertApplicationAccess(mockApp, adminUser)).not.toThrow();

      // Seeker B (foreign candidate) -> 404 NOT_FOUND
      expect(() => assertApplicationAccess(mockApp, seekerB)).toThrow(NotFoundError);

      // Employer B (foreign employer) -> 404 NOT_FOUND
      expect(() => assertApplicationAccess(mockApp, employerB)).toThrow(NotFoundError);
    });
  });

  describe("Administrative Safeguards Matrix", () => {
    it("Prevents an administrator from self-demoting or self-suspending", () => {
      expect(() => assertNotSelf(adminUser.userId, adminUser.userId, "demote")).toThrow(
        ForbiddenError,
      );
      expect(() => assertNotSelf(adminUser.userId, adminUser.userId, "suspend")).toThrow(
        ForbiddenError,
      );
      expect(() => assertNotSelf(adminUser.userId, employerA.userId, "suspend")).not.toThrow();
    });

    it("Protects the last active administrator from removal or demotion", () => {
      expect(() => assertNotLastAdmin(1)).toThrow(ForbiddenError);
      expect(() => assertNotLastAdmin(0)).toThrow(ForbiddenError);
      expect(() => assertNotLastAdmin(2)).not.toThrow();
    });
  });
});
