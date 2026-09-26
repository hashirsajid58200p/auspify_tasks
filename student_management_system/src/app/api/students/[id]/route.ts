import { apiHandler, BadRequestError } from "@/server/http";
import { updateStudentSchema, UpdateStudentInput } from "@/validations/student";
import { getStudentById, updateStudent, deleteStudent } from "@/server/services/students";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ params }) => {
    const id = params.id as string;
    if (!id) {
      throw new BadRequestError("Student ID is required");
    }
    const data = await getStudentById(id);
    return {
      data,
    };
  },
);

export const PATCH = apiHandler<UpdateStudentInput>(
  {
    auth: true,
    bodySchema: updateStudentSchema,
  },
  async ({ params, body }) => {
    const id = params.id as string;
    if (!id) {
      throw new BadRequestError("Student ID is required");
    }
    const data = await updateStudent(id, body);
    return {
      data,
    };
  },
);

export const DELETE = apiHandler(
  {
    auth: true,
  },
  async ({ params, user }) => {
    const id = params.id as string;
    if (!id) {
      throw new BadRequestError("Student ID is required");
    }
    const data = await deleteStudent(id, user!.id);
    return {
      data,
    };
  },
);
