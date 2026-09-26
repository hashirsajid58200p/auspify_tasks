import { apiHandler } from "@/server/http";
import {
  listTransactions,
  createTransaction,
} from "@/server/services/transaction";
import {
  createTransactionSchema,
  transactionFilterSchema,
  CreateTransactionInput,
  TransactionFilterInput,
} from "@/validations/transaction";

export const GET = apiHandler<unknown, TransactionFilterInput>(
  {
    auth: true,
    querySchema: transactionFilterSchema,
  },
  async ({ user, query }) => {
    const { items, meta } = await listTransactions(user!.userId, query);
    return {
      data: items,
      meta,
    };
  }
);

export const POST = apiHandler<CreateTransactionInput>(
  {
    auth: true,
    bodySchema: createTransactionSchema,
  },
  async ({ user, body }) => {
    const transaction = await createTransaction(user!.userId, body);
    return {
      data: transaction,
      status: 201,
    };
  }
);
