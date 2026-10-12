import { db } from "./store";
import { operationContext } from "./operation-context";

function context() {
  const c = operationContext.getStore();
  if (!c?.owner) throw new Error("UNAUTHENTICATED");
  return c;
}
function ceiling(phase: string) {
  return {
    cents:
      phase.startsWith("crust-search-") || phase === "crust-fetch"
        ? 0
        : phase === "crust-plan" || phase === "crust-select"
        ? 5
        : phase === "cfo"
        ? 0
        : 25,
    credits: phase.startsWith("crust-search-")
      ? 1000
      : phase === "crust-fetch"
      ? 3000
      : 0,
  };
}
export async function agentOperation(id: string, phase: string) {
  const { owner } = context();
  const rows =
    await db()`select o.* from provider_operations o join runs r on r.id=o.run_id where r.id=${id} and r.owner_id=${owner} and o.phase=${phase}`;
  return rows[0];
}
export async function claimAgentOperation(id: string, phase: string) {
  const { owner, revision, lease } = context(),
    cap = ceiling(phase);
  const rows = await db()`with eligible as (
    select * from runs where id=${id} and owner_id=${owner} and mode='autonomous' and status in ('queued','running')
      and lease_token=${lease} and lease_until>now() and deadline_at>now() and actual_cents<=reservation_cents and credit_actual_milli<=credit_reservation_milli for update
  ), funded as (
    update runs set operation_budget_cents=operation_budget_cents+${cap.cents},operation_budget_credits=operation_budget_credits+${cap.credits}
    where id in (select id from eligible) and not exists(select 1 from provider_operations where run_id=${id} and phase=${phase})
      and operation_budget_cents+${cap.cents}<=reservation_cents and operation_budget_credits+${cap.credits}<=credit_reservation_milli returning id
  ) insert into provider_operations(run_id,phase,state,brief_revision,ceiling_cents,ceiling_credits)
    select id,${phase},'creating',${revision},${cap.cents},${cap.credits} from eligible
    where exists(select 1 from funded) or exists(select 1 from provider_operations where run_id=${id} and phase=${phase} and state='retryable' and attempts<4)
    on conflict(run_id,phase) do update set state='creating',attempts=provider_operations.attempts+1,brief_revision=${revision},error_class=null
    where provider_operations.state='retryable' and provider_operations.attempts<4 returning phase`;
  if (!rows.length) {
    if (!(await agentOperation(id, phase)))
      throw new Error("OPERATION_ALLOWANCE_EXHAUSTED");
    return false;
  }
  return true;
}
export async function agentReceipt(
  id: string,
  phase: string,
  receipt: unknown,
  cost: number,
  credits: number
) {
  const { owner } = context();
  if (![cost, credits].every((n) => Number.isSafeInteger(n) && n >= 0))
    throw new Error("INVALID_PROVIDER_COST");
  await db()`with saved as (
    update provider_operations o set raw_receipt=coalesce(raw_receipt,${JSON.stringify(
      receipt
    )}::jsonb),
      cost_cents=${cost},credit_milli=${credits},accounted=true,state=case when state='complete' then state else 'received' end
    where run_id=${id} and phase=${phase} and accounted=false and exists(select 1 from runs where id=${id} and owner_id=${owner})
    returning cost_cents,credit_milli,ceiling_cents,ceiling_credits,response_id
  ) update runs set actual_cents=actual_cents+coalesce((select cost_cents from saved),0),
    credit_actual_milli=credit_actual_milli+coalesce((select credit_milli from saved),0),
    operation_budget_cents=operation_budget_cents-coalesce((select ceiling_cents-cost_cents from saved where response_id is not null),0)
    where id=${id} and owner_id=${owner}`;
  // A credit receipt above its reserved ceiling freezes future credit allocation.
  await db()`update budgets set credit_limit_milli=credit_allocated_milli where id='research'
    and exists(select 1 from runs where id=${id} and owner_id=${owner} and credit_actual_milli>credit_reservation_milli)`;
}
export async function agentResult(
  id: string,
  phase: string,
  result: unknown,
  cost: number,
  credits: number
) {
  const { owner } = context();
  await agentReceipt(id, phase, result, cost, credits);
  await db()`update provider_operations set result=${JSON.stringify(
    result
  )}::jsonb,state='complete'
    where run_id=${id} and phase=${phase} and state='received' and exists(select 1 from runs where id=${id} and owner_id=${owner})`;
}
export async function agentResponseId(
  id: string,
  phase: string,
  responseId: string
) {
  const { owner } = context();
  await db()`update provider_operations set response_id=${responseId},state='polling' where run_id=${id} and phase=${phase}
    and state='creating' and exists(select 1 from runs where id=${id} and owner_id=${owner})`;
}
export async function agentFailure(
  id: string,
  phase: string,
  receipt: unknown,
  uncharged: boolean,
  retryAfter = 0
) {
  const { owner } = context();
  await db()`update provider_operations set state=case when ${uncharged} then 'failed_uncharged' else state end,
    error_class=case when ${uncharged} then 'safe' else 'uncertain' end,retry_after_seconds=${retryAfter},
    failure_history=failure_history||(${JSON.stringify(
      receipt
    )}::jsonb||jsonb_build_object('attempt',attempts,'briefRevision',brief_revision))
    where run_id=${id} and phase=${phase} and state='creating' and exists(select 1 from runs where id=${id} and owner_id=${owner})`;
}
