import type { FullConfig } from "@playwright/test";

// Compile fixture pages before parallel interactions. Next's development CSS
// refresh can reload a page when another worker opens a newly compiled route.
// These are credential-free page reads, never research requests.
export default async function setup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  for (const path of ["/", "/sample", "/new", "/sign-in", "/sign-up", "/sso-callback", "/library", "/share/not-a-real-share"]) {
    const response = await fetch(new URL(path, baseURL));
    await response.arrayBuffer();
    if (response.status >= 500) throw new Error(`Fixture page failed: ${path}`);
  }
}
