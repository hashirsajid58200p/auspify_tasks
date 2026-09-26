import { apiHandler, NotFoundError } from "@/server/http";
import { getAttemptResult } from "@/server/services/attempts";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    const attemptId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!attemptId) {
      throw new NotFoundError("Attempt not found");
    }

    const result = await getAttemptResult(user!, attemptId);
    return {
      data: result,
    };
  }
);
