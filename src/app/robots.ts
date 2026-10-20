import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/calculator"], disallow: ["/api/", "/workbench", "/enterprises", "/positions", "/tasks", "/ledgers", "/bills", "/plans", "/proposals", "/talents", "/users", "/audit", "/me"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
