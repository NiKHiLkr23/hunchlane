import { z } from "zod";
import { IdeaBriefSchema } from "@/core/types";
import { apiError, requireOwner, sameOrigin, researchReady } from "@/server/auth";
import { createRun, listRuns, markDispatched } from "@/server/store";
import { inngest } from "@/server/inngest";
import { researchProvider } from "@/server/research-provider";
import { autonomousEnabled,createAgentRun,matchesAgentSubmission } from "@/server/agent-store";
import { dispatchAgentWake } from "@/server/inngest";
export const runtime = "nodejs";
export async function GET() { try { return Response.json({ runs:await listRuns(await requireOwner()) }); } catch(e) { return apiError(e); } }
export async function POST(request:Request) {
  try {
    sameOrigin(request); const owner=await requireOwner();
    if(!researchReady()) throw new Error("INTEGRATIONS_NOT_READY");
    const text=await request.text(); if(text.length>20000) return Response.json({error:"Your idea is too long."},{status:400});
    const input = z.object({id:z.uuid(),brief:IdeaBriefSchema,parentId:z.uuid().nullable().optional(),mode:z.enum(["legacy","autonomous"]).default("legacy"),ownerId:z.string().min(1).optional()}).safeParse(JSON.parse(text));
    if(!input.success) return Response.json({error:input.error.issues[0].message},{status:400});
    if(input.data.ownerId && input.data.ownerId!==owner) return Response.json({error:"Your account changed. This submission belongs to the account that started it."},{status:403});
    if(input.data.mode==="autonomous") {
      if(!autonomousEnabled()) return Response.json({error:"The continuous research flow is not available yet."},{status:503});
      let run;
      try { run=await createAgentRun(input.data.id,owner,input.data.brief,input.data.parentId||null,researchProvider()); }
      catch(error) { const existing=await import("@/server/store").then(s=>s.ownedRun(input.data.id,owner)); if(!existing || !await matchesAgentSubmission(input.data.id,owner,input.data.brief,input.data.parentId||null)) throw error; run=existing; }
      if(!run.dispatched && run.status==="queued") {
        try { await dispatchAgentWake({id:`agent-${run.id}-0`,runId:run.id,ownerId:owner,availableAt:run.createdAt}); } catch { /* The committed outbox will recover dispatch without the browser. */ }
      }
      return Response.json({id:run.id},{status:202});
    }
    const run=await createRun(input.data.id,owner,input.data.brief,input.data.parentId || null,researchProvider());
    if(!run.dispatched && run.status === "queued") {
      try { await inngest.send({id:`research-${run.id}`,name:"hunchlane/research.created",data:{runId:run.id,ownerId:owner}}); await markDispatched(run.id); } catch { return Response.json({id:run.id,warning:"Your idea is saved. The research queue is reconnecting."},{status:202}); }
    }
    return Response.json({id:run.id},{status:202});
  } catch(e) { return apiError(e); }
}
