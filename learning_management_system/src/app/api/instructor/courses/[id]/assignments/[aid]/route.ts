import { apiHandler, NotFoundError } from "@/server/http";
import {
  updateAssignmentSchema,
  UpdateAssignmentSchema,
} from "@/validations/assignment";
import {
  getAssignmentForInstructor,
  updateAssignment,
  deleteAssignment,
} from "@/server/services/assignments";

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
    const assignmentId =
      typeof params.aid === "string"
        ? params.aid
        : Array.isArray(params.aid)
        ? params.aid[0]
        : "";

    if (!courseId || !assignmentId) {
      throw new NotFoundError("Assignment not found");
    }

    const assignment = await getAssignmentForInstructor(user!, courseId, assignmentId);
    return { data: assignment };
  }
);

export const PATCH = apiHandler<UpdateAssignmentSchema>(
  {
    auth: true,
    bodySchema: updateAssignmentSchema,
  },
  async ({ user, params, body }) => {
    const courseId =
      typeof params.id === "string"
        ? params.id
        : Array.isArray(params.id)
        ? params.id[0]
        : "";
    const assignmentId =
      typeof params.aid === "string"
        ? params.aid
        : Array.isArray(params.aid)
        ? params.aid[0]
        : "";

    if (!courseId || !assignmentId) {
      throw new NotFoundError("Assignment not found");
    }

    const assignment = await updateAssignment(user!, courseId, assignmentId, body);
    return { data: assignment };
  }
);

export const DELETE = apiHandler(
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
    const assignmentId =
      typeof params.aid === "string"
        ? params.aid
        : Array.isArray(params.aid)
        ? params.aid[0]
        : "";

    if (!courseId || !assignmentId) {
      throw new NotFoundError("Assignment not found");
    }

    const result = await deleteAssignment(user!, courseId, assignmentId);
    return { data: result };
  }
);
