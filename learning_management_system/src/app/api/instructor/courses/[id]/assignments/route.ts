import { apiHandler, NotFoundError } from "@/server/http";
import {
  createAssignmentSchema,
  CreateAssignmentSchema,
} from "@/validations/assignment";
import {
  createAssignment,
  listAssignmentsForInstructor,
} from "@/server/services/assignments";

export const POST = apiHandler<CreateAssignmentSchema>(
  {
    auth: true,
    bodySchema: createAssignmentSchema,
  },
  async ({ user, params, body }) => {
    const courseId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!courseId) {
      throw new NotFoundError("Course not found");
    }

    const assignment = await createAssignment(user!, courseId, body);
    return {
      data: assignment,
      status: 201,
    };
  }
);

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    const courseId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";

    if (!courseId) {
      throw new NotFoundError("Course not found");
    }

    const assignments = await listAssignmentsForInstructor(user!, courseId);
    return {
      data: assignments,
    };
  }
);
