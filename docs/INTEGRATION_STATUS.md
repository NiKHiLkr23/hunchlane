# Integration verification

This file distinguishes source implementation from live proof. Update only with observed results.

| Capability | Implemented | Live evidence |
|---|---|---|
| Next.js interface and sample | Yes | Production build passed; 8 desktop/mobile browser checks passed; screenshots reviewed |
| Clerk sign-in and owner checks | Yes, provider inside body, async auth, Next.js proxy and explicit Clerk matcher | Sign-in screen rendered and backend key passed read-only SDK check; first-user and two-account verification pending |
| Neon schema, versions, share snapshots, reservations | Yes | Remote migrations applied and budget row read back; embedded PostgreSQL tests passed; remote ownership/concurrency pending |
| Inngest durable stages and response polling | Yes | Local persisted dev runner running; Hunchlane synced with one function. Actual job lifecycle/restart verification pending |
| OpenAI web search and structured report | Yes | API credentials and live citation/cost evaluation pending |
| Sponsored Nova/Claude planning and composition | Yes, fixed endpoint and model allowlist | One bounded, journaled Claude JSON connection check passed with Neatlogs instrumentation; full planning/composition quality pending |
| Neatlogs wrapper and run trace grouping | Yes, startup initialization and correct region | Doctor probe passed: export, authenticated readback, finalization, hierarchy and four spans. Real workflow pending |
| Entire Graph | Enabled and queried | Local graph output observed |
| Entire captured checkpoint | Hooks configured | Fresh approved session, commit and synchronization pending |
| CFO.ai OAuth and gated adapter | OAuth/vault and contract probe implemented | Browser authorization, native model normalization/isolation/renewal pending |
| CFO.ai Hunchlane business plan (required) | Assumptions draft prepared | Actual CFO.ai plan, model/export/link pending |
| Crustdata web research | Search/Fetch, free preflight, credit ledger and request spacing implemented | Documentation verified; key, claimed balance, account entitlement, retrieval and billing pending |

No deployment, domain purchase, social post, paid subscription, public checkpoint or remote repository has been created as part of the local scaffold.
