import type { IdeaBrief, RunStage, RunState } from "./types";

// Home needs summaries, never the report body or provider operation journal.
export type HomeRun = {
  id: string;
  idea: string;
  category: IdeaBrief["category"];
  status: RunState["status"];
  stage: RunStage;
  createdAt: string;
  parentId: string | null;
  title: string | null;
  hasReport: boolean;
  mode?: "legacy" | "autonomous";
  recovery?: "working" | "recovering" | "reconciling";
};

export type HomeNext =
  | { kind: "active" | "report" | "paused"; run: HomeRun }
  | { kind: "draft"; draft: IdeaBrief }
  | { kind: "empty" };

export function homeNext(runs: HomeRun[], draft: IdeaBrief | null): HomeNext {
  const newest = [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = newest.find(run => !run.hasReport && (run.status === "queued" || run.status === "running"));
  if (active) return { kind: "active", run: active };
  if (draft) return { kind: "draft", draft };
  const report = newest.find(run => run.hasReport);
  if (report) return { kind: "report", run: report };
  const paused = newest.find(run => run.status === "failed");
  return paused ? { kind: "paused", run: paused } : { kind: "empty" };
}

export const homeCategories = { software: "Software", physical: "Physical product", service: "Service" };
export const homeStages: Record<RunStage, string> = {
  queued: "Waiting for a research slot",
  discovering: "Looking for what exists",
  verifying: "Checking the closest matches",
  composing: "Finding a useful next step",
  finances: "Checking the financial model",
  complete: "Report ready",
};

export function homeRunHref(run: HomeRun) {
  return `/${run.mode === "autonomous" ? "research" : run.hasReport ? "reports" : "research"}/${run.id}`;
}
