# Hunchlane — Teal and Depth

See what exists. Find your angle.

Hunchlane helps beginners explore software, physical products, and services. The design gives an unpolished idea a clear place to start, keeps evidence within reach, and makes uncertainty understandable. Research is context, not a prediction of success.

## Identity and phase adoption

The selected direction uses the user's ChronoTask screenshots for composition and soft depth, with deep teal replacing blue. White surfaces, a pale neutral canvas, faint dots, rounded panels and soft shadows frame a centered headline and compact idea field. The CoreShift recording informs staged entrances and layered movement. Retain the Hunchlane name, branching-lane mark, and locally hosted Manrope with its SIL Open Font License. Original sculpted illustrations use matte white materials, teal details and restrained apricot accents; report text and citations remain HTML.

Phase 1 is being reviewed in two steps. The first step implements the centered hero, responsive header treatment, one dimensional idea-note illustration, and decorative motion on `codex/teal-motion-landing`. The existing lower sections remain in place for this review. After feedback, complete the evidence-book and experiment-lightbulb illustrations and the unfolding illustrative report showcase. `src/app/hero.css` scopes the first step; `src/app/studio.css` retains the lower section presentation. Earlier designs remain on their branches, including `codex/paper-teal-landing` at `34e8384`. Other screens retain their existing presentation. Present desktop/mobile evidence before expanding the landing and again before beginning login/signup.

## Executable foundation

- Hero canvas `#f5f6f4`, white paper, ink `#23332e`, muted ink `#5d6c63`, primary teal `#175d50`, hover `#124c41`, sage `#eaf1eb`, apricot `#ffd8c3`. Lower sections retain their previous palette during the first review step.
- Manrope variable type, locally loaded with `next/font/local`. Hero display 38–64px, weight 600, line height 1.08, tracking -0.04em. The headline reads “Give your idea / a clearer next step.” with a teal final phrase and no underline. It wraps naturally on narrow screens. Supporting copy stays about 65 characters wide.
- 4px spacing increments; 1120px inner content width. Center the idea form at a maximum 540px. Use a 32px rounded textured hero, an 18px white form, and slightly rotated perimeter cards on desktop. At 900px, remove the miniature cards; on mobile retain a small idea-note illustration and disable decorative scroll travel. The primary action remains in the first viewport.
- Interactive targets at least 44px. Teal focus outlines, explicit labels, scoped selection/caret colors. Border for inputs, soft elevation for the mobile navigation disclosure. Decorative accents never communicate status alone.
- Feedback 140ms. Decorative hero entrances take 480ms with 90ms stagger, opacity and small transforms. A small isolated client component bounds scroll travel to 42px and updates only while the hero is visible. Forms do not move or wait for animation. No continuous loops or simulated research progress. Reduced motion immediately removes entrance animation and scroll travel, including when the preference changes during use. Mobile uses the static layered composition with smaller entrances.

## Original illustration assets

The first review uses `public/illustrations/idea-note-v1.png`, generated with the built-in imagegen tool. It is a transparent 1254×1254 PNG, served through Next's image optimizer with responsive sizes. Keep the source alpha and dimensional lighting. The exact prompt is retained in `docs/design/ASSETS.md`. The evidence book and experiment lightbulb remain pending hero feedback; no placeholder images imply they are complete.

## Behavior and evidence

The landing form uses the existing idea composer and draft format. Valid submission saves locally and opens `/new`; it never starts research. Examples set the matching software/product/service category. Errors preserve input and focus the field. The mobile navigation is a native disclosure with keyboard activation, Escape close/focus restoration, and closing links.

The scheduling preview derives from the deterministic sample report and is explicitly labeled illustrative. Reports separate cited observations, hypotheses, and user-entered assumptions. Citations remain near claims; a receipt is not proof of every interpretation. Public shares expose immutable report snapshots only. Never imply novelty, market demand, financial predictions, or sponsor success without evidence.

Later phases preserve context through authentication and require explicit research submission after review. Libraries distinguish device-local drafts from saved reports. Empty states provide a useful next action; failures preserve work and explain recovery. Paid calls retain reservations and operation records; uncertain charges require reconciliation.
