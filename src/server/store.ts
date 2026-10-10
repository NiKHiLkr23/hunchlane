import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes } from "node:crypto";
import type { IdeaBrief, ResearchReport, RunStage, RunState } from "@/core/types";
import { RESERVATIONS } from "@/core/budget";
import { CRUST_CREDITS, type ResearchProvider } from "./research-provider";
export function db() { if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED"); return neon(process.env.DATABASE_URL); }
type Row = Record<string, unknown>;
function runFromRow(row: Row): RunState { return { id: String(row.id), brief: row.brief as IdeaBrief, status: row.status as RunState["status"], stage: row.stage as RunStage, createdAt: new Date(String(row.created_at)).toISOString(), error: row.error as string | null, parentId: row.parent_id as string | null, report: row.report as ResearchReport | null, dispatched: Boolean(row.dispatched), provider: row.provider === "crustdata" ? "crustdata" : "openai" }; }
export async function ownedRun(id: string, owner: string) { const rows = await db()`select * from runs where id=${id} and owner_id=${owner}`; return rows[0] ? runFromRow(rows[0]) : null; }
export async function internalRun(id: string) { const rows = await db()`select * from runs where id=${id}`; if (!rows[0]) throw new Error("RUN_NOT_FOUND"); return runFromRow(rows[0]); }
export async function listRuns(owner: string) { const rows = await db()`select * from runs where owner_id=${owner} order by created_at desc limit 50`; return rows.map(runFromRow); }
export async function createRun(id: string, owner: string, brief: IdeaBrief, parentId: string | null, provider: ResearchProvider = "openai") {
  const sql = db(), kind = parentId ? "refinement" : "full", reservation = RESERVATIONS[kind];
  const credits = provider === "crustdata" ? CRUST_CREDITS[kind] * 1000 : 0;
  const existing = await ownedRun(id, owner); if (existing) return existing;
  if (parentId) { const parent = await ownedRun(parentId, owner); if (!parent?.report || parent.parentId) throw new Error("REFINEMENT_NOT_ALLOWED"); }
  // Conditional row update serializes global reservations. A uniqueness violation rolls back this whole statement.
  const rows = await sql`
    with reserve as (
      update budgets set allocated_cents=allocated_cents+${reservation},credit_allocated_milli=credit_allocated_milli+${credits}
      where id='research' and allocated_cents+${reservation}<=limit_cents and credit_allocated_milli+${credits}<=credit_limit_milli returning id
    ) insert into runs (id,owner_id,kind,brief,parent_id,reservation_cents,provider,credit_reservation_milli)
      select ${id},${owner},${kind},${JSON.stringify(brief)}::jsonb,${parentId},${reservation},${provider},${credits} from reserve returning *`;
  if (!rows[0]) throw new Error("BUDGET_EXHAUSTED");
  return runFromRow(rows[0]);
}
export async function markDispatched(id: string) { await db()`update runs set dispatched=true where id=${id}`; }
export async function reserveCrustSlot(){
  // Serialize all paid Crustdata requests across workers below the verified 10/minute floor.
  const rows=await db()`update budgets set crust_next_call_at=greatest(coalesce(crust_next_call_at,now()),now())+interval '7 seconds' where id='research' returning crust_next_call_at-interval '7 seconds' as call_at`;
  if(!rows[0])throw new Error("BUDGET_EXHAUSTED");return new Date(String(rows[0].call_at)).toISOString();
}
export async function progress(id: string, stage: RunStage) { await db()`update runs set status='running',stage=${stage},error=null where id=${id} and status in ('queued','running','failed')`; }
export async function finishRun(id: string, report: ResearchReport) { await db()`update runs set status='complete',stage='complete',report=${JSON.stringify(report)}::jsonb,error=null where id=${id}`; }
export async function failRun(id: string, message: string) { await db()`update runs set status='failed',error=${message} where id=${id} and status!='complete'`; }
export async function retryRun(id: string, owner: string) {
  const rows = await db()`update runs set status='queued',error=null,dispatched=false where id=${id} and owner_id=${owner} and (status='failed' or (status='queued' and dispatched=false)) and not exists (select 1 from provider_operations where run_id=${id} and state='creating') returning *`;
  if (!rows[0]) throw new Error("RECONCILIATION_REQUIRED"); return runFromRow(rows[0]);
}
export type Operation = { state: string; response_id: string | null; result: unknown; cost_cents: number };
export async function operation(id: string, phase: string) { const rows = await db()`select * from provider_operations where run_id=${id} and phase=${phase}`; return rows[0] as Operation | undefined; }
export async function claimOperation(id: string, phase: string) { const rows = await db()`insert into provider_operations(run_id,phase,state) values(${id},${phase},'creating') on conflict do nothing returning phase`; return rows.length > 0; }
export async function saveResponseId(id: string, phase: string, responseId: string) { await db()`update provider_operations set response_id=${responseId},state='polling' where run_id=${id} and phase=${phase}`; }
export async function saveOperation(id: string, phase: string, result: unknown, cost = 0, credits = 0) {
  if (![cost,credits].every(n=>Number.isSafeInteger(n)&&n>=0)) throw new Error("INVALID_PROVIDER_COST");
  const sql=db();
  await sql`with updated as (update provider_operations set state='complete',result=${JSON.stringify(result)}::jsonb,cost_cents=${cost},credit_milli=${credits} where run_id=${id} and phase=${phase} and state!='complete' returning cost_cents,credit_milli)
  update runs set actual_cents=actual_cents+coalesce((select cost_cents from updated),0),credit_actual_milli=credit_actual_milli+coalesce((select credit_milli from updated),0) where id=${id}`;
  // Any cost above its reservation freezes future allocation rather than hiding an overrun.
  await sql`update budgets set limit_cents=allocated_cents where id='research' and exists(select 1 from runs where id=${id} and actual_cents>reservation_cents)`;
  await sql`update budgets set credit_limit_milli=credit_allocated_milli where id='research' and exists(select 1 from runs where id=${id} and credit_actual_milli>credit_reservation_milli)`;
}
export async function createShare(id: string, owner: string) {
  const run = await ownedRun(id,owner); if (!run?.report) throw new Error("REPORT_NOT_FOUND");
  const token = randomBytes(24).toString("base64url"), hash = hashToken(token);
  await db()`insert into shares(token_hash,run_id,owner_id,snapshot) values(${hash},${id},${owner},${JSON.stringify(run.report)}::jsonb)`;
  return token;
}
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export async function sharedReport(token: string) { if (!/^[a-zA-Z0-9_-]{32}$/.test(token)) return null; const rows = await db()`select snapshot from shares where token_hash=${hashToken(token)} and revoked=false`; return rows[0]?.snapshot as ResearchReport | null || null; }
export async function revokeShares(id: string, owner: string) { await db()`update shares set revoked=true where run_id=${id} and owner_id=${owner}`; }
