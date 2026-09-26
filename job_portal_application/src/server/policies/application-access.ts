import { Types } from "mongoose";
import { CurrentUser } from "@/server/auth/session";
import { NotFoundError } from "@/server/http";
import { IApplication } from "@/server/models/application";

export function assertApplicationAccess(application: IApplication, user: CurrentUser): void {
  if (user.role === "ADMIN") {
    return;
  }

  const userObjectId = new Types.ObjectId(user.userId);

  const seekerId = (application.seekerId as any)?._id
    ? (application.seekerId as any)._id
    : application.seekerId;

  const employerId = (application.employerId as any)?._id
    ? (application.employerId as any)._id
    : application.employerId;

  if (user.role === "JOB_SEEKER") {
    if (seekerId && seekerId.toString() === userObjectId.toString()) {
      return;
    }
    // Anti-enumeration: return 404, never 403
    throw new NotFoundError("Application not found");
  }

  if (user.role === "EMPLOYER") {
    if (employerId && employerId.toString() === userObjectId.toString()) {
      return;
    }
    // Anti-enumeration: return 404, never 403
    throw new NotFoundError("Application not found");
  }

  throw new NotFoundError("Application not found");
}
