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
test("the unfolding sample remains readable with accessible sources and live reduced motion",async({page})=>{
  const paidRequests:string[]=[];
  page.on("request",request=>{if(request.url().endsWith("/api/runs")&&request.method()==="POST")paidRequests.push(request.url());});
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
  const preview=page.getByRole("article",{name:"Find a time. Keep the friendship."});
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.getByText("Illustrative sample",{exact:true})).toBeVisible();
  await expect(preview.getByText(/It is not live research/)).toBeVisible();
  const source=preview.getByRole("link",{name:"Doodle — official website, opens a new tab",exact:true});
  await expect(source).toHaveAttribute("href","https://doodle.com/");
  await source.focus();
  await expect(source).toBeFocused();
  expect(await source.evaluate(element=>getComputedStyle(element).outlineStyle)).not.toBe("none");
  await page.emulateMedia({reducedMotion:"reduce"});
  await expect(source).toBeFocused();
  await expect.poll(() => preview.locator(".report-panel").evaluateAll(elements=>elements.every(element=>getComputedStyle(element).opacity==="1"&&getComputedStyle(element).transform==="none")), { timeout: 1000 }).toBe(true);
  await expect(preview.getByRole("heading",{name:"Keep the questions open"})).toBeVisible();
  await expect(preview.getByRole("heading",{name:"Try a small experiment"})).toBeVisible();
  await page.emulateMedia({reducedMotion:"no-preference"});
  await expect(source).toBeFocused();
  await preview.getByRole("link",{name:"Open the sample report"}).click();
  await expect(page).toHaveURL(/\/sample$/);
  expect(paidRequests).toEqual([]);
  await expect(page.getByRole("heading", { name: "Find a time. Keep the friendship." })).toBeVisible();
  await page.getByRole("link", { name: "← Back to Hunchlane", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.setViewportSize({width:320,height:800});
  await page.locator(".landing-closing").scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:`artifacts/teal-landing-complete-narrow-${test.info().project.name}.png`,fullPage:true,animations:"disabled"});
});
test("the report preview is complete when enhancement scripts are unavailable",async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,reducedMotion:"reduce"});
  const page=await context.newPage();
  await page.goto("http://localhost:3110/");
  const preview=page.getByRole("article",{name:"Find a time. Keep the friendship."});
  await expect(preview.getByRole("heading",{name:"Learn from what exists"})).toBeVisible();
  await expect(preview.getByRole("heading",{name:"Keep the questions open"})).toBeVisible();
  await expect(preview.getByRole("heading",{name:"Try a small experiment"})).toBeVisible();
  await expect(preview.getByRole("link",{name:"Open the sample report"})).toHaveAttribute("href","/sample");
  await context.close();
});
test("an idea survives navigation and missing account setup",async({page})=>{
  await page.goto("/");await page.getByRole("textbox",{name:"What’s your idea?"}).fill("A reusable meal kit designed for people cooking for one.");await page.getByRole("button",{name:"Explore my idea",exact:true}).click();await expect(page).toHaveURL(/\/new$/);
  await expect(page.getByRole("region",{name:"Idea conversation"})).toContainText("meal kit");await page.getByRole("radio",{name:"Physical product"}).check();await page.getByRole("textbox",{name:"Your answer"}).fill("Delivered locally for people living alone");await page.getByRole("button",{name:"Review with what I have"}).click();
  await expect(page.getByRole("region",{name:"Research brief"})).toContainText("Delivered locally");await page.getByRole("button",{name:"Sign in to research"}).click();await expect(page.locator("main").getByRole("alert")).toContainText("Sign-in is being connected");await page.reload();await expect(page.getByRole("region",{name:"Research brief"})).toContainText("meal kit");
});
test("report sections expose citations and editable assumptions",async({page})=>{
  await page.goto("/sample");await expect(page.getByText("Illustrative content, not live research.",{exact:false})).toBeVisible();await page.getByRole("tab",{name:/What exists/}).click();await expect(page.getByRole("heading",{name:"Doodle"})).toBeVisible();await expect(page.getByRole("link",{name:"Source 1: Doodle — official website"}).first()).toHaveAttribute("href","https://doodle.com/");await page.getByRole("tab",{name:"Your angle"}).click();await expect(page.getByRole("heading",{name:"Help the plan actually happen"})).toBeVisible();await page.getByRole("tab",{name:"The numbers"}).click();await expect(page.getByText("CFO.AI MODEL NOT AVAILABLE",{exact:true})).toBeVisible();await page.getByRole("spinbutton",{name:"Monthly price",exact:true}).fill("0");await expect(page.getByText("No break-even at this price",{exact:true})).toBeVisible();await page.getByRole("tab",{name:"Sources",exact:true}).click();await expect(page.getByText("What this search covers",{exact:true})).toBeVisible();
});
test("keyboard tabs, narrow layout and reduced motion stay usable",async({page})=>{
  await page.goto("/sample");await page.getByRole("tab",{name:"The big picture"}).focus();await page.keyboard.press("ArrowRight");await expect(page.getByRole("tab",{name:/What exists/})).toBeFocused();await page.keyboard.press("Enter");await expect(page.getByRole("heading",{name:"Doodle"})).toBeVisible();await page.emulateMedia({reducedMotion:"reduce"});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:`artifacts/report-${test.info().project.name}.png`,fullPage:true});await page.goto("/");expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:`artifacts/home-${test.info().project.name}.png`,fullPage:true});
});
test("unsigned users cannot read or create private research",async({request,page})=>{
  const read=await request.get("/api/runs/does-not-belong-to-you");expect([401,503]).toContain(read.status());const write=await request.post("/api/runs",{data:{},headers:{Origin:"https://other.example"}});expect(write.status()).toBe(403);await page.goto("/library");await expect(page.getByRole("heading",{name:"Keep your hunches together."})).toBeVisible();await page.goto("/share/revoked-or-missing");await expect(page.getByRole("heading",{name:"This report isn’t here."})).toBeVisible();
});
