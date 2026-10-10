import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { AuthContent } from "@/components/auth-content";
import { authDestination } from "@/lib/auth-navigation";

export const metadata: Metadata = { title: "Create an account" };
export default async function SignUpPage({ searchParams, params }: { searchParams: Promise<Record<string, string | string[] | undefined>>; params: Promise<{ "sign-up"?: string[] }> }) {
  const [query, route] = await Promise.all([searchParams, params]);
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  return <AuthShell><AuthContent mode="sign-up" configured={configured} destination={authDestination(query.redirect_url)} verify={query.verify === "1" || Boolean(route["sign-up"]?.length)}/></AuthShell>;
}
