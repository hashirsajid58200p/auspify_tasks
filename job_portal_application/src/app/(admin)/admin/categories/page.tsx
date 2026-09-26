import { Metadata } from "next";
import { requireServerUser } from "@/server/auth/server-session";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const metadata: Metadata = {
  title: "Category Management | Admin Console",
  description: "Manage sector taxonomies and review job listing counts.",
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireServerUser(["ADMIN"]);

  return <CategoriesManager />;
}
