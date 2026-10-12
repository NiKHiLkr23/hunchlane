"use client";
import * as Tabs from "@radix-ui/react-tabs";
import {
  ArrowUpRight,
  ArrowRight,
  Compass,
  FlaskConical,
  BookOpen,
  Lightbulb,
  CircleHelp,
  Check,
  Share2,
} from "lucide-react";
import Link from "next/link";
import type {
  EvidenceSource,
  ResearchReport,
  ResearchContent,
} from "@/core/types";
import { ReportExport } from "./report-export";
import { NumbersComingSoon } from "./numbers-coming-soon";
import { Button } from "./ui/button";
type Claim = ResearchContent["summary"];
function Citation({ id, sources }: { id: string; sources: EvidenceSource[] }) {
  const index = sources.findIndex((s) => s.id === id),
    source = sources[index];
  return source ? (
    <a
      className="citation"
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Source ${index + 1}: ${source.title}`}
    >
      [{index + 1}]
    </a>
  ) : null;
}
function ClaimText({
  claim,
  sources,
}: {
  claim: Claim;
  sources: EvidenceSource[];
}) {
  return (
    <p>
      {claim.text}{" "}
      {claim.sourceIds.map((id) => (
        <Citation key={id} id={id} sources={sources} />
      ))}
    </p>
  );
}
const verdicts = {
  close_matches: "Close matches found",
  related_options: "Related options found",
  insufficient_evidence: "More evidence needed",
};
export function ReportView({
  report,
  sample = false,
  runId,
  shared = false,
  embedded = false,
}: {
  report: ResearchReport;
  sample?: boolean;
  runId?: string;
  shared?: boolean;
  embedded?: boolean;
}) {
  const Container = embedded ? "section" : "main";
  return (
    <Container
      id={embedded ? undefined : "main"}
      className={embedded ? "report-page" : "report-page page-container"}
    >
      <div className="report-topline">
        <Link
          href={sample || shared ? "/" : "/library"}
          className="text-button"
        >
          ← {sample || shared ? "Back to Hunchlane" : "My ideas"}
        </Link>
        <span className="report-version">
          RESEARCH BRIEF / V{String(report.version).padStart(2, "0")}
        </span>
      </div>
      {sample && (
        <div className="sample-banner">
          <BookOpen size={16} />
          <span>
            <strong>A sample, so you know what to expect.</strong> Illustrative
            content, not live research.
          </span>
          <Link href="/new">
            Try your own idea <ArrowRight size={14} />
          </Link>
        </div>
      )}
      {shared && (
        <div className="sample-banner">
          <Share2 size={16} />
          <span>A shared, saved snapshot · Version {report.version}</span>
        </div>
      )}
      <header className="report-header">
        <div>
          <span className="eyebrow">
            {report.brief.category.toUpperCase()} ·{" "}
            {report.brief.location || "LOCATION OPEN"}
          </span>
          <h1>{report.title}</h1>
          <p className="report-idea">{report.brief.idea}</p>
        </div>
      </header>
      <Tabs.Root defaultValue="overview" className="report-tabs">
        <div className={embedded ? undefined : "report-toolbar"}>
        <Tabs.List aria-label="Report sections" className="tabs-list">
          {[
            ["overview", "The big picture"],
            ["competitors", "What exists"],
            ["angles", "Your angle"],
            ["numbers", "The numbers"],
            ["sources", "Sources"],
          ].map(([value, label]) => (
            <Tabs.Trigger key={value} value={value} className="tab-trigger">
              {label}
              {value === "competitors" && (
                <span className="tab-count">{report.competitors.length}</span>
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {!embedded && <ReportExport report={report} sample={sample} shared={shared} compact/>}
        </div>
        <Tabs.Content value="overview" className="tab-content">
          <div className="overview-layout">
            <section className="verdict-card">
              <div className="verdict-chip">
                <Compass size={15} />
                {verdicts[report.verdict]}
              </div>
              <h2>
                {report.verdict === "close_matches"
                  ? "Your idea has company."
                  : report.verdict === "related_options"
                  ? "There are pieces to learn from."
                  : "We need a wider lens."}
              </h2>
              <ClaimText claim={report.summary} sources={report.sources} />
              <p className="fine-print">
                A close match is context. It doesn’t tell us whether your
                approach will work.
              </p>
              <div className="mini-competitors">
                {report.competitors.map((c) => (
                  <a
                    key={c.name}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="competitor-initial">{c.name[0]}</span>
                    {c.name}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            </section>
            <aside className="open-questions">
              <CircleHelp size={22} />
              <h3>The questions still open</h3>
              <ul>
                {report.unknowns.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
              <span className="fine-print">
                Good research leaves room for uncertainty.
              </span>
            </aside>
          </div>
          <section className="experiment-card">
            <div className="experiment-heading">
              <span className="note-icon">
                <FlaskConical size={22} />
              </span>
              <div>
                <span className="eyebrow">YOUR FIRST SMALL TEST</span>
                <h2>{report.experiment.title}</h2>
              </div>
              <span className="experiment-cost">{report.experiment.cost}</span>
            </div>
            <ol className="experiment-steps">
              {report.experiment.steps.map((s, i) => (
                <li key={s}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </li>
              ))}
            </ol>
            <div className="success-signal">
              <Check size={17} />
              <div>
                <strong>A useful signal</strong>
                <p>{report.experiment.successSignal}</p>
              </div>
            </div>
          </section>
          {report.changes.length > 0 && (
            <section className="changes-card">
              <h3>What changed in this refinement</h3>
              <ul>
                {report.changes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          )}
        </Tabs.Content>
        <Tabs.Content value="competitors" className="tab-content">
          <div className="section-intro">
            <h2>You’re not starting from zero.</h2>
            <p>
              Look at who solves a similar problem, and how close that solution
              is to your idea.
            </p>
          </div>
          <div className="competitor-list">
            {report.competitors.map((c) => (
              <article className="competitor-card" key={c.name}>
                <div className="competitor-heading">
                  <span className="competitor-initial">{c.name[0]}</span>
                  <h3>
                    <a href={c.url} target="_blank" rel="noopener noreferrer">
                      {c.name}
                      <ArrowUpRight size={16} />
                    </a>
                  </h3>
                  <span className={`match-tag ${c.match}`}>
                    {c.match === "close" ? "Close match" : "Adjacent option"}
                  </span>
                </div>
                <ClaimText claim={c.description} sources={report.sources} />
                <div className="comparison-grid">
                  <div>
                    <span className="eyebrow">THE OVERLAP</span>
                    <ClaimText claim={c.overlap} sources={report.sources} />
                  </div>
                  <div>
                    <span className="eyebrow">
                      A POSSIBLE DIFFERENCE{" "}
                      {c.difference.nature === "hypothesis" && "· HYPOTHESIS"}
                    </span>
                    <ClaimText claim={c.difference} sources={report.sources} />
                  </div>
                </div>
                <div className="pricing-line">
                  <strong>Pricing</strong>
                  <ClaimText claim={c.pricing} sources={report.sources} />
                </div>
              </article>
            ))}
            {report.competitors.length === 0 && (
              <div className="empty-state">
                <h3>No verified alternatives in this search.</h3>
                <p>
                  That does not establish novelty. Review the search limitations
                  and test a broader description.
                </p>
              </div>
            )}
          </div>
        </Tabs.Content>
        <Tabs.Content value="angles" className="tab-content">
          <div className="section-intro">
            <span className="eyebrow">POSSIBILITIES, NOT PROMISES</span>
            <h2>A familiar idea can take a different lane.</h2>
            <p>
              These are hypotheses to investigate. We haven’t proven there’s
              demand for them.
            </p>
          </div>
          <div className="angle-grid">
            {report.angles.map((a, i) => (
              <article className="angle-card" key={a.title}>
                <span className="angle-number">
                  0{i + 1}
                  <Lightbulb size={19} />
                </span>
                <h3>{a.title}</h3>
                <ClaimText claim={a.explanation} sources={report.sources} />
                <div className="angle-test">
                  <span className="eyebrow">HOW TO FIND OUT</span>
                  <p>{a.test}</p>
                </div>
              </article>
            ))}
          </div>
        </Tabs.Content>
        <Tabs.Content value="numbers" className="tab-content">
          <NumbersComingSoon />
        </Tabs.Content>
        <Tabs.Content value="sources" className="tab-content">
          <div className="section-intro">
            <h2>Keep the evidence within reach.</h2>
            <p>
              {sample
                ? "Illustrative links for this sample. They were not retrieved by a live research run."
                : "Sources returned by the research provider, with retained passages or research summaries. Open the original page to check the context."}
            </p>
          </div>
          <ol className="source-list">
            {report.sources.map((s, i) => (
              <li key={s.id}>
                <span className="source-number">{i + 1}</span>
                <div>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                    <ArrowUpRight size={14} />
                  </a>
                  <span className="source-host">
                    {new URL(s.url).hostname} ·{" "}
                    {sample
                      ? "Sample reference"
                      : `Retrieved ${new Date(s.retrievedAt).toLocaleDateString(
                          "en",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}`}
                  </span>
                  {s.excerpt && <p>{s.excerpt}</p>}
                </div>
              </li>
            ))}
          </ol>
          {!sample && (
            <section className="coverage-note">
              <h3>What this search covers</h3>
              <ul>
                {report.searchNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>
          )}
        </Tabs.Content>
      </Tabs.Root>
      <div className="report-bottom" hidden={embedded}>
        <span>Your next move doesn’t have to be a big one.</span>
        {sample || shared ? (
          <Button asChild>
            <Link href="/new">
              Explore your own idea <ArrowRight size={15} />
            </Link>
          </Button>
        ) : (
          report.version === 1 && (
            <Button asChild variant="secondary">
              <Link href={`/new/refine/${runId}`}>
                Try a different angle <ArrowRight size={15} />
              </Link>
            </Button>
          )
        )}
      </div>
    </Container>
  );
}
