import type { Metadata } from "next";

// Use the explicit production hostname, never a request Host header or preview URL.
export const siteUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100");
export const siteTitle = "Hunchlane: Give your idea a clearer next step";
export const siteDescription = "Explore existing alternatives, cited evidence, and possible angles for your app, product, or service idea. Find a small next experiment worth testing.";
const image = { url: "/opengraph-image", width: 1200, height: 630, alt: "Hunchlane: Give your idea a clearer next step" };
export function publicMetadata(title: string, description: string, path: string): Metadata {
  return {
    title: { absolute: title }, description,
    alternates: { canonical: path },
    robots: { index: process.env.VERCEL_ENV !== "preview", follow: true },
    openGraph: { type: "website", locale: "en_US", siteName: "Hunchlane", title, description, url: path, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
