import nextEnv from "@next/env";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createRun,failRun,listRuns } from "../src/server/store";
import { sponsoredJson } from "../src/server/sponsored-model";
nextEnv.loadEnvConfig(process.cwd());
// One tiny, journaled connection check using a private system run. Re-running reuses its receipt.
const owner="system:sponsored-model-check";
let id:string|undefined;
try{
  if(!process.env.LITELLM_API_KEY||!process.env.NEATLOGS_API_KEY)throw new Error("Missing integration keys.");
  const [existing]=await listRuns(owner);id=existing?.id||randomUUID();
  if(!existing)await createRun(id,owner,{idea:"Check the model connection for Hunchlane, an idea research tool.",category:"software",audience:"",location:"",answers:{}},null);
  await sponsoredJson(id,"model-connection-check",z.object({ok:z.literal(true)}),"This is a connection check. Return the required JSON object with ok set to true.",{check:"hunchlane-sponsored-model"},32);
  await failRun(id,"Internal connection check complete; no research report was generated.");
  console.log("Sponsored model returned valid JSON. The request has a persisted reservation/receipt and a Neatlogs trace. This does not verify live research quality.");
}catch{
  if(id)await failRun(id,"Internal connection check paused. Inspect its provider operation before retrying.").catch(()=>{});
  console.error("Sponsored model check did not pass. Inspect the saved operation; no credentials or provider response were printed.");process.exitCode=1;
}
