import {afterEach,expect,it,vi} from "vitest";
const journal=vi.hoisted(()=>({operation:vi.fn(),claimOperation:vi.fn(),saveOperation:vi.fn(),saveProviderReceipt:vi.fn(),failUnchargedOperation:vi.fn(),recordCrustUncertainFailure:vi.fn()}));
vi.mock("@/server/store",()=>journal);
vi.mock("@/server/telemetry",()=>({observed:async(_id:string,_phase:string,fn:()=>Promise<unknown>)=>fn()}));
import {searchCrust,CrustHttpError} from "@/server/crustdata";
afterEach(()=>{vi.resetAllMocks();vi.unstubAllGlobals();vi.unstubAllEnvs();});
it("waits for provider responses without a request cutoff and journals explicit zero-credit failures",async()=>{
  vi.stubEnv("CRUSTDATA_API_KEY","test");journal.claimOperation.mockResolvedValue(true);
  const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{type:"upstream_timeout",message:"private raw provider message"},private:"raw body"}),{status:500,headers:{"X-Credits-Used":"0","x-request-id":"request-123"}}));vi.stubGlobal("fetch",fetch);
  await expect(searchCrust("run",1,"query")).rejects.toThrow("CRUST_HTTP_500");
  expect(fetch.mock.calls[0][1]).not.toHaveProperty("signal");
  expect(journal.failUnchargedOperation).toHaveBeenCalledWith("run","crust-search-1",{status:500,credits:0,confirmedAt:expect.any(String),requestId:"request-123",errorType:"upstream_timeout"});
});
it("does not unlock a failure without a zero-credit receipt",async()=>{
  vi.stubEnv("CRUSTDATA_API_KEY","test");journal.claimOperation.mockResolvedValue(true);
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{type:"internal_error",message:"private raw provider message"},private:"raw body"}),{status:500,headers:{"request-id":"request-456"}})));
  await expect(searchCrust("run",1,"query")).rejects.toThrow("RECONCILIATION_REQUIRED");expect(journal.failUnchargedOperation).not.toHaveBeenCalled();
  expect(journal.recordCrustUncertainFailure).toHaveBeenCalledWith("run","crust-search-1",{status:500,requestId:"request-456",errorType:"internal_error",confirmedAt:expect.any(String)});
});
it("reuses completed evidence without a provider call",async()=>{
  journal.operation.mockResolvedValue({state:"complete",result:{sources:[]}});const fetch=vi.fn();vi.stubGlobal("fetch",fetch);
  expect(await searchCrust("run",0,"query")).toEqual({sources:[]});expect(fetch).not.toHaveBeenCalled();
});

it("omits unsafe provider codes and raw error text from uncertain receipts",async()=>{
  vi.stubEnv("CRUSTDATA_API_KEY","test");journal.claimOperation.mockResolvedValue(true);
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{type:"contains private text!",message:"secret raw message"}}),{status:502,headers:{"x-request-id":"unsafe request id"}})));
  await expect(searchCrust("run",1,"query")).rejects.toThrow("RECONCILIATION_REQUIRED");
  expect(journal.recordCrustUncertainFailure).toHaveBeenCalledWith("run","crust-search-1",{status:502,requestId:undefined,errorType:undefined,confirmedAt:expect.any(String)});
});
it("retains the raw charged receipt before JSON decoding can fail",async()=>{
  vi.stubEnv("CRUSTDATA_API_KEY","test");journal.claimOperation.mockResolvedValue(true);
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response('{malformed',{status:200,headers:{"X-Credits-Used":"1"}})));
  await expect(searchCrust("run",0,"query")).rejects.toThrow();
  expect(journal.saveProviderReceipt).toHaveBeenCalledWith("run","crust-search-0",{body:'{malformed',credits:1000},0,1000);
  expect(journal.saveOperation).not.toHaveBeenCalled();
});
it("preserves Retry-After on a provider-confirmed uncharged failure",async()=>{
  vi.stubEnv("CRUSTDATA_API_KEY","test");journal.claimOperation.mockResolvedValue(true);
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response('{}',{status:429,headers:{"X-Credits-Used":"0","Retry-After":"90"}})));
  const error=await searchCrust("run",0,"query").catch(error=>error);
  expect(error).toBeInstanceOf(CrustHttpError);expect(error.retryAfterSeconds).toBe(90);
});
