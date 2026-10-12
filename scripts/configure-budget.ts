import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { neon } from "@neondatabase/serverless";
import { crustCreditBudget } from "../src/server/research-provider";
import { checkCrustAccount } from "../src/server/crustdata";
loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL first.");
const credits = crustCreditBudget();
if (credits) await checkCrustAccount(credits);
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`update budgets set credit_limit_milli=${
  credits * 1000
} where id='research' and credit_allocated_milli<=${
  credits * 1000
} returning id`;
if (!rows.length)
  throw new Error(
    "Migrate first. Limits cannot be below existing allocations; no allocations were changed."
  );
console.log(
  "Crustdata credit cap configured from .env.local. Existing allocations preserved. No paid provider calls made."
);
