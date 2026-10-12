import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
const harness = vi.hoisted(() => ({
  query: undefined as
    | undefined
    | ((sql: string, args: unknown[]) => Promise<unknown[]>),
}));
vi.mock("@neondatabase/serverless", () => ({
  neon:
    () =>
    async (strings: TemplateStringsArray, ...args: unknown[]) => {
      const query = strings.reduce(
        (s, part, i) => s + part + (i < args.length ? `$${i + 1}` : ""),
        ""
      );
      return harness.query!(query, args);
    },
}));
import {
  createRun,
  ownedRun,
  internalRun,
  listRuns,
  listHomeRuns,
  finishRun,
  createShare,
  sharedReport,
  revokeShares,
  claimOperation,
  saveResponseId,
  saveOperation,
  retryRun,
  failRun,
  reserveCrustSlot,
  failUnchargedOperation,
  markRetryDispatched,
  reconcileCrustOperation,
  db,
} from "@/server/store";
import { sampleReport } from "@/core/sample";
let engine: PGlite;
beforeAll(async () => {
  process.env.DATABASE_URL = "postgres://test";
  engine = new PGlite();
  harness.query = async (sql, args) => (await engine.query(sql, args)).rows;
  const folder = new URL("../drizzle/", import.meta.url);
  for (const file of (await readdir(folder))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await engine.exec(await readFile(new URL(file, folder), "utf8"));
}, 30000);
beforeEach(async () => {
  await engine.exec(
    "TRUNCATE provider_operations, shares, runs, budgets, credentials CASCADE; INSERT INTO budgets (id,limit_cents) VALUES ('research',1500);"
  );
});
afterAll(async () => {
  await engine.close();
});
describe("persisted ownership and reservations (real SQL, embedded PostgreSQL)", () => {
  it("loads only the owner's home summaries without report bodies or journal data", async () => {
    await createRun("a", "alice", sampleReport.brief, null);
    await finishRun("a", sampleReport);
    await createRun("b", "bob", sampleReport.brief, null);
    const summaries = await listHomeRuns("alice");
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      id: "a",
      idea: sampleReport.brief.idea,
      category: sampleReport.brief.category,
      title: sampleReport.title,
      hasReport: true,
      status: "complete",
      stage: "complete",
    });
    expect(summaries[0]).not.toHaveProperty("report");
    expect(summaries[0]).not.toHaveProperty("brief");
    expect((await listHomeRuns("bob")).map((run) => run.id)).toEqual(["b"]);
    await expect(listHomeRuns("")).rejects.toThrow("UNAUTHENTICATED");
  });
  it("isolates private reports and the library by owner", async () => {
    await createRun("a", "alice", sampleReport.brief, null);
    expect(await ownedRun("a", "bob")).toBeNull();
    expect(await listRuns("bob")).toEqual([]);
    expect((await listRuns("alice"))[0].id).toBe("a");
  });
  it("requires the same owner for background run and refinement-parent reads", async () => {
    await createRun("parent", "user_alice", sampleReport.brief, null);
    await finishRun("parent", sampleReport);
    await createRun("refinement", "user_alice", sampleReport.brief, "parent");
    for (const id of ["parent", "refinement"]) {
      expect((await internalRun(id, "user_alice")).id).toBe(id);
      await expect(internalRun(id, "user_bob")).rejects.toThrow(
        "RUN_NOT_FOUND"
      );
      await expect(internalRun(id, "")).rejects.toThrow("RUN_NOT_FOUND");
    }
  });
  it("deduplicates a client request without reserving twice", async () => {
    await createRun("a", "alice", sampleReport.brief, null);
    await createRun("a", "alice", sampleReport.brief, null);
    const rows = await db()`select allocated_cents from budgets`;
    expect(rows[0].allocated_cents).toBe(75);
  });
  it("rolls back reservations when user quotas reject an insert", async () => {
    await createRun("a", "alice", sampleReport.brief, null);
    await expect(
      createRun("b", "alice", sampleReport.brief, null)
    ).rejects.toThrow();
    const rows = await db()`select allocated_cents from budgets`;
    expect(rows[0].allocated_cents).toBe(75);
  });
  it("ignores the dollar cap but serializes Crustdata credit reservations", async () => {
    await engine.exec(
      "UPDATE budgets SET limit_cents=0,credit_limit_milli=10000"
    );
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, i) =>
        createRun(`r${i}`, `owner${i}`, sampleReport.brief, null, "crustdata")
      )
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    const rows =
      await db()`select allocated_cents,credit_allocated_milli from budgets`;
    expect(rows[0]).toMatchObject({
      allocated_cents: 150,
      credit_allocated_milli: 10000,
    });
  });
  it("permits two full reports and atomically rejects the third including failed reports", async () => {
    await engine.exec("UPDATE budgets SET limit_cents=0");
    await createRun("a", "alice", sampleReport.brief, null);
    await finishRun("a", sampleReport);
    await createRun("b", "alice", sampleReport.brief, null);
    await failRun("b", "fixture failure");
    const attempts = await Promise.allSettled([
      createRun("c", "alice", sampleReport.brief, null),
      createRun("d", "alice", sampleReport.brief, null),
    ]);
    expect(
      attempts.every(
        (r) =>
          r.status === "rejected" &&
          String(r.reason).includes("ACCOUNT_QUOTA_EXHAUSTED")
      )
    ).toBe(true);
    expect(
      (await db()`select allocated_cents from budgets`)[0].allocated_cents
    ).toBe(150);
    expect(
      await createRun("b", "alice", sampleReport.brief, null)
    ).toMatchObject({ id: "b" });
  });
  it("preserves pre-existing reports when upgrading from five to two and keeps refinements available", async () => {
    const priorQuota = (
      await readFile(
        new URL("../drizzle/0005_account_allowances.sql", import.meta.url),
        "utf8"
      )
    )
      .split("--> statement-breakpoint")[0]
      .replace("CREATE FUNCTION", "CREATE OR REPLACE FUNCTION");
    const currentQuota = await readFile(
      new URL("../drizzle/0006_two_reports.sql", import.meta.url),
      "utf8"
    );
    await engine.exec(priorQuota);
    try {
      for (const id of ["old-a", "old-b", "old-c"]) {
        await createRun(id, "alice", sampleReport.brief, null);
        await finishRun(id, sampleReport);
      }
      await engine.exec(currentQuota);
      expect(await listRuns("alice")).toHaveLength(3);
      await finishRun("old-a", {
        ...sampleReport,
        title: "Existing report stays editable",
      });
      await expect(
        createRun("new-full", "alice", sampleReport.brief, null)
      ).rejects.toThrow("ACCOUNT_QUOTA_EXHAUSTED");
      for (let i = 0; i < 5; i++) {
        await createRun(`ref-${i}`, "alice", sampleReport.brief, "old-a");
        await finishRun(`ref-${i}`, sampleReport);
      }
      await expect(
        createRun("ref-6", "alice", sampleReport.brief, "old-a")
      ).rejects.toThrow("ACCOUNT_QUOTA_EXHAUSTED");
      expect(
        (await db()`select allocated_cents from budgets`)[0].allocated_cents
      ).toBe(425);
      expect((await ownedRun("old-a", "alice"))?.report?.title).toBe(
        "Existing report stays editable"
      );
    } finally {
      await engine.exec(currentQuota);
    }
  });
  it("permits only one refinement of a completed owned original", async () => {
    await createRun("a", "alice", sampleReport.brief, null);
    await finishRun("a", sampleReport);
    await expect(
      createRun("b", "bob", sampleReport.brief, "a")
    ).rejects.toThrow("REFINEMENT_NOT_ALLOWED");
    await createRun("b", "alice", sampleReport.brief, "a");
    await finishRun("b", { ...sampleReport, version: 2 });
    await expect(
      createRun("c", "alice", sampleReport.brief, "b")
    ).rejects.toThrow("REFINEMENT_NOT_ALLOWED");
  });
  it("shares an immutable snapshot and revokes existing links", async () => {
    await createRun("a", "alice", sampleReport.brief, null);
    await finishRun("a", sampleReport);
    await expect(createShare("a", "bob")).rejects.toThrow();
    const token = await createShare("a", "alice");
    await finishRun("a", { ...sampleReport, title: "Changed later" });
    expect((await sharedReport(token))?.title).toBe(sampleReport.title);
    await revokeShares("a", "bob");
    expect(await sharedReport(token)).not.toBeNull();
    await revokeShares("a", "alice");
    expect(await sharedReport(token)).toBeNull();
  });
  it("refuses automatic replay of an ambiguous provider creation", async () => {
    await createRun("a", "alice", sampleReport.brief, null);
    expect(await claimOperation("a", "discovery")).toBe(true);
    expect(await claimOperation("a", "discovery")).toBe(false);
    await failRun("a", "saved");
    await expect(retryRun("a", "alice")).rejects.toThrow(
      "RECONCILIATION_REQUIRED"
    );
    await saveResponseId("a", "discovery", "response-known");
    expect((await retryRun("a", "alice")).status).toBe("queued");
  });
  it("unlocks uncharged failures only on owned explicit resume and keeps completed receipts", async () => {
    await createRun("a", "alice", sampleReport.brief, null);
    await claimOperation("a", "crust-search-0");
    await saveOperation("a", "crust-search-0", { sources: [] });
    await claimOperation("a", "crust-search-1");
    await failUnchargedOperation("a", "crust-search-1", {
      status: 500,
      credits: 0,
      confirmedAt: "2026-10-11T10:07:00Z",
    });
    expect(await claimOperation("a", "crust-search-1")).toBe(false);
    await failRun("a", "paused");
    await expect(retryRun("a", "bob")).rejects.toThrow();
    await retryRun("a", "alice");
    expect(await claimOperation("a", "crust-search-1")).toBe(true);
    expect(await claimOperation("a", "crust-search-1")).toBe(false);
    expect(await claimOperation("a", "crust-search-0")).toBe(false);
    expect(
      (await db()`select allocated_cents from budgets`)[0].allocated_cents
    ).toBe(75);
    await saveOperation(
      "a",
      "crust-search-1",
      { sources: [{ url: "https://example.com" }] },
      0,
      1000
    );
    const receipt = (
      await db()`select state,result,failure_history from provider_operations where phase='crust-search-1'`
    )[0];
    expect(receipt.state).toBe("complete");
    expect(receipt.result).toEqual({
      sources: [{ url: "https://example.com" }],
    });
    expect(receipt.failure_history).toEqual([
      {
        status: 500,
        credits: 0,
        confirmedAt: "2026-10-11T10:07:00Z",
        source: "provider_response",
      },
    ]);
  });
  it("requires an owned independently evidenced zero-credit receipt to reconcile an uncertain Crust call", async () => {
    await engine.exec("UPDATE budgets SET credit_limit_milli=10000");
    await createRun("a", "alice", sampleReport.brief, null, "crustdata");
    await claimOperation("a", "crust-search-1");
    await failRun("a", "uncertain");
    const receipt = {
      status: 500,
      credits: 0 as const,
      confirmedAt: "2026-10-11T10:07:00Z",
      requestId: "request-123",
      evidence: "Provider receipt confirms no charge.",
    };
    await expect(
      reconcileCrustOperation("a", "bob", "crust-search-1", receipt)
    ).rejects.toThrow("RECONCILIATION_REQUIRED");
    for (const invalid of [
      { ...receipt, credits: 1 },
      { ...receipt, status: 200 },
      { ...receipt, requestId: "" },
      { ...receipt, evidence: " " },
    ]) {
      await expect(
        reconcileCrustOperation(
          "a",
          "alice",
          "crust-search-1",
          invalid as typeof receipt
        )
      ).rejects.toThrow("INVALID_RECONCILIATION");
    }
    expect(
      (
        await db()`select state,failure_history from provider_operations where run_id='a'`
      )[0]
    ).toMatchObject({ state: "creating", failure_history: [] });
    await expect(retryRun("a", "alice")).rejects.toThrow(
      "RECONCILIATION_REQUIRED"
    );
    await reconcileCrustOperation("a", "alice", "crust-search-1", receipt);
    expect(
      (
        await db()`select state,failure_history from provider_operations where run_id='a'`
      )[0]
    ).toMatchObject({
      state: "failed_uncharged",
      failure_history: [{ ...receipt, source: "operator_receipt" }],
    });
    await retryRun("a", "alice");
    expect(await claimOperation("a", "crust-search-1")).toBe(true);
    await saveOperation("a", "crust-search-1", { sources: [] }, 0, 1000);
    expect(
      (
        await db()`select failure_history from provider_operations where run_id='a'`
      )[0].failure_history
    ).toEqual([{ ...receipt, source: "operator_receipt" }]);
  });
  it("does not queue or unlock confirmed failures while another operation is uncertain", async () => {
    await createRun("a", "alice", sampleReport.brief, null);
    await claimOperation("a", "crust-search-0");
    await failUnchargedOperation("a", "crust-search-0", {
      status: 500,
      credits: 0,
      confirmedAt: "2026-10-11T10:07:00Z",
    });
    await claimOperation("a", "crust-search-1");
    await failRun("a", "uncertain");
    await expect(retryRun("a", "alice")).rejects.toThrow(
      "RECONCILIATION_REQUIRED"
    );
    expect(
      (await db()`select status,retry_dispatch_id from runs where id='a'`)[0]
    ).toMatchObject({ status: "failed", retry_dispatch_id: null });
    expect(
      (
        await db()`select state from provider_operations where run_id='a' and phase='crust-search-0'`
      )[0].state
    ).toBe("failed_uncharged");
  });
  it("keeps one dispatch identity until acknowledgment and rejects stale or foreign acknowledgments", async () => {
    await createRun("a", "alice", sampleReport.brief, null);
    await failRun("a", "paused");
    const first = await retryRun("a", "alice");
    expect(first.dispatchId).toEqual(expect.any(String));
    expect(first.dispatchId.length).toBeGreaterThan(0);
    const repeated = await Promise.all([
      retryRun("a", "alice"),
      retryRun("a", "alice"),
      retryRun("a", "alice"),
    ]);
    expect(repeated.map((run) => run.dispatchId)).toEqual([
      first.dispatchId,
      first.dispatchId,
      first.dispatchId,
    ]);
    await markRetryDispatched("a", "bob", first.dispatchId);
    expect(
      (await db()`select dispatched from runs where id='a'`)[0].dispatched
    ).toBe(false);
    await markRetryDispatched("a", "alice", first.dispatchId);
    expect(
      (await db()`select dispatched from runs where id='a'`)[0].dispatched
    ).toBe(true);
    await failRun("a", "paused again");
    const next = await retryRun("a", "alice");
    expect(next.dispatchId).not.toBe(first.dispatchId);
    await markRetryDispatched("a", "alice", first.dispatchId);
    expect(
      (await db()`select dispatched from runs where id='a'`)[0].dispatched
    ).toBe(false);
    expect((await retryRun("a", "alice")).dispatchId).toBe(next.dispatchId);
    await markRetryDispatched("a", "alice", next.dispatchId);
    expect(
      (await db()`select dispatched from runs where id='a'`)[0].dispatched
    ).toBe(true);
    expect(
      (await db()`select allocated_cents from budgets`)[0].allocated_cents
    ).toBe(75);
  });
  it("counts a completed operation once without imposing a dollar admission cap", async () => {
    await createRun("a", "alice", sampleReport.brief, null);
    await claimOperation("a", "discovery");
    await saveOperation("a", "discovery", { text: "done" }, 80);
    await saveOperation("a", "discovery", { text: "done" }, 80);
    const rows = await db()`select actual_cents from runs`;
    expect(rows[0].actual_cents).toBe(80);
    await expect(
      createRun("b", "bob", sampleReport.brief, null)
    ).resolves.toMatchObject({ id: "b" });
  });
  it("reserves both budget dimensions atomically and persists the research provider", async () => {
    await expect(
      createRun("a", "alice", sampleReport.brief, null, "crustdata")
    ).rejects.toThrow("BUDGET_EXHAUSTED");
    expect(
      (await db()`select allocated_cents from budgets`)[0].allocated_cents
    ).toBe(0);
    await engine.exec("UPDATE budgets SET credit_limit_milli=10000");
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, (_, i) =>
        createRun(`c${i}`, `crust${i}`, sampleReport.brief, null, "crustdata")
      )
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    expect(
      (await db()`select credit_allocated_milli from budgets`)[0]
        .credit_allocated_milli
    ).toBe(10000);
    expect((await listRuns("crust0"))[0].provider).toBe("crustdata");
  });
  it("counts credits once and serializes rate-limit slots across workers", async () => {
    await engine.exec("UPDATE budgets SET credit_limit_milli=10000");
    await createRun("a", "alice", sampleReport.brief, null, "crustdata");
    await claimOperation("a", "crust-search-0");
    await saveOperation("a", "crust-search-0", {}, 0, 1000);
    await saveOperation("a", "crust-search-0", {}, 0, 1000);
    expect(
      (await db()`select credit_actual_milli from runs`)[0].credit_actual_milli
    ).toBe(1000);
    const slots = await Promise.all([
      reserveCrustSlot(),
      reserveCrustSlot(),
      reserveCrustSlot(),
    ]);
    expect(new Date(slots[1]).getTime() - new Date(slots[0]).getTime()).toBe(
      7000
    );
    expect(new Date(slots[2]).getTime() - new Date(slots[1]).getTime()).toBe(
      7000
    );
  });
});
