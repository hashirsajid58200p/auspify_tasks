import mongoose from "mongoose";
import { User, IUser } from "@/server/models/user";
import { Session } from "@/server/models/session";
import { Category } from "@/server/models/category";
import { Transaction } from "@/server/models/transaction";
import { Budget } from "@/server/models/budget";
import { connectToDatabase } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { revokeAllUserSessions } from "@/server/auth/session";
import { HttpError, ForbiddenError, NotFoundError } from "@/server/http";
import {
  UpdateProfileInput,
  ChangePasswordInput,
} from "@/validations/account";

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<{
  id: string;
  name: string;
  email: string;
  currency: string;
  locale: string;
  isDemo: boolean;
}> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const user = await User.findById(userObjectId);
  if (!user) {
    throw new Error("User not found");
  }

  if (input.name) user.name = input.name;
  if (input.currency) user.currency = input.currency;
  if (input.locale) user.locale = input.locale;

  await user.save();

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    currency: user.currency,
    locale: user.locale,
    isDemo: user.isDemo,
  };
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
  currentFamilyId?: string
): Promise<void> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const user = await User.findById(userObjectId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.isDemo) {
    throw new ForbiddenError("Demo account password cannot be modified");
  }

  const isValid = await verifyPassword(user.passwordHash, input.currentPassword);
  if (!isValid) {
    throw new HttpError(400, "BAD_REQUEST", "Incorrect current password");
  }

  const newHash = await hashPassword(input.newPassword);
  user.passwordHash = newHash;
  await user.save();

  // Revoke all other sessions
  await revokeAllUserSessions(userId, currentFamilyId);
}

export async function exportUserData(userId: string) {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const user = await User.findById(userObjectId).select("-passwordHash");
  if (!user) {
    throw new Error("User not found");
  }

  const categories = await Category.find({ userId: userObjectId }).sort({ name: 1 });
  const transactions = await Transaction.find({ userId: userObjectId }).sort({
    occurredOn: -1,
  });
  const budgets = await Budget.find({ userId: userObjectId });

  return {
    exportDate: new Date().toISOString(),
    version: "1.0",
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      currency: user.currency,
      locale: user.locale,
      createdAt: user.createdAt,
    },
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      type: c.type,
      color: c.color,
      icon: c.icon,
      isSystem: c.isSystem,
    })),
    budgets: budgets.map((b) => ({
      id: b._id.toString(),
      categoryId: b.categoryId.toString(),
      limitMinor: b.limitMinor,
    })),
    transactions: transactions.map((t) => ({
      id: t._id.toString(),
      type: t.type,
      amountMinor: t.amountMinor,
      categoryId: t.categoryId ? t.categoryId.toString() : null,
      occurredOn: t.occurredOn.toISOString().slice(0, 10),
      note: t.note,
      createdAt: t.createdAt,
    })),
  };
}

export async function deleteAccount(
  userId: string,
  passwordConfirm: string
): Promise<void> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const user = await User.findById(userObjectId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.isDemo) {
    throw new ForbiddenError("Demo account cannot be deleted");
  }

  const isValid = await verifyPassword(user.passwordHash, passwordConfirm);
  if (!isValid) {
    throw new HttpError(
      400,
      "BAD_REQUEST",
      "Incorrect password provided for account deletion"
    );
  }

  // Complete cascade delete across all linked collections
  await Promise.all([
    Session.deleteMany({ userId: userObjectId }),
    Transaction.deleteMany({ userId: userObjectId }),
    Budget.deleteMany({ userId: userObjectId }),
    Category.deleteMany({ userId: userObjectId }),
    User.findByIdAndDelete(userObjectId),
  ]);
}
