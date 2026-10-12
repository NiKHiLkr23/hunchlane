"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, FlaskConical, Lightbulb, Search } from "lucide-react";
import { sampleReport } from "@/core/sample";
import { sampleStudy } from "@/core/sample-study";
import Link from "next/link";
import { LaneMark } from "./brand";

const pages = ["What exists", "Hunchlane’s possible advantage", "How we test it"];

export function LandingReportPreview() {
  const [page, setPage] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stopMotion = () => { if (reduced.matches) setLeaving(null); };
    reduced.addEventListener("change", stopMotion);
    return () => reduced.removeEventListener("change", stopMotion);
  }, []);

  useEffect(() => {
    if (leaving === null) return;
    // Only the decorative outgoing sheet uses this timer. Page selection is immediate.
    const timer = setTimeout(() => setLeaving(null), 620);
    return () => clearTimeout(timer);
  }, [page, leaving]);

  function turn(direction: number) {
    setLeaving(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? null : page);
    setPage((page + direction + pages.length) % pages.length);
  }

  return (
    <div className="report-stage report-book" data-unfold>
      <div className="report-sheets" aria-hidden="true"><span /><span /></div>
      <article className="report-preview" aria-label="Hunchlane sample report preview">
        <header className="report-preview-header">
          <span className="report-sample-label">Illustrative sample</span>
          <div><LaneMark /><span>Hunchlane <span className="report-header-detail">/ Our own idea</span></span></div>
        </header>
        <p className="report-curation-note">Curated from official sources · Oct 12, 2026. Our proposed advantage is still a hypothesis.</p>
        <div className="report-sheet-stack">
          {pages.map((title, index) => (
            <section
              key={title}
              className="report-sheet"
              data-active={page === index}
              data-leaving={leaving === index}
              aria-hidden={page !== index}
              inert={page !== index}
              aria-labelledby={`report-preview-title-${index}`}
            >
              <div className="report-book-title">
                <span className="landing-eyebrow">{title}</span>
                <h3 id={`report-preview-title-${index}`}>
                  {index === 0 ? sampleStudy.preview.title : index === 1 ? sampleReport.angles[0].title : sampleReport.experiment.title}
                </h3>
              </div>
              {index === 0 && (
                <div className="report-book-options">
                  <div className="report-book-lead"><Search size={18} /><p>Research tools and builders already cover parts of the journey.</p></div>
                  <ul>
                    {sampleReport.competitors.map(competitor => (
                      <li key={competitor.name}>
                        <span className="alternative-initial" aria-hidden="true">{competitor.name[0]}</span>
                        <div>
                          <a href={competitor.url} target="_blank" rel="noopener noreferrer">{competitor.name} <ArrowUpRight size={13} /><span className="sr-only">Official website, opens a new tab</span></a>
                          <p>{competitor.overlap.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {index === 1 && (
                <div className="report-book-angle">
                  <div className="report-book-lead"><Lightbulb size={18} /><span className="report-hypothesis">Hypothesis to test</span></div>
                  <p>{sampleStudy.preview.angle}</p>
                  <div className="report-book-question"><span className="landing-eyebrow">The question to ask</span><p>{sampleReport.unknowns[0]}</p></div>
                </div>
              )}
              {index === 2 && (
                <div className="report-book-test">
                  <div className="report-book-lead"><FlaskConical size={18} /><p>{sampleReport.experiment.cost}</p></div>
                  <ol>{sampleStudy.preview.steps.map(step => <li key={step}>{step}</li>)}</ol>
                  <div className="report-book-signal"><Check size={17} /><p>{sampleStudy.preview.signal}</p></div>
                </div>
              )}
            </section>
          ))}
        </div>
        <footer className="report-preview-footer">
          <span role="status" aria-live="polite">{page + 1} of {pages.length} <span className="report-page-caption">· {pages[page]}</span></span>
          <Link href="/sample" className="studio-text-link">Full sample report <ArrowUpRight size={14} /></Link>
          <nav aria-label="Report preview pages">
            <button type="button" disabled={!ready || page === 0} onClick={() => turn(-1)} aria-label="Previous report page"><ArrowLeft size={18} /></button>
            <button type="button" disabled={!ready} onClick={() => turn(1)} aria-label={page === pages.length - 1 ? "Return to first report page" : "Next report page"}><ArrowRight size={18} /></button>
          </nav>
        </footer>
      </article>
    </div>
  );
}
