import { sampleReport } from "../../src/core/sample";
import { chromium, type FullConfig } from "@playwright/test";

// Compile fixture pages before parallel interactions. Next's development CSS
// refresh can reload a page when another worker opens a newly compiled route.
// Pages and fixture transports use no credentials or paid providers.
// Denied private API prewarms cannot enter the research workflow.
export default async function setup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  const paths = ["/", "/sample", "/new", "/new?fresh=1", "/sign-in", "/sign-up", "/sso-callback", "/library", "/home", "/dev/home-preview", "/dev/idea-preview", "/dev/research-preview", "/share/not-a-real-share"];
  for (const path of paths) {
    const response = await fetch(new URL(path, baseURL));
    await response.arrayBuffer();
    if (response.status >= 500) throw new Error(`Fixture page failed: ${path}`);
  }
  const transports = [
    {path:"/dev/idea-preview/intake",method:"POST",body:{id:"00000000-0000-4000-8000-000000000001",turn:0,brief:sampleReport.brief,messages:[{role:"user",text:sampleReport.brief.idea}]},status:200},
    {path:"/dev/idea-preview/research",method:"POST",body:{},status:429},
    {path:"/dev/research-preview/state",method:"GET",status:200},
    {path:"/dev/research-preview/retry",method:"POST",body:{},status:409},
    {path:"/api/runs/does-not-belong-to-you",method:"GET",status:503},
    {path:"/api/runs",method:"POST",body:{},status:403},
  ];
  for(const item of transports){
    const response=await fetch(new URL(item.path,baseURL),{method:item.method,headers:{Origin:"https://other.example","Content-Type":"application/json"},...(item.body?{body:JSON.stringify(item.body)}:{})});
    await response.arrayBuffer();if(response.status!==item.status)throw new Error(`Transport warmup failed: ${item.path}`);
  }
  // Load the client bundles too: cold CSS compilation can otherwise trigger
  // a development refresh in a different worker halfway through navigation.
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const path of paths) {
      await page.goto(new URL(path, baseURL).href);
      await page.waitForLoadState("networkidle");
    }
  } finally { await browser.close(); }
}
