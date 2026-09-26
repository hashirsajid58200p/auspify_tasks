import { Types } from "mongoose";
import { CurrentUser } from "@/server/auth/session";
import { NotFoundError } from "@/server/http";

export interface CourseAccessContext {
  courseStatus: string;
  instructorId: string | Types.ObjectId;
}

export function canAccessCourseContent(
  user: CurrentUser | null | undefined,
  course: CourseAccessContext,
  isPreview = false,
  isEnrolled = false
): boolean {
  // 1. Preview lessons on published courses are publicly accessible
  if (isPreview && course.courseStatus === "PUBLISHED") {
    return true;
  }

  // If user is not authenticated, all other content is inaccessible
  if (!user) {
    return false;
  }

  // 2. Admins have read-only access to all content
  if (user.role === "ADMIN") {
    return true;
  }

  // 3. Owning instructors have full access to their courses
  if (
    user.role === "INSTRUCTOR" &&
    course.instructorId.toString() === user.userId
  ) {
    return true;
  }

  // 4. Students who are actively enrolled in the course
  if (user.role === "STUDENT" && isEnrolled) {
    return true;
  }

  return false;
}

export function assertCourseContentAccess(
  user: CurrentUser | null | undefined,
  course: CourseAccessContext,
  isPreview = false,
  isEnrolled = false
): void {
  const allowed = canAccessCourseContent(user, course, isPreview, isEnrolled);
  if (!allowed) {
    // Return 404 instead of 403 to prevent probing hidden or foreign content
    throw new NotFoundError("Resource not found");
  }
}
