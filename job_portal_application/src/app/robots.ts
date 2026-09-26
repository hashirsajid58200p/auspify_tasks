import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/jobs", "/jobs/*", "/companies", "/companies/*", "/privacy", "/terms"],
        disallow: [
          "/api/*",
          "/dashboard/*",
          "/employer/*",
          "/admin/*",
          "/profile/*",
          "/applications/*",
          "/saved-jobs/*",
          "/settings/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
