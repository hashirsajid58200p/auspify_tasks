import { Metadata } from "next";
import { connectToDatabase } from "@/server/db";
import { Category } from "@/server/models/category";
import { requireServerUser } from "@/server/auth/server-session";
import { AdminCategoriesView } from "@/components/admin/admin-categories-view";

export const metadata: Metadata = {
  title: "Categories Management | Admin Portal",
  description: "Organize platform courses into searchable educational disciplines.",
};

export default async function AdminCategoriesPage() {
  await requireServerUser(["ADMIN"]);
  await connectToDatabase();

  const categories = await Category.find({})
    .sort({ name: 1 })
    .lean();

  const formatted = categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description || null,
  }));

  return <AdminCategoriesView initialCategories={formatted} />;
}
