import { apiError,requireOwner } from "@/server/auth";
import { ownedRun } from "@/server/store";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  try { const run=await ownedRun((await params).id,await requireOwner()); return run ? Response.json(run,{headers:{"Cache-Control":"private, no-store"}}) : Response.json({error:"Report not found."},{status:404}); } catch(e) { return apiError(e); }
}
