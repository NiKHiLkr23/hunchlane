import { requireOwner } from "@/server/auth";
import { ownedRun } from "@/server/store";
import { notFound,redirect } from "next/navigation";
import { ReportView } from "@/components/report-view";
export const dynamic="force-dynamic";
export default async function ReportPage({params}:{params:Promise<{id:string}>}) { let owner:string;try{owner=await requireOwner();}catch{redirect("/sign-in");}const {id}=await params;const run=await ownedRun(id,owner);if(!run)notFound();if(!run.report)redirect(`/research/${id}`);return <ReportView report={run.report} runId={id}/>; }
