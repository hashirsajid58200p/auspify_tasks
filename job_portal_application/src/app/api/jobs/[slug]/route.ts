import { apiHandler } from "@/server/http";
import { getPublishedJobBySlug } from "@/server/services/catalog";

export const GET = apiHandler(
  {
    auth: false,
  },
  async ({ params }) => {
    const slug = typeof params.slug === "string" ? params.slug : "";
    const job = await getPublishedJobBySlug(slug);
    return {
      data: job,
    };
  },
);
