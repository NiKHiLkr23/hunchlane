import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { reportMarkdown } from "../../src/core/report-export";
import { sampleReport } from "../../src/core/sample";

const expected = reportMarkdown(sampleReport, true);

test("copies and downloads the whole saved report regardless of the active tab", async ({ page }) => {
  const researchCalls: string[] = [];
  page.on("request", request => {
    if (request.method() === "POST" && request.url().includes("/api/")) researchCalls.push(request.url());
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (value: string) => { sessionStorage.setItem("exported-report", value); },
    } });
  });
  await page.goto("/sample");
  await page.getByRole("tab", { name: "Your angle", exact: true }).click();
  await page.getByRole("button", { name: "Copy report", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Report copied as Markdown.");
  expect(await page.evaluate(() => sessionStorage.getItem("exported-report"))).toBe(expected);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("find-a-time-keep-the-friendship-v1.md");
  expect(await readFile((await download.path())!, "utf8")).toBe(expected);
  expect(researchCalls).toEqual([]);
  await page.getByRole("button", { name: "Download Markdown", exact: true }).focus();
  await expect(page.getByRole("button", { name: "Download Markdown", exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `artifacts/report-export-${test.info().project.name}.png`, fullPage: true });
});

test("offers selectable Markdown when clipboard permission is denied", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async () => { throw new DOMException("Blocked", "NotAllowedError"); },
    } });
  });
  await page.goto("/sample");
  await page.getByRole("button", { name: "Copy report", exact: true }).click();
  const manual = page.getByRole("textbox", { name: "Report Markdown", exact: true });
  await expect(manual).toHaveValue(expected);
  await manual.focus();
  expect(await manual.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart)).toBe(expected.length);
  await expect(page.getByRole("button", { name: "Copy report", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown", exact: true }).click();
  expect(await readFile((await (await downloadPromise).path())!, "utf8")).toBe(expected);
  await page.screenshot({ path: `artifacts/report-export-fallback-${test.info().project.name}.png`, fullPage: true });
});

test("exports a completed chat report without opening its details or creating another run", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (value: string) => { sessionStorage.setItem("exported-report", value); },
    } });
  });
  await page.goto("/dev/agent-preview?scenario=complete");
  await page.getByRole("textbox", { name: "Tell us what you have in mind." }).fill("A meal kit for people cooking for one");
  await page.getByRole("button", { name: "Research my idea", exact: true }).click();
  await page.getByRole("button", { name: "Auto-answer remaining questions", exact: true }).click();
  const result = page.getByRole("region", { name: "Final research result" });
  await expect(result).toBeVisible({ timeout: 20000 });
  await result.getByRole("button", { name: "Copy report", exact: true }).click();
  expect(await page.evaluate(() => sessionStorage.getItem("exported-report"))).toContain("A meal kit for people cooking for one");
  await result.getByText("Read the full report", { exact: true }).click();
  await expect(result.getByRole("button", { name: "Download Markdown", exact: true })).toHaveCount(1);
  await page.screenshot({ path: `artifacts/report-export-chat-${test.info().project.name}.png`, fullPage: true });
});
