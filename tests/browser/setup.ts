import { chromium, type FullConfig } from "@playwright/test";

// Compile fixture pages before parallel interactions. Next's development CSS
// refresh can reload a page when another worker opens a newly compiled route.
// These are credential-free page reads, never research requests.
export default async function setup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  const paths = ["/", "/sample", "/new", "/new?fresh=1", "/sign-in", "/sign-up", "/sso-callback", "/library", "/home", "/dev/home-preview", "/share/not-a-real-share"];
  for (const path of paths) {
    const response = await fetch(new URL(path, baseURL));
    await response.arrayBuffer();
    if (response.status >= 500) throw new Error(`Fixture page failed: ${path}`);
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
