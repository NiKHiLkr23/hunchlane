import { test, expect } from "@playwright/test";
const idea = "A meal kit for people cooking for one";
async function start(page: import("@playwright/test").Page, scenario = "running") {
  await page.goto(`/dev/agent-preview?scenario=${scenario}`);
  await page.getByRole("textbox", { name: "Tell us what you have in mind." }).fill(idea);
  await page.getByRole("button", { name: "Research my idea", exact: true }).click();
  await expect(page.getByRole("region", { name: "Idea conversation" })).toBeVisible();
}
test("one submission begins a continuous thread with nonblocking questions and live input", async ({ page }) => {
  const realCalls: string[] = []; let starts = 0;
  page.on("request", r => { if (r.method() === "POST" && r.url().includes("/api/runs")) realCalls.push(r.url()); if (r.method() === "POST" && r.url().includes("/dev/agent-preview/api") && r.postDataJSON().mode) starts++; });
  await page.goto("/dev/agent-preview");
  await page.getByRole("textbox", { name: "Tell us what you have in mind." }).fill(idea);
  await page.getByRole("button", { name: "Research my idea", exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByRole("region", { name: "Optional clarification" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Add context or a direction" })).toBeEnabled();
  await page.getByRole("button", { name: "Use your judgment", exact: true }).first().click();
  await expect(page.getByRole("region", { name: "Idea conversation" }).getByText("Use your judgment.", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Add context or a direction" }).fill("Use reusable packaging and focus on Bengaluru.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Use reusable packaging and focus on Bengaluru.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Start research|Resume research|Check saved reply/ })).toHaveCount(0);
  expect(starts).toBe(1); expect(realCalls).toEqual([]);
  await page.screenshot({ path: `artifacts/agent-running-${test.info().project.name}.png`, fullPage: true });
});
test("unanswered questions do not stop completion and the report stays in the thread", async ({ page }) => {
  await start(page, "complete");
  await expect(page.getByRole("region", { name: "Final research result" })).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(/\/dev\/agent-preview/);
  await expect(page.getByRole("region", { name: "Optional clarification" })).toHaveCount(0);
  await page.getByText("Read the full report", { exact: true }).click();
  await expect(page.getByRole("tab", { name: "What exists" })).toBeVisible();
  await page.getByRole("tab", { name: "Sources", exact: true }).click();
  await expect(page.getByText("Illustrative links for this sample. They were not retrieved by a live research run.", { exact: false })).toBeVisible();
  await page.screenshot({ path: `artifacts/agent-report-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole("textbox", { name: "Add context or a direction" }).fill("Explore a different audience.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Saved for a follow-up; the report keeps its original scope.")).toBeVisible();
});
test("connection failures recover message delivery using the same identity", async ({ page }) => {
  await start(page); let attempts = 0; const ids: string[] = [];
  await page.route("**/dev/agent-preview/api", async route => {
    const request = route.request();
    if (request.method() === "POST" && request.postDataJSON().runId) {
      ids.push(request.postDataJSON().id); attempts++;
      if (attempts === 1) { await route.abort(); return; }
    }
    await route.continue();
  });
  await page.getByRole("textbox", { name: "Add context or a direction" }).fill("Include people who work late shifts.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Include people who work late shifts.", { exact: true })).toBeVisible({ timeout: 15000 });
  expect(ids.length).toBeGreaterThanOrEqual(2); expect(new Set(ids).size).toBe(1);
});
test("quiet recovery and final failure preserve usable input with mobile and keyboard accessibility", async ({ page }) => {
  await start(page, "recovering");
  await expect(page.getByRole("button", { name: /Resume|Retry|Check saved/ })).toHaveCount(0);
  const input = page.getByRole("textbox", { name: "Add context or a direction" });
  await input.fill("A long direction ".repeat(80));
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await input.focus(); expect(await input.evaluate(e => getComputedStyle(e.closest("form")!).outlineStyle)).not.toBe("none");
  expect(await page.locator(".agent-chat .spinner").first().evaluate(e => getComputedStyle(e).animationName)).toBe("none");
  await page.screenshot({ path: `artifacts/agent-narrow-${test.info().project.name}.png`, fullPage: true });
  await start(page, "failure");
  await expect(page.getByText("I couldn’t retrieve enough usable evidence for a reliable report. Your idea is saved.")).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: /Resume|Retry|Check saved/ })).toHaveCount(0);
});
test("a normal saved draft never starts autonomous research on load", async ({ page }) => {
  let starts = 0;
  await page.addInitScript(() => localStorage.setItem("hunchlane.preview.idea-draft.v2", JSON.stringify({ version: 2, brief: { idea: "A local service for repairing household items", category: "service", audience: "", location: "", answers: {} }, step: "describe", buffer: "", messages: [], reply: null, intakeId: null, turn: 0, pending: null, requestId: null })));
  page.on("request", r => { if (r.method() === "POST" && r.url().includes("/dev/agent-preview/api")) starts++; });
  await page.goto("/dev/agent-preview");
  await expect(page.getByRole("textbox", { name: "Tell us what you have in mind." })).toHaveValue("A local service for repairing household items");
  await page.reload(); expect(starts).toBe(0);
});
test("only a matching submitted authentication intent automatically continues", async ({ page }) => {
  const id="00000000-0000-4000-8000-000000000002";
  let starts=0;
  await page.addInitScript(({id,idea})=>sessionStorage.setItem("hunchlane.preview.agent.start.v1",JSON.stringify({id,brief:{idea,category:"physical",audience:"",location:"",answers:{}},owner:null,createdAt:Date.now()})),{id,idea});
  page.on("request",r=>{if(r.method()==="POST"&&r.url().includes("/dev/agent-preview/api")&&r.postDataJSON().mode)starts++;});
  await page.goto(`/dev/agent-preview?start=00000000-0000-4000-8000-000000000099`);
  await expect(page.getByRole("textbox",{name:"Tell us what you have in mind."})).toBeVisible();
  // No match must not authorize a submission, even when an intent is present.
  await page.waitForTimeout(5500); expect(starts).toBe(0);
  await page.goto(`/dev/agent-preview?start=${id}`);
  await expect(page.getByRole("region",{name:"Idea conversation"})).toBeVisible(); expect(starts).toBe(1);
});
