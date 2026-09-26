import { Types } from "mongoose";
import { NotFoundError } from "@/server/http";

/**
 * Asserts resource ownership.
 * CRITICAL SECURITY RULE:
 * If a resource exists but belongs to another user, return 404 Not Found (NOT 403 Forbidden)
 * to prevent ID enumeration and information disclosure.
 */
export function assertResourceOwner(
  resourceOwnerId: string | Types.ObjectId,
  actorId: string | Types.ObjectId,
  resourceName = "Resource",
): void {
  const ownerStr = resourceOwnerId.toString();
  const actorStr = actorId.toString();

  if (ownerStr !== actorStr) {
    throw new NotFoundError(`${resourceName} not found`);
  }
}
