import { apiHandler, NotFoundError } from "@/server/http";
import { getAssignmentForStudent } from "@/server/services/assignments";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "assignment:view",
    },
  },
  async ({ user, params }) => {
    const assignmentId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!assignmentId) {
      throw new NotFoundError("Assignment not found");
    }

    const assignment = await getAssignmentForStudent(user!, assignmentId);
    return {
      data: assignment,
    };
  }
);
