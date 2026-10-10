import { beforeAll,beforeEach,afterAll,describe,it,expect,vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile,readdir } from "node:fs/promises";
const harness=vi.hoisted(()=>({query:undefined as undefined|((sql:string,args:unknown[])=>Promise<unknown[]>)}));
vi.mock("@neondatabase/serverless",()=>({neon:()=>async(strings:TemplateStringsArray,...args:unknown[])=>{const query=strings.reduce((s,part,i)=>s+part+(i<args.length?`$${i+1}`:""),"");return harness.query!(query,args);}}));
import { createRun,ownedRun,internalRun,listRuns,finishRun,createShare,sharedReport,revokeShares,claimOperation,saveResponseId,saveOperation,retryRun,failRun,reserveCrustSlot,db } from "@/server/store";
import { sampleReport } from "@/core/sample";
let engine:PGlite;
beforeAll(async()=>{process.env.DATABASE_URL="postgres://test";engine=new PGlite();harness.query=async(sql,args)=>(await engine.query(sql,args)).rows;const folder=new URL("../drizzle/",import.meta.url);for(const file of (await readdir(folder)).filter(f=>f.endsWith(".sql")).sort())await engine.exec(await readFile(new URL(file,folder),"utf8"));},30000);
beforeEach(async()=>{await engine.exec("TRUNCATE provider_operations, shares, runs, budgets, credentials CASCADE; INSERT INTO budgets (id,limit_cents) VALUES ('research',1500);");});
afterAll(async()=>{await engine.close();});
describe("persisted ownership and reservations (real SQL, embedded PostgreSQL)",()=>{
  it("isolates private reports and the library by owner",async()=>{await createRun("a","alice",sampleReport.brief,null);expect(await ownedRun("a","bob")).toBeNull();expect(await listRuns("bob")).toEqual([]);expect((await listRuns("alice"))[0].id).toBe("a");});
  it("requires the same owner for background run and refinement-parent reads",async()=>{
    await createRun("parent","user_alice",sampleReport.brief,null);
    await finishRun("parent",sampleReport);
    await createRun("refinement","user_alice",sampleReport.brief,"parent");
    for(const id of ["parent","refinement"]){
      expect((await internalRun(id,"user_alice")).id).toBe(id);
      await expect(internalRun(id,"user_bob")).rejects.toThrow("RUN_NOT_FOUND");
      await expect(internalRun(id,"")).rejects.toThrow("RUN_NOT_FOUND");
    }
  });
  it("deduplicates a client request without reserving twice",async()=>{await createRun("a","alice",sampleReport.brief,null);await createRun("a","alice",sampleReport.brief,null);const rows=await db()`select allocated_cents from budgets`;expect(rows[0].allocated_cents).toBe(75);});
  it("rolls back reservations when user quotas reject an insert",async()=>{await createRun("a","alice",sampleReport.brief,null);await expect(createRun("b","alice",sampleReport.brief,null)).rejects.toThrow();const rows=await db()`select allocated_cents from budgets`;expect(rows[0].allocated_cents).toBe(75);});
  it("keeps concurrent requests inside the global allowance",async()=>{await engine.exec("UPDATE budgets SET limit_cents=150");const results=await Promise.allSettled(Array.from({length:8},(_,i)=>createRun(`r${i}`,`owner${i}`,sampleReport.brief,null)));expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(2);const rows=await db()`select allocated_cents from budgets`;expect(rows[0].allocated_cents).toBe(150);});
  it("permits only one refinement of a completed owned original",async()=>{await createRun("a","alice",sampleReport.brief,null);await finishRun("a",sampleReport);await expect(createRun("b","bob",sampleReport.brief,"a")).rejects.toThrow("REFINEMENT_NOT_ALLOWED");await createRun("b","alice",sampleReport.brief,"a");await finishRun("b",{...sampleReport,version:2});await expect(createRun("c","alice",sampleReport.brief,"b")).rejects.toThrow("REFINEMENT_NOT_ALLOWED");});
  it("shares an immutable snapshot and revokes existing links",async()=>{await createRun("a","alice",sampleReport.brief,null);await finishRun("a",sampleReport);await expect(createShare("a","bob")).rejects.toThrow();const token=await createShare("a","alice");await finishRun("a",{...sampleReport,title:"Changed later"});expect((await sharedReport(token))?.title).toBe(sampleReport.title);await revokeShares("a","bob");expect(await sharedReport(token)).not.toBeNull();await revokeShares("a","alice");expect(await sharedReport(token)).toBeNull();});
  it("refuses automatic replay of an ambiguous provider creation",async()=>{await createRun("a","alice",sampleReport.brief,null);expect(await claimOperation("a","discovery")).toBe(true);expect(await claimOperation("a","discovery")).toBe(false);await failRun("a","saved");await expect(retryRun("a","alice")).rejects.toThrow("RECONCILIATION_REQUIRED");await saveResponseId("a","discovery","response-known");expect((await retryRun("a","alice")).status).toBe("queued");});
  it("counts a completed operation once and freezes an overrun",async()=>{await createRun("a","alice",sampleReport.brief,null);await claimOperation("a","discovery");await saveOperation("a","discovery",{text:"done"},80);await saveOperation("a","discovery",{text:"done"},80);const rows=await db()`select actual_cents from runs`;expect(rows[0].actual_cents).toBe(80);await expect(createRun("b","bob",sampleReport.brief,null)).rejects.toThrow("BUDGET_EXHAUSTED");});
  it("reserves both budget dimensions atomically and persists the research provider",async()=>{
    await expect(createRun("a","alice",sampleReport.brief,null,"crustdata")).rejects.toThrow("BUDGET_EXHAUSTED");
    expect((await db()`select allocated_cents from budgets`)[0].allocated_cents).toBe(0);
    await engine.exec("UPDATE budgets SET credit_limit_milli=10000");
    const results=await Promise.allSettled(Array.from({length:4},(_,i)=>createRun(`c${i}`,`crust${i}`,sampleReport.brief,null,"crustdata")));
    expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(2);
    expect((await db()`select credit_allocated_milli from budgets`)[0].credit_allocated_milli).toBe(10000);
    expect((await listRuns("crust0"))[0].provider).toBe("crustdata");
  });
  it("counts credits once and serializes rate-limit slots across workers",async()=>{
    await engine.exec("UPDATE budgets SET credit_limit_milli=10000");await createRun("a","alice",sampleReport.brief,null,"crustdata");
    await claimOperation("a","crust-search-0");await saveOperation("a","crust-search-0",{},0,1000);await saveOperation("a","crust-search-0",{},0,1000);
    expect((await db()`select credit_actual_milli from runs`)[0].credit_actual_milli).toBe(1000);
    const slots=await Promise.all([reserveCrustSlot(),reserveCrustSlot(),reserveCrustSlot()]);
    expect(new Date(slots[1]).getTime()-new Date(slots[0]).getTime()).toBe(7000);
    expect(new Date(slots[2]).getTime()-new Date(slots[1]).getTime()).toBe(7000);
  });
});
