import { apiHandler, NotFoundError } from "@/server/http";
import {
  gradeSubmissionSchema,
  GradeSubmissionSchema,
} from "@/validations/assignment";
import { gradeSubmission } from "@/server/services/submissions";

export const PATCH = apiHandler<GradeSubmissionSchema>(
  {
    auth: true,
    bodySchema: gradeSubmissionSchema,
  },
  async ({ user, params, body }) => {
    const submissionId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!submissionId) {
      throw new NotFoundError("Submission not found");
    }

    const result = await gradeSubmission(
      user!,
      submissionId,
      body.grade,
      body.feedback
    );

    return {
      data: result,
    };
  }
);
