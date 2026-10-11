import OpenAI from "openai";
import { wrapOpenAI } from "neatlogs";
import { z } from "zod";
import { ResearchContentSchema,type IdeaBrief,type ResearchReport } from "@/core/types";
import { claimOperation,operation,saveOperation } from "./store";
import { observed } from "./telemetry";
import { compositionParams,type ResearchEvidence } from "./research";
const allowed=new Set(["nova-micro","nova-lite","nova-pro","nova-2-lite","claude-haiku","claude-sonnet-4.6","claude-opus-4.6"]);
export async function sponsoredJson<T>(runId:string,phase:string,schema:z.ZodType<T>,instructions:string,input:unknown,maxTokens:number){
  const model=process.env.LITELLM_MODEL||"claude-sonnet-4.6";
  if(!allowed.has(model))throw new Error("UNSUPPORTED_SPONSORED_MODEL");
  if(!process.env.LITELLM_API_KEY)throw new Error("INTEGRATIONS_NOT_READY");
  const saved=await operation(runId,phase);if(saved?.state==="complete")return schema.parse(saved.result);
  if(saved||!await claimOperation(runId,phase))throw new Error("RECONCILIATION_REQUIRED");
  return observed(runId,phase,async()=>{
    const client=wrapOpenAI(new OpenAI({baseURL:"https://litellm.vision.aivar.app/v1",apiKey:process.env.LITELLM_API_KEY,maxRetries:0}));
    const result=await client.chat.completions.create({model,max_tokens:maxTokens,messages:[{role:"system",content:`${instructions}\nReturn one valid JSON object, without markdown, matching this JSON schema exactly:\n${JSON.stringify(z.toJSONSchema(schema))}`},{role:"user",content:JSON.stringify(input)}]});
    const content=result.choices[0]?.message.content;if(!content||result.choices[0].finish_reason==="length")throw new Error("SPONSORED_RESPONSE_INCOMPLETE");
    const parsed=schema.parse(JSON.parse(content.trim().replace(/^```(?:json)?\s*/,"").replace(/\s*```$/,"")));
    // Separate sponsor-funded usage from the personal OpenAI ledger. Neatlogs captures provider usage.
    await saveOperation(runId,phase,parsed,0);return parsed;
  });
}
export async function sponsoredComposition(runId:string,brief:IdeaBrief,evidence:ResearchEvidence,previous:ResearchReport|null){
  const params=compositionParams(brief,evidence,previous);
  return sponsoredJson(runId,"sponsored-composition",ResearchContentSchema,String(params.instructions),JSON.parse(String(params.input)),5500);
}
