import Link from "next/link";
import localFont from "next/font/local";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { IdeaComposer } from "@/components/idea-composer";
import { sampleReport } from "@/core/sample";
import "./atlas.css";

const atlasFont = localFont({
  src: [
    { path: "./fonts/Newsreader.ttf", weight: "200 800", style: "normal" },
    { path: "./fonts/Newsreader-Italic.ttf", weight: "200 800", style: "italic" },
  ],
  variable: "--font-atlas-display",
  display: "swap",
});

export default function Home() {
  return <main id="main" className={`atlas-landing ${atlasFont.variable}`}>
    <section className="atlas-hero" aria-labelledby="atlas-title">
      <div className="atlas-hero-copy">
        <h1 id="atlas-title">Give your idea<br/>{" "}a clearer<br/>{" "}<em>next step.</em></h1>
        <p>Explore existing alternatives, see the evidence, and find something worth testing—whether it’s an app, a product, or a service.</p>
        <Link href="/sample" className="atlas-text-link">See what a report looks like <ArrowUpRight size={18}/></Link>
        <ol className="atlas-route" aria-label="Your research path">
          <li><span aria-hidden="true">01</span>Your idea</li>
          <li><span aria-hidden="true">02</span>The evidence</li>
          <li><span aria-hidden="true">03</span>A next step</li>
        </ol>
      </div>
      <div id="start-your-idea" className="atlas-entry"><IdeaComposer compact/></div>
    </section>

    <section className="atlas-preview-section" aria-labelledby="preview-title">
      <div className="atlas-section-heading"><h2 id="preview-title">One hunch. A few useful directions.</h2><p>Follow an idea through a sample report.</p></div>
      <article className="atlas-preview">
        <div className="atlas-preview-intro">
          <span className="atlas-sample-label">Illustrative sample</span>
          <h3>{sampleReport.title}</h3>
          <p>{sampleReport.brief.idea}</p>
          <p className="atlas-preview-disclaimer">This sample explains the format. It is not live research.</p>
          <Link href="/sample" className="atlas-text-link">Open the sample report <ArrowUpRight size={18}/></Link>
        </div>
        <ol className="atlas-findings" aria-label="Sample research path">
          <li><span className="atlas-stop" aria-hidden="true">01</span><div><h4>Existing alternatives</h4><p>{sampleReport.competitors.map(competitor => competitor.name).join(" · ")}</p></div></li>
          <li><span className="atlas-stop" aria-hidden="true">02</span><div><h4>A possible angle <span className="atlas-hypothesis">Hypothesis</span></h4><p>{sampleReport.angles[0].title}</p></div></li>
          <li><span className="atlas-stop" aria-hidden="true">03</span><div><h4>A small next experiment</h4><p>{sampleReport.experiment.title}</p><small>{sampleReport.experiment.cost}</small></div></li>
        </ol>
      </article>
    </section>

    <section id="how-it-works" className="atlas-how" aria-labelledby="how-title">
      <div className="atlas-how-intro"><h2 id="how-title">You bring the hunch.<br/>{" "}We help you<br/>{" "}look around.</h2><p>No pitch deck. No perfect idea.<br/>Just a place to start.</p></div>
      <ol className="atlas-how-steps">
        <li><span className="atlas-step-number" aria-hidden="true">01</span><div><h3>Describe your starting point</h3><p>Use your own words. Add a little context about who it helps. Sign in when you’re ready to begin research.</p></div></li>
        <li><span className="atlas-step-number" aria-hidden="true">02</span><div><h3>Explore the landscape</h3><p>See existing alternatives and source-backed comparisons, with gaps in the research kept visible.</p></div></li>
        <li><span className="atlas-step-number" aria-hidden="true">03</span><div><h3>Find a direction worth testing</h3><p>Choose a possible angle and a small experiment before making a bigger bet.</p></div></li>
      </ol>
    </section>

    <section className="atlas-closing" aria-labelledby="closing-title">
      <div><h2 id="closing-title">A map, not a crystal ball.</h2><p>Finding a competitor doesn’t end your idea. Finding none doesn’t prove it’s new. Research gives you context—not a guarantee that an idea will work.</p><ul><li><Check size={16}/>Citations you can check</li><li><Check size={16}/>Hypotheses you can question</li><li><Check size={16}/>Assumptions you can change</li></ul></div>
      <a href="#idea" className="button atlas-primary">Explore my idea <ArrowRight size={18}/></a>
    </section>
  </main>;
}
