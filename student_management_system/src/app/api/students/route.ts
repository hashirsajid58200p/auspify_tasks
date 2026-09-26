import { apiHandler } from "@/server/http";
import {
  createStudentSchema,
  studentQuerySchema,
  CreateStudentInput,
  StudentQueryInput,
} from "@/validations/student";
import { listStudents, createStudent } from "@/server/services/students";

export const GET = apiHandler<unknown, StudentQueryInput>(
  {
    auth: true,
    querySchema: studentQuerySchema,
  },
  async ({ query }) => {
    const result = await listStudents(query);
    return {
      data: result.students,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  },
);

export const POST = apiHandler<CreateStudentInput>(
  {
    auth: true,
    bodySchema: createStudentSchema,
  },
  async ({ body, user }) => {
    const data = await createStudent(body, user!.id);
    return {
      data,
      status: 201,
    };
  },
);
