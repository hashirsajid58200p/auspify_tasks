import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eduflow.local";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courses", "/courses/*", "/privacy", "/terms"],
        disallow: [
          "/api/",
          "/dashboard",
          "/my-courses",
          "/learn/",
          "/quizzes/",
          "/assignments/",
          "/grades",
          "/certificates",
          "/settings",
          "/instructor/",
          "/admin/",
          "/verify/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
