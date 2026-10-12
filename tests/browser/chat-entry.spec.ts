import { test, expect } from "@playwright/test";

const idea = "A meal kit for people cooking for one";

for (const submit of ["Enter", "send button"] as const) {
  test(`the introduction stays while editing and disappears on ${submit}`, async ({ page }) => {
    let starts = 0;
    page.on("request", request => {
      if (request.method() === "POST" && request.url().includes("/dev/agent-preview/api") && request.postDataJSON().mode) starts++;
    });
    await page.goto("/dev/agent-preview");
    const heading = page.getByRole("heading", { name: "What’s your hunch?" });
    const description = page.getByText("An app, a product, a service. Start with whatever is on your mind.");
    const input = page.getByRole("textbox", { name: "Tell us what you have in mind." });
    await expect(heading).toBeVisible();
    await input.fill("short");
    await input.press("Enter");
    await expect(heading).toBeVisible();
    await input.fill(idea);
    await input.press("Shift+Enter");
    await expect(input).toHaveValue(`${idea}\n`);
    await expect(heading).toBeVisible();
    await expect(description).toBeVisible();
    expect(starts).toBe(0);
    await page.reload();
    await expect(input).toHaveValue(`${idea}\n`);
    await expect(heading).toBeVisible();
    await page.screenshot({ path: `artifacts/chat-typing-${submit}-${test.info().project.name}.png`, fullPage: true });

    if (submit === "Enter") await input.press("Enter");
    else await page.getByRole("button", { name: "Research my idea", exact: true }).click();
    await expect(heading).toBeHidden();
    await expect(description).toBeHidden();
    const card = page.locator(".agent-question-card");
    await expect(card).toBeVisible();
    await expect(card.locator("legend")).not.toBeFocused();
    expect(await card.locator("legend").evaluate(element => getComputedStyle(element).outlineStyle)).toBe("none");
    expect(starts).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/chat-question-${submit}-${test.info().project.name}.png`, fullPage: true });

    const firstOption = card.getByRole("checkbox").first();
    await page.keyboard.press("Tab");
    await firstOption.focus();
    expect(await firstOption.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
    await firstOption.press("Space");
    await expect(firstOption).toBeChecked();
    await card.getByRole("button", { name: "Next", exact: true }).click();
    await expect(card).toContainText("Question 2 of 2");
    await expect(card.locator("legend")).not.toBeFocused();
    await card.getByRole("checkbox", { name: "Something else" }).check();
    await expect(card.getByRole("textbox", { name: "Your own answer" })).toBeFocused();
  });
}
