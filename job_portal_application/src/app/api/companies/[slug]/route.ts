import { apiHandler } from "@/server/http";
import { getPublicCompanyBySlug } from "@/server/services/catalog";

export const GET = apiHandler(
  {
    auth: false,
  },
  async ({ params }) => {
    const slug = typeof params.slug === "string" ? params.slug : "";
    const result = await getPublicCompanyBySlug(slug);
    return {
      data: result,
    };
  },
);
