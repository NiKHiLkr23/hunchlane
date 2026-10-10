import { test, expect } from "@playwright/test";

const draft = { idea: "A meal kit for people cooking for one", category: "physical", audience: "People living alone", location: "Bengaluru", answers: {} };
test("home prioritizes active research and offers a separate preserved device draft", async ({ page }) => {
  const research: string[] = [];
  page.on("request", request => { if (request.method() === "POST" && /\/api\/runs/.test(request.url())) research.push(request.url()); });
  await page.addInitScript(value => localStorage.setItem("hunchlane.idea-draft.v1", JSON.stringify(value)), draft);
  await page.goto("/dev/home-preview");
  await expect(page.getByRole("heading", { name: "A quiet coworking space for night owls", exact: true, level: 2 })).toBeVisible();
  await expect(page.getByRole("link", { name: "View progress", exact: true })).toHaveAttribute("href", "/research/00000000-0000-4000-8000-000000000002");
  await expect(page.getByText("Checking the closest matches")).toBeVisible();
  await expect(page.getByRole("link", { name: "You also have a draft saved on this device" })).toHaveAttribute("href", "/new");
  await expect(page.getByRole("heading", { name: "Recent work" })).toBeVisible();
  await page.screenshot({ path: `artifacts/home-active-${test.info().project.name}.png`, fullPage: true });
  const toggle = page.locator('summary[aria-label="Navigation menu"]');
  if (await toggle.isVisible()) {
    await toggle.focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "My ideas" })).toBeVisible();
    await page.keyboard.press("Escape"); await expect(toggle).toBeFocused();
  }
  await page.getByRole("link", { name: "New idea", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/new\?fresh=1$/);
  await expect(page.getByRole("textbox", { name: "Tell us what you have in mind." })).toHaveValue("");
  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hunchlane.idea-draft.v1")!))).toEqual(draft);
  await page.getByRole("textbox", { name: "Tell us what you have in mind." }).fill("Too short");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Tell us what you have in mind." })).toHaveValue("Too short");
  await page.getByRole("button", { name: "Explore my idea", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hunchlane.idea-draft.v1")!))).toEqual(draft);
  await page.getByRole("textbox", { name: "Tell us what you have in mind." }).fill("An app for neighbours to lend each other tools");
  await page.getByRole("button", { name: "Explore my idea", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Let’s shape your idea." })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hunchlane.idea-draft.v2")!).brief.idea)).toBe("An app for neighbours to lend each other tools");
  expect(research).toEqual([]);
});

test("home resumes a draft before a report and handles empty, paused and connection states", async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem("hunchlane.idea-draft.v1", JSON.stringify(value)), draft);
  await page.goto("/dev/home-preview?state=report");
  await expect(page.getByText("Saved on this device", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Continue draft", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Tell us what you have in mind." })).toHaveValue(draft.idea);
  await page.getByRole("button",{name:"Explore my idea",exact:true}).click();
  await expect(page.getByRole("radio", { name: "Physical product", exact: true })).toBeChecked();
  // Removing the init script requires a fresh page/context for the remaining states.
  const clean = await page.context().browser()!.newContext({ viewport: page.viewportSize()!, reducedMotion: "reduce" });
  const other = await clean.newPage();
  await other.goto("http://localhost:3110/dev/home-preview?state=report");
  await expect(other.getByRole("link", { name: "Open report", exact: true })).toHaveAttribute("href", "/reports/00000000-0000-4000-8000-000000000001");
  await other.screenshot({ path: `artifacts/home-report-${test.info().project.name}.png`, fullPage: true });
  await other.getByRole("link", { name: "empty", exact: true }).click();
  await expect(other.getByRole("heading", { name: "A sentence is enough." })).toBeVisible();
  await expect(other.getByRole("link", { name: "Explore your first idea" })).toBeVisible();
  await other.screenshot({ path: `artifacts/home-empty-${test.info().project.name}.png`, fullPage: true });
  await other.getByRole("link", { name: "paused", exact: true }).click();
  await expect(other.getByText("Research paused", { exact: true }).first()).toBeVisible();
  await expect(other.getByRole("link", { name: "View progress", exact: true })).toBeVisible();
  await other.getByRole("link", { name: "error", exact: true }).click();
  await expect(other.getByRole("heading", { name: "We couldn’t open your saved work." })).toBeVisible();
  await other.getByRole("button", { name: "Try again" }).focus();
  await expect(other.getByRole("button", { name: "Try again" })).toBeFocused();
  await other.keyboard.press("Enter");
  await expect(other.getByRole("heading", { name: "We couldn’t open your saved work." })).toBeVisible();
  await other.screenshot({ path: `artifacts/home-error-${test.info().project.name}.png`, fullPage: true });
  await other.getByRole("link", { name: "loading", exact: true }).click();
  await expect(other.getByText("Opening your idea desk…")).toBeVisible();
  await other.screenshot({ path: `artifacts/home-loading-${test.info().project.name}.png`, fullPage: true });
  await other.getByRole("link", { name: "long", exact: true }).click();
  await other.setViewportSize({ width: 320, height: 800 });
  await expect(other.getByRole("link", { name: "View progress", exact: true })).toBeVisible();
  expect(await other.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await other.screenshot({ path: `artifacts/home-narrow-${test.info().project.name}.png`, fullPage: true });
  await clean.close();
});

test("signed-out home requires authentication and direct sign-in defaults home", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/sign-in\?redirect_url=%2Fhome$/);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/sign-up\?redirect_url=%2Fhome$/);
});
