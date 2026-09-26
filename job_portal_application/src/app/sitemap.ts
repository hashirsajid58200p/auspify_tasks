import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/server/db";
import { Job } from "@/server/models/job";
import { Company } from "@/server/models/company";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    await connectToDatabase();

    const [publishedJobs, companies] = await Promise.all([
      Job.find({ status: "PUBLISHED" }).select("slug updatedAt").lean(),
      Company.find({}).select("slug updatedAt").lean(),
    ]);

    const jobRoutes: MetadataRoute.Sitemap = publishedJobs.map((job) => ({
      url: `${baseUrl}/jobs/${job.slug}`,
      lastModified: job.updatedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const companyRoutes: MetadataRoute.Sitemap = companies.map((comp) => ({
      url: `${baseUrl}/companies/${comp.slug}`,
      lastModified: comp.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...jobRoutes, ...companyRoutes];
  } catch (err) {
    console.error("Failed to generate dynamic sitemap entries:", err);
    return staticRoutes;
  }
}
