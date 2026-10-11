import { publicMetadata, siteTitle, siteDescription } from "@/lib/seo";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Check, FileCheck2, Search, FlaskConical } from "lucide-react";
import { IdeaComposer } from "@/components/idea-composer";
import { HeroMotion } from "@/components/hero-motion";
import { LandingMotion } from "@/components/landing-motion";
import { SponsorCarousel } from "@/components/sponsor-carousel";
import { LaneMark } from "@/components/brand";
import { sampleReport } from "@/core/sample";
import "./studio.css";
import "./hero.css";
import "./landing-details.css";

export const metadata = publicMetadata(siteTitle, siteDescription, "/");

export default async function Home() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY && (await auth()).userId) redirect("/home");
  return <main id="main" className="studio-landing">
    <HeroMotion>
      <div className="hero-decoration" aria-hidden="true">
        <div className="hero-drift-item hero-note-scene">
          <div className="hero-float hero-idea-object"><Image src="/illustrations/idea-note-v1.png" alt="" width={1254} height={1254} sizes="(max-width: 760px) 96px, 230px" preload/></div>
          <div className="hero-float hero-idea-card"><span className="hero-note-pin"/><span className="hero-card-kicker">The starting idea</span><p>{sampleReport.title}</p><span className="hero-note-idea">{sampleReport.brief.idea}</span></div>
          <div className="hero-float hero-check-chip"><Check size={22}/></div>
        </div>
        <div className="hero-drift-item hero-alternatives-scene">
          <div className="hero-float hero-mini-card hero-alternatives-card"><span className="hero-card-kicker">Sample alternatives</span><p className="hero-widget-title">A few familiar names</p><ul className="hero-mini-alternatives">{sampleReport.competitors.map(competitor => <li key={competitor.name}><i>{competitor.name[0]}</i><span><strong>{competitor.name}</strong><em>{competitor.match}</em></span></li>)}</ul></div>
        </div>
        <div className="hero-drift-item hero-evidence-scene">
          <div className="hero-float hero-mini-card hero-evidence-card"><div className="hero-widget-head"><span className="hero-icon-tile"><FileCheck2 size={18}/></span><div><span className="hero-card-kicker">Sample evidence</span><p>How close a match</p></div></div><ul className="hero-bars">{sampleReport.competitors.map(competitor => <li key={competitor.name}><span className="hero-bar-label"><span>{competitor.name}</span><span className="hero-bar-match">{competitor.match}</span></span><span className="hero-bar-track"><span className="hero-bar-fill" data-match={competitor.match}/></span></li>)}</ul></div>
        </div>
        <div className="hero-drift-item hero-experiment-scene">
          <div className="hero-float hero-experiment-card"><span className="hero-card-kicker">The next move</span><p>{sampleReport.experiment.title}</p><ul className="hero-steps">{sampleReport.experiment.steps.slice(0, 3).map(step => <li key={step}><span className="hero-check-box"/>{step}</li>)}</ul></div>
        </div>
      </div>
      <div className="studio-hero-copy">
        <div className="hero-brand-tile" aria-hidden="true"><LaneMark/></div>
        <h1 id="studio-title"><span className="hero-line">Give your idea</span><span className="hero-line hero-line-muted">a clearer <span>next step.</span></span></h1>
        <p>Explore existing alternatives, see the evidence, and find something worth testing—whether it’s an app, a product, or a service.</p>
      </div>
      <div id="start-your-idea" className="studio-entry"><IdeaComposer compact/></div>
      <Link href="/sample" className="studio-text-link hero-sample-link">See what a report looks like <ArrowRight size={16}/></Link>
    </HeroMotion>
    <SponsorCarousel/>

    <LandingMotion>
      <section className="landing-showcase" aria-labelledby="preview-title">
        <div className="landing-section-heading" data-reveal>
          <span className="landing-pill">A hunch, opened up</span>
          <h2 id="preview-title">A little context.<br/>A more useful next move.</h2>
          <p>See how one idea becomes alternatives, open questions, and something small to try.</p>
        </div>
        <div className="report-stage" data-unfold>
          <div className="report-float report-float-questions" aria-hidden="true"><span className="landing-eyebrow">Still to find out</span><p>{sampleReport.unknowns[0]}</p></div>
          <div className="report-float report-float-cost" aria-hidden="true"><span className="landing-eyebrow">A small experiment</span><strong>{sampleReport.experiment.title}</strong><p>{sampleReport.experiment.cost}</p></div>
          <div className="report-frame">
          <div className="report-sheets" aria-hidden="true"><span/><span/><span/></div>
          <div className="report-note-object" aria-hidden="true"><Image src="/illustrations/idea-note-v1.png" alt="" width={1254} height={1254} sizes="180px"/></div>
          <article className="report-preview" aria-labelledby="sample-title">
            <header className="report-preview-header">
              <div><LaneMark/><span>Hunchlane <span className="report-header-detail">/ A closer look</span></span></div>
              <span className="landing-pill sample-pill">Illustrative sample</span>
            </header>
            <div className="report-idea">
              <span className="landing-eyebrow">The starting idea</span>
              <h3 id="sample-title">{sampleReport.title}</h3>
              <p>{sampleReport.brief.idea}</p>
            </div>
            <div className="report-unfold-grid">
              <section className="report-panel report-alternatives" data-reveal aria-labelledby="alternatives-title">
                <span className="report-panel-icon"><Search size={20} aria-hidden="true"/></span>
                <h4 id="alternatives-title">Learn from what exists</h4>
                <ul>{sampleReport.competitors.map((competitor,index) => <li key={competitor.name}>
                  <span className="alternative-initial" aria-hidden="true">{competitor.name[0]}</span>
                  <div><a href={competitor.url} target="_blank" rel="noreferrer">{competitor.name}<ArrowUpRight size={13} aria-hidden="true"/><span className="sr-only"> — official website, opens a new tab</span></a><p>{competitor.description.text}</p></div>
                  <span className="report-reference" aria-label={`Sample source ${index+1}`}>{index+1}</span>
                </li>)}</ul>
              </section>
              <div className="report-side-stack">
                <section className="report-panel report-evidence" data-reveal aria-labelledby="evidence-title">
                  <span className="report-panel-icon"><FileCheck2 size={20} aria-hidden="true"/></span>
                  <h4 id="evidence-title">Keep the questions open</h4>
                  <span className="report-hypothesis">Hypothesis</span>
                  <h5>{sampleReport.angles[0].title}</h5>
                  <p>{sampleReport.angles[0].explanation.text}</p>
                  <div className="report-open-question"><span>Still to find out</span><p>{sampleReport.unknowns[0]}</p></div>
                </section>
                <section className="report-panel report-experiment" data-reveal aria-labelledby="experiment-title">
                  <span className="report-panel-icon"><FlaskConical size={20} aria-hidden="true"/></span>
                  <h4 id="experiment-title">Try a small experiment</h4>
                  <h5>{sampleReport.experiment.title}</h5>
                  <ol>{sampleReport.experiment.steps.slice(0,3).map(step=><li key={step}>{step}</li>)}</ol>
                  <p className="report-experiment-cost">{sampleReport.experiment.cost}</p>
                </section>
              </div>
            </div>
            <footer className="report-preview-footer"><p>This sample explains the format. It is not live research. Open the linked websites to check current details.</p><Link href="/sample" className="studio-text-link">Open the sample report <ArrowRight size={16} aria-hidden="true"/></Link></footer>
          </article>
          <div className="report-book-object" aria-hidden="true"><Image src="/illustrations/evidence-book-v1.png" alt="" width={1254} height={1254} sizes="160px"/></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-benefits" aria-labelledby="how-title">
        <div className="landing-section-heading" data-reveal><span className="landing-pill">How it works</span><h2 id="how-title">Keep the spark.<br/>Get a clearer picture.</h2><p>Describe your idea, add a little context, then choose when to start research.</p></div>
        <ol className="landing-benefit-grid">
          <li className="landing-benefit" data-reveal>
            <div className="benefit-art">
              <div className="benefit-mock" aria-hidden="true">
                <div className="mock-bar"><span>Sample alternatives</span><span>{sampleReport.competitors.length}</span></div>
                <ul className="mock-rows">{sampleReport.competitors.map(competitor => <li key={competitor.name}><i>{competitor.name[0]}</i><span><strong>{competitor.name}</strong><em>{competitor.match} match</em></span></li>)}</ul>
              </div>
              <Image className="benefit-accent" src="/illustrations/idea-note-v1.png" alt="" width={1254} height={1254} sizes="96px"/>
            </div>
            <div className="benefit-copy"><span className="landing-eyebrow">01 / Look around</span><h3>Find alternatives.<br/>Find perspective.</h3><p>See how others approach the problem. Close matches can be useful starting points for your own idea.</p></div>
          </li>
          <li className="landing-benefit" data-reveal>
            <div className="benefit-art">
              <div className="benefit-mock" aria-hidden="true">
                <span className="report-hypothesis">Hypothesis</span>
                <strong className="mock-title">{sampleReport.angles[0].title}</strong>
                <p className="mock-clamp">{sampleReport.angles[0].explanation.text}</p>
                <div className="mock-source"><span>1</span>{sampleReport.sources[0].title}</div>
              </div>
              <Image className="benefit-accent" src="/illustrations/evidence-book-v1.png" alt="" width={1254} height={1254} sizes="72px"/>
            </div>
            <div className="benefit-copy"><span className="landing-eyebrow">02 / Follow the evidence</span><h3>More context.<br/>Fewer blind guesses.</h3><p>Follow citations, question possible angles, and see what the research still leaves uncertain.</p></div>
          </li>
          <li className="landing-benefit" data-reveal>
            <div className="benefit-art">
              <div className="benefit-mock" aria-hidden="true">
                <strong className="mock-title">{sampleReport.experiment.title}</strong>
                <ol className="mock-steps">{sampleReport.experiment.steps.slice(0, 3).map(step => <li key={step}>{step}</li>)}</ol>
                <span className="mock-cost">{sampleReport.experiment.cost}</span>
              </div>
              <Image className="benefit-accent" src="/illustrations/experiment-lightbulb-v1.png" alt="" width={1254} height={1254} sizes="72px"/>
            </div>
            <div className="benefit-copy"><span className="landing-eyebrow">03 / Try something</span><h3>A next step.<br/>Not a giant leap.</h3><p>Choose a small experiment to learn about the problem before investing in a bigger solution.</p></div>
          </li>
        </ol>
      </section>

      <section className="landing-closing" aria-labelledby="closing-title">
        <div className="closing-mark" aria-hidden="true"><LaneMark/></div>
        <div className="landing-section-heading" data-reveal><span className="landing-pill">Room for a little uncertainty</span><h2 id="closing-title">Keep the curiosity.<br/>Question the evidence.</h2><p>Finding a competitor doesn’t end your idea. Finding none doesn’t prove it’s new. Research gives you context—not a guarantee that an idea will work.</p></div>
        <ul className="closing-checks"><li><Check size={16} aria-hidden="true"/>Citations you can check</li><li><Check size={16} aria-hidden="true"/>Hypotheses you can question</li><li><Check size={16} aria-hidden="true"/>Assumptions you can change</li></ul>
        <a href="#idea" className="button studio-primary">Explore my idea <ArrowRight size={18} aria-hidden="true"/></a>
        <p className="closing-helper">Start with a sentence. Sign in before research begins.</p>
      </section>
    </LandingMotion>
  </main>;
}
