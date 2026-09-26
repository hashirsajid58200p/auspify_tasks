import { apiHandler, NotFoundError } from "@/server/http";
import {
  submitAssignmentSchema,
  SubmitAssignmentSchema,
} from "@/validations/assignment";
import { submitAssignment } from "@/server/services/submissions";

export const PUT = apiHandler<SubmitAssignmentSchema>(
  {
    auth: true,
    bodySchema: submitAssignmentSchema,
    rateLimit: {
      maxPoints: 15,
      windowSeconds: 60,
      keyPrefix: "assignment:submit",
    },
  },
  async ({ user, params, body }) => {
    const assignmentId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!assignmentId) {
      throw new NotFoundError("Assignment not found");
    }

    const result = await submitAssignment(
      user!,
      assignmentId,
      body.text,
      body.linkUrl
    );

    return {
      data: result,
    };
  }
);
