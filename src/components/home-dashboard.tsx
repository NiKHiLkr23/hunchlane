"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Plus, FileText, GitBranch, AlertCircle, RefreshCw, Search, PencilLine, LockKeyhole } from "lucide-react";
import { Button } from "./ui/button";
import { type IdeaBrief } from "@/core/types";
import { homeNext, homeCategories, homeStages, homeRunHref, type HomeRun } from "@/core/home";
import "@/app/home/home.css";

import { readIdeaDraft, clearFreshDraft } from "@/lib/idea-draft";

export function HomeDashboard({ runs, connectionError = false, loading = false, onRetry }: {
  runs: HomeRun[]; connectionError?: boolean; loading?: boolean; onRetry?: () => void;
}) {
  const [draft, setDraft] = useState<IdeaBrief | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  useEffect(() => {
    function readDraft() {
      const saved=readIdeaDraft();
      const next=saved?.brief.idea.trim() ? saved.brief : null;
      setDraft(next); setDraftLoaded(true);
    }
    readDraft();
    window.addEventListener("storage", readDraft);
    window.addEventListener("pageshow", readDraft);
    return () => { window.removeEventListener("storage", readDraft); window.removeEventListener("pageshow", readDraft); };
  }, []);

  const pending = loading || !draftLoaded;
  const next = homeNext(runs, draft);
  const nextRun = "run" in next ? next.run : null;
  const heading = next.kind === "active" ? next.run.idea : next.kind === "draft" ? next.draft.idea : next.kind === "report" ? (next.run.title || next.run.idea) : next.kind === "paused" ? next.run.idea : "A sentence is enough.";
  const description = next.kind === "active" ? "Your research continues in the background. Open the conversation for the latest update." : next.kind === "draft" ? "Pick up where you left off. Add a little context, then choose when to start research." : next.kind === "report" ? "Revisit the alternatives, follow the evidence, and choose something small to test." : next.kind === "paused" ? "Open the saved outcome to see what the research could establish." : "An app, a product, a service. Start with something you wish existed, or a problem you’d like to solve.";
  const label = next.kind === "active" ? "Research in progress" : next.kind === "draft" ? "Saved on this device" : next.kind === "report" ? "Your latest report" : next.kind === "paused" ? next.run.mode === "autonomous" ? "Research ended" : "Research paused" : "Your first idea";
  const action = next.kind === "active" || next.kind === "paused" ? "View progress" : next.kind === "draft" ? "Continue draft" : next.kind === "report" ? "Open report" : "Explore your first idea";
  const href = nextRun ? homeRunHref(nextRun) : next.kind === "draft" ? "/new" : "/new?fresh=1";

  return <main id="main" className="idea-desk">
    <div className="desk-intro"><div><span className="desk-eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</span><h1>Your idea desk<span>.</span></h1><p>A place for your hunches, and what you find out next.</p></div><Button asChild><Link href="/new?fresh=1" onClick={clearFreshDraft}><Plus size={18}/>New idea</Link></Button></div>

    <div className="desk-top-grid">
      <section className={`desk-next${connectionError ? " desk-connection" : ""}`} aria-labelledby="next-heading" aria-busy={pending}>
        <div className="desk-panel-top"><span className="desk-eyebrow">NEXT UP</span><span className="desk-private"><LockKeyhole size={13}/>Private to you</span></div>
        {pending ? <div className="desk-loading" role="status"><span className="desk-skeleton desk-skeleton-short"/><span className="desk-skeleton"/><span className="desk-skeleton"/><p>Opening your idea desk…</p></div> : connectionError ? <>
          <span className="desk-status desk-status-paused"><AlertCircle size={14}/>Connection interrupted</span>
          <h2 id="next-heading">We couldn’t open your saved work.</h2>
          <p>Your reports haven’t been loaded. Try connecting again, or continue a draft saved on this device.</p>
          <div className="desk-next-actions"><Button onClick={() => onRetry ? onRetry() : window.location.reload()}><RefreshCw size={16}/>Try again</Button>{draft && <Link className="desk-text-link" href="/new">Continue draft <ArrowRight size={16}/></Link>}</div>
        </> : <>
          <span className={`desk-status desk-status-${next.kind}`}>{next.kind === "active" ? <Search size={14}/> : next.kind === "draft" ? <PencilLine size={14}/> : next.kind === "paused" ? <AlertCircle size={14}/> : <FileText size={14}/>} {label}</span>
          <h2 id="next-heading">{heading}</h2>
          <p>{description}</p>
          {next.kind === "active" && <div className="desk-stage"><span aria-hidden="true"/>{homeStages[next.run.stage]}<small>Last saved update · open progress for the latest</small></div>}
          <div className="desk-next-actions"><Button asChild><Link href={href} onClick={href.includes("fresh=1")?clearFreshDraft:undefined}>{action}<ArrowRight size={16}/></Link></Button>{next.kind === "report" && <span className="desk-meta">{homeCategories[next.run.category]}</span>}</div>
          {next.kind === "active" && draft && <Link className="desk-secondary-draft" href="/new">You also have a draft saved on this device <ArrowUpRight size={14}/></Link>}
        </>}
      </section>

      <aside className="desk-nudge" aria-labelledby="nudge-heading"><div className="desk-note-art" aria-hidden="true"><Image src="/illustrations/idea-note-v1.png" alt="" width={1254} height={1254} loading="eager" sizes="(max-width: 760px) 140px, 200px"/></div><span className="desk-eyebrow">ROOM TO WONDER</span><h2 id="nudge-heading">Start curious.<br/>Leave a little clearer.</h2><p>You don’t need a polished pitch. A real problem and a few questions are a good beginning.</p><Link href="/sample" className="desk-text-link">Take a look at a sample <ArrowUpRight size={16}/></Link><span className="desk-sample-note">Illustrative sample · no live research</span></aside>
    </div>

    <section className="desk-recent" aria-labelledby="recent-heading"><div className="desk-section-heading"><div><span className="desk-eyebrow">PICK UP A THREAD</span><h2 id="recent-heading">Recent work</h2></div><Link href="/library" className="desk-text-link">All my ideas <ArrowUpRight size={16}/></Link></div>
      {pending ? <div className="desk-recent-empty" role="status">Loading recent work…</div> : connectionError ? <div className="desk-recent-empty"><FileText size={24}/><div><h3>Your recent work is unavailable right now.</h3><p>Reconnect above to load it. A connection error doesn’t mean your ideas are gone.</p></div></div> : runs.length === 0 ? <div className="desk-recent-empty"><PencilLine size={26}/><div><h3>Your research will find a home here.</h3><p>{draft ? "Your device draft is waiting above. Once you start research, you’ll find it here too." : "Explore your first idea to start a collection of alternatives, evidence, and next steps."}</p></div></div> : <ul className="desk-run-list">{runs.slice(0, 6).map(run => <li key={run.id}><Link href={homeRunHref(run)}><span className="desk-row-icon" aria-hidden="true">{run.parentId ? <GitBranch size={19}/> : <FileText size={19}/>}</span><div className="desk-row-main"><h3>{run.title || run.idea}</h3><div className="desk-row-meta"><span>{homeCategories[run.category]}</span><span aria-hidden="true">·</span><time dateTime={run.createdAt}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(run.createdAt))}</time>{run.parentId && <span className="desk-refinement">Refinement</span>}</div></div><span className={`desk-row-status${run.status === "failed" ? " paused" : ""}`}>{run.hasReport ? "Report ready" : run.status === "failed" ? run.mode === "autonomous" ? "Research ended" : "Research paused" : run.status === "queued" ? "Queued" : "Researching"}</span><ArrowUpRight className="desk-row-arrow" size={18}/></Link></li>)}</ul>}
    </section>
    <p className="desk-footnote">Research gives you context, not a promise of success.</p>
  </main>;
}
