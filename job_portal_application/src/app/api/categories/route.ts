import { apiHandler } from "@/server/http";
import { getAllCategories } from "@/server/services/categories";

export const dynamic = "force-dynamic";

export const GET = apiHandler(
  {
    auth: false,
  },
  async () => {
    const categories = await getAllCategories();
    return {
      data: categories.map((cat) => ({
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        jobCount: cat.jobCount || 0,
      })),
    };
  },
);
