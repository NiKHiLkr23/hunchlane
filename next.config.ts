import type { NextConfig } from "next";
const config: NextConfig = { poweredByHeader: false, serverExternalPackages: ["neatlogs"], devIndicators: false,
  distDir: process.env.HUNCHLANE_BROWSER_TEST === "1" ? ".next-browser" : ".next" };
export default config;
