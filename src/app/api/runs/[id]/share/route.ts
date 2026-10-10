import { apiError,requireOwner,sameOrigin } from "@/server/auth";
import { createShare,revokeShares,ownedRun } from "@/server/store";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) { try { sameOrigin(request);return Response.json({token:await createShare((await params).id,await requireOwner())}); } catch(e) {return apiError(e);} }
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}) { try { sameOrigin(request);const owner=await requireOwner(),{id}=await params;if(!await ownedRun(id,owner)) return Response.json({error:"Report not found."},{status:404});await revokeShares(id,owner);return Response.json({revoked:true}); } catch(e) {return apiError(e);} }
