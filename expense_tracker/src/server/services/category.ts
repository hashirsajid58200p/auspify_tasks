import mongoose from "mongoose";
import { Category, ICategory } from "@/server/models/category";
import { Transaction } from "@/server/models/transaction";
import { connectToDatabase } from "@/server/db";
import { NotFoundError, ForbiddenError, ConflictError } from "@/server/http";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/validations/category";

export const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
  isSystem: boolean;
}> = [
  // Income
  { name: "Salary", type: "INCOME", color: "#10b981", icon: "briefcase", isSystem: true },
  { name: "Freelance", type: "INCOME", color: "#06b6d4", icon: "laptop", isSystem: true },
  { name: "Investments", type: "INCOME", color: "#8b5cf6", icon: "trending-up", isSystem: true },
  { name: "Other Income", type: "INCOME", color: "#64748b", icon: "plus-circle", isSystem: true },

  // Expenses
  { name: "Housing", type: "EXPENSE", color: "#3b82f6", icon: "home", isSystem: true },
  { name: "Food & Dining", type: "EXPENSE", color: "#f97316", icon: "utensils", isSystem: true },
  { name: "Transportation", type: "EXPENSE", color: "#0ea5e9", icon: "car", isSystem: true },
  { name: "Utilities", type: "EXPENSE", color: "#eab308", icon: "zap", isSystem: true },
  { name: "Entertainment", type: "EXPENSE", color: "#ec4899", icon: "film", isSystem: true },
  { name: "Health", type: "EXPENSE", color: "#ef4444", icon: "activity", isSystem: true },
  { name: "Shopping", type: "EXPENSE", color: "#a855f7", icon: "shopping-bag", isSystem: true },
  { name: "Other Expense", type: "EXPENSE", color: "#64748b", icon: "more-horizontal", isSystem: true },
];

export async function seedDefaultCategories(userId: string): Promise<void> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const existing = await Category.countDocuments({ userId: userObjectId });
  if (existing > 0) return;

  const docs = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    userId: userObjectId,
  }));

  await Category.insertMany(docs);
}

export async function listCategories(userId: string): Promise<ICategory[]> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  return Category.find({ userId: userObjectId }).sort({ type: 1, name: 1 });
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput
): Promise<ICategory> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check unique compound: (userId, name, type)
  const existing = await Category.findOne({
    userId: userObjectId,
    name: input.name,
    type: input.type,
  });

  if (existing) {
    throw new ConflictError(
      `A ${input.type.toLowerCase()} category named "${input.name}" already exists`
    );
  }

  const category = await Category.create({
    userId: userObjectId,
    name: input.name,
    type: input.type,
    color: input.color,
    icon: input.icon,
    isSystem: false,
  });

  return category;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput
): Promise<ICategory> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const catObjectId = new mongoose.Types.ObjectId(categoryId);

  const category = await Category.findOne({
    _id: catObjectId,
    userId: userObjectId,
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  if (input.name && input.name !== category.name) {
    const existing = await Category.findOne({
      userId: userObjectId,
      name: input.name,
      type: category.type,
      _id: { $ne: catObjectId },
    });
    if (existing) {
      throw new ConflictError(
        `A ${category.type.toLowerCase()} category named "${input.name}" already exists`
      );
    }
    category.name = input.name;
  }

  if (input.color) category.color = input.color;
  if (input.icon) category.icon = input.icon;

  await category.save();
  return category;
}

export async function deleteCategory(
  userId: string,
  categoryId: string,
  reassignToCategoryId?: string
): Promise<void> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const catObjectId = new mongoose.Types.ObjectId(categoryId);

  const category = await Category.findOne({
    _id: catObjectId,
    userId: userObjectId,
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  if (category.isSystem) {
    throw new ForbiddenError("Default system categories cannot be deleted");
  }

  // Determine target category for reassignment
  let targetCategoryId: mongoose.Types.ObjectId;

  if (reassignToCategoryId) {
    const target = await Category.findOne({
      _id: new mongoose.Types.ObjectId(reassignToCategoryId),
      userId: userObjectId,
    });
    if (!target) {
      throw new NotFoundError("Reassignment target category not found");
    }
    targetCategoryId = target._id as mongoose.Types.ObjectId;
  } else {
    // Fallback to system Other category
    const defaultOtherName =
      category.type === "INCOME" ? "Other Income" : "Other Expense";
    let fallback = await Category.findOne({
      userId: userObjectId,
      name: defaultOtherName,
    });

    if (!fallback) {
      fallback = await Category.findOne({
        userId: userObjectId,
        type: category.type,
      });
    }

    if (!fallback) {
      throw new Error("No fallback category found for reassignment");
    }
    targetCategoryId = fallback._id as mongoose.Types.ObjectId;
  }

  // Reassign all associated transactions before deletion
  await Transaction.updateMany(
    { categoryId: catObjectId, userId: userObjectId },
    { categoryId: targetCategoryId }
  );

  await Category.deleteOne({ _id: catObjectId, userId: userObjectId });
}
