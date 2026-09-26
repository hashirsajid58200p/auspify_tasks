import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Auspify Expense Tracker",
    short_name: "Auspify",
    description: "Enterprise-grade multi-tenant personal finance and cash flow intelligence platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5F3",
    theme_color: "#37322F",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
