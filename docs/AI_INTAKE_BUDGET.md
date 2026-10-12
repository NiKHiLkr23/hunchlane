# Live AI intake — existing sponsored access

On October 11, 2026 the operator authorized using the existing sponsor key without a dedicated capped key or a separate pilot restriction. This supersedes the earlier conditional 30-cent pilot and sponsor-administrator setup requirement. No new key or provider cap is created.

## Setup

Run `pnpm intake:setup` to apply the separate intake session and operation tables. It does not reset existing reservations or the Crustdata allowance. Intake is available automatically when the database, sponsored key and Neatlogs key are configured; no enable flag is required. `.env.local` remains intact. Intake uses the same server-only `LITELLM_API_KEY` as research. No `AI_INTAKE_API_KEY` or pricing-confirmation flag is needed.

Each new conversation records a 30-cent reservation in the shared `budgets.id='research'` ledger. As of October 12, intake and reports no longer enforce an app-wide dollar cap. This is the existing app accounting mechanism, not an additional pilot cap or a provider invoice guarantee. Research keeps its own run reservations and journals. Intake consumes no Crustdata credits. The provider's existing $20 key budget remains unchanged.

## Conversation and recovery

The existing conversational design asks one useful question at a time, offers up to three suggestions, accepts personal answers or uncertainty, and leads to review after two answers. Normal request sizing remains three Claude Sonnet 4.6 calls, 800 output tokens per call and 16,000 UTF-8 prompt bytes. These existing bounds support concise intake; they are not a newly configured provider spending cap. Research requires a separate explicit Start research action.

Every session has an owner. A turn is atomically claimed and journaled before a paid request. Concurrent reuse, changed request identity and uncertain operations stop for reconciliation. SDK retries are disabled. GET recovers a completed reply without paying again. Login and reload never start a model call.

AI suggestions are unverified possibilities. No web searches, citations, demand validation or novelty claims occur during intake. Only accepted user answers enter the research brief. Development previews remain labeled fixtures with isolated device storage, and return 404 in production.

## Observed sponsor rates

Authenticated free metadata reported Sonnet 4.6 accounting rates of $3.30/$16.50 per million ordinary input/output tokens, plus $4.125/$0.33 cache-write/read input rates. These are reported accounting rates, not independent proof of external billing fees. At ordinary rates, a 4,000-input/800-output call is $0.0264; a 16,000-input/800-output planning scenario is $0.066. Prompt bytes are not exact token counts.

The earlier shared key readback reported a $20 budget and $0.09768 spend. Creating a separate key returned HTTP 401; this is now historical evidence, not an activation blocker. The user explicitly chose the existing access.

## Verification commands

`pnpm intake:check` makes one private operator connection check about Hunchlane itself, using a persisted reservation and operation receipt. Re-running recovers the same completed turn; an uncertain operation stops without a new call. This command can spend on its first run. It does not authenticate a Clerk browser user or start research. Evidence is written only to ignored `artifacts/verification/` files. A signed-in browser conversation still needs user verification.
