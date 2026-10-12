import { describe, expect, it } from "vitest";
import { reportFilename, reportMarkdown } from "@/core/report-export";
import { sampleReport } from "@/core/sample";
import { modelScenarios } from "@/core/finance";

describe("portable saved report", () => {
  it("retains every section, citations, uncertainty, provenance and sample labels", () => {
    const report = structuredClone(sampleReport);
    report.sources[0].evidenceLevel = "search_preview";
    report.changes = ["Narrowed the audience."];
    const markdown = reportMarkdown(report);
    for (const value of [report.title, report.brief.idea, report.experiment.title, report.experiment.successSignal,
      report.unknowns[0], report.searchNotes[0], report.changes[0], report.finance.message]) expect(markdown).toContain(value);
    expect(markdown).toContain("[1](<https://lovable.dev/>)");
    expect(markdown).toContain("**Hypothesis:**");
    expect(markdown).toContain("**Observation:**");
    expect(markdown).toContain("Search preview only");
    expect(markdown).toContain("**CFO.ai: Unavailable**");
    expect(markdown).not.toContain("Verified saved model");
    expect(reportMarkdown(report, true)).toContain("Curated Hunchlane sample");
    expect(reportMarkdown(report, true)).toContain("Evidence: Reviewed official page summary");
    expect(reportMarkdown(report, true)).toContain("Reasons it could fail");
    expect(reportMarkdown(report, true)).toContain("Build · Planned");
    expect(reportMarkdown(report, true)).toContain("| 25 | 1225 | 1125 | 100 |");
    expect(markdown).not.toContain("## The product vision");
    expect(reportMarkdown(report, false, true)).toContain("Shared saved report snapshot");
  });
  it("keeps Hunchlane editorial sections out of other illustrative reports", () => {
    const report = structuredClone(sampleReport);
    report.brief.idea = "A meal kit for people cooking for one";
    const markdown = reportMarkdown(report, true);
    expect(markdown).toContain("Illustrative sample — not live research");
    expect(markdown).not.toContain("## The product vision");
    expect(markdown).not.toContain("## Illustrative monthly costs");
  });
  it("exports verified financial assumptions and scenarios, excluding internal receipts", () => {
    const report = structuredClone(sampleReport);
    const inputs = { currency: "USD" as const, price: 10, variableCost: 4, fixedCost: 120, startingUnits: 30, monthlyGrowth: 0, startingCapital: null };
    report.finance = { status: "verified", provider: "cfo.ai", message: "Saved model verified.", inputs, scenarios: modelScenarios(inputs), receipt: "private-provider-receipt" };
    const markdown = reportMarkdown(report);
    expect(markdown).toContain("Verified saved model");
    expect(markdown).toContain("12-month revenue: 3600");
    expect(markdown).toContain("Monthly break-even units: 20");
    expect(markdown).toContain("| Month | Units | Revenue");
    expect(markdown).toContain("startingCapital: Not specified");
    expect(markdown).not.toContain("private-provider-receipt");
  });
  it("keeps user and source markup as text and omits unsafe or unknown citations", () => {
    const report = structuredClone(sampleReport);
    report.title = "<script>alert('x')</script> [fake](javascript:alert(1))";
    report.summary.sourceIds.push("not-returned-by-provider");
    report.sources[0].url = "javascript:alert(1)";
    report.sources[1].url = "https://example.com/a\n<script>";
    const markdown = reportMarkdown(report);
    expect(markdown).not.toContain("<script>");
    expect(markdown).not.toContain("](<javascript:");
    expect(markdown).not.toContain("not-returned-by-provider");
    expect(markdown).toContain("&lt;script&gt;");
    expect(markdown).toContain("https://example.com/a%3Cscript%3E");
    expect(reportFilename({ title: "../../?!", version: 2 })).toBe("hunchlane-report-v2.md");
    expect(reportFilename({ title: "Café: a better idea!", version: 1 })).toBe("cafe-a-better-idea-v1.md");
  });
});
