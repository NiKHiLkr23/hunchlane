import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireOwner } from "@/server/auth";
import { listHomeRuns } from "@/server/store";
import { HomeDashboard } from "@/components/home-dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your idea desk" };

export default async function HomePage() {
  let owner: string | null = null;
  let authUnavailable = false;
  try { owner = await requireOwner(); }
  catch (error) {
    if (error instanceof Error && ["AUTH_NOT_CONFIGURED", "UNAUTHENTICATED"].includes(error.message)) authUnavailable = true;
    else return <HomeDashboard runs={[]} connectionError/>;
  }
  if (authUnavailable || !owner) redirect("/sign-in?redirect_url=%2Fhome");
  try { return <HomeDashboard runs={await listHomeRuns(owner)}/>; }
  catch { return <HomeDashboard runs={[]} connectionError/>; }
}
