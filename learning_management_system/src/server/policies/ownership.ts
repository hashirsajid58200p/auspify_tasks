import { Types } from "mongoose";
import { NotFoundError } from "@/server/http";

export function assertCourseOwner(
  courseInstructorId: string | Types.ObjectId,
  actorId: string | Types.ObjectId
): void {
  const cId = courseInstructorId.toString();
  const aId = actorId.toString();

  if (cId !== aId) {
    // Return 404 instead of 403 to prevent resource enumeration
    throw new NotFoundError("Course not found");
  }
}

export function assertSubmissionOwner(
  submissionUserId: string | Types.ObjectId,
  actorId: string | Types.ObjectId
): void {
  if (submissionUserId.toString() !== actorId.toString()) {
    throw new NotFoundError("Submission not found");
  }
}
