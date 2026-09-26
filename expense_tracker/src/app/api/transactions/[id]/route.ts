import { apiHandler } from "@/server/http";
import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/server/services/transaction";
import {
  updateTransactionSchema,
  UpdateTransactionInput,
} from "@/validations/transaction";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const transaction = await getTransactionById(user!.userId, id);
    return {
      data: transaction,
    };
  }
);

export const PATCH = apiHandler<UpdateTransactionInput>(
  {
    auth: true,
    bodySchema: updateTransactionSchema,
  },
  async ({ user, params, body }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const updated = await updateTransaction(user!.userId, id, body);
    return {
      data: updated,
    };
  }
);

export const DELETE = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    await deleteTransaction(user!.userId, id);
    return {
      data: { success: true },
    };
  }
);
