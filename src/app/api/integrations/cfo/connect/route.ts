import { requireOwner,sameOrigin } from "@/server/auth";
import { beginCfoAuthorization } from "@/server/cfo-oauth";
export async function POST(request:Request){try{sameOrigin(request);const owner=await requireOwner();if(owner!==process.env.CFO_OPERATOR_USER_ID)return Response.json({error:"Integration setup is restricted to the project operator."},{status:403});return Response.json({url:await beginCfoAuthorization(owner)});}catch{return Response.json({error:"CFO.ai authorization could not start. Check the database, app URL and credential vault configuration."},{status:503});}}
