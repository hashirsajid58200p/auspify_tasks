import { apiHandler } from "@/server/http";
import { createClassSchema, CreateClassInput } from "@/validations/class";
import { listClasses, createClass } from "@/server/services/classes";

export const GET = apiHandler(
  {
    auth: true,
  },
  async () => {
    const data = await listClasses();
    return {
      data,
    };
  },
);

export const POST = apiHandler<CreateClassInput>(
  {
    auth: true,
    bodySchema: createClassSchema,
  },
  async ({ body }) => {
    const data = await createClass(body);
    return {
      data,
      status: 201,
    };
  },
);
