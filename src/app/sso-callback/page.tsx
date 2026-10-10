import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { AuthCallback } from "@/components/auth-callback";
import { authDestination, authRoute } from "@/lib/auth-navigation";

export const metadata: Metadata = { title: "Finishing sign-in" };
export default async function CallbackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const destination = authDestination((await searchParams).redirect_url);
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  return <AuthShell>{configured ? <AuthCallback destination={destination}/> : <div className="auth-content"><h1>Sign-in is being connected.</h1><p className="auth-description">Your draft stays on this device.</p><Link className="auth-recovery" href={authRoute("/sign-in", destination)}>Back to sign-in</Link></div>}</AuthShell>;
}
