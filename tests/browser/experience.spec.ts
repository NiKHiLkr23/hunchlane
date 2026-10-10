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
  for(const [label,category,content] of [["App Plans with friends","Software or app","friend group"],["Product Meal kits for one","Physical product","meal kit"],["Service Coworking for night owls","A service or place","coworking"]]){
    await page.goto("/");
    await page.getByRole("button",{name:label,exact:true}).click();
    await expect(idea).toHaveValue(new RegExp(content));
    // Repeated submits only preserve the same draft and navigate; no research starts.
    await page.getByRole("button",{name:"Explore my idea",exact:true}).evaluate((button:HTMLButtonElement)=>{button.click();button.click();});
    await expect(page).toHaveURL(/\/new$/);
    await expect(page.getByRole("radio",{name:category,exact:true})).toBeChecked();
    await expect(page.getByRole("textbox",{name:"Tell us what you have in mind."})).toHaveValue(new RegExp(content));
  }
  expect(paidRequests).toEqual([]);
});
test("landing entry stays in the first viewport and navigation works by keyboard",async({page})=>{
  await page.goto("/");
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`artifacts/paper-teal-${test.info().project.name}.png`});
  await page.screenshot({path:`artifacts/paper-teal-full-${test.info().project.name}.png`,fullPage:true});
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
  await page.screenshot({path:`artifacts/paper-teal-narrow-${test.info().project.name}.png`});
});
test("an idea survives navigation and missing account setup",async({page})=>{
  await page.goto("/");await expect(page.getByRole("heading",{level:1})).toContainText("Give your idea");await page.getByRole("textbox",{name:"What’s your idea?"}).fill("A reusable meal kit designed for people cooking for one.");await page.getByRole("button",{name:"Explore my idea"}).click();await expect(page).toHaveURL(/\/new$/);await expect(page.getByRole("textbox",{name:"Tell us what you have in mind."})).toHaveValue(/meal kit/);await page.getByRole("radio",{name:"Physical product"}).check();await page.getByRole("button",{name:"Explore my idea"}).click();await expect(page.getByRole("heading",{name:"Let’s make the search useful."})).toBeVisible();await page.getByRole("button",{name:"I’m not sure yet"}).first().click();await page.getByRole("button",{name:"Sign in to research"}).click();await expect(page.getByRole("alert").filter({hasText:"Sign-in and live research"})).toContainText("Sign-in and live research");await page.reload();await expect(page.getByRole("textbox",{name:"Tell us what you have in mind."})).toHaveValue(/meal kit/);
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
