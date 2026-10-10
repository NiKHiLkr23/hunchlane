import nextEnv from '@next/env';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { db } from '../src/server/store';
import { intakeTurn, savedIntake } from '../src/server/intake';
nextEnv.loadEnvConfig(process.cwd(), false, {info() {}, error() {}});
// Private operator smoke check, not a Clerk-authenticated browser session or research report.
// Reuses its journaled turn on rerun; an uncertain operation stops without another provider call.
const owner = 'system:intake-connection-check';
const idea = 'Hunchlane helps beginners research an idea, discover existing alternatives, identify possible angles, and understand basic business assumptions for software, physical products, and services.';
try {
  const rows = await db()`select id from idea_intakes where owner_id=${owner} order by created_at desc limit 1`;
  const id = rows[0] ? String(rows[0].id) : randomUUID();
  const reply = await intakeTurn(owner, {id,turn:0,brief:{idea,category:'software',audience:'Beginners exploring a business idea',location:'',answers:{}},messages:[{role:'user',text:idea}]});
  const receipt = await savedIntake(id,owner,0);
  const usage = await db()`select o.input_tokens,o.output_tokens from intake_operations o join idea_intakes i on i.id=o.intake_id where i.id=${id} and i.owner_id=${owner} and o.turn=0`;
  const evidence = {id,privateOperatorCheck:true,browserAuthenticationVerified:false,state:receipt?.state,reply,usage:usage[0]};
  await writeFile('artifacts/verification/intake-live-check.json',JSON.stringify(evidence,null,2));
  console.log(JSON.stringify({id,state:receipt?.state,hasQuestion:!!reply.question,suggestions:reply.suggestions.length,usage:usage[0],browserAuthenticationVerified:false}));
} catch {
  console.error('Intake check paused. Inspect its saved operation before another request; no automatic retry.');
  process.exitCode=1;
}
