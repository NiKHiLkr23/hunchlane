# Integration verification

This file distinguishes source implementation from live proof. Update only with observed results.

| Capability | Implemented | Live evidence |
|---|---|---|
| Next.js interface and sample | Yes | October 10: `pnpm check` passed (33 tests), all 12 desktop/mobile browser checks passed, production build passed after restoring paper-and-teal with Idea Studio typography |
| Clerk sign-in and owner checks | Yes, provider inside body, async auth, Next.js proxy and explicit Clerk matcher | User signed in and created a complete live report on October 10; report/operations independently read with the Clerk owner predicate. Two-account browser verification pending |
| Neon schema, versions, share snapshots, reservations | Yes | Remote migrations applied and budget row read back; embedded PostgreSQL tests passed; remote ownership/concurrency pending |
| Inngest durable stages and response polling | Yes | Local workflow reached a saved complete report through six journaled provider operations. Restart/recovery verification pending |
| OpenAI web search and structured report | Yes | API credentials and live citation/cost evaluation pending |
| Sponsored Nova/Claude planning and composition | Yes, fixed endpoint and model allowlist | Live planning, page selection and composition completed with Claude Sonnet 4.6; authenticated Neatlogs readback recorded 16,481 tokens. Semantic quality caveats and preventive fix below |
| Neatlogs wrapper and run trace grouping | Yes, startup initialization and correct region | Real workflow readback: six successful traces, nine spans, three Claude child spans, correct shared session ID and parent edges; no trace errors. Model pricing is unpriced, so zero displayed cost is not a verified invoice |
| Entire Graph | Enabled and queried | Local graph output observed |
| Entire Runners and Trails | Six tailored Runner configs committed on the default branch | GitHub-linked CLI login and enabled toggles verified; Trail 1 created. Review completed on `a9a29d4` with zero findings. Five other Runner completions remain unverified due to a result-API region error; see ENTIRE_WORKFLOW.md |
| Entire captured checkpoint | Approved hooks active in this Hunchlane chat | Checkpoint `01M4JWWNZ0D5V0E5KMETZY804F` links commit `149e48aa1dfc9927c53758c4f72153853aa298ac` to session `01a125c7-e20d-7a31-8b7c-12219e382c59`; exact checkpoint ref verified on GitHub. Entire web import/reviewer access still pending |
| CFO.ai OAuth and gated adapter | OAuth/vault and contract probe implemented | Browser authorization, native model normalization/isolation/renewal pending |
| CFO.ai Hunchlane business plan (required) | Actual model created in CFO.ai from the prepared inputs | Saved Page, monthly/annual tables, six scenarios and XLSX attachment observed. Five scenarios' summary values match independent arithmetic; No sales correctly reaches negative cash in month 5. Direct doubled-cost verification and local export inspection pending; see HUNCHLANE_BUSINESS_PLAN.md for real links |
| Crustdata web research | Search/Fetch, free preflight, credit ledger and request spacing implemented | User-created live report completed: two searches plus three fetched pages, five journaled credits. Free account balance decreased from 5,200 to 5,195. All 16 source URLs/excerpts matched existing provider receipts; semantic claim limitations below |

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

Workflow tracing emits only run ID, phase and trace ID for authenticated Neatlogs correlation. The initial correlation change passed 32 unit tests, 8 browser checks and the production build.

## First live research verification — October 10, 2026

The user supplied a completed report ID after testing the signed-in app. Read-only verification used the actual Clerk owner in all run/provider-operation queries. Private report content and raw trace responses remain in ignored local `artifacts/verification/`; they were not published or committed.

- Saved status/stage: complete; provider: Crustdata; version: 1; 16 sources and 5 alternatives. The report's source URLs and excerpts match the search/page operation receipts exactly, and citation-ID/competitor-host validation passes.
- Six operation records are complete: planning, two searches, page selection, fetch and composition. No uncertain/creating record remains. The full-run reservation is 75 cents and five credits; journaled usage is five credits. Sponsor usage has zero personal OpenAI ledger cost, which is not a statement that model usage is free.
- Free Crustdata account readback: 5,195 credits, exactly five below the pre-pilot read. No additional paid calls were made during verification. The pilot allowance is consumed; further research requires a separately authorized allowance.
- Authenticated existing-trace readback verified six successes with nine unique spans and three Claude Sonnet 4.6 child calls. All share the report ID as session ID, parent edges point to the correct workflow span and error counts are zero. Tokens: 273 planning, 2,114 selection and 14,094 composition. Neatlogs reports model pricing as `unpriced`; no vendor dollar total is verified. Trace success satisfies the installed Doctor reader's completion convention; the response does not provide a separate finalizationStatus field.
- Quality issue: one listing-based pricing statement claimed page verification using only a search preview. The report also mixes competitor observations with market-saturation/user-churn interpretations. Three competitors' official pages were fetched; other sources remain previews. Receipt-valid citations do not prove every claim is semantically supported.
- Preventive fix: future Crustdata sources retain `search_preview` or `page_text` provenance. Validation rejects explicit page-verification wording supported solely by previews, and composition instructions make preview coverage and unsupported interpretations explicit. Offline replay of the stored pilot detects the offending claim without spending again. The original report and receipts are preserved; no regenerated report is claimed.
- The report's optional CFO.ai section correctly remains unavailable. Hunchlane's separate saved CFO.ai business plan is the required sponsor evidence.

Validation of the preventive fix: `pnpm check` passed 33 tests, `pnpm test:browser` passed all eight desktop/mobile cases, and `pnpm build` passed.

## Idea Studio phase 1 — landing page

The approved replacement identity is implemented on the landing page: locally hosted Manrope, white/cobalt/apricot tokens, first-viewport idea entry, three category-aware example prompts, responsive keyboard-operable navigation, and a preview derived from the explicitly illustrative scheduling sample. Other screens retain their previous presentation until their scheduled phase.

`pnpm check` passed 33 tests, `pnpm test:browser` passed 12 desktop/mobile cases, and `pnpm build` passed. Browser checks verify input-error recovery, all three example categories, draft transfer to `/new`, first-viewport entry, mobile menu activation/Escape/close-on-navigation, closing-link focus, reduced motion and long-input overflow. The landing navigation test observed no research POSTs. Desktop/mobile screenshots are local ignored artifacts. `.env.local` remained unchanged; no paid research calls or deployment were performed. User feedback on this phase is required before beginning the login screen, as requested.

## Discovery Atlas phase 1 — alternate landing trial

At the user's request, the landing page now trials Discovery Atlas: ivory/navy/vermilion, locally hosted Newsreader normal/italic headlines with retained licenses, Manrope controls, flat frames, connected sample findings, and a navy explanation of the research sequence. The prior Idea Studio implementation remains on `codex/idea-studio-landing` at `181ebd6`; the alternate is on `codex/discovery-atlas-landing`. Other screens retain their existing design.

Final verification: `pnpm check` passed 33 tests, all 12 desktop/mobile browser checks passed, and `pnpm build` passed. Deterministic screenshots were inspected at 1280×720 and 390×844, plus a 320px focused long-input state, invalid input, and the open mobile menu. Tests cover repeated valid submissions, all three example categories, draft continuity, first-viewport entry, keyboard navigation and reduced motion. Repeated landing submits produced no research POSTs. Measured primary, button, muted-text and hypothesis foreground/background contrast ratios exceed 4.5:1. Browser-device emulation is verified; a physical-device test is not claimed.

Desktop/mobile previews are ignored local artifacts at `artifacts/atlas-*.png`. `.env.local` was hash-checked unchanged. No paid research calls, database changes or deployment occurred. Landing feedback is still required before proceeding to login/signup.

## Paper-and-teal phase 1 — selected visual direction

The user requested the original paper-and-teal look with Idea Studio's font and hero treatment. The landing now uses locally hosted Manrope, warm paper surfaces, teal actions, sage sample surfaces, and the three-line “Give your idea / a clearer / next step.” headline with a teal final phrase and apricot underline. `DESIGN.md` records this direction. The Atlas alternative is preserved on its branch; its stylesheet and unused Newsreader assets are removed from the current version. Existing research behavior and later screens are unchanged.

`pnpm check` passed 33 tests, all 12 desktop/mobile browser checks passed, and `pnpm build` passed. Desktop (1280×720), mobile (390×844), full-page layouts, a 320px focused long-input state, validation errors and open mobile navigation were inspected using deterministic fixtures. Checks retain draft continuity, all example categories, repeated-submit behavior, keyboard navigation, first-viewport entry and reduced motion. The landing produced no research POSTs. Foreground/background contrast for checked text pairs exceeds 4.5:1, including teal over the apricot underline. Physical-device testing is not claimed.

Previews are ignored local artifacts at `artifacts/paper-teal-*.png`. `.env.local` was hash-checked unchanged. No paid calls, database changes, deployment or social posting occurred. This remains the landing phase; collect feedback before login/signup.

## Teal and Depth — first hero review

The user selected teal, a compact centered idea field, and expressive motion limited to the hero and report showcase. The first review stage implements a white textured hero, the existing Hunchlane mark and Manrope, miniature illustrative cards, and one original transparent idea-note illustration generated with the built-in imagegen tool. Its exact prompt is saved in `docs/design/ASSETS.md`. CSS provides 480ms entrances with 90ms stagger; an isolated client component bounds desktop scroll movement and immediately removes it for reduced motion or mobile. The form's validation, examples, draft storage and `/new` navigation are preserved.

Final validation: `pnpm check` passed TypeScript and 33 tests; `pnpm test:browser` passed all 14 desktop/mobile checks; `pnpm build` passed. Checks cover all three categories, validation recovery, repeated submits, draft continuity, keyboard navigation, visible focus, 320px long-input overflow, and changing reduced-motion preferences while editing. No landing research POST was observed. Desktop 1280×900 and mobile 390×844 review captures and a decoded 6.88-second MP4 motion recording are saved in ignored `artifacts/teal-hero-*` files. Browser emulation is verified; physical-device performance is not claimed.

`.env.local` was hash-checked unchanged and changed files were scanned against configured credentials with zero matches. No paid research, migration, deployment or social posting occurred. Hero feedback is the next step before generating the evidence-book/lightbulb assets and expanding the lower sections. The existing lower-section layout remains in place for this review.

## Teal and Depth — completed landing phase

After the user approved the hero direction, the landing was completed with original transparent evidence-book and experiment-lightbulb assets, a layered scheduling report showcase, three illustrated benefits, and a textured closing section. All three illustration sources and exact built-in imagegen prompts are retained in the repository. Report text, official-site links, the illustrative disclaimer, hypotheses, and open questions remain HTML derived from the deterministic sample. No retrieved-page provenance or live integration success is claimed by this sample.

An isolated client component adds bounded desktop sheet/illustration movement and brief 480ms reveals with 90ms stagger. Normal page scrolling is retained. Mobile removes parallax and stacks the sample; reduced motion responds while the page is open and shows the complete static composition. Lower content remains readable without enhancement scripts. The existing composer, validation, category examples, local draft format, and navigation to `/new` are preserved. Landing submission does not begin research.

Validation: `pnpm check` passed TypeScript and 33 unit tests; `pnpm test:browser` passed all 18 desktop/mobile cases; `pnpm build` passed. Checks include all three examples, repeated submits, validation recovery, draft continuity, first-viewport entry, keyboard navigation, visible source-link focus, live reduced-motion changes, a script-disabled sample, and 320px overflow. Final deterministic captures were inspected at 1280×900, 390×844, and 320×800. Mobile illustrations were reduced after inspection to avoid extending into text. An 11.16-second recording captures actual scrolling through the hero, sample, benefits and closing; its MP4 export is decoded for preview verification. Captures and recordings remain in ignored `artifacts/teal-landing-*` files. Browser emulation is verified; physical-device performance is not claimed.

No research POST was observed in the landing checks or recording. `.env.local` was hash-checked unchanged; changed files were scanned against configured credentials with zero matches. No paid research calls, migrations, provider/API/authentication changes, deployment or social posting occurred. This completes the landing implementation only; collect feedback before starting login/signup. The earlier automatic approval-review usage-limit interruption was resolved on continuation, without bypassing review.
