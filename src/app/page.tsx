import { publicMetadata, siteTitle, siteDescription } from "@/lib/seo";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  FileCheck2,
  Search,
  FlaskConical,
} from "lucide-react";
import { IdeaComposer } from "@/components/idea-composer";
import { HeroMotion } from "@/components/hero-motion";
import { LandingMotion } from "@/components/landing-motion";
import { LaneMark } from "@/components/brand";
import { sampleReport } from "@/core/sample";
import { autonomousEnabled } from "@/server/agent-store";
import "./studio.css";
import "./hero.css";
import "./landing-details.css";

export const metadata = publicMetadata(siteTitle, siteDescription, "/");

export default async function Home() {
  if (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY &&
    (await auth()).userId
  )
    redirect("/home");
  return (
    <main id="main" className="studio-landing">
      <HeroMotion>
        <div className="hero-decoration" aria-hidden="true">
          <div className="hero-drift-item hero-note-scene">
            <div className="hero-float hero-idea-object">
              <Image
                src="/illustrations/idea-note-real-v2.png"
                alt=""
                width={1254}
                height={1254}
                sizes="(max-width: 760px) 96px, 196px"
                preload
              />
            </div>
          </div>
          <div className="hero-drift-item hero-questions-scene">
            <div className="hero-float hero-questions-object">
              <Image
                src="/illustrations/questions-tracing-real-v2.png"
                alt=""
                width={1254}
                height={1254}
                sizes="(max-width: 760px) 84px, 164px"
                preload
              />
            </div>
          </div>
        </div>
        <div className="studio-hero-copy ">
          <div className="pt-20" aria-hidden="true">
            {/* <LaneMark /> */}
          </div>
          <h1 id="studio-title">
            Give your idea
            <br /> a clearer <span>next step.</span>
          </h1>
          <p>See what already exists, then choose a small thing to try.</p>
        </div>
        <div id="start-your-idea" className="studio-entry">
          <IdeaComposer compact autonomous={autonomousEnabled()} />
          {autonomousEnabled() && <p className="fine-print">Sending starts research after sign-in. Your idea and answers are shared with our research providers.</p>}
        </div>
      </HeroMotion>

      <LandingMotion>
        <section className="landing-showcase" aria-labelledby="preview-title">
          <div className="landing-section-heading" data-reveal>
            <h2 id="preview-title">
              A little context.
              <br />A more useful next move.
            </h2>
            <p>
              See how one idea becomes alternatives, open questions, and
              something small to try.
            </p>
          </div>
          <div className="report-stage" data-unfold>
            <div className="report-sheets" aria-hidden="true">
              <span />
              <span />
            </div>
            <article className="report-preview" aria-labelledby="sample-title">
              <header className="report-preview-header">
                <span className="report-sample-label">Illustrative sample</span>
                <div>
                  <LaneMark className="text-[var(--teal)]" />
                  <span>
                    Hunchlane{" "}
                    <span className="report-header-detail">
                      / A closer look
                    </span>
                  </span>
                </div>
              </header>
              <div className="report-idea">
                <span className="landing-eyebrow">The starting idea</span>
                <h3 id="sample-title">{sampleReport.title}</h3>
                <p>{sampleReport.brief.idea}</p>
              </div>
              <div className="report-unfold-grid">
                <section
                  className="report-panel report-alternatives"
                  data-reveal
                  aria-labelledby="alternatives-title"
                >
                  <span className="report-panel-icon">
                    <Search size={20} aria-hidden="true" />
                  </span>
                  <h4 id="alternatives-title">Learn from what exists</h4>
                  <ul>
                    {sampleReport.competitors.map((competitor, index) => (
                      <li key={competitor.name}>
                        <span
                          className="alternative-initial"
                          aria-hidden="true"
                        >
                          {competitor.name[0]}
                        </span>
                        <div>
                          <a
                            href={competitor.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {competitor.name}
                            <ArrowUpRight size={13} aria-hidden="true" />
                            <span className="sr-only">
                              {" "}
                              — official website, opens a new tab
                            </span>
                          </a>
                          <p>{competitor.description.text}</p>
                        </div>
                        <span
                          className="report-reference"
                          aria-label={`Sample source ${index + 1}`}
                        >
                          {index + 1}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
                <div className="report-side-stack">
                  <section
                    className="report-panel report-evidence"
                    data-reveal
                    aria-labelledby="evidence-title"
                  >
                    <span className="report-panel-icon">
                      <FileCheck2 size={20} aria-hidden="true" />
                    </span>
                    <h4 id="evidence-title">Keep the questions open</h4>
                    <span className="report-hypothesis">Hypothesis</span>
                    <h5>{sampleReport.angles[0].title}</h5>
                    <p>{sampleReport.angles[0].explanation.text}</p>
                    <div className="report-open-question">
                      <span>Still to find out</span>
                      <p>{sampleReport.unknowns[0]}</p>
                    </div>
                  </section>
                  <section
                    className="report-panel report-experiment"
                    data-reveal
                    aria-labelledby="experiment-title"
                  >
                    <span className="report-panel-icon">
                      <FlaskConical size={20} aria-hidden="true" />
                    </span>
                    <h4 id="experiment-title">Try a small experiment</h4>
                    <h5>{sampleReport.experiment.title}</h5>
                    <ol>
                      {sampleReport.experiment.steps.slice(0, 3).map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <p className="report-experiment-cost">
                      {sampleReport.experiment.cost}
                    </p>
                  </section>
                </div>
              </div>
              <footer className="report-preview-footer">
                <p>
                  This sample explains the format. It is not live research. Open
                  the linked websites to check current details.
                </p>
                <Link href="/sample" className="studio-text-link">
                  Open the sample report{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </footer>
            </article>
          </div>
        </section>

        <section
          id="how-it-works"
          className="landing-benefits"
          aria-labelledby="how-title"
        >
          <div className="landing-section-heading" data-reveal>
            <h2 id="how-title">
              Keep the spark.
              <br />
              Get a clearer picture.
            </h2>
            <p>
              Describe your idea, add a little context, then choose when to
              start research.
            </p>
          </div>
          <ol className="landing-benefit-grid">
            <li className="landing-benefit" data-reveal>
              <div className="benefit-art" aria-hidden="true">
                <Image
                  src="/illustrations/alternatives-cards-real-v2.png"
                  alt=""
                  width={1254}
                  height={1254}
                  sizes="(max-width: 760px) 110px, 280px"
                />
              </div>
              <div className="benefit-copy">
                <span className="landing-eyebrow">01 / Look around</span>
                <h3>
                  Find alternatives.
                  <br />
                  Find perspective.
                </h3>
                <p>
                  See how others approach the problem. Close matches can be
                  useful starting points for your own idea.
                </p>
              </div>
            </li>
            <li className="landing-benefit" data-reveal>
              <div className="benefit-art" aria-hidden="true">
                <Image
                  src="/illustrations/evidence-book-real-v2.png"
                  alt=""
                  width={1254}
                  height={1254}
                  sizes="118px"
                />
              </div>
              <div className="benefit-copy">
                <span className="landing-eyebrow">
                  02 / Follow the evidence
                </span>
                <h3>
                  More context.
                  <br />
                  Fewer blind guesses.
                </h3>
                <p>
                  Follow citations, question possible angles, and see what the
                  research still leaves uncertain.
                </p>
              </div>
            </li>
            <li className="landing-benefit" data-reveal>
              <div className="benefit-art" aria-hidden="true">
                <Image
                  src="/illustrations/experiment-bulb-real-v2.png"
                  alt=""
                  width={1254}
                  height={1254}
                  sizes="118px"
                />
              </div>
              <div className="benefit-copy">
                <span className="landing-eyebrow">03 / Try something</span>
                <h3>
                  A next step.
                  <br />
                  Not a giant leap.
                </h3>
                <p>
                  Choose a small experiment to learn about the problem before
                  investing in a bigger solution.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="landing-closing" aria-labelledby="closing-title">
          <div className="closing-paper-arrow" aria-hidden="true">
            <Image
              src="/illustrations/next-step-arrow-real-v2.png"
              alt=""
              width={1254}
              height={1254}
              sizes="120px"
            />
          </div>
          <div className="landing-section-heading" data-reveal>
            <h2 id="closing-title">
              Keep the curiosity.
              <br />
              Question the evidence.
            </h2>
            <p>
              Finding a competitor doesn’t end your idea. Finding none doesn’t
              prove it’s new. Research gives you context—not a guarantee that an
              idea will work.
            </p>
          </div>

          <a href="#idea" className="button studio-primary">
            Explore my idea <ArrowRight size={18} aria-hidden="true" />
          </a>
        </section>
      </LandingMotion>
    </main>
  );
}
