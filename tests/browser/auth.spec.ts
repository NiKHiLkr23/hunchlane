import { test, expect } from "@playwright/test";

test("account entry preserves the local draft across sign-up, reload and recovery", async ({ page }) => {
  const researchRequests: string[] = [];
  page.on("request", request => { if (request.url().endsWith("/api/runs") && request.method() === "POST") researchRequests.push(request.url()); });
  const draft = { idea: "A repair service for everyday household items in my neighbourhood.", category: "service", audience: "Neighbours", location: "Bengaluru", answers: { customer: "Not sure yet" } };
  await page.goto("/");
  await page.evaluate(value => localStorage.setItem("hunchlane.idea-draft.v1", JSON.stringify(value)), draft);
  await page.goto("/sign-in?redirect_url=%2Fnew");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continue with Google", exact: true })).toBeDisabled();
  await expect(page.getByText("Sign-in is being connected. Your draft stays on this device.")).toBeVisible();
  const localDraft = page.getByRole("complementary", { name: "Your local draft" });
  await expect(localDraft.getByText("Saved on this device", { exact: true })).toBeVisible();
  await expect(localDraft).toContainText(draft.idea);
  await page.getByRole("link", { name: "Create an account", exact: true }).focus();
  await expect(page.getByRole("link", { name: "Create an account", exact: true })).toBeFocused();
  expect(await page.getByRole("link", { name: "Create an account", exact: true }).evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/sign-up\?redirect_url=%2Fnew$/);
  await expect(page.getByRole("heading", { name: "Your next idea starts here." })).toBeVisible();
  await page.reload();
  await expect(localDraft).toContainText(draft.idea);
  await localDraft.getByRole("link", { name: "Back to your idea" }).click();
  await expect(page).toHaveURL(/\/new$/);
  await expect(page.getByRole("textbox", { name: "Tell us what you have in mind." })).toHaveValue(draft.idea);
  await expect(page.getByRole("radio", { name: "A service or place", exact: true })).toBeChecked();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hunchlane.idea-draft.v1")!))).toEqual(draft);
  expect(researchRequests).toEqual([]);
});

test("account states stay usable on narrow screens with long or corrupt local drafts", async ({ page }) => {
  await page.goto("/");
  const idea = "A".repeat(3000);
  await page.evaluate(value => localStorage.setItem("hunchlane.idea-draft.v1", JSON.stringify({ idea: value, category: "physical", answers: {} })), idea);
  await page.goto("/sign-in?redirect_url=https%3A%2F%2Fevil.example");
  await expect(page.getByRole("link", { name: "Create an account", exact: true })).toHaveAttribute("href", "/sign-up?redirect_url=%2Flibrary");
  await expect(page.getByRole("complementary", { name: "Your local draft" })).toContainText(idea);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Continue with Google", exact: true })).toBeVisible();
  await page.screenshot({ path: `artifacts/auth-narrow-draft-${test.info().project.name}.png`, fullPage: true });
  await page.evaluate(() => localStorage.setItem("hunchlane.idea-draft.v1", "{broken"));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Your local draft" })).toHaveCount(0);
  await page.getByRole("link", { name: "Explore the sample report" }).click();
  await expect(page).toHaveURL(/\/sample$/);
  await expect(page.getByRole("heading", { name: "Find a time. Keep the friendship." })).toBeVisible();
});

test("an unavailable OAuth callback offers a safe return to the preserved idea", async ({ page }) => {
  await page.goto("/sso-callback?redirect_url=%2Fnew");
  await expect(page.getByRole("heading", { name: "Sign-in is being connected." })).toBeVisible();
  await page.getByRole("link", { name: "Back to sign-in" }).click();
  await expect(page).toHaveURL(/\/sign-in\?redirect_url=%2Fnew$/);
});
