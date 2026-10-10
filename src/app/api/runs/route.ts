import { z } from "zod";
import { IdeaBriefSchema } from "@/core/types";
import { apiError, requireOwner, sameOrigin, researchReady } from "@/server/auth";
import { createRun, listRuns, markDispatched } from "@/server/store";
import { inngest } from "@/server/inngest";
import { researchProvider } from "@/server/research-provider";
export const runtime = "nodejs";
export async function GET() { try { return Response.json({ runs:await listRuns(await requireOwner()) }); } catch(e) { return apiError(e); } }
export async function POST(request:Request) {
  try {
    sameOrigin(request); const owner=await requireOwner();
    if(!researchReady()) throw new Error("INTEGRATIONS_NOT_READY");
    const text=await request.text(); if(text.length>20000) return Response.json({error:"Your idea is too long."},{status:400});
    const input = z.object({id:z.uuid(),brief:IdeaBriefSchema,parentId:z.uuid().nullable().optional()}).safeParse(JSON.parse(text));
    if(!input.success) return Response.json({error:input.error.issues[0].message},{status:400});
    const run=await createRun(input.data.id,owner,input.data.brief,input.data.parentId || null,researchProvider());
    if(!run.dispatched && run.status === "queued") {
      try { await inngest.send({id:`research-${run.id}`,name:"hunchlane/research.created",data:{runId:run.id,ownerId:owner}}); await markDispatched(run.id); } catch { return Response.json({id:run.id,warning:"Your idea is saved. The research queue is reconnecting."},{status:202}); }
    }
    return Response.json({id:run.id},{status:202});
  } catch(e) { return apiError(e); }
}
