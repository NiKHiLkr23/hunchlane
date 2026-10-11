import nextEnv from "@next/env";
import { researchProvider, providerReady, CRUST_CREDITS, crustCreditBudget } from "../src/server/research-provider";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const groups={Clerk:["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY","CLERK_SECRET_KEY"],Neon:["DATABASE_URL"],OpenAI:["OPENAI_API_KEY"],Neatlogs:["NEATLOGS_API_KEY"],Inngest:["INNGEST_EVENT_KEY","INNGEST_SIGNING_KEY"],"CFO OAuth":["CFO_OPERATOR_USER_ID","CREDENTIALS_ENCRYPTION_KEY"],"CFO model gate":["CFO_ORG_ID","CFO_MODEL_RECIPE_PATH"]};
for(const [name,keys] of Object.entries(groups)){const missing=keys.filter(k=>!process.env[k]);console.log(`${name}: ${missing.length?`missing ${missing.join(", ")}`:"configured (not live-verified)"}`);}
console.log(`Local Inngest: ${process.env.INNGEST_DEV==="1"?"enabled; dev server must be running":"disabled"}`);
console.log(`Sponsored LiteLLM: ${process.env.LITELLM_API_KEY?"configured (not live-verified)":"not configured; OpenAI composition used"}`);
console.log(`Crustdata: ${process.env.CRUSTDATA_API_KEY?"key configured; run pnpm crust:check to verify account access":"not configured"}`);
console.log(`Crustdata credit allowance: ${process.env.CRUSTDATA_CREDIT_BUDGET||"0"}; requires migrated budget configuration`);
console.log(`Research provider: ${process.env.RESEARCH_PROVIDER||"auto"}; persisted when each run is created`);
console.log(`CFO model verified flag: ${process.env.CFO_INTEGRATION_VERIFIED==="true"?"set; live arithmetic and isolation still require evidence":"not set"}`);
try {
  console.log(`Crustdata per-run reservations: full ${CRUST_CREDITS.full} credits; refinement ${CRUST_CREDITS.refinement} credits`);
  const provider=researchProvider();
  const ready=Boolean(process.env.DATABASE_URL && providerReady(provider) && process.env.NEATLOGS_API_KEY && (process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV==="1"));
  console.log(`Selected research provider: ${provider}`);
  console.log(`Research admission: ${ready?"configured; worker, account and persisted allowance still require verification":"BLOCKED"}`);
  if(!ready){
    if(!process.env.OPENAI_API_KEY && process.env.CRUSTDATA_API_KEY && process.env.LITELLM_API_KEY && crustCreditBudget()<CRUST_CREDITS.full) console.error("Crustdata is configured but CRUSTDATA_CREDIT_BUDGET is missing or too low. Match it to the approved persisted allowance; auto selection currently falls back to unavailable OpenAI.");
    process.exitCode=1;
  }
} catch {console.error("Research admission: BLOCKED by invalid provider configuration. Credentials omitted.");process.exitCode=1;}
