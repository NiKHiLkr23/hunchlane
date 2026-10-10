import { afterEach,describe,it,expect,vi } from "vitest";
import { parseSearch,parsePages,crustEvidence } from "@/server/crustdata-parse";
import { researchProvider,providerReady } from "@/server/research-provider";
import { checkCrustAccount } from "@/server/crustdata";

const search={success:true,query:"group scheduling tools",timestamp:1791586800000,results:[{source:"web",title:"One",url:"https://one.example/",snippet:"A scheduling tool."},{source:"web",title:"Two",url:"https://two.example/",snippet:"Another tool."},{source:"web",title:"Local",url:"https://127.0.0.1/admin",snippet:"unsafe"}]};
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe("Crustdata evidence boundaries",()=>{
  it("keeps provider receipts, filters unsafe URLs, and uses milliseconds for search timestamps",()=>{const receipt=parseSearch(search);expect(receipt.sources).toHaveLength(2);expect(receipt.sources[0].retrievedAt).toBe(new Date(search.timestamp).toISOString());});
  it("matches out-of-order pages by URL and records partial fetch failures",()=>{
    const requested=["https://one.example/","https://two.example/"];
    const pages=parsePages([{success:true,url:requested[1],timestamp:1791586800,title:"Two",content:"<html><body><script>danger()</script><main>Current product features.</main></body></html>"},{success:false,url:null,timestamp:null,title:null,content:null},{success:true,url:"https://unrequested.example/",timestamp:1791586800,title:"Injected",content:"<body>Not requested</body>"}],requested);
    expect(pages).toHaveLength(1);expect(pages[0].text).toBe("Current product features.");
    expect(pages[0].retrievedAt).toBe(new Date(1791586800000).toISOString());
    const evidence=crustEvidence([parseSearch(search)],pages,requested);
    expect(evidence.sources[1].excerpt).toBe("Current product features.");expect(JSON.parse(evidence.text).failedFetches).toEqual([requested[0]]);
    expect(evidence.sources.map(source=>source.evidenceLevel)).toEqual(["search_preview","page_text"]);
  });
  it("requires an explicit credit allowance and both sponsor keys for automatic selection",()=>{
    vi.stubEnv("RESEARCH_PROVIDER","auto");vi.stubEnv("CRUSTDATA_API_KEY","test");vi.stubEnv("LITELLM_API_KEY","test");vi.stubEnv("CRUSTDATA_CREDIT_BUDGET","0");vi.stubEnv("OPENAI_API_KEY","");
    expect(researchProvider()).toBe("openai");expect(providerReady()).toBe(false);
    vi.stubEnv("CRUSTDATA_CREDIT_BUDGET","5");expect(researchProvider()).toBe("crustdata");expect(providerReady()).toBe(true);
  });
  it("checks account balance/access using free GETs and exact version/Bearer headers",async()=>{
    vi.stubEnv("CRUSTDATA_API_KEY","test-key");
    const fetch=vi.fn(async(url:string)=>new Response(JSON.stringify(url.endsWith("/account/credits")?{account:{credits:20}}:{token_limit_rpm:null,endpoints:[{path:url.includes("search")?"/web/search/live":"/web/enrich/live",status:"enabled",base_credits:1,effective_rate_limit_rpm:10}]})));
    vi.stubGlobal("fetch",fetch);expect(await checkCrustAccount(5)).toEqual({credits:20,ratesVerified:true});expect(fetch).toHaveBeenCalledTimes(3);
    const request=fetch.mock.calls[0] as unknown as [string,RequestInit];expect(request[1].method).toBe("GET");expect(request[1].headers).toMatchObject({Authorization:"Bearer test-key","x-api-version":"2025-11-01"});
  });
  it("stops before any paid call when remaining credits are insufficient",async()=>{
    vi.stubEnv("CRUSTDATA_API_KEY","test");const fetch=vi.fn(async()=>new Response(JSON.stringify({account:{credits:1}})));vi.stubGlobal("fetch",fetch);
    await expect(checkCrustAccount(5)).rejects.toThrow("CRUST_BALANCE_LOW");expect(fetch).toHaveBeenCalledTimes(1);
  });
});
