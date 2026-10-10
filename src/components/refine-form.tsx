"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IdeaBrief } from "@/core/types";
import { Button } from "./ui/button";
export function RefineForm({id,brief}:{id:string;brief:IdeaBrief}) {
  const [idea,setIdea]=useState(brief.idea),[audience,setAudience]=useState(brief.audience),[difference,setDifference]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[requestId]=useState(()=>crypto.randomUUID());const router=useRouter();
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{const r=await fetch("/api/runs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:requestId,parentId:id,brief:{...brief,idea,audience,answers:{...brief.answers,refinement:difference}}})});const d=await r.json();if(!r.ok)throw new Error(d.error);router.push(`/research/${d.id}`);}catch(e){setError(e instanceof Error?e.message:"Could not start refinement.");}finally{setBusy(false);}}
  return <form className="refine-form composer" onSubmit={submit} style={{padding:28}}><label>Updated idea<textarea value={idea} onChange={e=>setIdea(e.target.value)} minLength={20} maxLength={3000} required/></label><label>Audience<input value={audience} onChange={e=>setAudience(e.target.value)} maxLength={300}/></label><label>What changed, and what should we investigate?<textarea value={difference} onChange={e=>setDifference(e.target.value)} maxLength={500} required placeholder="For example, focus on weekly game nights instead of any meetup."/></label>{error&&<p role="alert" className="error-message">{error}</p>}<Button disabled={busy}>{busy?"Starting…":"Research this angle →"}</Button><p className="fine-print" style={{marginTop:15}}>Your first report stays saved. This is your one hackathon refinement.</p></form>;
}
