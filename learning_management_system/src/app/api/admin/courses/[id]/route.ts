import { z } from "zod";
import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { moderateCourseStatus } from "@/server/services/admin";

const moderateCourseSchema = z
  .object({
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  })
  .strict();

export const PATCH = apiHandler(
  {
    auth: true,
    bodySchema: moderateCourseSchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "admin:courses:moderate",
    },
  },
  async ({ user, body, params }) => {
    requireRole(user, "ADMIN");

    const courseId = String(params.id || "");
    const updated = await moderateCourseStatus(user!.userId, courseId, body.status);
    return {
      data: updated,
    };
  }
);
