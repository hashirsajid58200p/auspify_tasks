import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register", "/privacy", "/terms"],
      disallow: [
        "/api/",
        "/dashboard",
        "/transactions",
        "/reports",
        "/budgets",
        "/settings",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
