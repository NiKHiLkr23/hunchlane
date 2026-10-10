# Live AI intake pilot — prepared, awaiting approval

No paid intake call has been made. `.env.local` is unchanged. The live endpoint is disabled unless both `AI_INTAKE_ENABLED=1` and `AI_INTAKE_PRICING_CONFIRMED=1` are set by the operator. The prepared SQL has not been applied to Neon.

## Proposed allowance

One conversation, at most three sponsored `claude-sonnet-4.6` calls, 800 output tokens per call, at most 16,000 UTF-8 bytes of complete prompt including instructions/schema per call. No web tools, Crustdata credits, or research run reservations. A separate persisted 30-cent reservation is allocated upfront from `budgets.id='intake'`. It is never released automatically after an uncertain call. The whole pilot consumes at most three provider requests, with SDK retries disabled.

At Anthropic's published $3 input / $15 output per million tokens, an example 4,000 input + 800 output tokens costs $0.024 per call, $0.072 for three. A conservative 16,000 input-token planning scenario costs $0.06 per call, $0.18 for three. Prompt bytes are a size bound, not an exact token count. The 30 cents is an app reservation, **not proof of a provider-enforced dollar cap**. The sponsor proxy's pricing/fees and a provider-side spending cap must be confirmed before activation. Source: https://www.anthropic.com/news/claude-sonnet-4-6 . Actual returned token usage is saved in the intake operation journal; no invented charge is recorded.

## Approval and activation

The operator must approve one 30-cent intake pilot separately from the consumed five-credit research pilot. Confirm the sponsored key's applicable prices and whether it can enforce a 30-cent cap (a shared key may already cover other workflows). If it cannot, resolve the cap before activation. Then apply `docs/INTAKE_SETUP.sql`, fund only the `intake` row to 30 cents using the commented conditional update, and enable the two process flags. Do not reset allocations or change `.env.local` automatically.

Each session belongs to a Clerk owner. A turn is atomically claimed and journaled before sending. Concurrent requests, changed reuse of an ID/turn, unknown responses and unfinished operations stop. GET can recover an already-completed reply without resending. No automatic requests occur on reload or login. Research still requires its separate explicit Start research action and existing reservation journal.

The provider receives the idea and accepted conversation text. AI suggestions are unverified possibilities; no search claims or citations are generated during intake. User answers are included in the eventual research brief; unaccepted AI suggestions are excluded. The separate development gallery uses labeled fixtures, never credentials, and returns 404 in production.

Preview conversations use an isolated local-storage namespace through the same draft helpers, so fixture replies never overwrite a real draft or appear in the live intake.
