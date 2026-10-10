# Hunchlane — Paper and Teal

See what exists. Find your angle.

Hunchlane helps beginners explore software, physical products, and services. The design gives an unpolished idea a clear place to start, keeps evidence within reach, and makes uncertainty understandable. Research is context, not a prediction of success.

## Identity and phase adoption

The selected direction returns to Hunchlane's original paper-and-teal palette with Idea Studio's Manrope typography and hero treatment. Warm paper surfaces, deep teal actions, sage accents, and a restrained apricot underline give the idea a clear place to start. The hero reads “Give your idea / a clearer / next step.” on three lines; the final phrase is teal with a warm underline, matching the user's reference treatment. Retain the Hunchlane name and branching-lane mark. Manrope is locally hosted in `src/app/fonts/` with its SIL Open Font License. No external font requests or decorative stock assets. Earlier alternatives remain on `codex/idea-studio-landing` at `181ebd6` and `codex/discovery-atlas-landing` at `221cc9c`.

Phase 1 adopts this identity on `/`, its responsive header, and footer. `src/app/studio.css` scopes the updated components and token overrides to that surface. Other screens keep their existing paper/teal/system-sans/Georgia styling until their phase. The next phases are login/signup, signed-in home, new idea, sample/shared report presentation, and My ideas library. Present desktop/mobile evidence and collect user feedback after each phase before starting the next.

## Executable foundation

- Canvas `#f8f8f3`, paper `#fffefa`, ink `#23332e`, muted ink `#5d6c63`, primary teal `#175d50`, hover `#124c41`, sage surface `#eaf1eb`, apricot `#ffd8c3`, divider `#dce1d7`. The limitations section uses the existing warm surface `#fbf0df`.
- Manrope variable type, locally loaded with `next/font/local`. Landing display 40–68px, section headings 27–34px, body 13–16px. Heading tracking never below -0.04em. Reading passages stay about 65 characters wide. The headline is upright sans-serif, with a short apricot band beneath the teal final phrase.
- 4px spacing increments; 1120px inner content width. Landing hero pairs purpose and idea entry on desktop, then places entry immediately beneath the introduction on mobile. Soft 9px paper frames and sage report surfaces return to the original palette. Section separation uses spacing and dividers; the numbered explanation describes the actual research sequence.
- Interactive targets at least 44px. Teal focus outlines, explicit labels, scoped selection/caret colors. Border for inputs, soft elevation for the mobile navigation disclosure. Decorative accents never communicate status alone.
- Feedback 140ms, disclosure 180ms. Small button press feedback and link emphasis only; no entrance loops, simulated research progress, or animation-dependent actions. Reduced motion removes travel and transition delays.

## Behavior and evidence

The landing form uses the existing idea composer and draft format. Valid submission saves locally and opens `/new`; it never starts research. Examples set the matching software/product/service category. Errors preserve input and focus the field. The mobile navigation is a native disclosure with keyboard activation, Escape close/focus restoration, and closing links.

The scheduling preview derives from the deterministic sample report and is explicitly labeled illustrative. Reports separate cited observations, hypotheses, and user-entered assumptions. Citations remain near claims; a receipt is not proof of every interpretation. Public shares expose immutable report snapshots only. Never imply novelty, market demand, financial predictions, or sponsor success without evidence.

Later phases preserve context through authentication and require explicit research submission after review. Libraries distinguish device-local drafts from saved reports. Empty states provide a useful next action; failures preserve work and explain recovery. Paid calls retain reservations and operation records; uncertain charges require reconciliation.
