import { apiHandler, BadRequestError } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { updateStaffSchema, UpdateStaffInput } from "@/validations/staff";
import { updateStaffUser } from "@/server/services/staff";

export const PATCH = apiHandler<UpdateStaffInput>(
  {
    auth: true,
    bodySchema: updateStaffSchema,
  },
  async ({ params, body, user }) => {
    requireRole(user, "ADMIN");
    const id = params.id as string;
    if (!id) {
      throw new BadRequestError("User ID is required");
    }
    const data = await updateStaffUser(id, body, user!);
    return {
      data,
    };
  },
);
