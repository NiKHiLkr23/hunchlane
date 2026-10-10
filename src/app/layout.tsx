import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/header";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Hunchlane — See what exists. Find your angle.", template: "%s · Hunchlane" }, description: "Turn a business or product idea into a research brief: existing alternatives, cited evidence, possible angles, and one practical next step." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const body = <><a className="skip-link" href="#main">Skip to content</a><Header/>{children}<footer className="site-footer"><span>Follow your hunch. Check the evidence.</span><span>Built at Neathacks 2026 <span aria-hidden="true">↗</span></span></footer></>;
  return <html lang="en" data-scroll-behavior="smooth"><body>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY ? <ClerkProvider>{body}</ClerkProvider> : body}</body></html>;
}
