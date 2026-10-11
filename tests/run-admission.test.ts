import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@clerk/nextjs/server",()=>({auth:async()=>({userId:"user_admission_fixture"})}));
vi.mock("@/server/inngest",()=>({inngest:{send:vi.fn()},dispatchAgentWake:vi.fn()}));
import { POST } from "@/app/api/runs/route";
const request=()=>new Request("http://localhost:3100/api/runs",{method:"POST",headers:{origin:"http://localhost:3100","content-type":"application/json"},body:JSON.stringify({id:"00000000-0000-4000-8000-000000000001",mode:"autonomous",brief:{}})});
beforeEach(()=>{
  for(const [key,value] of Object.entries({CLERK_SECRET_KEY:"fixture",NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:"fixture",DATABASE_URL:"fixture",NEATLOGS_API_KEY:"fixture",INNGEST_DEV:"1",INNGEST_EVENT_KEY:"",RESEARCH_PROVIDER:"auto",CRUSTDATA_API_KEY:"fixture",LITELLM_API_KEY:"fixture",OPENAI_API_KEY:"",HUNCHLANE_AUTONOMOUS_FLOW:"1"})) vi.stubEnv(key,value);
  vi.stubGlobal("fetch",vi.fn(()=>{throw Error("No network calls allowed in admission validation");}));
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it("returns 503 when auto selection lacks a credit allowance and OpenAI is unavailable",async()=>{
  vi.stubEnv("CRUSTDATA_CREDIT_BUDGET","");
  expect((await POST(request())).status).toBe(503);expect(fetch).not.toHaveBeenCalled();
});
it("passes readiness with the approved Crustdata allowance without requiring an OpenAI key",async()=>{
  vi.stubEnv("CRUSTDATA_CREDIT_BUDGET","5000");
  // Invalid brief deliberately stops before reservation or any paid operation.
  expect((await POST(request())).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
});
