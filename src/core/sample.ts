import type { ResearchReport } from "./types";
const observation = (text: string, sourceIds: string[]) => ({ text, sourceIds, nature: "observation" as const });
const hypothesis = (text: string, sourceIds: string[] = []) => ({ text, sourceIds, nature: "hypothesis" as const });
const reviewedAt = "2026-10-12T00:00:00Z";

// Editorial sample based on reviewed official pages, not a Hunchlane provider run.
// Source summaries and their web-tool receipts are recorded in docs/SAMPLE_RESEARCH.md.
export const sampleReport: ResearchReport = {
  title: "Hunchlane: from idea to working product",
  verdict: "close_matches",
  brief: {
    idea: "A workspace where people research an idea, test its assumptions, build an app or website, deploy it, and manage the product as it grows. Research and customer feedback stay connected to what gets built.",
    audience: "Proposed first audience: nontechnical solo founders testing a small web product",
    location: "Online · geography to test",
    category: "software",
    answers: {
      vision: "Keep idea research, product creation, deployment, and ongoing management in Hunchlane. Build, deploy, and management are planned capabilities, not available features demonstrated by this sample.",
      difference: "Proposed advantage: connect evidence to product decisions and revisit assumptions using real customer results. This advantage is not yet validated.",
    },
  },
  summary: observation("This idea has close alternatives. Lovable offers building, deployment, and hosting; Replit combines app creation, testing, and launch. DimeADozen offers sourced validation reports, while ValidatorAI provides idea analysis and a prompt for building a landing page or site. An integrated workflow alone does not establish a unique advantage.", ["s1", "s2", "s3", "s4"]),
  competitors: [
    {
      name: "Lovable", url: "https://lovable.dev/", match: "close",
      description: observation("Builds web products through conversation, with deployment, hosting, authentication, and integrations. Its Plan mode lets users review a structured implementation plan before building.", ["s1", "s5"]),
      overlap: observation("Already covers much of the proposed build, deploy, and manage workflow.", ["s1"]),
      difference: hypothesis("Hunchlane could help founders choose what deserves a build, then connect each feature to customer evidence. A founder with a clear specification may prefer Lovable's existing build workflow."),
      pricing: hypothesis("Paid plan amounts were not captured in the reviewed page text. Compare subscription, build usage, hosting, and runtime AI costs before choosing."),
    },
    {
      name: "Replit", url: "https://replit.com/products/agent", match: "close",
      description: observation("Creates apps through chat, connects databases and authentication, tests work in a browser, and supports launching from one workspace.", ["s2"]),
      overlap: observation("Combines product creation, integrations, testing, and launch in one platform.", ["s2"]),
      difference: hypothesis("Hunchlane could focus on an uncertain founder's customer and business decisions. Someone prioritizing implementation and testing may prefer Replit's existing tooling."),
      pricing: hypothesis("Exact subscription and usage costs are not verified in this sample. Estimate agent work and deployment usage together."),
    },
    {
      name: "DimeADozen", url: "https://www.dimeadozen.ai/", match: "adjacent",
      description: observation("Offers research-backed business-validation reports covering market research, competitors, validation, and launch strategy.", ["s3"]),
      overlap: observation("Supports the decision about whether an idea is worth building through sourced research and a named competitor set.", ["s3"]),
      difference: hypothesis("Hunchlane's planned build and feedback loop could carry a report into action. A founder who only needs a research document may prefer a focused report service."),
      pricing: observation("Advertises a $9 Starter report and a $129 full Entrepreneur report, purchased once rather than by subscription. Reviewed October 12, 2026; offers can change.", ["s3"]),
    },
    {
      name: "ValidatorAI", url: "https://validatorai.com/", match: "adjacent",
      description: observation("Offers free idea feedback, competition and customer analysis, and a next-step prompt to build a landing page or site.", ["s4"]),
      overlap: observation("Already connects idea analysis to guidance for taking a first building step.", ["s4"]),
      difference: hypothesis("Hunchlane could preserve research, experiments, and product decisions in the same project. A user seeking quick, free feedback may prefer ValidatorAI."),
      pricing: observation("The reviewed homepage describes its idea feedback tools as free. This does not establish the price of every possible service.", ["s4"]),
    },
  ],
  angles: [
    {
      title: "Keep the evidence in the build",
      explanation: hypothesis("Carry the customer problem, source links, and untested assumptions into the product brief. Explain why a feature exists and what result would justify keeping it. This may reduce repeated explanation and unnecessary scope; it has not been proven."),
      test: "Watch founders turn the same research into a prototype with and without a connected brief. Compare completion time, repeated explanation, and unnecessary features.",
    },
    {
      title: "Build the smallest useful test",
      explanation: hypothesis("Help a founder decide whether the next step is an interview, a landing page, or a small app. Generate only enough to test the riskiest assumption. A useful outcome may be deciding to change or stop an idea."),
      test: "Ask ten founders to identify their riskiest assumption. Measure whether the proposed experiment yields a customer decision rather than just a finished screen.",
    },
    {
      title: "Learn after the launch",
      explanation: hypothesis("The planned management workspace could connect activation, repeat usage, customer feedback, and costs to the original hypotheses. Recommend the next experiment based on observed results. Continued use and a defensible advantage remain uncertain."),
      test: "Follow the pilot founders for two weeks after their first test. Record whether they return to interpret results and choose the next change.",
    },
  ],
  unknowns: [
    "Will founders pay to connect research to a build when existing builders already offer planning?",
    "Which first audience has this problem often enough to return?",
    "Does the research change a product decision, or mostly confirm what users already believe?",
    "Can building, hosting, and support fit inside a sustainable usage budget?",
    "Will users trust the output and retain control of their code, data, and costs?",
    "Can the same value be delivered by a report plus an existing builder?",
  ],
  experiment: {
    title: "Help ten founders take the next step",
    steps: [
      "Recruit ten nontechnical solo founders with a small web-product idea and no completed customer test. Record their current process and baseline time.",
      "Give everyone the same research brief. Assign five to use the report with their chosen builder and five to a manually guided report-to-prototype workflow. Match experience as closely as possible.",
      "Time-box both groups equally. Label the guided workflow as a concierge pilot of planned capabilities. Track time to a customer-facing test, repeated explanation, changes in scope, and delivery costs.",
      "Ask each founder to put the experiment in front of at least three target customers. Record actions, objections, and any payment commitments; a generated report is not customer validation.",
      "After two weeks, ask whether they return for another decision and offer a clearly described paid continuation. Review completion, actual purchases, and costs before expanding the pilot.",
    ],
    successSignal: "Proposed gate, not a result: at least 4 of 5 guided founders complete a customer-facing test, at least 3 buy a paid continuation, and median completion time is lower than the report-only group. These are directional signals from a small pilot, not statistical proof. If the guided workflow shows no useful advantage, narrow or rethink it.",
    cost: "Two weeks · manual pilot · cap spend before starting",
  },
  searchNotes: [
    "Curated sample reviewed October 12, 2026 using official pages returned by the web research tool. It was not generated by a Hunchlane live research run.",
    "Official pages describe what vendors offer; their marketing claims were not independently tested. Page summaries are paraphrases, not direct quotations.",
    "This comparison covers four alternatives, not the entire market. Missing features on a page do not prove that a competitor lacks them.",
    "No customer interviews, payment evidence, retention cohorts, or independent market-size study were collected. Demand, willingness to pay, and market size remain unknown.",
    "Hunchlane's audience, differentiation, roadmap, pilot thresholds, and financial inputs are proposals. Build, deploy, and management are planned capabilities.",
    "No paid Hunchlane research or CFO.ai model was created for this sample. Financial arithmetic illustrates assumptions and does not forecast revenue or validate viability.",
  ],
  changes: [],
  sources: [
    { id: "s1", url: "https://lovable.dev/", title: "Lovable · official product overview", retrievedAt: reviewedAt, kind: "official", evidenceLevel: "page_text", excerpt: "Reviewed page summary: Lovable describes conversational product creation, deployment, hosting, authentication, integrations, and ongoing product management." },
    { id: "s2", url: "https://replit.com/products/agent", title: "Replit Agent · official product overview", retrievedAt: reviewedAt, kind: "official", evidenceLevel: "page_text", excerpt: "Reviewed page summary: Replit describes chat-based app creation, database and authentication integrations, browser testing, and launch from one workspace." },
    { id: "s3", url: "https://www.dimeadozen.ai/", title: "DimeADozen · official reports and pricing", retrievedAt: reviewedAt, kind: "official", evidenceLevel: "page_text", excerpt: "Reviewed page summary: research-backed validation reports include market research and competitors. The page advertises $9 Starter and $129 Entrepreneur reports as one-time purchases." },
    { id: "s4", url: "https://validatorai.com/", title: "ValidatorAI · official idea analysis", retrievedAt: reviewedAt, kind: "official", evidenceLevel: "page_text", excerpt: "Reviewed page summary: the site describes free idea feedback, competition and customer analysis, and a next-step prompt to build a landing page or site." },
    { id: "s5", url: "https://docs.lovable.dev/features/plan-mode", title: "Lovable · official Plan mode documentation", retrievedAt: reviewedAt, kind: "official", evidenceLevel: "page_text", excerpt: "Reviewed page summary: Plan mode investigates a project and writes a structured implementation plan that the user can review, edit, and approve before code changes." },
  ],
  createdAt: reviewedAt, version: 1,
  finance: { status: "unavailable", provider: "cfo.ai", message: "No CFO.ai model was created. The sample's cost example uses chosen assumptions and local arithmetic, not provider quotes or a financial forecast." },
};
