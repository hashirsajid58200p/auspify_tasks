import mongoose from "mongoose";
import { Transaction, ITransaction } from "@/server/models/transaction";
import { Category } from "@/server/models/category";
import { connectToDatabase } from "@/server/db";
import { NotFoundError } from "@/server/http";
import { toUtcMidnight, getUtcEndOfDay } from "@/lib/dates";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilterInput,
} from "@/validations/transaction";

export interface PaginatedTransactions {
  items: ITransaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
): Promise<ITransaction> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const categoryObjectId = new mongoose.Types.ObjectId(input.categoryId);

  // Verify category belongs to user
  const category = await Category.findOne({
    _id: categoryObjectId,
    userId: userObjectId,
  });

  if (!category) {
    throw new NotFoundError("Category not found for this user");
  }

  const occurredOn = toUtcMidnight(input.occurredOn);

  const transaction = await Transaction.create({
    userId: userObjectId,
    type: input.type,
    amountMinor: input.amountMinor,
    categoryId: categoryObjectId,
    occurredOn,
    note: input.note || "",
  });

  return transaction.populate("categoryId", "name color icon type");
}

export async function listTransactions(
  userId: string,
  filter: TransactionFilterInput
): Promise<PaginatedTransactions> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const query: Record<string, any> = {
    userId: userObjectId,
  };

  if (filter.type) {
    query.type = filter.type;
  }

  if (filter.categoryId) {
    query.categoryId = new mongoose.Types.ObjectId(filter.categoryId);
  }

  if (filter.startDate || filter.endDate) {
    query.occurredOn = {};
    if (filter.startDate) {
      query.occurredOn.$gte = toUtcMidnight(filter.startDate);
    }
    if (filter.endDate) {
      query.occurredOn.$lte = getUtcEndOfDay(filter.endDate);
    }
  }

  if (filter.search && filter.search.trim()) {
    query.note = {
      $regex: escapeRegex(filter.search.trim()),
      $options: "i",
    };
  }

  const page = Math.max(1, filter.page || 1);
  const limit = Math.min(50, Math.max(1, filter.limit || 20));
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    Transaction.countDocuments(query),
    Transaction.find(query)
      .sort({ occurredOn: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name color icon type"),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getTransactionById(
  userId: string,
  transactionId: string
): Promise<ITransaction> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const txObjectId = new mongoose.Types.ObjectId(transactionId);

  const transaction = await Transaction.findOne({
    _id: txObjectId,
    userId: userObjectId,
  }).populate("categoryId", "name color icon type");

  if (!transaction) {
    throw new NotFoundError("Transaction not found");
  }

  return transaction;
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: UpdateTransactionInput
): Promise<ITransaction> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const txObjectId = new mongoose.Types.ObjectId(transactionId);

  const transaction = await Transaction.findOne({
    _id: txObjectId,
    userId: userObjectId,
  });

  if (!transaction) {
    throw new NotFoundError("Transaction not found");
  }

  if (input.categoryId) {
    const categoryObjectId = new mongoose.Types.ObjectId(input.categoryId);
    const category = await Category.findOne({
      _id: categoryObjectId,
      userId: userObjectId,
    });
    if (!category) {
      throw new NotFoundError("Category not found for this user");
    }
    transaction.categoryId = categoryObjectId;
  }

  if (input.type) {
    transaction.type = input.type;
  }

  if (input.amountMinor !== undefined) {
    transaction.amountMinor = input.amountMinor;
  }

  if (input.occurredOn) {
    transaction.occurredOn = toUtcMidnight(input.occurredOn);
  }

  if (input.note !== undefined) {
    transaction.note = input.note;
  }

  await transaction.save();
  return transaction.populate("categoryId", "name color icon type");
}

export async function deleteTransaction(
  userId: string,
  transactionId: string
): Promise<void> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const txObjectId = new mongoose.Types.ObjectId(transactionId);

  const result = await Transaction.deleteOne({
    _id: txObjectId,
    userId: userObjectId,
  });

  if (result.deletedCount === 0) {
    throw new NotFoundError("Transaction not found");
  }
}
