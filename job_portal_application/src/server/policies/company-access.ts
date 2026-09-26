import { Types } from "mongoose";
import { NotFoundError } from "@/server/http";

/**
 * Asserts company ownership.
 * CRITICAL: Returns 404 Not Found if resource belongs to someone else to prevent enumeration.
 */
export function assertCompanyOwner(
  companyOwnerId: Types.ObjectId | string,
  actorId: Types.ObjectId | string,
): void {
  if (companyOwnerId.toString() !== actorId.toString()) {
    throw new NotFoundError("Company not found");
  }
}
