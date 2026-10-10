import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeDashboard } from "@/components/home-dashboard";
import type { HomeRun } from "@/core/home";

export const dynamic = "force-dynamic";

// A separate, opt-in development gallery. It never authenticates a fixture
// user, reads private reports, or calls a research provider.
export default async function HomePreview({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (process.env.NODE_ENV !== "development" || process.env.HUNCHLANE_UI_PREVIEW !== "1") notFound();
  const { state = "active" } = await searchParams;
  const report: HomeRun = {
    id: "00000000-0000-4000-8000-000000000001", idea: "An app that finds a time everyone in a friend group can meet",
    category: "software", status: "complete", stage: "complete", createdAt: "2026-10-09T12:00:00.000Z",
    parentId: null, title: "Find a time. Keep the friendship.", hasReport: true,
  };
  const active: HomeRun = {
    id: "00000000-0000-4000-8000-000000000002", idea: "A quiet coworking space for night owls",
    category: "service", status: "running", stage: "verifying", createdAt: "2026-10-10T12:00:00.000Z",
    parentId: null, title: null, hasReport: false,
  };
  const refinement: HomeRun = { ...report, id: "00000000-0000-4000-8000-000000000003", title: "A simpler way to plan a friend-group meetup", parentId: report.id, createdAt: "2026-10-08T12:00:00.000Z" };
  const runs = state === "empty" || state === "error" || state === "loading" ? [] : state === "paused" ? [{ ...active, status: "failed" as const }] : state === "report" ? [report, refinement] : state === "long" ? [{ ...active, idea: "A service for beginners exploring a very detailed business idea in their neighbourhood. ".repeat(30) }] : [active, report, refinement];
  return <><div className="desk-preview-bar"><strong>Design preview · deterministic fixtures</strong>{["active", "report", "empty", "paused", "error", "loading", "long"].map(value => <Link key={value} href={`/dev/home-preview?state=${value}`}>{value}</Link>)}</div><HomeDashboard runs={runs} connectionError={state === "error"} loading={state === "loading"}/></>;
}
