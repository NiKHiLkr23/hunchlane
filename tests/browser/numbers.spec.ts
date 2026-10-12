import { test, expect } from "@playwright/test";

test("Numbers shows a readable coming-soon placeholder without controls or financial requests", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", request => {
    if (request.method() !== "GET" && request.method() !== "HEAD") writes.push(request.url());
  });
  await page.goto("/sample");
  await page.getByRole("tab", { name: "The numbers", exact: true }).click();
  const panel = page.getByRole("tabpanel", { name: "The numbers", exact: true });
  await expect(panel.getByRole("heading", { name: "Numbers coming soon", exact: true })).toBeVisible();
  await expect(panel).toContainText("Explore pricing, costs, and break-even for your idea.");
  await expect(panel.getByRole("spinbutton")).toHaveCount(0);
  await expect(panel.getByRole("slider")).toHaveCount(0);
  await expect(panel.getByRole("button")).toHaveCount(0);
  await expect(panel.locator("input, select, textarea")).toHaveCount(0);
  expect(await panel.locator(".numbers-placeholder").textContent()).toBe("");
  await expect(panel.locator(".numbers-placeholder")).toHaveAttribute("aria-hidden", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `artifacts/numbers-coming-soon-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole("tab", { name: "The numbers", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("tab", { name: "Sources", exact: true })).toHaveAttribute("aria-selected", "true");
  expect(writes).toEqual([]);
});
