import { Types } from "mongoose";
import { NotFoundError } from "@/server/http";

/**
 * Asserts job ownership for employer management.
 * CRITICAL: Returns 404 Not Found if resource belongs to someone else to prevent enumeration.
 */
export function assertJobOwner(
  jobEmployerId: Types.ObjectId | string,
  actorId: Types.ObjectId | string,
): void {
  if (jobEmployerId.toString() !== actorId.toString()) {
    throw new NotFoundError("Job not found");
  }
}
