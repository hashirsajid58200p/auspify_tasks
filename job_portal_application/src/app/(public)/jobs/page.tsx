import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { searchPublishedJobs } from "@/server/services/catalog";
import { getAllCategories } from "@/server/services/categories";
import { publicJobsQuerySchema, PublicJobsQueryInput } from "@/validations/catalog";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";

export const metadata: Metadata = {
  title: "Browse Jobs | Find Your Next Career Role",
  description:
    "Explore verified, published job openings across engineering, design, product, and technology companies.",
};

export const dynamic = "force-dynamic";

interface JobsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const resolvedSearchParams = await searchParams;

  const rawQuery: Record<string, string> = {};
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === "string") {
      rawQuery[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      rawQuery[key] = value[0];
    }
  }

  const parsed = publicJobsQuerySchema.safeParse(rawQuery);
  const filterParams: PublicJobsQueryInput = parsed.success
    ? parsed.data
    : {
        q: "",
        sort: "newest",
        page: 1,
        limit: 10,
      };

  const [catalogResult, rawCategories] = await Promise.all([
    searchPublishedJobs(filterParams),
    getAllCategories(),
  ]);

  const categories = rawCategories.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    jobCount: c.jobCount || 0,
  }));

  // Convert Mongoose lean plain documents with string IDs for client serialization
  const serializedJobs = catalogResult.jobs.map((job: any) => ({
    _id: job._id.toString(),
    title: job.title,
    slug: job.slug,
    description: job.description,
    type: job.type,
    locationType: job.locationType,
    location: job.location,
    experienceLevel: job.experienceLevel,
    skills: job.skills || [],
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency || "USD",
    publishedAt: job.publishedAt ? new Date(job.publishedAt).toISOString() : null,
    createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    companyId: job.companyId
      ? {
          _id: job.companyId._id?.toString(),
          name: job.companyId.name,
          slug: job.companyId.slug,
          logoUrl: job.companyId.logoUrl,
          location: job.companyId.location,
          industry: job.companyId.industry,
        }
      : undefined,
    categoryId: job.categoryId
      ? {
          _id: job.categoryId._id?.toString(),
          name: job.categoryId.name,
          slug: job.categoryId.slug,
        }
      : undefined,
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Badge className="bg-[#2F81F7] text-white border-2 border-black font-bold uppercase text-xs">
          Job Catalog
        </Badge>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Find Your Next Role</h1>
        <p className="text-muted-foreground font-medium text-base max-w-2xl">
          Browse verified, published positions across top technology, design, and engineering firms.
        </p>
      </div>

      {/* Catalog Explorer */}
      <CatalogExplorer
        initialJobs={serializedJobs}
        meta={catalogResult.meta}
        categories={categories}
        initialFilters={{
          q: filterParams.q,
          categoryId: filterParams.categoryId,
          type: filterParams.type,
          locationType: filterParams.locationType,
          experienceLevel: filterParams.experienceLevel,
          salaryMin: filterParams.salaryMin,
          sort: filterParams.sort,
          page: filterParams.page,
        }}
      />
    </div>
  );
}
