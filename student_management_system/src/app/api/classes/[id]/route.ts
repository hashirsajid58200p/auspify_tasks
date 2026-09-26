import { apiHandler, BadRequestError } from "@/server/http";
import { updateClassSchema, UpdateClassInput } from "@/validations/class";
import { getClassById, updateClass, deleteClass } from "@/server/services/classes";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ params }) => {
    const id = params.id as string;
    if (!id) {
      throw new BadRequestError("Class ID is required");
    }
    const data = await getClassById(id);
    return {
      data,
    };
  },
);

export const PATCH = apiHandler<UpdateClassInput>(
  {
    auth: true,
    bodySchema: updateClassSchema,
  },
  async ({ params, body }) => {
    const id = params.id as string;
    if (!id) {
      throw new BadRequestError("Class ID is required");
    }
    const data = await updateClass(id, body);
    return {
      data,
    };
  },
);

export const DELETE = apiHandler(
  {
    auth: true,
  },
  async ({ params }) => {
    const id = params.id as string;
    if (!id) {
      throw new BadRequestError("Class ID is required");
    }
    const data = await deleteClass(id);
    return {
      data,
    };
  },
);
