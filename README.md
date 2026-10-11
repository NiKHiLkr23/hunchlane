# Hunchlane

**See what exists. Find your angle.**

A research desk for a first business or product idea. Describe an idea, clarify it through a short conversation, explicitly start research, and receive a saved report of existing alternatives, cited evidence, possible angles and a small next experiment. Software, physical products and services are supported.

## Run locally

Requires Node 22+ and pnpm 10. Start the sample interface with no accounts:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3100. `/sample` is deterministic illustrative content; it is never substituted for a live research run. Missing auth/database credentials do not enable a production bypass.

For live research, copy `.env.example` to `.env.local`, configure Clerk, Neon, Neatlogs and Inngest, plus either OpenAI or both Crustdata and LiteLLM, then:

```sh
pnpm integrations:check
pnpm db:migrate
pnpm jobs:dev
```

Keep `pnpm dev` running in another terminal. Set `INNGEST_DEV=1` locally. The job command enables the official runner's required binary install script, binds to localhost, and persists local queue state; open http://localhost:8288 to inspect it. On Vercel remove the dev variable, set Inngest event/signing keys and sync `/api/inngest` in Inngest Cloud. Update `NEXT_PUBLIC_APP_URL` and Clerk's allowed origins/redirects for the deployed hostname.

The sponsored Nova/Claude connection uses `LITELLM_API_KEY` and `LITELLM_MODEL`. Its fixed endpoint and model allowlist come from https://neatlogs.com/hackathon/models. With Crustdata configured, it plans searches, selects evidence pages, and composes reports using Chat Completions. With OpenAI research selected, it composes reports from OpenAI's retrieved evidence. Without the sponsor key, OpenAI also composes the report.

For Crustdata, set `CRUSTDATA_API_KEY`, `LITELLM_API_KEY`, and an operator-approved `CRUSTDATA_CREDIT_BUDGET` from your claimed allocation. The email offers 5,000 credits per team; an offer is not proof of a credited balance. This operator has approved a 5,000-credit total allowance, reflected in `.env.example`; verify your own account before applying it. Run `pnpm crust:check` (free account reads), `pnpm db:migrate`, and `pnpm budget:configure`. The last command applies the configured limits without resetting allocations. `RESEARCH_PROVIDER=auto` selects Crustdata when both keys and a minimum five-credit allowance are configured; otherwise it selects OpenAI. Explicit values `crustdata` or `openai` select one provider. A failed provider never silently switches to another paid service.

Crustdata Web Search and Web Fetch use the documented `2025-11-01` API, Bearer authentication, and normal retrieval mode. Full reports reserve five credits (two searches and up to three fetched pages); refinements reserve four. Free preflight verifies the account balance, endpoint access, one-credit rates and at least 10 requests/minute. Paid requests are spaced across workers with a persisted seven-second queue. Receipts are matched by URL rather than response order; failed fetches stay visible as evidence limitations. Search snippets are not treated as full-page verification. See https://docs.crustdata.com/web-docs/search/reference and https://docs.crustdata.com/web-docs/fetch/introduction.

`pnpm sponsored:check` performs one tiny JSON connection check with a private system-run reservation, cached operation receipt and Neatlogs instrumentation. Re-running reuses the receipt instead of spending again. It passed against the configured sponsor key; it does not verify research quality. Its conservative 75-cent app reservation stays allocated, and sponsor-funded usage is separate from the personal OpenAI ledger.

Live conversational intake uses the existing sponsored key and shared app allowance. Apply its journal tables with `pnpm intake:setup`; intake is available automatically when its database, sponsored key and telemetry are configured. No dedicated key, separate pilot budget or pricing-confirmation flag is required. Intake reserves its own conversation allowance before calling Claude; it consumes no Crustdata credits and never automatically retries uncertain operations. See [AI intake setup](docs/AI_INTAKE_BUDGET.md). Drafts are saved on this device, with legacy draft compatibility.

## Architecture

`src/core` contains provider-independent schemas, evidence validation, budget constants and financial arithmetic. `src/server` contains owner-scoped Neon queries, encrypted OAuth credentials, provider operation receipts, the research adapters and Inngest workflow. Client components call APIs; no database or provider secrets are public.

Research proceeds through discovery → verification → composition → CFO modeling → saved report. Background OpenAI response IDs survive application restarts. Inngest polls durably rather than tying research to an open browser request. An uncertain provider creation stops for reconciliation, never blindly creates another request. Failed core research remains recoverable. CFO failures produce an explicit unavailable financial section and keep the research report.

Each user receives five full reports and five refinements during the hackathon, with one queued or running report at a time. A conditional PostgreSQL budget-row update, serialized quota trigger and active-run constraint gate allocations atomically. Crustdata reserves 5 credits by default for each full report or refinement. Set `CRUSTDATA_FULL_REPORT_CREDITS` and `CRUSTDATA_REFINEMENT_CREDITS` in `.env.local` to change those per-run allowances (for example, `10` each), then restart the app and workers. These settings affect new runs only; `CRUSTDATA_CREDIT_BUDGET` remains the separate global cap. Existing runs retain their reservations and count toward the account allowance. Reservations remain charged after failure to account conservatively for unknown usage. Actual OpenAI usage is recorded separately; over-reservation usage freezes new allocations. Hosted search and input billing still need live validation and vendor-side limits: the app ledger alone cannot guarantee a provider invoice cap. Set an OpenAI project budget before public access. Public shares store immutable report snapshots behind random hashed tokens; all links can be revoked by the owner.

## Hackathon integrations

- **Neatlogs:** server-side workflow traces grouped by run/session ID at `https://ingest.neatlogs.com`; wrapped OpenAI and sponsor model calls, stage outcomes and errors. The configured key passed the Doctor export/readback/finalization probe. A real research workflow trace remains to be verified.
- **Entire:** CLI and Graph are enabled for this independent repository. Follow `.entire/graph-agent.md` during code exploration. Captured Codex hooks require approval in the Hunchlane project and a fresh session; a Git commit alone is not a session checkpoint. See `docs/HACKATHON.md`.
- **CFO.ai:** the organizer email requires Hunchlane's own business plan (pricing, costs, revenue and runway), included in the submission. Prepare it using `docs/HUNCHLANE_BUSINESS_PLAN.md`. The optional per-user financial adapter has OAuth/PKCE, an encrypted vault and contract inspection; schema-specific model construction and normalization remain pending. Its unavailable state does not substitute for the required business plan. See `docs/CFO_SETUP.md`; do not bypass the verified gate.
- **Crustdata:** Web Search/Fetch research adapter and credit reservations implemented. Live account access, retrieval quality and billed credits still require the configured key.

## Verify

```sh
pnpm check
pnpm test:browser
pnpm build
```

SQL behavior tests execute migrations and store queries in isolated embedded PostgreSQL (PGlite). They are not substitutes for remote Neon concurrency and failure testing. Browser tests cover draft preservation, report sections, citations, local financial assumptions, keyboard tabs, mobile overflow, reduced motion and unauthenticated access. Live provider quality, actual cost, OAuth renewal and Vercel/Inngest recovery checks require configured accounts.

### Search and link previews

Set `NEXT_PUBLIC_APP_URL` to the canonical production HTTPS origin before building on Vercel. Landing and `/sample` have canonical URLs, Open Graph and large Twitter cards; `/opengraph-image` generates a branded 1200×630 PNG. Only those two public pages appear in the sitemap. Account routes and report shares inherit `noindex`; shares remain accessible by link. Vercel Preview deployments disable indexing and produce an empty sitemap. Crawler directives do not replace authentication or share-token access controls.

### Research recovery

Crustdata requests have no fixed application request timeout. The Inngest route allows 300 seconds per invocation; enable Vercel Fluid compute and verify the deployed function duration supports this value. Inngest checkpoints between steps; completed provider receipts are reused on an explicit Resume research action, with the original reservation.

A non-success response with an explicit `X-Credits-Used: 0` receipt is journaled as `failed_uncharged`. Only owner-authorized resume unlocks that operation for another attempt. Missing billing receipts, disconnected requests, host termination, and unexpected billing remain uncertain and require operator reconciliation against the provider's request log. HTTP 500 alone is not proof of zero usage. The earlier aborted request was reconciled from its zero-credit dashboard receipt, retaining a separate archived attempt. Existing uncertain operations are never reclassified automatically.


Apply `pnpm db:migrate` before deploying the recovery changes. This adds a persisted retry event ID and a failure-history column, copying earlier failure receipts into that history. Resume queues the run and unlocks confirmed uncharged operations in one statement. Repeated sends for the same queued attempt use the same Inngest event ID; successful responses never overwrite failure history.

Sponsored research and intake use the installed SDK's default timeout (currently ten minutes) with automatic SDK retries disabled. Both the Inngest and intake routes allow 300 seconds on a supported Vercel runtime. These are longer-lived requests, not unlimited execution; an interrupted paid request still needs reconciliation.

For a Crustdata error without a zero-credit response header, independently verify its request ID, query, time and zero usage in the provider dashboard. Save a private JSON receipt containing `status` (400–599), `credits` (0), `confirmedAt` (ISO timestamp), `requestId`, and `evidence` (a concise description of the matched provider log). Then run:

```sh
pnpm research:reconcile <run-id> <Clerk-owner-id> <crust-search-N|crust-fetch> <receipt.json>
```

The command only reconciles an uncertain Crustdata operation on a failed run owned by that Clerk user. It records the receipt in permanent failure history and permits a later explicit Resume; it does not send a research event. Preserve the receipt outside Git. Missing or nonzero usage must not be represented as zero. Safe response request IDs and error types are recorded when provided; raw error bodies and credentials are not stored.

## Continuous agent flow

The autonomous conversation, durable recovery, and inline report are behind `HUNCHLANE_AUTONOMOUS_FLOW`. See [rollout and operation details](docs/CONTINUOUS_AGENT.md). The flag defaults off; migration 0004 and registered Inngest jobs are required before activation. `/dev/agent-preview` provides an isolated, explicitly illustrative gallery when `HUNCHLANE_UI_PREVIEW=1`.
