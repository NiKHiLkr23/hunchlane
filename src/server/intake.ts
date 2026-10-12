import OpenAI from 'openai';
import { wrapOpenAI } from 'neatlogs';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from './store';
import { observed } from './telemetry';
import { IntakeReplySchema } from '@/core/idea-draft';
import { INTAKE_LIMITS, INTAKE_RULES, type IntakeRequest } from '@/core/intake';
export function intakeEnabled() {
  return Boolean(process.env.DATABASE_URL && process.env.LITELLM_API_KEY && process.env.NEATLOGS_API_KEY);
}
export async function savedIntake(id: string, owner: string, turn: number) {
  if (!owner) throw Error("UNAUTHENTICATED");
  const rows = await db()`select o.state,o.result,o.request_hash from intake_operations o join idea_intakes i on i.id=o.intake_id where i.id=${id} and i.owner_id=${owner} and o.turn=${turn}`;
  return rows[0];
}
export async function intakeTurn(owner: string, input: IntakeRequest) {
  if (!owner) throw Error("UNAUTHENTICATED");
  if (input.turn < 0 || input.turn >= INTAKE_LIMITS.turns) throw Error('RECONCILIATION_REQUIRED');
  const content = JSON.stringify(input),
    hash = createHash('sha256').update(content).digest('hex');
  const system = INTAKE_RULES + '\nReturn JSON matching this schema: ' + JSON.stringify(z.toJSONSchema(IntakeReplySchema));
  if (Buffer.byteLength(content + system, 'utf8') > INTAKE_LIMITS.promptBytes) throw Error('INTAKE_TOO_LONG');
  const sql = db();
  const existing = await savedIntake(input.id, owner, input.turn);
  if (existing) {
    if (existing.request_hash !== hash) throw Error('INTAKE_CONFLICT');
    if (existing.state === 'complete') return IntakeReplySchema.parse(existing.result);
    throw Error('RECONCILIATION_REQUIRED');
  }
  const apiKey = process.env.LITELLM_API_KEY;
  if (!apiKey) throw Error('INTAKE_NOT_CONFIGURED');
  const session = await sql`select id,next_turn from idea_intakes where id=${input.id} and owner_id=${owner}`;
  if (!session[0]) {
    if (input.turn !== 0) throw Error('INTAKE_CONFLICT');
    const rows = await sql`with reserve as (update budgets set allocated_cents=allocated_cents+30 where id='research' returning id)
    insert into idea_intakes(id,owner_id) select ${input.id},${owner} from reserve returning id`;
    if (!rows[0]) throw Error('INTAKE_BUDGET_EXHAUSTED');
  }
  // This statement serializes a session's turn. Any operation insert failure rolls back the claim.
  const claim = await sql`with advance as (update idea_intakes set next_turn=next_turn+1 where id=${input.id} and owner_id=${owner} and next_turn=${input.turn}
  and not exists(select 1 from intake_operations where intake_id=${input.id} and (state='creating' or result->>'ready'='true')) returning id)
  insert into intake_operations(intake_id,turn,request_hash,state) select id,${input.turn},${hash},'creating' from advance returning intake_id`;
  if (!claim[0]) throw Error('RECONCILIATION_REQUIRED');
  return observed(input.id, 'idea-intake', async () => {
    const client = wrapOpenAI(new OpenAI({
      baseURL: 'https://litellm.vision.aivar.app/v1',
      apiKey,
      maxRetries: 0
    }));
    const result = await client.chat.completions.create({
      model: 'claude-sonnet-4.6',
      max_tokens: INTAKE_LIMITS.outputTokens,
      messages: [{
        role: 'system',
        content: system
      }, {
        role: 'user',
        content
      }]
    });
    const text = result.choices[0]?.message.content;
    if (!text || result.choices[0].finish_reason !== 'stop') throw Error('INTAKE_UNCERTAIN');
    const reply = IntakeReplySchema.parse(JSON.parse(text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')));
    if (!reply.ready && !reply.question.trim()) throw Error('INTAKE_UNCERTAIN');
    const final = input.turn === 2 ? {
      ...reply,
      ready: true,
      question: '',
      suggestions: []
    } : reply;
    await sql`update intake_operations o set state='complete',result=${JSON.stringify(final)}::jsonb,input_tokens=${result.usage?.prompt_tokens ?? null},output_tokens=${result.usage?.completion_tokens ?? null}
   where intake_id=${input.id} and turn=${input.turn} and exists(select 1 from idea_intakes i where i.id=o.intake_id and i.owner_id=${owner})`;
    return final;
  });
}
