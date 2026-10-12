import { safeWebUrl } from "./evidence";
import type { ResearchContent, ResearchReport } from "./types";
import { isCuratedSample, sampleCostModel, sampleStudy } from "./sample-study";

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
  const curated = sample && isCuratedSample(report);
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
          curated ? "**Curated Hunchlane sample — official pages reviewed October 12, 2026; not a Hunchlane live research run. Vendor claims are not independently tested. Planned features, hypotheses, and illustrative assumptions are not validated outcomes.**" : "**Illustrative sample — not live research. Source links are sample references, not retrieved evidence.**",
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
  if (curated) {
    const model = sampleCostModel();
    const finance = sampleStudy.financial;
    sections.push(
      `## The product vision\n\n${text(sampleStudy.positioning)}\n\n${text(sampleStudy.audience)}\n\n${sampleStudy.journey.map(step => `### ${text(step.title)} · ${text(step.status)}\n\n${text(step.detail)}`).join("\n\n")}`,
      ...([["Reasons it could work", sampleStudy.advantages], ["Reasons it could fail", sampleStudy.risks]] as const).map(([title, items]) => `## ${title} · hypotheses\n\n${items.map(item => `### ${text(item.title)}\n\n${text(item.detail)}`).join("\n\n")}`),
      `## Proposed next decision\n\n${text(sampleStudy.decision)}`,
      `## Illustrative monthly costs · ${finance.currency}\n\n${text(finance.note)}\n\n- Price per customer: ${finance.monthlyPrice}\n${finance.costs.map(cost => `- ${text(cost.label)}: ${cost.amount}`).join("\n")}\n- Variable cost per customer: ${model.variableCost}\n- Monthly fixed costs: ${finance.fixedCost}\n- Contribution per customer: ${model.contribution}\n- Customers to cover entered costs: ${model.breakEvenCustomers}\n\n| Customers | Revenue | Costs | Result |\n| --- | --- | --- | --- |\n${model.scenarios.map(row => `| ${row.customers} | ${row.revenue} | ${row.cost} | ${row.result} |`).join("\n")}\n\nLocal arithmetic, not a forecast or a CFO.ai model. This does not establish full business break-even.`,
    );
  }
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
    curated ? "The sample cost example uses chosen assumptions; no customer or financial results have been collected." : "The interactive assumption explorer uses editable, unsourced inputs. Its temporary calculations are not part of this saved report."
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
                  curated ? "Editorial review date" : sample ? "Sample reference date" : "Retrieved"
                }: ${text(source.retrievedAt)}\n- Evidence: ${
                  curated
                    ? "Reviewed official page summary; vendor claims not independently tested"
                    : sample ? "Illustrative reference" : source.evidenceLevel === "page_text"
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
