import { test, expect } from "@playwright/test";

test("public metadata and crawler files keep private routes out of search", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Hunchlane/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https?:\/\/[^/]+\/?$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await page.goto("/sample");
  await expect(page).toHaveTitle("Illustrative sample report · Hunchlane");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/sample$/);
  await page.goto("/sign-in");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /share/");
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("/sample</loc>");
  expect(xml).not.toContain("/reports/");
  const image = await request.get("/opengraph-image");
  expect(image.ok()).toBeTruthy();
  expect(image.headers()["content-type"]).toContain("image/png");
});
