# Hunchlane — Discovery Atlas

See what exists. Find your angle.

Hunchlane helps beginners explore software, physical products, and services. The design gives an unpolished idea a clear place to start, keeps evidence within reach, and makes uncertainty understandable. Research is context, not a prediction of success.

## Identity and phase adoption

Discovery Atlas is the user's requested alternative to Idea Studio, awaiting landing-page feedback. It uses ivory, navy and vermilion, editorial Newsreader headlines, Manrope controls, crisp rules, and connected research stops. Retain the Hunchlane name and branching-lane mark. Both font families are locally hosted in `src/app/fonts/` with their SIL Open Font Licenses; Newsreader comes from the official Google Fonts repository. No external font requests or decorative stock assets. The previous Idea Studio landing remains on branch `codex/idea-studio-landing` at `181ebd6` for comparison.

Phase 1 trials this identity on `/`, its responsive header, and footer. `src/app/atlas.css` scopes the new components and token overrides to that surface. Other screens keep their existing paper/teal/system-sans/Georgia styling until their phase. The next phases are login/signup, signed-in home, new idea, sample/shared report presentation, and My ideas library. Present desktop/mobile evidence and collect user feedback after each phase before starting the next.

## Executable foundation

- Canvas `#f7f5ee`, paper `#fffdf8`, navy ink `#202f45`, muted ink `#5c6570`, primary vermilion `#b83d28`, hover `#97301f`, emphasis surface `#f8e5dc`, divider `#d4d4c9`.
- Newsreader normal/italic variable display type and Manrope variable controls, locally loaded with `next/font/local`. Landing display 50–78px, section headings 32–46px, body 13–16px. Heading tracking never below -0.04em. Reading passages stay about 65 characters wide. Newsreader is loaded by the landing route only.
- 4px spacing increments; 1120px inner content width. Landing hero pairs purpose and idea entry on desktop, then places entry immediately beneath the introduction on mobile. Flat 3px frames and thin rules support the field-guide character. The sample connects alternatives → a possible angle → a small experiment; a navy section explains the actual research sequence. Numbered stops express sequence, not fabricated progress.
- Interactive targets at least 44px. Vermilion focus outlines, explicit labels, scoped selection/caret colors. Border for inputs, soft elevation for the mobile navigation disclosure. Decorative accents never communicate status alone.
- Feedback 140ms, disclosure 180ms. Small button press feedback and link emphasis only; no entrance loops, simulated research progress, or animation-dependent actions. Reduced motion removes travel and transition delays.

## Behavior and evidence

The landing form uses the existing idea composer and draft format. Valid submission saves locally and opens `/new`; it never starts research. Examples set the matching software/product/service category. Errors preserve input and focus the field. The mobile navigation is a native disclosure with keyboard activation, Escape close/focus restoration, and closing links.

The scheduling preview derives from the deterministic sample report and is explicitly labeled illustrative. Reports separate cited observations, hypotheses, and user-entered assumptions. Citations remain near claims; a receipt is not proof of every interpretation. Public shares expose immutable report snapshots only. Never imply novelty, market demand, financial predictions, or sponsor success without evidence.

Later phases preserve context through authentication and require explicit research submission after review. Libraries distinguish device-local drafts from saved reports. Empty states provide a useful next action; failures preserve work and explain recovery. Paid calls retain reservations and operation records; uncertain charges require reconciliation.
