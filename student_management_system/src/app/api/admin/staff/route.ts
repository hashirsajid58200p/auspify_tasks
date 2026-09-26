import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { createStaffSchema, CreateStaffInput } from "@/validations/staff";
import { listStaffUsers, createStaffUser } from "@/server/services/staff";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    requireRole(user, "ADMIN");
    const data = await listStaffUsers();
    return {
      data,
    };
  },
);

export const POST = apiHandler<CreateStaffInput>(
  {
    auth: true,
    bodySchema: createStaffSchema,
  },
  async ({ body, user }) => {
    requireRole(user, "ADMIN");
    const data = await createStaffUser(body, user!.id);
    return {
      data,
      status: 201,
    };
  },
);
