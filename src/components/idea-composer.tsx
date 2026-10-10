"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Globe2, LockKeyhole, LoaderCircle } from "lucide-react";
import { Button } from "./ui/button";
import { IdeaBriefSchema, clarify, type IdeaBrief } from "@/core/types";
import { FinancialAssumptions } from "./financial-assumptions";
import { newDraft } from "@/core/idea-draft";
import { readIdeaDraft, saveIdeaDraft } from "@/lib/idea-draft";
const initial: IdeaBrief = { idea: "", category: "software", audience: "", location: "", answers: {} };
const examples = [
  { label: "Plans with friends", type: "App", category: "software", idea: "An app that finds a time everyone in a friend group can meet" },
  { label: "Meal kits for one", type: "Product", category: "physical", idea: "A meal kit for people cooking for one" },
  { label: "Coworking for night owls", type: "Service", category: "service", idea: "A quiet coworking space for night owls" },
] as const;
export function IdeaComposer({ compact = false, signedIn = false, authConfigured = false, fresh = false }: { compact?: boolean; signedIn?: boolean; authConfigured?: boolean; fresh?: boolean }) {
  const router = useRouter();
  const [brief,setBrief] = useState<IdeaBrief>(initial), [step,setStep] = useState<"describe"|"clarify">("describe"), [error,setError] = useState(""), [busy,setBusy] = useState(false);
  const [requestId,setRequestId] = useState<string | null>(null);
  const ideaInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (fresh) return; const saved=readIdeaDraft(); if(saved) setBrief(saved.brief); },[fresh]);
  function update<K extends keyof IdeaBrief>(key: K,value: IdeaBrief[K]) { setBrief(old => ({ ...old,[key]:value })); setRequestId(null); setError(""); }
  function saveDraft(value = brief) { return saveIdeaDraft({...newDraft(),brief:value,step:"context",messages:[{role:"user",text:value.idea}]}); }
  function describe(event: React.FormEvent) {
    event.preventDefault(); const parsed=IdeaBriefSchema.safeParse(brief); if(!parsed.success) { setError(parsed.error.issues[0].message); ideaInput.current?.focus(); return; }
    if (!saveDraft(parsed.data)) { setError("Your browser could not save this draft. Allow local storage before continuing."); return; }
    if (compact) { router.push("/new"); return; }
    setStep("clarify"); setError("");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); saveDraft();
    if (!signedIn) { if(authConfigured) router.push("/sign-in?redirect_url=%2Fnew"); else setError("Sign-in and live research are being connected. Your idea is saved on this device; explore the sample while you wait."); return; }
    setBusy(true); setError("");
    const id = requestId || crypto.randomUUID(); setRequestId(id);
    try {
      const response = await fetch("/api/runs", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id,brief }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Research could not start.");
       router.push(`/research/${data.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Research could not start. Your idea is saved."); } finally { setBusy(false); }
  }
  return <section className={compact ? "composer compact-composer" : "composer workbench"} aria-label="Describe your idea">
    {!compact && <div className="step-label"><span className="step-count">{step === "describe" ? "01" : "02"}</span><span>{step === "describe" ? "Start with a hunch" : "A little more context"}</span><span className="muted">{step === "describe" ? "1" : "2"} of 2</span></div>}
    {step === "describe" ? <form onSubmit={describe}>
      <label htmlFor="idea" className="composer-label">{compact ? "What’s your idea?" : "Tell us what you have in mind."}</label>
      <textarea id="idea" ref={ideaInput} value={brief.idea} onChange={e=>update("idea",e.target.value)} maxLength={3000} placeholder={compact ? "An app, a product, a service…\nWhat would you like to explore?" : "I’m thinking about building…"} rows={compact ? 4 : 5} aria-invalid={Boolean(error)} aria-describedby={`idea-hint${error ? " idea-error" : ""}`} autoFocus={!compact}/>
      <div className="composer-bottom"><span id="idea-hint" className="muted">{compact ? "Start with a sentence. Sign in before research begins." : "A sentence or two is enough. No pitch deck needed."}</span><span className="muted char-count">{brief.idea.length}/3000</span></div>
      {!compact && <><fieldset className="category-options"><legend>What kind of idea is it?</legend>{([ ["software","Software or app"], ["physical","Physical product"], ["service","A service or place"] ] as const).map(([value,label])=><label className={brief.category === value ? "category-option selected" : "category-option"} key={value}><input type="radio" name="category" value={value} checked={brief.category === value} onChange={()=>update("category",value)}/>{label}</label>)}</fieldset><div className="field-grid"><label>Who is it for? <span className="muted">(optional)</span><input value={brief.audience} maxLength={300} onChange={e=>update("audience",e.target.value)} placeholder="e.g. Students living away from home"/></label><label>Where? <span className="muted">(optional)</span><input value={brief.location} maxLength={150} onChange={e=>update("location",e.target.value)} placeholder="e.g. Bengaluru, or anywhere"/></label></div></>}
      {error && <p className="error-message" role="alert" id="idea-error">{error}</p>}
      <div className="composer-action"><span className="privacy-note"><LockKeyhole size={13}/> Your ideas start private</span><Button type="submit">Explore my idea <ArrowRight size={16}/></Button></div>
    </form> : <form onSubmit={submit}><h2>Let’s make the search useful.</h2><p className="muted">Two quick questions. It’s okay to be figuring things out.</p><blockquote className="idea-quote">{brief.idea}</blockquote>{clarify(brief).map(q=><label className="clarify-field" key={q.id}>{q.label}<span className="muted field-hint">{q.hint}</span><input value={brief.answers[q.id] || ""} maxLength={500} onChange={e=>update("answers",{ ...brief.answers,[q.id]:e.target.value })}/><button type="button" className="text-button" onClick={()=>update("answers",{ ...brief.answers,[q.id]:"Not sure yet" })}>I’m not sure yet</button></label>)}
      <FinancialAssumptions value={brief.answers.finance || ""} onChange={value=>update("answers",{...brief.answers,finance:value})}/>
      <p className="privacy-note"><Globe2 size={15}/> We’ll search the web, check alternatives, and save a cited report. Your description is sent to our research providers.</p>
      {error && <p className="error-message" role="alert">{error} <a href="/sample">See a sample report</a></p>}
      <div className="composer-action"><Button type="button" variant="ghost" onClick={()=>setStep("describe")}>Back</Button><Button type="submit" disabled={busy}>{busy ? <><LoaderCircle size={16} className="spinner"/>Starting research…</> : <>{signedIn ? "Start research" : "Sign in to research"}<ArrowRight size={16}/></>}</Button></div>
    </form>}
    {compact && <div className="example-row"><span>Or borrow a starting point</span><div className="studio-examples">{examples.map(example=><button type="button" key={example.category} onClick={()=>{setBrief({...initial,idea:example.idea,category:example.category});setError("");setRequestId(null);ideaInput.current?.focus();}}><span className="studio-example-type">{example.type}</span><span>{example.label}</span><ArrowUpRight size={14}/></button>)}</div></div>}
  </section>;
}
