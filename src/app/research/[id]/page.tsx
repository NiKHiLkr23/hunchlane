import { requireOwner } from "@/server/auth";
import { ownedRun } from "@/server/store";
import { notFound,redirect } from "next/navigation";
import { RunProgress } from "@/components/run-progress";
export const dynamic="force-dynamic";
export default async function ResearchPage({params}:{params:Promise<{id:string}>}) { let owner:string;try{owner=await requireOwner();}catch{redirect("/sign-in");}const {id}=await params;const run=await ownedRun(id,owner);if(!run)notFound();if(run.report)redirect(`/reports/${id}`);return <RunProgress initial={run}/>; }
