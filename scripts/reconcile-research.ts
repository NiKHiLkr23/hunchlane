import nextEnv from '@next/env';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { reconcileCrustOperation } from '../src/server/store';
nextEnv.loadEnvConfig(process.cwd());
const [runId,owner,phase,receiptPath]=process.argv.slice(2);
const Receipt=z.object({status:z.number().int().min(400).max(599),credits:z.literal(0),confirmedAt:z.iso.datetime(),requestId:z.string().regex(/^[a-zA-Z0-9_-]{8,128}$/),evidence:z.string().trim().min(1).max(1000)}).strict();
try {
  if(!runId || !owner || !phase || !receiptPath)throw new Error('ARGUMENTS');
  const receipt=Receipt.parse(JSON.parse(await readFile(receiptPath,'utf8')));
  await reconcileCrustOperation(z.uuid().parse(runId),owner,phase,receipt);
  console.log('Verified zero-credit failure recorded. Active continuous runs recover automatically; completed reports remain immutable. Legacy runs retain explicit retry. No paid request or event was sent.');
} catch {
  console.error('Reconciliation refused. Use: pnpm research:reconcile <run-id> <Clerk-owner-id> <crust-search-N|crust-fetch> <receipt.json>. Check the owner, failed state and independently verified zero-credit receipt.');
  process.exitCode=1;
}
