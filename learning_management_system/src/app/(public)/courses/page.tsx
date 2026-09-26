import { Metadata } from "next";
import { connectToDatabase } from "@/server/db";
import { Category } from "@/server/models/category";
import { CatalogView } from "@/components/catalog/catalog-view";

export const metadata: Metadata = {
  title: "Course Catalog | EduFlow LMS",
  description:
    "Explore our complete catalog of industry-grade software engineering, system design, and computer science courses.",
  openGraph: {
    title: "Course Catalog | EduFlow LMS",
    description: "Explore our complete catalog of industry-grade courses.",
    type: "website",
  },
};

export default async function CoursesCatalogPage() {
  await connectToDatabase();
  const rawCategories = await Category.find().sort({ name: 1 }).lean();

  const categories = rawCategories.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    slug: c.slug,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CatalogView initialCategories={categories} />
    </div>
  );
}
