import {afterEach,expect,it,vi} from "vitest";
const journal=vi.hoisted(()=>({operation:vi.fn(),claimOperation:vi.fn(),saveOperation:vi.fn(),failUnchargedOperation:vi.fn()}));
vi.mock("@/server/store",()=>journal);
vi.mock("@/server/telemetry",()=>({observed:async(_id:string,_phase:string,fn:()=>Promise<unknown>)=>fn()}));
import {searchCrust} from "@/server/crustdata";
afterEach(()=>{vi.resetAllMocks();vi.unstubAllGlobals();vi.unstubAllEnvs();});
it("waits for provider responses without a request cutoff and journals explicit zero-credit failures",async()=>{
  vi.stubEnv("CRUSTDATA_API_KEY","test");journal.claimOperation.mockResolvedValue(true);
  const fetch=vi.fn().mockResolvedValue(new Response(null,{status:500,headers:{"X-Credits-Used":"0"}}));vi.stubGlobal("fetch",fetch);
  await expect(searchCrust("run",1,"query")).rejects.toThrow("CRUST_HTTP_500");
  expect(fetch.mock.calls[0][1]).not.toHaveProperty("signal");
  expect(journal.failUnchargedOperation).toHaveBeenCalledWith("run","crust-search-1",expect.objectContaining({status:500,credits:0}));
});
it("does not unlock a failure without a zero-credit receipt",async()=>{
  vi.stubEnv("CRUSTDATA_API_KEY","test");journal.claimOperation.mockResolvedValue(true);
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(null,{status:500})));
  await expect(searchCrust("run",1,"query")).rejects.toThrow("RECONCILIATION_REQUIRED");expect(journal.failUnchargedOperation).not.toHaveBeenCalled();
});
it("reuses completed evidence without a provider call",async()=>{
  journal.operation.mockResolvedValue({state:"complete",result:{sources:[]}});const fetch=vi.fn();vi.stubGlobal("fetch",fetch);
  expect(await searchCrust("run",0,"query")).toEqual({sources:[]});expect(fetch).not.toHaveBeenCalled();
});
