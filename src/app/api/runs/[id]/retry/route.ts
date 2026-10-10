import { apiError,requireOwner,sameOrigin } from "@/server/auth";
import { retryRun,markDispatched } from "@/server/store";
import { inngest } from "@/server/inngest";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  try { sameOrigin(request); const owner=await requireOwner(), {id}=await params; const run=await retryRun(id,owner);
    await inngest.send({id:`retry-${run.id}-${crypto.randomUUID()}`,name:"hunchlane/research.created",data:{runId:run.id,ownerId:owner}}); await markDispatched(id); return Response.json({id});
  } catch(e) { return apiError(e); }
}
