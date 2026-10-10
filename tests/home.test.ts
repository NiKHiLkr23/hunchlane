import { describe, expect, it } from "vitest";
import { homeNext, type HomeRun } from "../src/core/home";
import { sampleReport } from "../src/core/sample";

const report: HomeRun = { id: "report", idea: "An idea", category: "software", status: "complete", stage: "complete", createdAt: "2026-10-09T00:00:00.000Z", parentId: null, title: "Report", hasReport: true };
const active: HomeRun = { ...report, id: "active", status: "running", stage: "verifying", hasReport: false, createdAt: "2026-10-10T00:00:00.000Z" };
describe("home next action", () => {
  it("prioritizes current research, then a device draft, then the latest report", () => {
    expect(homeNext([report, active], sampleReport.brief)).toEqual({ kind: "active", run: active });
    expect(homeNext([report], sampleReport.brief)).toEqual({ kind: "draft", draft: sampleReport.brief });
    expect(homeNext([report], null)).toEqual({ kind: "report", run: report });
  });
  it("uses the newest eligible run without changing input order and keeps paused work recoverable", () => {
    const older = { ...active, id: "older", createdAt: "2026-10-08T00:00:00.000Z" };
    const runs = [older, active];
    expect(homeNext(runs, null)).toEqual({ kind: "active", run: active });
    expect(runs[0]).toBe(older);
    const paused = { ...active, status: "failed" as const };
    expect(homeNext([paused], null)).toEqual({ kind: "paused", run: paused });
    expect(homeNext([], null)).toEqual({ kind: "empty" });
  });
});
