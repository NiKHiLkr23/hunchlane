import { operationContext } from "./operation-context";
import {
  agentOperation,
  claimAgentOperation,
  agentReceipt,
  agentResult,
  agentResponseId,
  agentFailure,
} from "./agent-journal";
import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type {
  IdeaBrief,
  ResearchReport,
  RunStage,
  RunState,
} from "@/core/types";
import { RESERVATIONS } from "@/core/budget";
import { CRUST_CREDITS, type ResearchProvider } from "./research-provider";
import type { HomeRun } from "@/core/home";
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  return neon(process.env.DATABASE_URL);
}
type Row = Record<string, unknown>;
function runFromRow(row: Row): RunState {
  return {
    id: String(row.id),
    brief: row.brief as IdeaBrief,
    status: row.status as RunState["status"],
    stage: row.stage as RunStage,
    createdAt: new Date(String(row.created_at)).toISOString(),
    error: row.error as string | null,
    parentId: row.parent_id as string | null,
    report: row.report as ResearchReport | null,
    dispatched: Boolean(row.dispatched),
    provider: row.provider === "crustdata" ? "crustdata" : "openai",
    mode: row.mode === "autonomous" ? "autonomous" : "legacy",
    ...(row.mode === "autonomous"
      ? {
          agent: {
            conversation:
              row.conversation as import("@/core/agent").AgentConversation,
            revision: Number(row.brief_revision),
            lockedRevision:
              row.locked_revision === null ? null : Number(row.locked_revision),
            cursor: row.agent_cursor as import("@/core/agent").AgentCursor,
            deadlineAt: new Date(String(row.deadline_at)).toISOString(),
            nextAttemptAt: new Date(String(row.next_attempt_at)).toISOString(),
            recovery: row.recovery as "working" | "recovering" | "reconciling",
            finalBrief: row.final_brief as IdeaBrief | null,
          },
        }
      : {}),
  };
}
export async function ownedRun(id: string, owner: string) {
  const rows =
    await db()`select * from runs where id=${id} and owner_id=${owner}`;
  return rows[0] ? runFromRow(rows[0]) : null;
}
export async function internalRun(id: string, owner: string) {
  if (!owner) throw new Error("RUN_NOT_FOUND");
  const run = await ownedRun(id, owner);
  if (!run) throw new Error("RUN_NOT_FOUND");
  return run;
}
export async function listRuns(owner: string) {
  const rows =
    await db()`select * from runs where owner_id=${owner} order by created_at desc limit 50`;
  return rows.map(runFromRow);
}
export async function listHomeRuns(owner: string): Promise<HomeRun[]> {
  if (!owner) throw new Error("UNAUTHENTICATED");
  const rows =
    await db()`select id, brief->>'idea' as idea, brief->>'category' as category,
    status, stage, created_at, parent_id, mode, recovery, report->>'title' as title, (report is not null) as has_report,
    coalesce(conversation->'clarification'->>'state'='waiting',false) as awaiting_answers
    from runs where owner_id=${owner} order by created_at desc limit 50`;
  return rows.map((row) => ({
    id: String(row.id),
    idea: String(row.idea),
    category: row.category as HomeRun["category"],
    status: row.status as HomeRun["status"],
    stage: row.stage as RunStage,
    createdAt: new Date(String(row.created_at)).toISOString(),
    parentId: row.parent_id as string | null,
    title: row.title as string | null,
    hasReport: Boolean(row.has_report),
    mode: row.mode === "autonomous" ? "autonomous" : "legacy",
    recovery: row.recovery as "working" | "recovering" | "reconciling",
    awaitingAnswers: Boolean(row.awaiting_answers),
  }));
}
export async function createRun(
  id: string,
  owner: string,
  brief: IdeaBrief,
  parentId: string | null,
  provider: ResearchProvider = "openai"
) {
  const sql = db(),
    kind = parentId ? "refinement" : "full",
    reservation = RESERVATIONS[kind];
  const credits = provider === "crustdata" ? CRUST_CREDITS[kind] * 1000 : 0;
  const existing = await ownedRun(id, owner);
  if (existing) return existing;
  if (parentId) {
    const parent = await ownedRun(parentId, owner);
    if (!parent?.report || parent.parentId)
      throw new Error("REFINEMENT_NOT_ALLOWED");
  }
  // Conditional row update serializes global reservations. A uniqueness violation rolls back this whole statement.
  const rows = await sql`
    with reserve as (
      update budgets set allocated_cents=allocated_cents+${reservation},credit_allocated_milli=credit_allocated_milli+${credits}
      where id='research' and allocated_cents+${reservation}<=limit_cents and credit_allocated_milli+${credits}<=credit_limit_milli returning id
    ) insert into runs (id,owner_id,kind,brief,parent_id,reservation_cents,provider,credit_reservation_milli)
      select ${id},${owner},${kind},${JSON.stringify(
    brief
  )}::jsonb,${parentId},${reservation},${provider},${credits} from reserve returning *`;
  if (!rows[0]) throw new Error("BUDGET_EXHAUSTED");
  return runFromRow(rows[0]);
}
export async function markDispatched(id: string) {
  await db()`update runs set dispatched=true where id=${id}`;
}
export async function reserveCrustSlot() {
  // Serialize all paid Crustdata requests across workers below the verified 10/minute floor.
  const rows =
    await db()`update budgets set crust_next_call_at=greatest(coalesce(crust_next_call_at,now()),now())+interval '7 seconds' where id='research' returning crust_next_call_at-interval '7 seconds' as call_at`;
  if (!rows[0]) throw new Error("BUDGET_EXHAUSTED");
  return new Date(String(rows[0].call_at)).toISOString();
}
export async function progress(id: string, stage: RunStage) {
  await db()`update runs set status='running',stage=${stage},error=null where id=${id} and mode='legacy' and status in ('queued','running','failed')`;
}
export async function finishRun(id: string, report: ResearchReport) {
  await db()`update runs set status='complete',stage='complete',report=${JSON.stringify(
    report
  )}::jsonb,error=null where id=${id} and mode='legacy'`;
}
export async function failRun(id: string, message: string) {
  await db()`update runs set status='failed',error=${message} where id=${id} and mode='legacy' and status!='complete'`;
}
export async function retryRun(id: string, owner: string) {
  if (!owner) throw new Error("UNAUTHENTICATED");
  const dispatchId = `retry-${id}-${randomUUID()}`;
  // Queue transition and unlocking operations commit together. Concurrent or ambiguous
  // sends for this queued attempt reuse the same persisted Inngest event identity.
  const rows = await db()`with resumed as (
    update runs set retry_dispatch_id=case when status='failed' then ${dispatchId} else coalesce(retry_dispatch_id,${dispatchId}) end,
      status='queued',error=null,dispatched=false
    where id=${id} and owner_id=${owner} and mode='legacy' and (status='failed' or (status='queued' and dispatched=false))
      and not exists(select 1 from provider_operations where run_id=${id} and state='creating') returning *
  ), unlocked as (
    update provider_operations set state='retryable' where run_id in (select id from resumed) and state='failed_uncharged' returning phase
  ) select * from resumed`;
  if (!rows[0]) throw new Error("RECONCILIATION_REQUIRED");
  return {
    ...runFromRow(rows[0]),
    dispatchId: String(rows[0].retry_dispatch_id),
  };
}
export async function markRetryDispatched(
  id: string,
  owner: string,
  dispatchId: string
) {
  await db()`update runs set dispatched=true where id=${id} and owner_id=${owner} and retry_dispatch_id=${dispatchId}`;
}
export type Operation = {
  state: string;
  response_id: string | null;
  result: unknown;
  cost_cents: number;
  raw_receipt?: unknown;
  attempts?: number;
  retry_after_seconds?: number;
  brief_revision?: number;
};
export async function operation(id: string, phase: string) {
  if (operationContext.getStore())
    return (await agentOperation(id, phase)) as Operation | undefined;
  const rows =
    await db()`select * from provider_operations where run_id=${id} and phase=${phase}`;
  return rows[0] as Operation | undefined;
}
export async function claimOperation(id: string, phase: string) {
  if (operationContext.getStore()) return claimAgentOperation(id, phase);
  const rows =
    await db()`insert into provider_operations(run_id,phase,state) values(${id},${phase},'creating') on conflict (run_id,phase) do update set state='creating' where provider_operations.state='retryable' returning phase`;
  return rows.length > 0;
}
export type CrustFailureReceipt = {
  status: number;
  credits: 0;
  confirmedAt: string;
  requestId?: string;
  errorType?: string;
};
export async function failUnchargedOperation(
  id: string,
  phase: string,
  receipt: CrustFailureReceipt
) {
  if (operationContext.getStore())
    return agentFailure(
      id,
      phase,
      { ...receipt, source: "provider_response" },
      true
    );
  await db()`update provider_operations set state='failed_uncharged',failure_history=failure_history||${JSON.stringify(
    { ...receipt, source: "provider_response" }
  )}::jsonb where run_id=${id} and phase=${phase} and state='creating'`;
}
export async function recordCrustUncertainFailure(
  id: string,
  phase: string,
  receipt: {
    status: number;
    requestId?: string;
    errorType?: string;
    confirmedAt: string;
  }
) {
  if (operationContext.getStore())
    return agentFailure(
      id,
      phase,
      { ...receipt, source: "provider_response", credits: null },
      false
    );
  await db()`update provider_operations set failure_history=failure_history||${JSON.stringify(
    { ...receipt, source: "provider_response", credits: null }
  )}::jsonb where run_id=${id} and phase=${phase} and state='creating'`;
}
// Operator-only: supply an independently checked provider receipt, never user API input.
// This records the same terminal state as a provider-confirmed zero-credit failure.
export async function reconcileCrustOperation(
  id: string,
  owner: string,
  phase: string,
  receipt: CrustFailureReceipt & { requestId: string; evidence: string }
) {
  if (
    !owner ||
    !/^crust-(search-\d+|fetch)$/.test(phase) ||
    !Number.isInteger(receipt.status) ||
    receipt.status < 400 ||
    receipt.status > 599 ||
    receipt.credits !== 0 ||
    !/^[a-zA-Z0-9_-]{8,128}$/.test(receipt.requestId) ||
    !receipt.evidence?.trim() ||
    receipt.evidence.length > 1000 ||
    !Number.isFinite(Date.parse(receipt.confirmedAt))
  )
    throw new Error("INVALID_RECONCILIATION");
  const rows =
    await db()`update provider_operations set state='failed_uncharged',failure_history=failure_history||${JSON.stringify(
      { ...receipt, source: "operator_receipt" }
    )}::jsonb
    where run_id=${id} and phase=${phase} and state='creating' and cost_cents=0 and credit_milli=0
    and exists(select 1 from runs where id=${id} and owner_id=${owner} and mode='legacy' and (status='failed' or mode='autonomous') and provider='crustdata') returning phase`;
  if (!rows[0]) throw new Error("RECONCILIATION_REQUIRED");
}
export async function saveResponseId(
  id: string,
  phase: string,
  responseId: string
) {
  if (operationContext.getStore())
    return agentResponseId(id, phase, responseId);
  await db()`update provider_operations set response_id=${responseId},state='polling' where run_id=${id} and phase=${phase}`;
}
export async function saveOperation(
  id: string,
  phase: string,
  result: unknown,
  cost = 0,
  credits = 0
) {
  if (operationContext.getStore())
    return agentResult(id, phase, result, cost, credits);
  if (![cost, credits].every((n) => Number.isSafeInteger(n) && n >= 0))
    throw new Error("INVALID_PROVIDER_COST");
  const sql = db();
  await sql`with updated as (update provider_operations set state='complete',result=${JSON.stringify(
    result
  )}::jsonb,cost_cents=${cost},credit_milli=${credits} where run_id=${id} and phase=${phase} and state!='complete' returning cost_cents,credit_milli)
  update runs set actual_cents=actual_cents+coalesce((select cost_cents from updated),0),credit_actual_milli=credit_actual_milli+coalesce((select credit_milli from updated),0) where id=${id}`;
  // Any cost above its reservation freezes future allocation rather than hiding an overrun.
  await sql`update budgets set limit_cents=allocated_cents where id='research' and exists(select 1 from runs where id=${id} and actual_cents>reservation_cents)`;
  await sql`update budgets set credit_limit_milli=credit_allocated_milli where id='research' and exists(select 1 from runs where id=${id} and credit_actual_milli>credit_reservation_milli)`;
}
export async function createShare(id: string, owner: string) {
  const run = await ownedRun(id, owner);
  if (!run?.report) throw new Error("REPORT_NOT_FOUND");
  const token = randomBytes(24).toString("base64url"),
    hash = hashToken(token);
  await db()`insert into shares(token_hash,run_id,owner_id,snapshot) values(${hash},${id},${owner},${JSON.stringify(
    run.report
  )}::jsonb)`;
  return token;
}
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function sharedReport(token: string) {
  if (!/^[a-zA-Z0-9_-]{32}$/.test(token)) return null;
  const rows =
    await db()`select snapshot from shares where token_hash=${hashToken(
      token
    )} and revoked=false`;
  return (rows[0]?.snapshot as ResearchReport | null) || null;
}
export async function revokeShares(id: string, owner: string) {
  await db()`update shares set revoked=true where run_id=${id} and owner_id=${owner}`;
}

export async function saveProviderReceipt(
  id: string,
  phase: string,
  receipt: unknown,
  cost = 0,
  credits = 0
) {
  if (operationContext.getStore())
    return agentReceipt(id, phase, receipt, cost, credits);
  await db()`update provider_operations set raw_receipt=coalesce(raw_receipt,${JSON.stringify(
    receipt
  )}::jsonb) where run_id=${id} and phase=${phase}`;
}
