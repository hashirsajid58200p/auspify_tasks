import { connectToDatabase } from "@/server/db";
import { Category, ICategory } from "@/server/models/category";

export async function getAllCategories(): Promise<ICategory[]> {
  await connectToDatabase();
  const categories = await Category.find({})
    .select("_id name slug description jobCount")
    .sort({ name: 1 })
    .lean();

  return categories as unknown as ICategory[];
}
