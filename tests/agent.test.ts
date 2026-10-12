import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
const harness = vi.hoisted(() => ({ query: null as null | ((sql: string, args: unknown[]) => Promise<unknown[]>), search: vi.fn(), plan: vi.fn(), select: vi.fn(), fetch: vi.fn(), composition: vi.fn(), start: vi.fn(), poll: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({ neon: () => async (strings: TemplateStringsArray, ...args: unknown[]) => harness.query!(strings.reduce((s, p, i) => s + p + (i < args.length ? `$${i + 1}` : ""), ""), args) }));
vi.mock("@/server/crustdata", () => ({ checkCrustAccount: async () => ({}), planCrustResearch: harness.plan, searchCrust: harness.search, selectCrustPages: harness.select, fetchCrustPages: harness.fetch }));
vi.mock("@/server/sponsored-model", () => ({ sponsoredComposition: harness.composition, sponsoredJson: harness.composition }));
vi.mock("@/server/cfo", () => ({ modelIdeaWithCfo: async () => ({ status: "unavailable", provider: "cfo.ai", message: "Fixture: not connected." }) }));
vi.mock("@/server/research", async importOriginal => ({ ...await importOriginal<typeof import("@/server/research")>(), startResponse: harness.start, pollResponse: harness.poll }));
vi.mock("@/server/store", async importOriginal => ({ ...await importOriginal<typeof import("@/server/store")>(), reserveCrustSlot: async () => new Date(Date.now() - 1000).toISOString() }));
import { sampleReport } from "@/core/sample";
import { retryDelay, openingConversation, supportedFallback } from "@/core/agent";
import { createAgentRun, appendAgentMessage, acquireAgentLease, freezeAgentBrief, finishAgent, scheduleAgent, pendingAgentWakes, acknowledgeWake, rescueAgent } from "@/server/agent-store";
import { db, ownedRun, operation, claimOperation, saveOperation, saveProviderReceipt, failUnchargedOperation, saveResponseId } from "@/server/store";
import { operationContext } from "@/server/operation-context";
import { advanceAgent } from "@/server/agent-worker";
import { authDestination } from "@/lib/auth-navigation";
let engine: PGlite;
const owner = "user_alice", id = "00000000-0000-4000-8000-000000000001";
const message = (text = "Students", questionId: "audience" | undefined = "audience") => ({ id: crypto.randomUUID(), text, questionId });
beforeAll(async () => {
  process.env.DATABASE_URL = "postgres://fixture"; engine = new PGlite(); harness.query = async (sql, args) => (await engine.query(sql, args)).rows;
  const folder = new URL("../drizzle/", import.meta.url);
  for (const file of (await readdir(folder)).filter(f => f.endsWith(".sql")).sort()) {
    // Neon HTTP prepares one statement per migration chunk. Match that boundary in fixtures.
    for (const statement of (await readFile(new URL(file, folder), "utf8")).split("--> statement-breakpoint").filter(s=>s.trim())) await engine.query(statement);
  }
}, 30000);
beforeEach(async () => {
  vi.stubEnv("LITELLM_API_KEY", "fixture"); vi.clearAllMocks();
  await engine.exec("TRUNCATE agent_outbox,provider_operations,shares,runs,budgets,credentials CASCADE;INSERT INTO budgets(id,limit_cents,credit_limit_milli) VALUES('research',1500,50000)");
  harness.plan.mockImplementation(async (runId: string) => { if (await claimOperation(runId, "crust-plan")) await saveOperation(runId, "crust-plan", { queries: ["student scheduling software", "scheduling app alternatives"] }); });
  harness.search.mockImplementation(async (runId: string, index: number) => {
    const phase = `crust-search-${index}`, cached = await operation(runId, phase); if (cached?.state === "complete") return cached.result;
    if (!await claimOperation(runId, phase)) throw Error("RECONCILIATION_REQUIRED");
    const result = { query: "fixture", sources: structuredClone(sampleReport.sources) };
    await saveProviderReceipt(runId, phase, { body: "private fixture receipt" }, 0, 1000); await saveOperation(runId, phase, result, 0, 1000); return result;
  });
  harness.select.mockImplementation(async (runId: string) => { if (await claimOperation(runId, "crust-select")) await saveOperation(runId, "crust-select", { urls: [] }); });
  harness.fetch.mockResolvedValue([]);
  harness.composition.mockImplementation(async (runId: string, ...args: unknown[]) => {
    const phase = args[0] === "sponsored-repair" ? "sponsored-repair" : "sponsored-composition";
    if (await claimOperation(runId, phase)) await saveOperation(runId, phase, structuredClone(sampleReport));
  });
});
afterEach(() => vi.unstubAllEnvs()); afterAll(() => engine.close());
async function create(provider: "crustdata" | "openai" = "crustdata") { return createAgentRun(id, owner, { ...sampleReport.brief, audience: "" }, null, provider); }
async function tick() { await prepareLegacyWorkerFixture(); await db()`update runs set next_attempt_at=now() where id=${id} and owner_id=${owner}`; return advanceAgent(id, owner); }
// Existing worker tests exercise compatibility with runs created before clarification gating.
async function prepareLegacyWorkerFixture() { await db()`update runs set conversation=conversation-'clarification' where id=${id} and owner_id=${owner}`; }
async function inLease<T>(fn: () => Promise<T>) { await prepareLegacyWorkerFixture(); const lease = await acquireAgentLease(id, owner); if (!lease) throw Error("no lease"); return operationContext.run({ owner, revision: 0, lease }, fn); }

it("reserves and persists dispatch together, deduplicates admission, and keeps quotas", async () => {
  await create(); await create();
  expect((await pendingAgentWakes()).map(w => w.id)).toEqual([`agent-${id}-0`]);
  expect((await db()`select allocated_cents,credit_allocated_milli from budgets`)[0]).toMatchObject({ allocated_cents: 75, credit_allocated_milli: 5000 });
  await expect(createAgentRun(crypto.randomUUID(), owner, sampleReport.brief, null, "crustdata")).rejects.toThrow();
  expect((await db()`select allocated_cents from budgets`)[0].allocated_cents).toBe(75);
  await expect(createAgentRun(id, owner, { ...sampleReport.brief, idea: "Changed submitted idea completely" }, null, "crustdata")).rejects.toThrow("SUBMISSION_CONFLICT");
  await expect(createAgentRun(id, owner, { ...sampleReport.brief, audience: "Conflicting audience" }, null, "crustdata")).rejects.toThrow("SUBMISSION_CONFLICT");
});
it("rejects unfunded admission without a run or orphaned dispatch", async () => {
  await db()`update budgets set credit_limit_milli=0`;
  await expect(create()).rejects.toThrow("BUDGET_EXHAUSTED");
  expect(await pendingAgentWakes()).toEqual([]); expect(await ownedRun(id, owner)).toBeNull();
});
it("keeps conversation private and messages idempotent, accepting only selected suggestions", async () => {
  await create(); const input = message(); await appendAgentMessage(id, owner, input); await appendAgentMessage(id, owner, input);
  await expect(appendAgentMessage(id, "user_bob", message())).rejects.toThrow("RUN_NOT_FOUND");
  await expect(appendAgentMessage(id, owner, { ...input, text: "Conflicting duplicate" })).rejects.toThrow("SUBMISSION_CONFLICT");
  await expect(appendAgentMessage(id, owner, { ...input, questionId: undefined })).rejects.toThrow("SUBMISSION_CONFLICT");
  await expect(appendAgentMessage(id, owner, { ...input, useJudgment: true })).rejects.toThrow("SUBMISSION_CONFLICT");
  const run = await ownedRun(id, owner); expect(run?.agent?.conversation.messages).toHaveLength(2); expect(run?.brief.audience).toBe("Students");
  expect(JSON.stringify(run?.brief)).not.toContain("Small businesses");
});
it("use-your-judgment does not invent accepted context or spend on intake", async () => {
  await create(); await appendAgentMessage(id, owner, { ...message("Use your judgment."), useJudgment: true });
  const run = await ownedRun(id, owner); expect(run?.agent?.revision).toBe(0); expect(run?.brief.audience).toBe("");
  expect(run?.agent?.conversation.questions[0].answer).toBe("Use your judgment.");
  expect(run?.agent?.conversation.briefRevisions).toHaveLength(1);
});
it("locks a brief and preserves late messages without mutating the completed report", async () => {
  await create(); await prepareLegacyWorkerFixture(); const lease = await acquireAgentLease(id, owner); expect(lease).toBeTruthy();
  await freezeAgentBrief(id, owner, lease!); await appendAgentMessage(id, owner, message("New audience"));
  expect((await ownedRun(id, owner))?.brief.audience).toBe("");
  expect((await ownedRun(id, owner))?.agent?.conversation.questions[0].answer).toBeUndefined();
  await finishAgent(id, owner, lease!, sampleReport); await appendAgentMessage(id, owner, message("Another direction", undefined));
  await finishAgent(id, owner, lease!, { ...sampleReport, title: "Must not replace" });
  const run = await ownedRun(id, owner); expect(run?.report?.title).toBe(sampleReport.title);
  expect(run?.agent?.conversation.messages.slice(1).every(m => m.followUp)).toBe(true);
});
it("serializes workers, fences stale leases, and creates recoverable scheduled dispatch", async () => {
  await create(); await prepareLegacyWorkerFixture(); const leases = await Promise.all([acquireAgentLease(id, owner), acquireAgentLease(id, owner)]);
  expect(leases.filter(Boolean)).toHaveLength(1);
  await expect(acquireAgentLease(id, "user_bob")).resolves.toBeNull();
  const wake = await scheduleAgent(id, owner, leases.find(Boolean)!, "crust-plan", "discovering"); expect(wake).toBeTruthy();
  await finishAgent(id, owner, leases.find(Boolean)!, sampleReport); expect((await ownedRun(id, owner))?.report).toBeNull();
  await acknowledgeWake({ ...wake!, ownerId: "user_bob" }); expect((await pendingAgentWakes()).some(w => w.id === wake!.id)).toBe(true);
  await acknowledgeWake(wake!); expect((await pendingAgentWakes()).some(w => w.id === wake!.id)).toBe(false);
  expect(await rescueAgent(id, owner)).toBeTruthy();
});
it("never reclaims an uncertain paid creation after lease expiry or reserves it twice", async () => {
  await create(); await inLease(async () => { expect(await claimOperation(id, "crust-search-0")).toBe(true); expect(await claimOperation(id, "crust-search-0")).toBe(false); });
  await db()`update runs set lease_until=now()-interval '1 second' where id=${id} and owner_id=${owner}`;
  await inLease(async () => { expect(await claimOperation(id, "crust-search-0")).toBe(false); expect((await operation(id, "crust-search-0"))?.state).toBe("creating"); });
  expect((await db()`select operation_budget_credits from runs where id=${id} and owner_id=${owner}`)[0].operation_budget_credits).toBe(1000);
});
it("accounts raw receipts once before parsing and prevents overspending on repair", async () => {
  await create("openai");
  await inLease(async () => {
    await claimOperation(id, "discovery"); await saveResponseId(id, "discovery", "response-known");
    await saveProviderReceipt(id, "discovery", { private: "raw invalid result", usage: {} }, 8);
    expect((await operation(id, "discovery"))?.state).toBe("received");
    await saveProviderReceipt(id, "discovery", { different: "duplicate" }, 8); await saveOperation(id, "discovery", { text: "parsed", sources: [] }, 8);
    await claimOperation(id, "verification"); await claimOperation(id, "composition");
    await expect(claimOperation(id, "composition-repair")).rejects.toThrow("OPERATION_ALLOWANCE_EXHAUSTED");
  });
  expect((await db()`select actual_cents from runs where id=${id} and owner_id=${owner}`)[0].actual_cents).toBe(8);
});
it("completes without clarification, browser polling, or a manual resume", async () => {
  await create(); for (let i = 0; i < 12; i++) await tick();
  const run = await ownedRun(id, owner); expect(run?.status).toBe("complete"); expect(run?.report?.sources.length).toBeGreaterThan(0);
  expect(run?.agent?.conversation.questions.every(q => !q.answer)).toBe(true); expect(run?.report?.unknowns).toContain("Who would you help first?");
  expect(harness.search).toHaveBeenCalledTimes(2);
});
it("applies early context to unfinished work and preserves operation revision", async () => {
  await create(); await tick(); await appendAgentMessage(id, owner, message("University students")); await tick();
  expect(harness.plan).toHaveBeenCalledWith(id, expect.objectContaining({ audience: "University students" }), null);
  expect((await db()`select brief_revision from provider_operations where run_id=${id} and phase='crust-plan'`)[0].brief_revision).toBe(1);
  const revisions=(await ownedRun(id,owner))?.agent?.conversation.briefRevisions;
  expect(revisions?.map(r=>r.revision)).toEqual([0,1]);
  expect(revisions?.[0].brief.audience).toBe("");
  expect(revisions?.[1].brief.audience).toBe("University students");
});
it("applies a direction change to the next search without repeating completed work",async()=>{
  await create(); await tick(); await tick(); await tick();
  const context=message("Focus on community colleges in Bengaluru",undefined);
  await appendAgentMessage(id,owner,context); await tick();
  expect(harness.search).toHaveBeenCalledTimes(2);
  expect(harness.search.mock.calls[0][2]).not.toContain(context.text);
  expect(harness.search.mock.calls[1][2]).toContain(context.text);
  expect((await db()`select phase,brief_revision from provider_operations where run_id=${id} and phase='crust-search-1'`)[0].brief_revision).toBe(1);
});
it("automatically retries confirmed uncharged failures with persisted backoff and Retry-After", async () => {
  await create(); await tick(); await tick();
  harness.search.mockImplementationOnce(async (runId: string) => { await claimOperation(runId, "crust-search-0"); await failUnchargedOperation(runId, "crust-search-0", { status: 503, credits: 0, confirmedAt: new Date().toISOString() }); throw Error("CRUST_HTTP_503"); });
  const wake = await tick(); expect(Date.parse(wake!.availableAt) - Date.now()).toBeGreaterThan(3500);
  expect((await ownedRun(id, owner))?.agent?.recovery).toBe("recovering");
  await appendAgentMessage(id,owner,message("Updated audience before the safe retry")); await tick();
  expect((await db()`select attempts,state from provider_operations where run_id=${id} and phase='crust-search-0'`)[0]).toMatchObject({ attempts: 2, state: "complete" });
  const retried=(await db()`select brief_revision,failure_history from provider_operations where run_id=${id} and phase='crust-search-0'`)[0];
  expect(retried.brief_revision).toBe(1);
  expect(retried.failure_history).toEqual([expect.objectContaining({attempt:1,briefRevision:0})]);
  expect(retryDelay(1, 60)).toBe(60); expect(retryDelay(2)).toBe(30); expect(retryDelay(3)).toBe(120); expect(retryDelay(4)).toBeNull();
});
it("preserves uncertain creation, delivers supported fallback, and never silently retries it", async () => {
  await create(); await tick(); await tick(); await tick();
  harness.search.mockImplementationOnce(async (runId: string) => { await claimOperation(runId, "crust-search-1"); throw Error("Timeout"); });
  await tick(); for (let i = 0; i < 5; i++) await tick();
  const run = await ownedRun(id, owner); expect(run?.status).toBe("complete"); expect(run?.report?.verdict).toBe("insufficient_evidence");
  expect((await db()`select state from provider_operations where run_id=${id} and phase='crust-search-1'`)[0].state).toBe("creating");
  expect(harness.search).toHaveBeenCalledTimes(2);
});
it("repairs unsupported citations once, and falls back when the repair remains invalid", async () => {
  await create(); const invalid = structuredClone(sampleReport); invalid.summary.sourceIds = ["invented"];
  harness.composition.mockImplementation(async (runId: string, ...args: unknown[]) => { const phase = args[0] === "sponsored-repair" ? "sponsored-repair" : "sponsored-composition"; await claimOperation(runId, phase); await saveOperation(runId, phase, invalid); });
  for (let i = 0; i < 14; i++) await tick();
  const run = await ownedRun(id, owner); expect(run?.status).toBe("complete"); expect(run?.report?.verdict).toBe("insufficient_evidence"); expect(harness.composition).toHaveBeenCalledTimes(2);
});
it("finishes honestly at the deadline with no evidence and never makes a new paid call", async () => {
  await create(); await db()`update runs set deadline_at=now()-interval '1 second' where id=${id} and owner_id=${owner}`; await tick();
  const run = await ownedRun(id, owner); expect(run?.status).toBe("failed"); expect(run?.report).toBeNull(); expect(harness.search).not.toHaveBeenCalled(); expect(harness.plan).not.toHaveBeenCalled();
});
it("retries retrieval of a known response after a worker restart without creating another", async () => {
  await create("openai");
  await prepareLegacyWorkerFixture(); const lease=await acquireAgentLease(id,owner);
  await operationContext.run({owner,revision:0,lease:lease!},async()=>{await claimOperation(id,"discovery");await saveResponseId(id,"discovery","response-known");});
  await scheduleAgent(id,owner,lease!,"discovery-poll","discovering");
  harness.poll.mockRejectedValueOnce(Error("Temporary read failure")).mockResolvedValueOnce(null).mockResolvedValueOnce({text:"Retrieved",sources:sampleReport.sources});
  await tick(); expect((await ownedRun(id,owner))?.agent?.recovery).toBe("recovering");
  await db()`update runs set lease_until=now()-interval '1 second' where id=${id} and owner_id=${owner}`;
  await rescueAgent(id,owner); await tick(); await tick();
  expect(harness.start).not.toHaveBeenCalled();expect(harness.poll).toHaveBeenCalledWith(id,"discovery","response-known");
  expect((await ownedRun(id,owner))?.agent?.cursor).toBe("verification");
});
it("fallback includes only real usable receipts and does not fabricate alternatives", () => {
  expect(supportedFallback(sampleReport.brief, [], new Date().toISOString())).toBeNull();
  const report = supportedFallback(sampleReport.brief, [...sampleReport.sources, { ...sampleReport.sources[0], url: "http://localhost/private" }], new Date().toISOString());
  expect(report?.competitors).toEqual([]); expect(report?.sources.every(s => s.url.startsWith("https://"))).toBe(true);
  expect(openingConversation(sampleReport.brief, new Date().toISOString()).questions.length).toBeLessThanOrEqual(2);
});
it("permits only the exact local authentication continuation route", () => {
  expect(authDestination(`/new?start=${id}`)).toBe(`/new?start=${id}`);
  for(const value of [`https://evil.example/new?start=${id}`,`/new?start=${id}&redirect=https://evil.example`,`/new?start=not-an-id`]) expect(authDestination(value)).toBe("/home");
});
it("concurrent admissions cannot reserve twice or exceed the shared allowance", async () => {
  const results=await Promise.allSettled([create(),create(),create()]);
  expect(results.some(r=>r.status==="fulfilled")).toBe(true);
  expect((await db()`select allocated_cents from budgets`)[0].allocated_cents).toBe(75);
  expect((await pendingAgentWakes()).filter(w=>w.runId===id)).toHaveLength(1);
});

it("admits two autonomous reports without a dollar cap and rejects the third without an outbox entry", async()=>{await db()`update budgets set limit_cents=0`;await create();await db()`update runs set status='failed' where id=${id} and owner_id=${owner}`;const second=crypto.randomUUID();await createAgentRun(second,owner,sampleReport.brief,null,"crustdata");await db()`update runs set status='failed' where id=${second} and owner_id=${owner}`;const third=crypto.randomUUID();await expect(createAgentRun(third,owner,sampleReport.brief,null,"crustdata")).rejects.toThrow("ACCOUNT_QUOTA_EXHAUSTED");expect(await ownedRun(third,owner)).toBeNull();expect((await db()`select allocated_cents,credit_allocated_milli from budgets`)[0]).toMatchObject({allocated_cents:150,credit_allocated_milli:10000});expect((await pendingAgentWakes()).some(w=>w.runId===third)).toBe(false);});
