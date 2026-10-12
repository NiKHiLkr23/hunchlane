import { test,expect } from "@playwright/test";
test("landing validates input and carries each example category without starting research",async({page})=>{
  const paidRequests:string[]=[];
  page.on("request",request=>{if(request.url().endsWith("/api/runs")&&request.method()==="POST")paidRequests.push(request.url());});
  await page.goto("/");
  await expect(page.getByText("Illustrative sample",{exact:true})).toBeVisible();
  const idea=page.getByRole("textbox",{name:"What’s your idea?"});
  await idea.fill("Too short");
  await page.getByRole("button",{name:"Explore my idea",exact:true}).click();
  await expect(page.getByRole("alert").filter({hasText:"at least 20 characters"})).toContainText("at least 20 characters");
  await expect(idea).toBeFocused();
  await expect(idea).toHaveValue("Too short");
  await page.screenshot({path:`artifacts/landing-error-${test.info().project.name}.png`});
  for(const [label,content,category] of [["Grocery list for roommates","grocery list","Software or app"],["Meal kit for one person","meal kit","Physical product"],["Mending for work clothes","mending","A service or place"],["Office hours for a tutor","neighborhood tutor","Software or app"],["Refills for kitchen basics","kitchen basics","Physical product"]]){
    await page.goto("/");
    await page.getByRole("button",{name:label,exact:true}).click();
    await expect(idea).toHaveValue(new RegExp(content));
    // Repeated submits only preserve the same draft and navigate; no research starts.
    await page.getByRole("button",{name:"Explore my idea",exact:true}).evaluate((button:HTMLButtonElement)=>{button.click();button.click();});
    await expect(page).toHaveURL(/\/new$/);
    await expect(page.getByRole("radio",{name:category,exact:true})).toBeChecked();
    await expect(page.getByRole("region",{name:"Idea conversation"})).toContainText(new RegExp(content));
  }
  expect(paidRequests).toEqual([]);
});
test("landing entry stays in the first viewport and navigation works by keyboard",async({page})=>{
  await page.goto("/");
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`artifacts/teal-hero-${test.info().project.name}.png`,animations:"disabled"});
  await page.screenshot({path:`artifacts/teal-hero-full-${test.info().project.name}.png`,fullPage:true,animations:"disabled"});
  const entry=await page.getByRole("button",{name:"Explore my idea",exact:true}).boundingBox();
  expect(entry).not.toBeNull();
  expect(entry!.y+entry!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  const toggle=page.locator('summary[aria-label="Navigation menu"]');
  if(await toggle.isVisible()){
    await toggle.focus();await page.keyboard.press("Enter");
    const mobile=page.getByRole("navigation",{name:"Mobile navigation"});
    await expect(mobile.getByRole("link",{name:"Sample report",exact:true})).toBeVisible();
    await page.screenshot({path:`artifacts/landing-menu-${test.info().project.name}.png`});
    await page.keyboard.press("Escape");await expect(toggle).toBeFocused();
    await expect(mobile).not.toBeVisible();
    await toggle.press("Enter");await mobile.getByRole("link",{name:"How it works",exact:true}).click();
    await expect(mobile).not.toBeVisible();
  }else{
    await page.getByRole("navigation",{name:"Main navigation",exact:true}).getByRole("link",{name:"How it works"}).click();
  }
  await expect(page).toHaveURL(/#how-it-works$/);
  await page.getByRole("link",{name:"Explore my idea",exact:true}).click();
  await expect(page.getByRole("textbox",{name:"What’s your idea?"})).toBeFocused();
  await page.getByRole("textbox",{name:"What’s your idea?"}).fill("An idea that needs a little more context. ".repeat(75));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:`artifacts/landing-long-${test.info().project.name}.png`});
  await page.setViewportSize({width:320,height:800});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await expect(page.getByRole("textbox",{name:"What’s your idea?"})).toBeFocused();
  await page.screenshot({path:`artifacts/teal-hero-narrow-${test.info().project.name}.png`});
});
test("hero motion can be interrupted without losing an editable idea",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
  const idea=page.getByRole("textbox",{name:"What’s your idea?"});
  await idea.fill("A neighbourhood service that repairs everyday household items.");
  await page.emulateMedia({reducedMotion:"reduce"});
  await expect(idea).toBeFocused();
  await expect(idea).toHaveValue(/repairs everyday/);
  await expect(page.getByRole("button",{name:"Explore my idea",exact:true})).toBeEnabled();
  expect(await page.locator(".hero-float").evaluateAll(elements=>elements.every(element=>getComputedStyle(element).animationName==="none"))).toBe(true);
  await page.emulateMedia({reducedMotion:"no-preference"});
  await expect(idea).toBeFocused();
  await expect(idea).toHaveValue(/repairs everyday/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test("the curated preview turns pages, respects reduced motion, and opens the full sample", async ({ page }) => {
  const paidRequests: string[] = [];
  page.on("request", request => { if (request.url().endsWith("/api/runs") && request.method() === "POST") paidRequests.push(request.url()); });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const preview = page.getByRole("article", { name: "Hunchlane sample report preview" });
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.getByText("Illustrative sample", { exact: true })).toBeVisible();
  await expect(preview.getByText(/Curated from official sources/)).toBeVisible();
  const source = preview.getByRole("link", { name: /Lovable Official website/ });
  await expect(source).toHaveAttribute("href", "https://lovable.dev/");
  await source.focus();
  await expect(source).toBeFocused();
  expect(await source.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
  const initialHeight = (await preview.boundingBox())!.height;
  await preview.getByRole("button", { name: "Next report page" }).click();
  await expect(preview.getByRole("heading", { name: "Keep the evidence in the build" })).toBeVisible();
  await expect(preview.getByRole("link", { name: /Lovable Official website/ })).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await preview.getByRole("button", { name: "Next report page" }).click();
  await expect(preview.getByRole("heading", { name: "Help ten founders take the next step" })).toBeVisible();
  expect((await preview.boundingBox())!.height).toBeCloseTo(initialHeight, 0);
  await page.screenshot({ path: `artifacts/hunchlane-preview-test-${test.info().project.name}.png`, animations: "disabled" });
  await preview.getByRole("button", { name: "Return to first report page" }).click();
  await expect(source).toBeVisible();
  await expect(preview.getByRole("button", { name: "Previous report page" })).toBeDisabled();
  await preview.getByRole("link", { name: "Full sample report" }).click();
  await expect(page).toHaveURL(/\/sample$/);
  await expect(page.getByRole("heading", { name: "Hunchlane: from idea to working product" })).toBeVisible();
  expect(paidRequests).toEqual([]);
});
test("the curated preview has readable sources and a report link without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("http://localhost:3110/");
  const preview = page.getByRole("article", { name: "Hunchlane sample report preview" });
  await expect(preview.getByRole("heading", { name: "Hunchlane has company." })).toBeVisible();
  await expect(preview.getByRole("link", { name: /Lovable Official website/ })).toBeVisible();
  await expect(preview.getByRole("link", { name: "Full sample report" })).toHaveAttribute("href", "/sample");
  await expect(preview.getByRole("button", { name: "Next report page" })).toBeDisabled();
  await context.close();
});
test("an idea survives navigation and missing account setup",async({page})=>{
  await page.goto("/");await page.getByRole("textbox",{name:"What’s your idea?"}).fill("A reusable meal kit designed for people cooking for one.");await page.getByRole("button",{name:"Explore my idea",exact:true}).click();await expect(page).toHaveURL(/\/new$/);
  await expect(page.getByRole("region",{name:"Idea conversation"})).toContainText("meal kit");await page.getByRole("radio",{name:"Physical product"}).check();await page.getByRole("textbox",{name:"Your answer"}).fill("Delivered locally for people living alone");await page.getByRole("button",{name:"Review with what I have"}).click();
  await expect(page.getByRole("region",{name:"Research brief"})).toContainText("Delivered locally");await page.getByRole("button",{name:"Sign in to research"}).click();await expect(page.locator("main").getByRole("alert")).toContainText("Sign-in is being connected");await page.reload();await expect(page.getByRole("region",{name:"Research brief"})).toContainText("meal kit");
});
test("curated report distinguishes reviewed claims, planned capabilities, and hypotheses", async ({ page }) => {
  await page.goto("/sample");
  await expect(page.getByText(/Curated research, reviewed October 12, 2026/)).toBeVisible();
  const journey = page.getByRole("list").filter({ has: page.getByRole("heading", { name: "Build", exact: true }) });
  await expect(journey).toContainText("Planned");
  await expect(page.getByRole("heading", { name: "Help ten founders take the next step" })).toBeVisible();
  await page.screenshot({ path: `artifacts/hunchlane-overview-${test.info().project.name}.png`, fullPage: true, animations: "disabled" });
  await page.getByRole("tab", { name: /What exists/ }).click();
  await expect(page.getByRole("heading", { name: "Lovable", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Source 1: Lovable · official product overview" }).first()).toHaveAttribute("href", "https://lovable.dev/");
  await page.getByRole("tab", { name: "Your angle" }).click();
  await expect(page.getByRole("heading", { name: "Keep the evidence in the build" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reasons it could fail" })).toBeVisible();
  await page.screenshot({ path: `artifacts/hunchlane-strategy-${test.info().project.name}.png`, fullPage: true, animations: "disabled" });
  await page.getByRole("tab", { name: "Sources", exact: true }).click();
  await expect(page.getByText(/Official pages reviewed for this curated sample/)).toBeVisible();
  await expect(page.getByText(/No customer interviews, payment evidence/)).toBeVisible();
  await expect(page.locator(".source-list li")).toHaveCount(5);
});
test("keyboard tabs and narrow report sections remain usable", async ({ page }) => {
  await page.goto("/sample");
  await page.getByRole("tab", { name: "The big picture" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /What exists/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Lovable", exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  for (const name of ["The big picture", "What exists", "Your angle", "The numbers", "Sources"]) {
    await page.getByRole("tab", { name: name === "What exists" ? /What exists/ : name, exact: name !== "What exists" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.screenshot({ path: `artifacts/hunchlane-sources-narrow-${test.info().project.name}.png`, fullPage: true });
});
test("unsigned users cannot read or create private research",async({request,page})=>{
  const read=await request.get("/api/runs/does-not-belong-to-you");expect([401,503]).toContain(read.status());const write=await request.post("/api/runs",{data:{},headers:{Origin:"https://other.example"}});expect(write.status()).toBe(403);await page.goto("/library");await expect(page.getByRole("heading",{name:"Keep your hunches together."})).toBeVisible();await page.goto("/share/revoked-or-missing");await expect(page.getByRole("heading",{name:"This report isn’t here."})).toBeVisible();
});
