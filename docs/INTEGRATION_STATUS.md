# Integration verification

This file distinguishes source implementation from live proof. Update only with observed results.

| Capability | Implemented | Live evidence |
|---|---|---|
| Next.js interface and sample | Yes | October 10: `pnpm check` passed (32 tests), all 8 desktop/mobile browser checks passed, production build passed after background-owner fix |
| Clerk sign-in and owner checks | Yes, provider inside body, async auth, Next.js proxy and explicit Clerk matcher | Sign-in screen rendered and backend key passed read-only SDK check; first-user and two-account verification pending |
| Neon schema, versions, share snapshots, reservations | Yes | Remote migrations applied and budget row read back; embedded PostgreSQL tests passed; remote ownership/concurrency pending |
| Inngest durable stages and response polling | Yes | Local persisted dev runner running; Hunchlane synced with one function. Actual job lifecycle/restart verification pending |
| OpenAI web search and structured report | Yes | API credentials and live citation/cost evaluation pending |
| Sponsored Nova/Claude planning and composition | Yes, fixed endpoint and model allowlist | One bounded, journaled Claude JSON connection check passed with Neatlogs instrumentation; full planning/composition quality pending |
| Neatlogs wrapper and run trace grouping | Yes, startup initialization and correct region | Doctor probe passed: export, authenticated readback, finalization, hierarchy and four spans. Real workflow pending |
| Entire Graph | Enabled and queried | Local graph output observed |
| Entire Runners and Trails | Six tailored Runner configs committed on the default branch | GitHub-linked CLI login and enabled toggles verified; Trail 1 created. Review completed on `a9a29d4` with zero findings. Five other Runner completions remain unverified due to a result-API region error; see ENTIRE_WORKFLOW.md |
| Entire captured checkpoint | Approved hooks active in this Hunchlane chat | Checkpoint `01M4JWWNZ0D5V0E5KMETZY804F` links commit `149e48aa1dfc9927c53758c4f72153853aa298ac` to session `01a125c7-e20d-7a31-8b7c-12219e382c59`; exact checkpoint ref verified on GitHub. Entire web import/reviewer access still pending |
| CFO.ai OAuth and gated adapter | OAuth/vault and contract probe implemented | Browser authorization, native model normalization/isolation/renewal pending |
| CFO.ai Hunchlane business plan (required) | Actual model created in CFO.ai from the prepared inputs | Saved Page, monthly/annual tables, six scenarios and XLSX attachment observed. Five scenarios' summary values match independent arithmetic; No sales correctly reaches negative cash in month 5. Direct doubled-cost verification and local export inspection pending; see HUNCHLANE_BUSINESS_PLAN.md for real links |
| Crustdata web research | Search/Fetch, free preflight, credit ledger and request spacing implemented | October 10 free preflight passed: 5,200 credits, both endpoints enabled at one credit, rate-limit contract passed. User approved one five-credit pilot; persisted allowance verified. Paid retrieval, citations and billing still pending |

## Verified Git and capture evidence — October 10, 2026

- Public GitHub repository: https://github.com/NiKHiLkr23/hunchlane, branch `codex/hunchlane`. Initial commit `fb845078d2e29d476944505233e15e413a7093d6`; authenticated SSH push and remote commit readback passed.
- Generated screenshots, `next-env.d.ts`, build output, local queues, logs and credentials are ignored. Migration SQL/metadata and the package lockfile are retained because they reproduce the app. The initial files and captured transcript were checked against configured credentials with no matches.
- Entire initially reported seven unapproved hooks and no state for this chat. After the user's approval, `entire session current --json` resolved this exact session via `caller-env`, in `/Users/nikhil/Developer/hunchlane`. A fresh chat was no longer needed. The earlier Barbell chat is not claimed as captured work.
- Genuine captured improvement: background research and refinement-parent reads now use the event's Clerk owner. Missing event owners stop before provider operations. Embedded PostgreSQL regression checks reject cross-owner reads.
- `entire checkpoint explain HEAD --json` verified the checkpoint/session/changed-file relationship; `git push origin codex/hunchlane` synchronized its checkpoint ref. Remote ref: `refs/entire/checkpoints/4F/01M4JWWNZ0D5V0E5KMETZY804F`, object `d53c393533d4672b50311bb28d81d66dbb50aa0b`.
- Candidate Entire web URL: https://entire.io/gh/NiKHiLkr23/hunchlane/commit/149e48aa1dfc9927c53758c4f72153853aa298ac. This URL is not yet evidence of judge access; repository import and viewing still need verification.
- The user plans to use a new Entire account associated with their GitHub email. Checkpoints are already stored in the repository's Git refs; the new account must connect/import the same repository and verify indexing. An account merge or transfer of hosted settings has not been verified. Keep the old account until the new account displays the checkpoint.

## Live pilot preparation

No app or Inngest listener was present on ports 3100/8288 at the initial process check. After verification, both were started once, with persisted Inngest state. The app runs with process-only `CRUSTDATA_CREDIT_BUDGET=5 RESEARCH_PROVIDER=crustdata`; `.env.local` is preserved. Neon budget readback: 1,500-cent limit, 75 cents previously allocated, five-credit limit, zero credits allocated before the pilot. Reservations are not vendor invoice caps.

No deployment, domain purchase or social post was performed. CFO.ai login/setup was completed by the user; no billing action was performed by this agent.

Workflow tracing now emits only run ID, phase and trace ID for authenticated Neatlogs correlation. This is preparation, not proof of a live workflow. After this change, `pnpm check` passed 32 tests, `pnpm test:browser` passed all 8 checks and `pnpm build` passed. The local app and persisted Inngest runner are available on 3100/8288; the real report awaits the user's Clerk sign-in. No paid Crustdata pilot request has been sent.
