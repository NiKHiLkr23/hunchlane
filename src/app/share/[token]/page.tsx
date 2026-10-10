import { sharedReport } from "@/server/store";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/report-view";
export const dynamic="force-dynamic";
export default async function SharePage({params}:{params:Promise<{token:string}>}) {if(!process.env.DATABASE_URL)notFound();const report=await sharedReport((await params).token);if(!report)notFound();return <ReportView report={report} shared/>;}
