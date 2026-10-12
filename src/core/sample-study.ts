// Additional editorial sections belong only to the curated public sample.
// They never alter a generated report, research contract, or provider result.
import { sampleReport } from "./sample";
import type { ResearchReport } from "./types";

export function isCuratedSample(report: Pick<ResearchReport, "title" | "brief">) {
  return report.title === sampleReport.title && report.brief.idea === sampleReport.brief.idea;
}

export const sampleStudy = {
  preview: {
    title: "Hunchlane has company.",
    angle: "Carry customer evidence into the brief, the build, and the next experiment. Test whether that continuity helps founders make better decisions with less repeated explanation.",
    steps: ["Recruit ten founders with a small web-product idea.", "Compare a report-only path with a guided prototype pilot.", "Measure customer tests, paid continuation, and time saved."],
    signal: "Proposed gate: 4 of 5 guided founders finish a customer test, 3 pay to continue, and completion is faster. No results yet.",
  },
  positioning: "Research your idea. Build the next test. Keep learning in one workspace.",
  audience: "Start with nontechnical solo founders who have an idea for a small web product but need help deciding what to test. This is a proposed segment, not a validated customer profile. Native apps, physical products, and complex businesses would need separate delivery and validation paths.",
  journey: [
    { title: "Research", status: "Current focus", detail: "Describe the idea; review alternatives, source links, hypotheses, and open questions." },
    { title: "Test", status: "Proposed workflow", detail: "Choose the riskiest assumption, a customer experiment, and a decision threshold before building." },
    { title: "Build", status: "Planned", detail: "Create a small app or website from the accepted brief, preserving the evidence behind product decisions." },
    { title: "Deploy", status: "Planned", detail: "Review the product, permissions, and expected running costs before publishing it from Hunchlane." },
    { title: "Manage", status: "Planned", detail: "See usage, customer feedback, errors, and operating costs in the same project." },
    { title: "Improve", status: "Planned", detail: "Compare real outcomes with the original assumptions and choose the next change or experiment." },
  ],
  advantages: [
    { title: "Less context to rebuild", detail: "A connected brief may spare founders from explaining their audience and research again when they start building. Measure whether this saves time in practice." },
    { title: "A reason behind each feature", detail: "Link proposed features to customer problems and explicit hypotheses. This may keep the first build smaller and make decisions easier to revisit." },
    { title: "A reason to return", detail: "Interpreting feedback and choosing the next experiment may create repeat value after a report is read. Return usage must be observed, not assumed." },
  ],
  risks: [
    { title: "Convenience may be insufficient", detail: "Existing builders already cover substantial parts of the journey. Users may get the same value from a report and their preferred builder." },
    { title: "Research may delay action", detail: "If advice is generic or does not change a decision, founders may skip it. Quick validation tools also put pressure on paid research." },
    { title: "Breadth can weaken delivery", detail: "Building, deployment, and management each require reliable execution and support. Adding features before proving the first workflow could spread the product too thin." },
    { title: "Usage costs can outrun pricing", detail: "Repeated builds, heavy app traffic, and support may erase the contribution from a subscription. Usage budgets and actual delivery costs need measurement." },
  ],
  decision: "Proceed with a narrow concierge pilot. Expand only if connected research helps founders complete a useful customer test and they pay to continue. Change direction if a report plus an existing builder performs just as well.",
  financial: {
    currency: "USD",
    monthlyPrice: 49,
    costs: [
      { label: "Research allowance", amount: 4 },
      { label: "Build and revision allowance", amount: 12 },
      { label: "Hosting allowance", amount: 4 },
      { label: "Support allowance", amount: 5 },
    ],
    fixedCost: 500,
    customers: [10, 25, 50],
    note: "All amounts are chosen monthly assumptions per paying customer, not Hunchlane pricing or provider quotes. The example excludes acquisition costs, founder salary, taxes, refunds, and churn; actual usage may exceed the allowances. Validate each allowance with pilot costs before setting prices.",
  },
};

export function sampleCostModel() {
  const { monthlyPrice, costs, fixedCost, customers } = sampleStudy.financial;
  const variableCost = costs.reduce((total, cost) => total + cost.amount, 0);
  const contribution = monthlyPrice - variableCost;
  return {
    variableCost, contribution,
    breakEvenCustomers: contribution > 0 ? Math.ceil(fixedCost / contribution) : null,
    scenarios: customers.map(count => ({ customers: count, revenue: count * monthlyPrice, cost: count * variableCost + fixedCost, result: count * contribution - fixedCost })),
  };
}
