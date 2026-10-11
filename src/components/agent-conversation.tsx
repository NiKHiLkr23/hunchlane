"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { IdeaBriefSchema, type IdeaBrief, type RunState } from "@/core/types";
import { inferCategory, type AgentMessageInput } from "@/core/agent";
import { newDraft } from "@/core/idea-draft";
import { readIdeaDraft, readFreshDraft, saveIdeaDraft, clearIdeaDraft, clearFreshDraft } from "@/lib/idea-draft";
import { LaneMark } from "./brand";
import { ReportView } from "./report-view";
import "@/app/new/conversation.css";

type StartIntent = { id: string; brief: IdeaBrief; owner: string | null; createdAt: number };
const INTENT_KEY = "hunchlane.agent.start.v1";
export function AgentConversation({ initial, ownerId = null, signedIn = false, authConfigured = false, fresh = false, continueIntent, preview = false, scenario = "running" }: {
  initial?: RunState; ownerId?: string | null; signedIn?: boolean; authConfigured?: boolean; fresh?: boolean; continueIntent?: string; preview?: boolean; scenario?: string;
}) {
  const [run, setRun] = useState(initial), [buffer, setBuffer] = useState(""), [loaded, setLoaded] = useState(Boolean(initial)), [busy, setBusy] = useState(false), [notice, setNotice] = useState(""), [questionId, setQuestionId] = useState<AgentMessageInput["questionId"]>();
  const router = useRouter(), input = useRef<HTMLTextAreaElement>(null), guard = useRef(false), bufferRef = useRef(""), briefRef = useRef(newDraft().brief), pending = useRef<AgentMessageInput | null>(null), authorizedStart = useRef<string | null>(null);
  const intentKey = preview ? "hunchlane.preview.agent.start.v1" : INTENT_KEY;
  const pendingKey = `hunchlane.${preview ? "preview." : ""}agent.message.${initial?.id || "new"}`;
  function change(text: string) {
    bufferRef.current = text; setBuffer(text);
    try { sessionStorage.setItem(`hunchlane.${preview ? "preview." : ""}agent.buffer.${ownerId || "guest"}.${run?.id || "new"}`, text); }
    catch { /* Server-saved work continues when device storage is unavailable. */ }
  }
  useEffect(() => {
    if (!run) return;
    try { const text=sessionStorage.getItem(`hunchlane.${preview ? "preview." : ""}agent.buffer.${ownerId || "guest"}.${run.id}`); if(text) {bufferRef.current=text;setBuffer(text);} } catch { /* Preserve server-saved conversation. */ }
  }, [run?.id, preview, ownerId]);
  const acceptRun = useCallback((next: RunState) => { setRun(next); }, []);
  const sendOpening = useCallback(async (intent: StartIntent) => {
    if (guard.current) return;
    guard.current = true; setBusy(true); setNotice("");
    try {
      const response = await fetch(preview ? "/dev/agent-preview/api" : "/api/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: intent.id, brief: intent.brief, mode: "autonomous", ownerId: intent.owner || undefined, scenario }), signal: AbortSignal.timeout(20000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your idea could not be submitted.");
      if (data.id !== intent.id) throw new Error("Your submission could not be confirmed.");
      const savedDraft = readIdeaDraft(preview);
      if (savedDraft?.requestId === intent.id && JSON.stringify(savedDraft.brief) === JSON.stringify(intent.brief)) clearIdeaDraft(intent.id, preview);
      try {sessionStorage.removeItem(intentKey);} catch { /* A saved server run does not depend on device storage. */ }
      if (preview) { acceptRun(data.run); change(""); }
      else router.replace(`/research/${intent.id}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The connection is unavailable. I’ll check your saved submission automatically.");
    } finally { guard.current = false; setBusy(false); }
  }, [preview, scenario, intentKey, router, acceptRun]);

  useEffect(() => {
    if (initial) {
      try { const saved = JSON.parse(sessionStorage.getItem(pendingKey) || "null"); if (saved?.owner === ownerId) pending.current = saved.message; } catch { /* Corrupt local input never authorizes a request. */ }
      return;
    }
    const draft = fresh ? readFreshDraft() : readIdeaDraft(preview);
    if (draft && !fresh) briefRef.current = draft.brief;
    try { const text=sessionStorage.getItem(`hunchlane.${preview ? "preview." : ""}agent.buffer.${ownerId || "guest"}.new`); change(text ?? (draft && !fresh ? draft.buffer || draft.brief.idea : "")); } catch { if(draft && !fresh) change(draft.buffer || draft.brief.idea); }
    setLoaded(true);
    // Only the exact submitted intent returning through authentication can auto-start.
    if (!continueIntent || !signedIn && !preview) return;
    try {
      const intent = JSON.parse(sessionStorage.getItem(intentKey) || "null") as StartIntent | null;
      if (intent && intent.id === continueIntent && Date.now() - intent.createdAt < 30 * 60_000 && (!intent.owner || intent.owner === ownerId) && IdeaBriefSchema.safeParse(intent.brief).success) {
        intent.owner = ownerId; authorizedStart.current=intent.id; sessionStorage.setItem(intentKey, JSON.stringify(intent)); void sendOpening(intent);
      }
    } catch { setNotice("Your submitted idea could not be restored. Your saved draft is still available."); }
  }, [initial, fresh, preview, signedIn, continueIntent, intentKey, ownerId, pendingKey, sendOpening]);

  useEffect(() => {
    if (run || !signedIn && !preview) return;
    const timer = setInterval(() => {
      try { const intent = JSON.parse(sessionStorage.getItem(intentKey) || "null") as StartIntent | null;
        if (intent && authorizedStart.current === intent.id && intent.owner === ownerId && Date.now() - intent.createdAt < 30 * 60_000) void sendOpening(intent);
      } catch { /* Keep unsaved input visible. */ }
    }, 5000);
    return () => clearInterval(timer);
  }, [run, signedIn, preview, intentKey, ownerId, sendOpening]);

  useEffect(() => {
    if (!run) return;
    let active = true, timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await fetch(preview ? `/dev/agent-preview/api?id=${run!.id}` : `/api/runs/${run!.id}`, { cache: "no-store", signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error();
        const next = await response.json() as RunState;
        if (!active) return;
        acceptRun(next); setNotice("");
        if (pending.current) {
          const message = pending.current;
          if (next.agent?.conversation.messages.some(m => m.id === message.id)) { pending.current = null; sessionStorage.removeItem(pendingKey); }
          else {
            const result = await fetch(preview ? "/dev/agent-preview/api" : `/api/runs/${next.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(preview ? { ...message, runId: next.id } : message), signal: AbortSignal.timeout(15000) });
            if (result.ok) { const updated = await result.json(); if (active) acceptRun(updated); pending.current = null; sessionStorage.removeItem(pendingKey); }
            else if (result.status >= 400 && result.status < 500) { const data = await result.json(); if (active) setNotice(data.error || "This message could not be added."); pending.current = null; sessionStorage.removeItem(pendingKey); }
          }
        }
        if (next.status === "complete" || next.status === "failed") {
          // Keep readback alive for queued follow-up input, without polling completed work indefinitely.
          if (!pending.current) { if (active) timer = setTimeout(poll, 15000); return; }
        }
      } catch { if (active) setNotice("Updates are reconnecting. Your saved research continues in the background."); }
      if (active) timer = setTimeout(poll, 3000);
    }
    void poll();
    return () => { active = false; clearTimeout(timer); };
  }, [run?.id, preview, pendingKey, ownerId, acceptRun]);

  async function opening() {
    const parsed = IdeaBriefSchema.safeParse({ ...briefRef.current, idea: buffer.trim(), category: inferCategory(buffer) });
    if (!parsed.success) { setNotice(parsed.error.issues[0].message); input.current?.focus(); return; }
    if (!signedIn && !preview && !authConfigured) { setNotice("Sign-in is being connected. Your idea is still here."); return; }
    let intent: StartIntent = { id: crypto.randomUUID(), brief: parsed.data, owner: ownerId, createdAt: Date.now() };
    try {
      const saved = JSON.parse(sessionStorage.getItem(intentKey) || "null") as StartIntent | null;
      if (saved && saved.owner === ownerId && Date.now() - saved.createdAt < 30 * 60_000) intent = saved;
      sessionStorage.setItem(intentKey, JSON.stringify(intent));
      saveIdeaDraft({ ...newDraft(), brief: parsed.data, buffer: parsed.data.idea, requestId: intent.id }, preview);
      if (fresh) clearFreshDraft();
    } catch { setNotice("This browser could not save the submission identity. Allow session storage before starting research."); return; }
    if (!signedIn && !preview) { router.push(`/sign-in?redirect_url=${encodeURIComponent(`/new?start=${intent.id}`)}`); return; }
    authorizedStart.current=intent.id;
    await sendOpening(intent);
  }
  function submitMessage(text = buffer.trim(), chosenQuestion = questionId, useJudgment = false) {
    if (!text || pending.current || guard.current || !run) return;
    const message: AgentMessageInput = { id: crypto.randomUUID(), text, ...(chosenQuestion ? { questionId: chosenQuestion } : {}), useJudgment };
    try { sessionStorage.setItem(pendingKey, JSON.stringify({ owner: ownerId, message })); }
    catch { setNotice("This browser could not save your message for delivery. Your input is still here."); return; }
    pending.current = message; change(""); setQuestionId(undefined); setNotice("Your message is queued for delivery.");
    // Delivery retries reuse this identity. Polling research state never triggers paid work.
    void (async () => {
      guard.current = true; setBusy(true);
      try {
        const response = await fetch(preview ? "/dev/agent-preview/api" : `/api/runs/${run.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(preview ? { ...message, runId: run.id } : message), signal: AbortSignal.timeout(15000) });
        if (response.ok) { acceptRun(await response.json()); pending.current = null; sessionStorage.removeItem(pendingKey); setNotice(""); }
        else if (response.status < 500) { const data = await response.json(); setNotice(data.error || "The message could not be saved."); pending.current = null; sessionStorage.removeItem(pendingKey); change(text); }
      } catch { setNotice("Your message is saved in this tab and will send when the connection returns."); }
      finally { guard.current = false; setBusy(false); }
    })();
  }
  const terminal = run?.status === "complete" || run?.status === "failed";
  const questions = run?.agent?.conversation.questions.filter(q => !q.answer) || [];
  return <main id="main" className="idea-chat agent-chat">
    <div className="chat-top"><Link href="/home">← Your idea desk</Link><span><LockKeyhole size={13}/>Private research</span></div>
    <div className={`chat-heading${run ? " chat-heading-context" : ""}`}><span className="chat-kicker">FOLLOW YOUR HUNCH</span><h1>{run ? terminal ? run.report ? "A clearer next step." : "Your idea is saved." : "Following your hunch." : "What’s your hunch?"}</h1><p>{run ? "You can add context while I work. I’ll bring the evidence and next step together here." : "An app, a product, a service. Start with whatever is on your mind."}</p></div>
    {!loaded ? <p role="status">Opening your idea…</p> : <>
      {run?.agent && <section className="chat-thread" aria-label="Idea conversation">
        {[...run.agent.conversation.messages, ...run.agent.conversation.activity.map(a=>({id:`activity-${a.id}`,role:"assistant" as const,text:a.text,createdAt:a.createdAt,followUp:false}))].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(m => <div key={m.id} className={`chat-message chat-${m.role}`}>{m.role === "assistant" && <LaneMark/>}<div><p>{m.text}</p>{m.followUp && <small className="chat-subtle">Saved for a follow-up; the report keeps its original scope.</small>}</div></div>)}
        {!terminal && <div className="chat-message chat-assistant"><LaneMark/><p className="chat-activity" role="status"><LoaderCircle size={15} className="spinner"/>Research in progress</p></div>}
        {!terminal && questions.length > 0 && <section className="agent-questions" aria-label="Optional clarification"><p className="chat-subtle">Optional context · I’ll keep researching if you leave these open. Suggestions are unverified starting points.</p>{questions.map(q => <div key={q.id} className="agent-question"><h2>{q.text}</h2><div className="chat-suggestions">{q.suggestions.map(s => <button key={s} disabled={busy || Boolean(pending.current)} onClick={() => submitMessage(s, q.id as AgentMessageInput["questionId"])}>{s}</button>)}<button disabled={busy || Boolean(pending.current)} onClick={() => submitMessage("Use your judgment.", q.id as AgentMessageInput["questionId"], true)}>Use your judgment</button><button onClick={() => { setQuestionId(q.id as AgentMessageInput["questionId"]); input.current?.focus(); }}>Write my own answer</button></div></div>)}</section>}
        {run.report && <section className="agent-result" aria-label="Final research result"><span className="chat-kicker">YOUR RESEARCH REPORT</span><h2>{run.report.title}</h2><p>{run.report.summary.text} {run.report.summary.sourceIds.map(id => { const source = run.report!.sources.find(s => s.id === id); return source ? <a key={id} href={source.url} target="_blank" rel="noopener noreferrer">[{run.report!.sources.indexOf(source) + 1}]</a> : null; })}</p><details><summary>Read the full report</summary><ReportView report={run.report} runId={preview ? undefined : run.id} sample={preview} embedded/></details>{!preview && <Link className="chat-text-button" href={`/reports/${run.id}`}>Open standalone report <ArrowRight size={14}/></Link>}<div className="agent-followups"><h3>Where would you like to go next?</h3><p>Save a direction below. A new research run starts only when you submit a refinement.</p>{["Focus on a different audience", "Explore a different approach"].map(text => <button className="chat-text-button" key={text} onClick={() => { change(text); input.current?.focus(); }}>{text}<ArrowRight size={13}/></button>)}{!preview && !run.parentId && <Link className="chat-text-button" href={`/new/refine/${run.id}`}>Research a refinement <ArrowRight size={14}/></Link>}</div></section>}
      </section>}
      <div className="agent-composer-wrap"><form className="chat-composer" onSubmit={event => { event.preventDefault(); if (run) submitMessage(); else void opening(); }}><label htmlFor="agent-input" className="sr-only">{run ? questionId ? "Your clarification answer" : "Add context or a direction" : "Tell us what you have in mind."}</label><textarea ref={input} id="agent-input" value={buffer} onChange={e => change(e.target.value)} rows={3} maxLength={run ? 500 : 3000} placeholder={run ? terminal ? "A direction for your next look…" : "Add context or steer the research…" : "I’m thinking about…"}/><div className="chat-composer-bottom"><span>{run ? terminal ? "Saved as follow-up context." : questionId ? "Answering the selected question." : "Optional. The research continues." : "A sentence is enough."}</span><button type="submit" disabled={busy || Boolean(pending.current)} aria-label={run ? "Send message" : "Research my idea"}>{busy ? <LoaderCircle size={18} className="spinner"/> : <ArrowUp size={19}/>}</button></div></form>{!run && <p className="chat-subtle agent-consent">Sending starts research. Your idea and answers are shared with our research providers. {signedIn || preview ? "" : "Sign in to continue your submission."}</p>}{run && <p className="chat-subtle">{terminal ? "Your idea and conversation are saved. Return through " : "You can close this tab. The research continues; return through "}<Link href="/library">My ideas</Link>.</p>}{notice && <p className="chat-subtle" role="status">{notice}</p>}</div>
    </>}
  </main>;
}
