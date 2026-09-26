import { apiHandler } from "@/server/http";
import { publicJobsQuerySchema, PublicJobsQueryInput } from "@/validations/catalog";
import { searchPublishedJobs } from "@/server/services/catalog";

export const GET = apiHandler<unknown, PublicJobsQueryInput>(
  {
    auth: false,
    querySchema: publicJobsQuerySchema,
  },
  async ({ query }) => {
    const result = await searchPublishedJobs(query);
    return {
      data: result.jobs,
      meta: result.meta,
    };
  },
);
