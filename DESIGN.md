# Hunchlane — Idea Studio

See what exists. Find your angle.

Hunchlane helps beginners explore software, physical products, and services. The design gives an unpolished idea a clear place to start, keeps evidence within reach, and makes uncertainty understandable. Research is context, not a prediction of success.

## Identity and phase adoption

The approved replacement identity is Idea Studio: bright white, cobalt actions, apricot emphasis, generous Manrope typography, and crisp layouts. Retain the Hunchlane name and branching-lane mark. Manrope is locally hosted in `src/app/fonts/` with its SIL Open Font License; no external font requests or decorative stock assets.

Phase 1 adopts this identity on `/`, its responsive header, and footer. `src/app/studio.css` scopes the new components and token overrides to that surface. Other screens keep their existing paper/teal/system-sans/Georgia styling until their phase. The next phases are login/signup, signed-in home, new idea, sample/shared report presentation, and My ideas library. Present desktop/mobile evidence and collect user feedback after each phase before starting the next.

## Executable foundation

- Canvas `#ffffff`, ink `#192438`, muted ink `#596477`, primary cobalt `#3154d9`, hover `#2542b3`, cobalt surface `#eef2ff`, apricot `#ffd8c3`, neutral surface `#f6f8fc`, divider `#dde2ec`.
- Manrope variable type, locally loaded with `next/font/local`. Landing display 40–68px, section headings 27–34px, body 13–16px. Heading tracking never below -0.04em. Reading passages stay about 65 characters wide.
- 4px spacing increments; 1120px inner content width. Landing hero pairs purpose and idea entry on desktop, then places entry immediately beneath the introduction on mobile. Section separation comes from spacing and dividers rather than a collection of identical cards.
- Interactive targets at least 44px. Cobalt focus outlines, explicit labels, scoped selection/caret colors. Border for inputs, soft elevation for the mobile navigation disclosure. Decorative accents never communicate status alone.
- Feedback 140ms, disclosure 180ms. Small button press feedback and link emphasis only; no entrance loops, simulated research progress, or animation-dependent actions. Reduced motion removes travel and transition delays.

## Behavior and evidence

The landing form uses the existing idea composer and draft format. Valid submission saves locally and opens `/new`; it never starts research. Examples set the matching software/product/service category. Errors preserve input and focus the field. The mobile navigation is a native disclosure with keyboard activation, Escape close/focus restoration, and closing links.

The scheduling preview derives from the deterministic sample report and is explicitly labeled illustrative. Reports separate cited observations, hypotheses, and user-entered assumptions. Citations remain near claims; a receipt is not proof of every interpretation. Public shares expose immutable report snapshots only. Never imply novelty, market demand, financial predictions, or sponsor success without evidence.

Later phases preserve context through authentication and require explicit research submission after review. Libraries distinguish device-local drafts from saved reports. Empty states provide a useful next action; failures preserve work and explain recovery. Paid calls retain reservations and operation records; uncertain charges require reconciliation.
