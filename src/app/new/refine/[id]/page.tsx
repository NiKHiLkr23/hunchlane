import { requireOwner } from "@/server/auth";
import { ownedRun } from "@/server/store";
import { redirect,notFound } from "next/navigation";
import { autonomousEnabled } from "@/server/agent-store";
import { RefineForm } from "@/components/refine-form";
export const dynamic="force-dynamic";
export default async function RefinePage({params}:{params:Promise<{id:string}>}){let owner:string;try{owner=await requireOwner();}catch{redirect("/sign-in");}const {id}=await params;const run=await ownedRun(id,owner);if(!run?.report||run.parentId)notFound();return <main id="main" className="narrow-page"><div className="page-intro"><span className="eyebrow">ONE MORE LOOK</span><h1>Try a different lane.</h1><p>Keep what you learned. Change one assumption. See what moves.</p></div><RefineForm id={id} brief={run.agent?.finalBrief || run.brief} autonomous={autonomousEnabled()}/></main>;}
