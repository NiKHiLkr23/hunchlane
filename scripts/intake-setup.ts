import nextEnv from '@next/env';
import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
async function main() {
nextEnv.loadEnvConfig(process.cwd(), false, {info() {}, error() {}});
if (!process.env.DATABASE_URL) throw Error('DATABASE_NOT_CONFIGURED');
const sql = neon(process.env.DATABASE_URL);
const before = await sql`select limit_cents,allocated_cents from budgets where id='research'`;
if (!before[0]) throw Error('SHARED_ALLOWANCE_NOT_CONFIGURED');
const schema = await readFile(new URL('../docs/INTAKE_SETUP.sql', import.meta.url), 'utf8');
const statements = schema.replace(/^\s*--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
await sql.transaction(statements.map(s => sql.query(s)));
const after = await sql`select limit_cents,allocated_cents from budgets where id='research'`;
console.log(JSON.stringify({intakeTablesApplied:true,budgetUnchanged:JSON.stringify(before)===JSON.stringify(after),sharedAllowanceCents:after[0].limit_cents,allocatedCents:after[0].allocated_cents}));
}
main().catch(() => { console.error('Intake schema setup did not complete; existing allowances were not reset.'); process.exitCode=1; });
