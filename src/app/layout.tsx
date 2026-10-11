import type { Metadata } from "next";
import { siteUrl, siteTitle, siteDescription, publicMetadata } from "@/lib/seo";
import { ClerkProvider } from "@clerk/nextjs";
import localFont from "next/font/local";
import { Header } from "@/components/header";
import "./globals.css";
const studioFont = localFont({
  src: "./fonts/Manrope.ttf",
  variable: "--font-studio",
  display: "swap",
  weight: "200 800",
});
export const metadata: Metadata = {
  ...publicMetadata(siteTitle, siteDescription, "/"),
  metadataBase: siteUrl,
  title: { default: siteTitle, template: "%s · Hunchlane" },
  applicationName: "Hunchlane",
  // Only explicitly public pages opt into indexing; account/share routes inherit this.
  robots: { index: false, follow: false },
  alternates: {},
  openGraph: {
    ...publicMetadata(siteTitle, siteDescription, "/").openGraph,
    url: undefined,
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const body = (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      {children}
    </>
  );
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={studioFont.variable}>
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
        process.env.CLERK_SECRET_KEY ? (
          <ClerkProvider>{body}</ClerkProvider>
        ) : (
          body
        )}
      </body>
    </html>
  );
}
