import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/home", "/new", "/library", "/reports/", "/research/", "/share/", "/setup", "/sign-in", "/sign-up", "/sso-callback", "/dev/"] },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}
