import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Check, FileCheck2, Lightbulb, Search, FlaskConical } from "lucide-react";
import { IdeaComposer } from "@/components/idea-composer";
import { HeroMotion } from "@/components/hero-motion";
import { LaneMark } from "@/components/brand";
import { sampleReport } from "@/core/sample";
import "./studio.css";
import "./hero.css";

export default function Home() {
  return <main id="main" className="studio-landing">
    <HeroMotion>
      <div className="hero-decoration" aria-hidden="true">
        <div className="hero-drift-item hero-note-scene">
          <div className="hero-float hero-idea-object"><Image src="/illustrations/idea-note-v1.png" alt="" width={1254} height={1254} sizes="(max-width: 760px) 96px, 230px" preload/></div>
          <div className="hero-float hero-idea-card"><span className="hero-card-kicker">A little what if…</span><p>Make plans with friends.<br/>Actually make them happen.</p><span className="hero-note-line"/></div>
        </div>
        <div className="hero-drift-item hero-alternatives-scene">
          <div className="hero-float hero-mini-card hero-alternatives-card"><span className="hero-card-kicker">Sample alternatives</span><h2>A few familiar names</h2><div className="hero-mini-alternatives">{sampleReport.competitors.map(competitor => <span key={competitor.name}><i>{competitor.name[0]}</i>{competitor.name}</span>)}</div></div>
        </div>
        <div className="hero-drift-item hero-evidence-scene">
          <div className="hero-float hero-mini-card hero-evidence-card"><span className="hero-icon-tile"><FileCheck2 size={27}/></span><div><span className="hero-card-kicker">Keep evidence close</span><p>Follow the source.</p><span className="hero-evidence-line"/><span className="hero-evidence-line short"/></div></div>
        </div>
        <div className="hero-drift-item hero-experiment-scene">
          <div className="hero-float hero-experiment-card"><span className="hero-icon-tile"><ArrowUpRight size={25}/></span><div><span className="hero-card-kicker">The next move</span><p>Start small. Learn something.</p></div></div>
        </div>
      </div>
      <div className="studio-hero-copy">
        <div className="hero-brand-tile" aria-hidden="true"><LaneMark/></div>
        <h1 id="studio-title">Give your idea<br/>{" "}a clearer <span>next step.</span></h1>
        <p>Explore existing alternatives, see the evidence, and find something worth testing—whether it’s an app, a product, or a service.</p>
      </div>
      <div id="start-your-idea" className="studio-entry"><IdeaComposer compact/></div>
      <Link href="/sample" className="studio-text-link hero-sample-link">See what a report looks like <ArrowRight size={16}/></Link>
    </HeroMotion>

    <section className="studio-preview-section" aria-labelledby="preview-title">
      <div className="studio-section-heading"><h2 id="preview-title">A little context.<br/>{" "}A more useful next move.</h2><p>Here’s what exploring a hunch can look like.</p></div>
      <article className="studio-preview">
        <div className="studio-preview-intro">
          <span className="studio-sample-label">Illustrative sample</span>
          <h3>{sampleReport.title}</h3>
          <p>{sampleReport.brief.idea}</p>
          <Link href="/sample" className="studio-text-link">Open the sample report <ArrowUpRight size={18}/></Link>
        </div>
        <div className="studio-preview-findings">
          <div className="studio-preview-finding"><Search size={20}/><div><h4>There are alternatives to learn from</h4><p>{sampleReport.competitors.map(competitor => competitor.name).join(" · ")}</p></div></div>
          <div className="studio-preview-finding"><Lightbulb size={20}/><div><h4>A possible angle</h4><p>{sampleReport.angles[0].title} <span className="studio-hypothesis">Hypothesis</span></p></div></div>
          <div className="studio-preview-finding"><FlaskConical size={20}/><div><h4>A small next experiment</h4><p>{sampleReport.experiment.title}</p></div></div>
          <p className="studio-preview-disclaimer">This sample explains the format. It is not live research.</p>
        </div>
      </article>
    </section>

    <section id="how-it-works" className="studio-how" aria-labelledby="how-title">
      <div className="studio-section-heading"><h2 id="how-title">From “what if”<br/>{" "}to something you can test.</h2><p>Bring the idea. We’ll help you look around.</p></div>
      <ol className="studio-how-steps">
        <li><span className="studio-step-number">1</span><div><h3>Tell us the hunch</h3><p>Describe it in your own words. Add a little context about who it helps and what makes it different.</p></div></li>
        <li><span className="studio-step-number">2</span><div><h3>See what exists</h3><p>Explore alternatives and source-backed comparisons, with search limitations kept visible.</p></div></li>
        <li><span className="studio-step-number">3</span><div><h3>Choose a small next step</h3><p>Leave with possible angles, open questions, and an experiment you can try before making a bigger bet.</p></div></li>
      </ol>
    </section>

    <section className="studio-closing" aria-labelledby="closing-title">
      <div><h2 id="closing-title">Keep the curiosity.<br/>{" "}Question the evidence.</h2><p>Finding a competitor doesn’t end your idea. Finding none doesn’t prove it’s new. Research gives you context—not a guarantee that an idea will work.</p><ul><li><Check size={16}/>Citations you can check</li><li><Check size={16}/>Hypotheses you can question</li><li><Check size={16}/>Assumptions you can change</li></ul></div>
      <a href="#idea" className="button studio-primary">Explore my idea <ArrowRight size={18}/></a>
    </section>
  </main>;
}
