import { createHash, randomUUID } from "node:crypto";
import { AGENT_LIMITS, openingConversation, type AgentCursor, type AgentMessageInput } from "@/core/agent";
import { RESERVATIONS } from "@/core/budget";
import type { IdeaBrief, ResearchReport, RunStage } from "@/core/types";
import { db, ownedRun } from "./store";
import { CRUST_CREDITS, type ResearchProvider } from "./research-provider";

export function autonomousEnabled() { return process.env.HUNCHLANE_AUTONOMOUS_FLOW === "1"; }
export async function agentSchemaReady() { const rows=await db()`select to_regclass('public.agent_outbox') is not null as ready`; return Boolean(rows[0]?.ready); }
export type Wake = { id: string; runId: string; ownerId: string; availableAt: string };
export function agentSubmissionHash(brief: IdeaBrief, parentId: string | null) { return createHash("sha256").update(JSON.stringify({brief,parentId})).digest("hex"); }
export async function matchesAgentSubmission(id: string, owner: string, brief: IdeaBrief, parentId: string | null) {
  const rows=await db()`select id from runs where id=${id} and owner_id=${owner} and mode='autonomous' and submission_hash=${agentSubmissionHash(brief,parentId)}`;return rows.length>0;
}
export async function createAgentRun(id: string, owner: string, brief: IdeaBrief, parentId: string | null, provider: ResearchProvider) {
  if (!owner) throw new Error("UNAUTHENTICATED");
  const existing = await ownedRun(id, owner);
  if (existing) {
    if (!await matchesAgentSubmission(id,owner,brief,parentId)) throw new Error("SUBMISSION_CONFLICT");
    return existing;
  }
  if (parentId) { const parent = await ownedRun(parentId, owner); if (!parent?.report || parent.parentId) throw new Error("REFINEMENT_NOT_ALLOWED"); }
  const now = new Date().toISOString(), kind = parentId ? "refinement" : "full", cents = RESERVATIONS[kind], credits = provider === "crustdata" ? CRUST_CREDITS[kind] * 1000 : 0;
  const conversation = openingConversation(brief, now);
  // Admission, reservation and first dispatch intent are one transaction, including quota constraints.
  await db()`with reserve as (
    update budgets set allocated_cents=allocated_cents+${cents},credit_allocated_milli=credit_allocated_milli+${credits}
    where id='research' and allocated_cents+${cents}<=limit_cents and credit_allocated_milli+${credits}<=credit_limit_milli returning id
  ), created as (
    insert into runs(id,owner_id,kind,brief,parent_id,reservation_cents,provider,credit_reservation_milli,mode,conversation,deadline_at,submission_hash)
    select ${id},${owner},${kind},${JSON.stringify(brief)}::jsonb,${parentId},${cents},${provider},${credits},'autonomous',${JSON.stringify(conversation)}::jsonb,
      ${now}::timestamptz+interval '20 minutes',${agentSubmissionHash(brief,parentId)} from reserve returning id,owner_id
  ) insert into agent_outbox(id,run_id,owner_id) select ${`agent-${id}-0`},id,owner_id from created`;
  const run = await ownedRun(id, owner);
  if (!run) throw new Error("BUDGET_EXHAUSTED");
  return run;
}

export async function appendAgentMessage(id: string, owner: string, input: AgentMessageInput) {
  if (!owner) throw new Error("UNAUTHENTICATED");
  const run = await ownedRun(id, owner); if (!run?.agent) throw new Error("RUN_NOT_FOUND");
  const old = run.agent.conversation.messages.find(m => m.id === input.id);
  const matches = (saved: typeof old) => saved?.text === input.text && (saved.questionId || "") === (input.questionId || "") && Boolean(saved.useJudgment) === Boolean(input.useJudgment);
  if (old) { if (!matches(old)) throw new Error("SUBMISSION_CONFLICT"); return run; }
  if (input.questionId && !run.agent.conversation.questions.some(q => q.id === input.questionId)) throw new Error("INVALID_QUESTION");
  const key = input.questionId || `context-${input.id}`, now = new Date().toISOString();
  const rows = await db()`with current as (
    select * from runs where id=${id} and owner_id=${owner} and mode='autonomous' for update
  ), revised as (
    select current.*,
      case when locked_revision is null and status in ('queued','running') and not ${Boolean(input.useJudgment)} then
        jsonb_set(case when ${input.questionId === "audience"} then jsonb_set(brief,'{audience}',to_jsonb(${input.text.slice(0, 300)}::text)) else brief end,
          '{answers}',coalesce(brief->'answers','{}'::jsonb)||jsonb_build_object(${key}::text,${input.text.slice(0, 500)}::text)) else brief end as next_brief,
      brief_revision+case when locked_revision is null and status in ('queued','running') and not ${Boolean(input.useJudgment)} then 1 else 0 end as next_revision
    from current
  ) update runs r set conversation=jsonb_set(jsonb_set(jsonb_set(r.conversation,'{messages}',r.conversation->'messages'||jsonb_build_array(
    jsonb_build_object('id',${input.id}::text,'role','user','text',${input.text}::text,'createdAt',${now}::text,
      'questionId',${input.questionId || ""}::text,'useJudgment',${Boolean(input.useJudgment)}::boolean,
      'followUp',r.locked_revision is not null or r.status in ('complete','failed')))), '{questions}',
    case when r.locked_revision is null and r.status in ('queued','running') then
      (select coalesce(jsonb_agg(case when q->>'id'=${input.questionId || ""} then q||jsonb_build_object('answer',${input.text}::text) else q end),'[]'::jsonb) from jsonb_array_elements(r.conversation->'questions') q)
      else r.conversation->'questions' end), '{briefRevisions}',
    case when c.next_revision>r.brief_revision then coalesce(r.conversation->'briefRevisions','[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('revision',c.next_revision,'brief',c.next_brief,'createdAt',${now}::text))
      else coalesce(r.conversation->'briefRevisions','[]'::jsonb) end),
    brief=c.next_brief,brief_revision=c.next_revision
    from revised c where r.id=c.id and r.owner_id=${owner}
      and jsonb_array_length(r.conversation->'messages')<50
      and not exists(select 1 from jsonb_array_elements(r.conversation->'messages') m where m->>'id'=${input.id}) returning r.id`;
  if (!rows.length) {
    const saved = await ownedRun(id, owner);
    const duplicate=saved?.agent?.conversation.messages.find(m => m.id === input.id);
    if(duplicate && !matches(duplicate)) throw new Error("SUBMISSION_CONFLICT");
    if (!duplicate) throw new Error("CONVERSATION_LIMIT");
  }
  return ownedRun(id, owner);
}

export async function acquireAgentLease(id: string, owner: string) {
  if (!owner) throw new Error("UNAUTHENTICATED");
  const lease = randomUUID();
  const rows = await db()`update runs set lease_token=${lease},lease_until=now()+interval '90 seconds',status='running'
    where id=${id} and owner_id=${owner} and mode='autonomous' and status in ('queued','running')
      and next_attempt_at<=now() and (lease_until is null or lease_until<now()) returning id`;
  return rows.length ? lease : null;
}
export async function freezeAgentBrief(id: string, owner: string, lease: string) {
  await db()`update runs set locked_revision=brief_revision,final_brief=brief
    where id=${id} and owner_id=${owner} and lease_token=${lease} and locked_revision is null`;
  return ownedRun(id, owner);
}
export async function scheduleAgent(id: string, owner: string, lease: string, cursor: AgentCursor, stage: RunStage,
  seconds = 0, recovery: "working" | "recovering" | "reconciling" = "working", activity?: string, resetAttempts = true): Promise<Wake | null> {
  const at = new Date(Date.now() + seconds * 1000).toISOString();
  const entry = activity ? [{ id: `${cursor}-${recovery}`, text: activity, createdAt: new Date().toISOString() }] : [];
  const rows = await db()`with updated as (
    update runs set agent_cursor=${cursor},stage=${stage},next_attempt_at=least(${at}::timestamptz,deadline_at),recovery=${recovery},
      recovery_attempts=case when ${resetAttempts} then 0 else recovery_attempts+1 end,
      wake_sequence=wake_sequence+1,lease_token=null,lease_until=null,
      conversation=case when ${Boolean(activity)} and not exists(select 1 from jsonb_array_elements(conversation->'activity') a where a->>'id'=${`${cursor}-${recovery}`})
        then jsonb_set(conversation,'{activity}',conversation->'activity'||${JSON.stringify(entry)}::jsonb) else conversation end
    where id=${id} and owner_id=${owner} and lease_token=${lease} and status in ('queued','running') returning *
  ) insert into agent_outbox(id,run_id,owner_id,available_at)
    select 'agent-'||id||'-'||wake_sequence,id,owner_id,next_attempt_at from updated returning *`;
  return rows[0] ? { id: String(rows[0].id), runId: id, ownerId: owner, availableAt: new Date(String(rows[0].available_at)).toISOString() } : null;
}
export async function finishAgent(id: string, owner: string, lease: string, report: ResearchReport | null) {
  const message = report ? "Your report is ready. Here’s what the evidence supports and a small next step." : "I couldn’t retrieve enough usable evidence to produce a reliable report. Your idea and conversation are saved.";
  await db()`update runs set status=case when ${Boolean(report)} then 'complete' else 'failed' end,stage='complete',report=${JSON.stringify(report)}::jsonb,
    locked_revision=coalesce(locked_revision,brief_revision),final_brief=coalesce(final_brief,brief),error=null,recovery='working',lease_token=null,lease_until=null,
    conversation=jsonb_set(conversation,'{activity}',conversation->'activity'||${JSON.stringify([{ id: "final", text: message, createdAt: new Date().toISOString() }])}::jsonb)
    where id=${id} and owner_id=${owner} and lease_token=${lease} and status in ('queued','running')`;
}
export async function agentAttempts(id: string, owner: string) {
  const rows = await db()`select recovery_attempts from runs where id=${id} and owner_id=${owner}`;
  return Number(rows[0]?.recovery_attempts || 0);
}
export async function unlockUncharged(id: string, owner: string, phase: string) {
  await db()`update provider_operations set state='retryable' where run_id=${id} and phase=${phase} and state='failed_uncharged'
    and attempts<4 and exists(select 1 from runs where id=${id} and owner_id=${owner} and mode='autonomous' and status in ('queued','running'))`;
}
export async function acknowledgeWake(wake: Wake) {
  await db()`with acknowledged as (update agent_outbox set sent_at=now() where id=${wake.id} and run_id=${wake.runId} and owner_id=${wake.ownerId} returning run_id)
    update runs set dispatched=true where id in (select run_id from acknowledged) and owner_id=${wake.ownerId}`;
}
/** The dispatcher scans identifiers only. All private reads and processing use the returned owner. */
export async function pendingAgentWakes(): Promise<Wake[]> {
  const rows = await db()`select id,run_id,owner_id,available_at from agent_outbox where sent_at is null and available_at<=now() order by available_at limit 50`;
  return rows.map(r => ({ id: String(r.id), runId: String(r.run_id), ownerId: String(r.owner_id), availableAt: new Date(String(r.available_at)).toISOString() }));
}
export async function stalledAgentPointers(): Promise<{ id: string; owner: string }[]> {
  const rows = await db()`select id,owner_id from runs where mode='autonomous' and status in ('queued','running') and next_attempt_at<now()-interval '90 seconds'
    and (lease_until is null or lease_until<now()) limit 50`;
  return rows.map(r => ({ id: String(r.id), owner: String(r.owner_id) }));
}
export async function rescueAgent(id: string, owner: string) {
  const lease = await acquireAgentLease(id, owner); if (!lease) return null;
  const run = await ownedRun(id, owner); if (!run?.agent) return null;
  return scheduleAgent(id, owner, lease, run.agent.cursor, run.stage, 0, run.agent.recovery, undefined, false);
}
