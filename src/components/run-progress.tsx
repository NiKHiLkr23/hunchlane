"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { type RunState } from "@/core/types";
import { Button } from "./ui/button";
import Link from "next/link";
import { LaneMark } from "./brand";
import "@/app/new/conversation.css";
const copy = [{
  stage: "queued",
  title: "Waiting for a research slot",
  detail: "Your idea and research allowance are saved."
}, {
  stage: "discovering",
  title: "Looking for what exists",
  detail: "Searching related terms and existing alternatives."
}, {
  stage: "verifying",
  title: "Checking the closest matches",
  detail: "Looking at sources and questioning the overlap."
}, {
  stage: "composing",
  title: "Finding a useful next step",
  detail: "Separating evidence, possibilities and open questions."
}, {
  stage: "finances",
  title: "Checking the financial model",
  detail: "Reporting whether CFO.ai can provide verified numbers."
}];
export function RunProgress({
  initial,
  preview = false
}: {
  initial: RunState;
  preview?: boolean;
}) {
  const [run, setRun] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [elapsed, setElapsed] = useState(0);
  const router = useRouter(),
    guard = useRef(false);
  const [observed, setObserved] = useState<RunState["stage"][]>([initial.stage]);
  useEffect(() => {
    let active = true,
      timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const r = await fetch(preview ? "/dev/research-preview/state" : `/api/runs/${initial.id}`, {
          cache: "no-store"
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (!active) return;
        setRun(data);
        setObserved(old => old.includes(data.stage) ? old : [...old, data.stage]);
        setError("");
        if (data.report) {
          router.replace(`/reports/${data.id}`);
          return;
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Could not refresh progress.");
      }
      if (active) timer = setTimeout(poll, 3000);
    }
    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [initial.id, router, preview]);
  useEffect(() => {
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(initial.createdAt).getTime()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [initial.createdAt]);
  async function retry() {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(preview ? "/dev/research-preview/retry" : `/api/runs/${run.id}/retry`, {
        method: "POST"
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setRun({
        ...run,
        status: "queued",
        error: null,
        dispatched: true
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resume.");
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  const current = copy.find(item => item.stage === run.stage);
  return <main id="main" className="idea-chat"><div className="chat-top"><Link href="/home">← Your idea desk</Link><span><LockKeyhole size={13} />Private research</span></div><div className="chat-heading"><span className="chat-kicker">FOLLOWING YOUR HUNCH</span><h1>{run.status === "failed" ? "Your research is saved." : "Following the evidence."}</h1><p>Actual research updates, saved as the work progresses.</p></div><div className="chat-thread"><div className="chat-message chat-user"><p>{run.brief.idea}</p></div><section className="research-activity" aria-label="Research progress"><LaneMark /><div><p className="chat-activity" role="status">{run.status === "failed" ? "Research paused" : <><LoaderCircle size={15} className="spinner" />{current?.title || "Report ready"}</>}</p><p className="chat-subtle">{run.status === "failed" ? "Your progress is saved. Read the message below before resuming." : current?.detail}</p><ol aria-label="Updates observed in this visit">{observed.map(stage => <li key={stage}><span aria-hidden="true" /><div>{copy.find(item => item.stage === stage)?.title || "Report ready"}<small>{stage === run.stage ? "Latest saved stage" : "Earlier update observed in this visit"}</small></div></li>)}</ol></div></section></div><p className="chat-subtle">{Math.floor(elapsed / 60)}m {elapsed % 60}s elapsed · Updates refresh every few seconds</p><p className="chat-subtle">You can close this tab. Find this research in <Link href="/library">My ideas <ArrowRight size={12} /></Link> when you return.</p>{run.error && <p className="chat-error">{run.error}</p>}{error && <p className="chat-error" role="alert">{error} The last saved stage is still shown.</p>}{(run.status === "failed" || !run.dispatched && elapsed > 15) && <Button disabled={busy} onClick={retry}>{busy ? "Reconnecting…" : "Resume research"}</Button>}</main>;
}
