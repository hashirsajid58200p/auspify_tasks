import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import {
  requireRole,
  assertNotSelf,
  assertNotLastAdmin,
} from "@/server/policies/roles";
import {
  assertCourseOwner,
  assertSubmissionOwner,
} from "@/server/policies/ownership";
import {
  canAccessCourseContent,
  assertCourseContentAccess,
} from "@/server/policies/course-access";
import { CurrentUser } from "@/server/auth/session";
import { ForbiddenError, NotFoundError } from "@/server/http";

describe("Policy Matrix & Access Control", () => {
  const createMockUser = (
    id: string,
    role: "STUDENT" | "INSTRUCTOR" | "ADMIN",
    status: "ACTIVE" | "SUSPENDED" = "ACTIVE"
  ): CurrentUser => ({
    userId: id,
    email: `${role.toLowerCase()}@lms.local`,
    name: `${role} User`,
    role,
    status,
    isDemo: false,
  });

  const studentUser = createMockUser("64f1a2b3c4d5e6f7a8b9c001", "STUDENT");
  const instructorA = createMockUser("64f1a2b3c4d5e6f7a8b9c002", "INSTRUCTOR");
  const instructorB = createMockUser("64f1a2b3c4d5e6f7a8b9c003", "INSTRUCTOR");
  const adminUser = createMockUser("64f1a2b3c4d5e6f7a8b9c004", "ADMIN");

  describe("Role Enforcement (requireRole)", () => {
    it("should reject unauthenticated caller with ForbiddenError", () => {
      expect(() => requireRole(undefined, "STUDENT")).toThrow(ForbiddenError);
    });

    it("should allow matching role", () => {
      expect(() => requireRole(studentUser, "STUDENT")).not.toThrow();
      expect(() => requireRole(instructorA, "INSTRUCTOR")).not.toThrow();
      expect(() => requireRole(adminUser, "ADMIN")).not.toThrow();
    });

    it("should reject student attempting instructor or admin actions", () => {
      expect(() => requireRole(studentUser, "INSTRUCTOR")).toThrow(ForbiddenError);
      expect(() => requireRole(studentUser, "ADMIN")).toThrow(ForbiddenError);
    });

    it("should reject instructor attempting admin actions", () => {
      expect(() => requireRole(instructorA, "ADMIN")).toThrow(ForbiddenError);
    });

    it("should allow multi-role requirements", () => {
      expect(() => requireRole(studentUser, "STUDENT", "INSTRUCTOR")).not.toThrow();
      expect(() => requireRole(instructorA, "STUDENT", "INSTRUCTOR")).not.toThrow();
      expect(() => requireRole(adminUser, "STUDENT", "INSTRUCTOR")).toThrow(ForbiddenError);
    });
  });

  describe("Admin Safeguards", () => {
    it("should block an admin from modifying or demoting themselves", () => {
      expect(() =>
        assertNotSelf(adminUser.userId, adminUser.userId, "demote")
      ).toThrow(ForbiddenError);

      expect(() =>
        assertNotSelf(adminUser.userId, instructorA.userId, "demote")
      ).not.toThrow();
    });

    it("should protect the last active administrator from demotion or removal", () => {
      expect(() => assertNotLastAdmin(1)).toThrow(ForbiddenError);
      expect(() => assertNotLastAdmin(0)).toThrow(ForbiddenError);
      expect(() => assertNotLastAdmin(2)).not.toThrow();
    });
  });

  describe("Ownership Protection (404 Anti-Enumeration)", () => {
    const courseInstructorId = new Types.ObjectId();

    it("should allow the course owner", () => {
      expect(() =>
        assertCourseOwner(courseInstructorId, courseInstructorId)
      ).not.toThrow();
    });

    it("should return 404 (not 403) when another instructor accesses the course", () => {
      const foreignInstructorId = new Types.ObjectId();
      expect(() =>
        assertCourseOwner(courseInstructorId, foreignInstructorId)
      ).toThrow(NotFoundError);
    });

    it("should return 404 when foreign user accesses a submission", () => {
      const ownerId = new Types.ObjectId();
      const foreignId = new Types.ObjectId();
      expect(() =>
        assertSubmissionOwner(ownerId, foreignId)
      ).toThrow(NotFoundError);
    });
  });

  describe("Course Content Access Matrix (canAccessCourseContent)", () => {
    const courseId = new Types.ObjectId();
    const instructorId = instructorA.userId;

    const publishedCourse = {
      courseStatus: "PUBLISHED",
      instructorId,
    };

    const draftCourse = {
      courseStatus: "DRAFT",
      instructorId,
    };

    it("should allow public access to preview lessons on published courses", () => {
      expect(canAccessCourseContent(null, publishedCourse, true, false)).toBe(true);
      expect(() =>
        assertCourseContentAccess(null, publishedCourse, true, false)
      ).not.toThrow();
    });

    it("should block public access to non-preview lessons (404)", () => {
      expect(canAccessCourseContent(null, publishedCourse, false, false)).toBe(false);
      expect(() =>
        assertCourseContentAccess(null, publishedCourse, false, false)
      ).toThrow(NotFoundError);
    });

    it("should block public access to preview lessons on draft courses", () => {
      expect(canAccessCourseContent(null, draftCourse, true, false)).toBe(false);
      expect(() =>
        assertCourseContentAccess(null, draftCourse, true, false)
      ).toThrow(NotFoundError);
    });

    it("should allow enrolled students to access full lesson content", () => {
      expect(
        canAccessCourseContent(studentUser, publishedCourse, false, true)
      ).toBe(true);
      expect(() =>
        assertCourseContentAccess(studentUser, publishedCourse, false, true)
      ).not.toThrow();
    });

    it("should block non-enrolled students from non-preview lessons (404)", () => {
      expect(
        canAccessCourseContent(studentUser, publishedCourse, false, false)
      ).toBe(false);
      expect(() =>
        assertCourseContentAccess(studentUser, publishedCourse, false, false)
      ).toThrow(NotFoundError);
    });

    it("should allow owning instructor full access to draft and published courses", () => {
      expect(
        canAccessCourseContent(instructorA, draftCourse, false, false)
      ).toBe(true);
      expect(
        canAccessCourseContent(instructorA, publishedCourse, false, false)
      ).toBe(true);
    });

    it("should block foreign instructors from draft courses (404)", () => {
      expect(
        canAccessCourseContent(instructorB, draftCourse, false, false)
      ).toBe(false);
      expect(() =>
        assertCourseContentAccess(instructorB, draftCourse, false, false)
      ).toThrow(NotFoundError);
    });

    it("should allow administrators read access to all content", () => {
      expect(
        canAccessCourseContent(adminUser, draftCourse, false, false)
      ).toBe(true);
      expect(
        canAccessCourseContent(adminUser, publishedCourse, false, false)
      ).toBe(true);
    });
  });
});
