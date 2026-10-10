import { readFile } from "node:fs/promises";
import { z } from "zod";
import { FinancialInputsSchema,type FinancialResult,type IdeaBrief } from "@/core/types";
import { verifyFinancials } from "@/core/finance";
import { connectCfo } from "./cfo-oauth";
import { claimOperation,operation,saveOperation } from "./store";
import { observed } from "./telemetry";
const Month=z.object({month:z.number().int(),units:z.number().finite(),revenue:z.number().finite(),variableCost:z.number().finite(),fixedCost:z.number().finite(),profit:z.number().finite(),cash:z.number().finite().nullable()});
const Scenario=z.object({name:z.enum(["Conservative","Base","Optimistic"]),months:z.array(Month).length(12),annualRevenue:z.number().finite(),annualProfit:z.number().finite(),breakEvenUnits:z.number().finite().nullable()});
const Action=z.object({tool:z.enum(["inspect_skills","inspect_pages","inspect_table_blocks","inspect_scenarios","edit_pages","edit_table_blocks","edit_scenarios"]),args:z.record(z.string(),z.unknown())});
const Recipe=z.object({schemaVersion:z.literal(1),verified:z.literal(true),workspaceId:z.string().min(1),buildModelSkillRead:Action,preflight:z.array(Action),actions:z.array(Action).max(12),resultAction:Action});
const unavailable=(message:string):FinancialResult=>({status:"unavailable",provider:"cfo.ai",message});
function substitute(value:unknown,variables:Record<string,string|number>):unknown {
  if(typeof value==="string")return value.replace(/\{\{([\w]+)\}\}/g,(_m,key)=>{if(!(key in variables))throw new Error("Unknown CFO.ai template variable.");return String(variables[key]);});
  if(Array.isArray(value))return value.map(v=>substitute(v,variables));
  if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,substitute(v,variables)]));
  return value;
}
export async function modelIdeaWithCfo(runId:string,brief:IdeaBrief):Promise<FinancialResult>{
  if(process.env.CFO_INTEGRATION_VERIFIED!=="true"||!process.env.CFO_MODEL_RECIPE_PATH)return unavailable("CFO.ai modeling is still being connected. No financial forecast has been generated for this idea.");
  let raw:unknown=null;try{raw=brief.answers.finance?JSON.parse(brief.answers.finance):null;}catch{}
  const parsed=FinancialInputsSchema.safeParse(raw);
  if(!parsed.success)return unavailable("Financial assumptions weren’t supplied. Add price, costs and sales assumptions before asking CFO.ai to model this idea.");
  const saved=await operation(runId,"cfo");if(saved?.state==="complete")return saved.result as FinancialResult;
  if(saved||!await claimOperation(runId,"cfo"))return unavailable("A CFO.ai model request needs reconciliation. It won’t be duplicated automatically.");
  return observed(runId,"cfo.model",async()=>{
    let client:Awaited<ReturnType<typeof connectCfo>>|undefined;
    try{
      const recipe=Recipe.parse(JSON.parse(await readFile(process.env.CFO_MODEL_RECIPE_PATH!,"utf8")));
      if(recipe.workspaceId!==process.env.CFO_ORG_ID)throw new Error("CFO_WORKSPACE_MISMATCH");
      // Run IDs, never user-provided text, namespace all saved tables/pages and Variables.
      if(!recipe.actions.every(a=>JSON.stringify(a.args).includes("{{runId}}")))throw new Error("CFO_RECIPE_NOT_ISOLATED");
      client=await connectCfo();const tools=await client.listTools(),names=new Set(tools.tools.map(t=>t.name));
      if(!client.getInstructions())throw new Error("CFO_MODEL_INSTRUCTIONS_MISSING");
      const variables={...parsed.data,startingCapital:parsed.data.startingCapital??"unknown",runId};
      async function call(action:z.infer<typeof Action>){if(!names.has(action.tool))throw new Error("CFO_TOOL_UNAVAILABLE");const result=await client!.callTool({name:action.tool,arguments:{...substitute(action.args,variables) as Record<string,unknown>,org_id:recipe.workspaceId}});if(result.isError)throw new Error("CFO_TOOL_FAILED");return result;}
      if(recipe.buildModelSkillRead.tool!=="inspect_skills"||!JSON.stringify(recipe.buildModelSkillRead.args).includes("instructions"))throw new Error("CFO_SKILL_INSTRUCTIONS_REQUIRED");
      await call(recipe.buildModelSkillRead);for(const action of recipe.preflight){if(!action.tool.startsWith("inspect_"))throw new Error("CFO_PREFLIGHT_MUST_BE_READ_ONLY");await call(action);}
      for(const action of recipe.actions)await call(action);
      if(recipe.resultAction.tool!=="inspect_table_blocks")throw new Error("CFO_RESULT_MUST_BE_READ_BACK");
      const result=await call(recipe.resultAction);
      // The verified recipe must supply a structured output contract, established from live tool receipts.
      const output=z.object({modelUrl:z.string().url(),receipt:z.string(),scenarios:z.array(Scenario).length(3)}).parse(result.structuredContent);
      if(!output.modelUrl.startsWith("https://app.cfo.ai/"))throw new Error("CFO_MODEL_URL_INVALID");
      const scenarios=verifyFinancials(parsed.data,output.scenarios);
      const finance:FinancialResult={status:"verified",provider:"cfo.ai",message:"CFO.ai created this model from your assumptions. Its arithmetic was independently checked. Demand has not been validated.",modelUrl:output.modelUrl,receipt:output.receipt,scenarios,inputs:parsed.data};
      await saveOperation(runId,"cfo",finance);return finance;
    }catch{return unavailable("CFO.ai could not return a verified model. The research report is available; financial results remain unverified.");}finally{await client?.close().catch(()=>undefined);}
  });
}
