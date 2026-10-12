import { safeWebUrl } from "./evidence";
import type { ResearchContent, ResearchReport } from "./types";

// Export only the saved report, never run identities, operation receipts, or local explorer state.
function text(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([\\`*_{}\[\]#!|])/g, "\\$1")
    .replace(/[\r\n]+/g, " ");
}
function link(label: string, url: string) {
  return safeWebUrl(url)
    ? `[${text(label)}](<${new URL(url).href.replace(/>/g, "%3E").replace(/</g, "%3C")}>)`
    : text(label);
}
export function reportMarkdown(
  report: ResearchReport,
  sample = false,
  shared = false
) {
  const claim = (value: ResearchContent["summary"]) => {
    const references = value.sourceIds.flatMap((id) => {
      const index = report.sources.findIndex((source) => source.id === id);
      return index < 0
        ? []
        : [link(String(index + 1), report.sources[index].url)];
    });
    return `**${
      value.nature === "hypothesis" ? "Hypothesis" : "Observation"
    }:** ${text(value.text)}${
      references.length ? ` ${references.join(" ")}` : ""
    }`;
  };
  const bullets = (values: string[]) =>
    values.length
      ? values.map((value) => `- ${text(value)}`).join("\n")
      : "None recorded.";
  const verdicts = {
    close_matches: "Close matches found",
    related_options: "Related options found",
    insufficient_evidence: "More evidence needed",
  };
  const sections = [
    `# ${text(report.title)}`,
    `Hunchlane research report · Version ${report.version}\n\nCreated: ${text(
      report.createdAt
    )}`,
    ...(sample
      ? [
          "**Illustrative sample — not live research. Source links are sample references, not retrieved evidence.**",
        ]
      : []),
    ...(shared ? ["Shared saved report snapshot."] : []),
    `## The idea\n\n${text(report.brief.idea)}\n\n- Category: ${text(
      report.brief.category
    )}\n- Audience: ${text(
      report.brief.audience || "Not specified"
    )}\n- Location: ${text(report.brief.location || "Not specified")}`,
    ...(Object.keys(report.brief.answers).length
      ? [
          `### Accepted context\n\n${Object.entries(report.brief.answers)
            .map(([key, value]) => `- ${text(key)}: ${text(value)}`)
            .join("\n")}`,
        ]
      : []),
    `## The big picture\n\n**${verdicts[report.verdict]}**\n\n${claim(
      report.summary
    )}\n\nResearch is context, not proof of demand, novelty, or success.`,
    `## What exists\n\n${
      report.competitors.length
        ? report.competitors
            .map(
              (c) =>
                `### ${link(c.name, c.url)}\n\nMatch: ${
                  c.match === "close" ? "Close" : "Adjacent"
                }\n\n${claim(c.description)}\n\n**Overlap**\n\n${claim(
                  c.overlap
                )}\n\n**Possible difference**\n\n${claim(
                  c.difference
                )}\n\n**Pricing**\n\n${claim(c.pricing)}`
            )
            .join("\n\n")
        : "No verified alternatives in this search. This does not establish novelty."
    }`,
    `## Possible angles\n\n${
      report.angles.length
        ? report.angles
            .map(
              (a) =>
                `### ${text(a.title)}\n\n${claim(
                  a.explanation
                )}\n\n**How to test:** ${text(a.test)}`
            )
            .join("\n\n")
        : "None recorded."
    }`,
    `## Open questions\n\n${bullets(report.unknowns)}`,
    `## First small experiment\n\n### ${text(
      report.experiment.title
    )}\n\n**Cost / effort:** ${text(
      report.experiment.cost
    )}\n\n${report.experiment.steps
      .map((step, index) => `${index + 1}. ${text(step)}`)
      .join("\n")}\n\n**Useful signal:** ${text(
      report.experiment.successSignal
    )}`,
    `## Financial model\n\n**CFO.ai: ${
      report.finance.status === "verified"
        ? "Verified saved model"
        : "Unavailable"
    }**\n\n${text(report.finance.message)}`,
  ];
  if (report.finance.status === "verified") {
    if (report.finance.modelUrl)
      sections.push(link("Open saved model", report.finance.modelUrl));
    if (report.finance.inputs)
      sections.push(
        `### Saved financial assumptions\n\n${Object.entries(
          report.finance.inputs
        )
          .map(
            ([key, value]) =>
              `- ${text(key)}: ${
                value === null ? "Not specified" : text(String(value))
              }`
          )
          .join("\n")}`
      );
    if (report.finance.scenarios?.length)
      sections.push(
        `### Saved scenarios\n\n${report.finance.scenarios
          .map(
            (s) =>
              `#### ${s.name}\n\n- Currency: ${
                report.finance.inputs?.currency || "Not recorded"
              }\n- 12-month revenue: ${s.annualRevenue}\n- 12-month profit: ${
                s.annualProfit
              }\n- Monthly break-even units: ${
                s.breakEvenUnits ?? "No break-even"
              }\n\n| Month | Units | Revenue | Variable costs | Fixed costs | Profit | Cash |\n| --- | --- | --- | --- | --- | --- | --- |\n${s.months
                .map(
                  (m) =>
                    `| ${m.month} | ${m.units} | ${m.revenue} | ${
                      m.variableCost
                    } | ${m.fixedCost} | ${m.profit} | ${
                      m.cash ?? "Not specified"
                    } |`
                )
                .join("\n")}`
          )
          .join("\n\n")}`
      );
  }
  sections.push(
    "The interactive assumption explorer uses editable, unsourced inputs. Its temporary calculations are not part of this saved report."
  );
  if (report.changes.length)
    sections.push(
      `## Changes in this refinement\n\n${bullets(report.changes)}`
    );
  sections.push(
    `## Search coverage and limitations\n\n${bullets(report.searchNotes)}`
  );
  sections.push(
    `## Sources\n\n${
      report.sources.length
        ? report.sources
            .map(
              (source, index) =>
                `### ${index + 1}. ${link(
                  source.title,
                  source.url
                )}\n\n- Type: ${text(source.kind)}\n- ${
                  sample ? "Sample reference date" : "Retrieved"
                }: ${text(source.retrievedAt)}\n- Evidence: ${
                  sample
                    ? "Illustrative reference"
                    : source.evidenceLevel === "page_text"
                    ? "Fetched page text"
                    : source.evidenceLevel === "search_preview"
                    ? "Search preview only"
                    : "Evidence level not recorded"
                }${
                  source.excerpt
                    ? `\n\n**Retained excerpt / summary:** ${text(
                        source.excerpt
                      )}`
                    : ""
                }`
            )
            .join("\n\n")
        : "No sources recorded."
    }`
  );
  return sections.join("\n\n") + "\n";
}
export function reportFilename(
  report: Pick<ResearchReport, "title" | "version">
) {
  const slug = report.title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/g, "");
  return `${slug || "hunchlane-report"}-v${report.version}.md`;
}
