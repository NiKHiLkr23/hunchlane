# Hunchlane — Teal and Depth

See what exists. Find your angle.

Hunchlane helps beginners explore software, physical products, and services. The design gives an unpolished idea a clear place to start, keeps evidence within reach, and makes uncertainty understandable. Research is context, not a prediction of success.

## Identity and phase adoption

The selected direction uses the user's ChronoTask screenshots for composition and soft depth, with deep teal replacing blue. White surfaces, a pale neutral canvas, faint dots, rounded panels and soft shadows frame a centered headline and compact idea field. The CoreShift recording informs staged entrances and layered movement. Retain the Hunchlane name, branching-lane mark, and locally hosted Manrope with its SIL Open Font License. Original sculpted illustrations use matte white materials, teal details and restrained apricot accents; report text and citations remain HTML.

The user approved the first hero review, and phase 1 now includes the complete landing on `codex/teal-motion-landing`: the centered hero, responsive header, three original dimensional illustrations, a layered scheduling sample, three benefits, and a closing explanation of uncertainty. `src/app/hero.css` scopes the hero; `src/app/landing-details.css` scopes the lower sections; `src/app/studio.css` retains the shared landing header/form foundation. Earlier designs remain on their branches, including `codex/paper-teal-landing` at `34e8384`. Other screens retain their existing presentation. Present the completed desktop/mobile landing and motion recording for feedback before beginning login/signup.

## Executable foundation

- Canvas `#f5f6f4`, white paper, ink `#23332e`, muted ink `#5d6c63`, primary teal `#175d50`, hover `#124c41`, sage `#eaf1eb`, apricot `#ffd8c3`. Use sage behind the sample and experiment, apricot for the hypothesis badge, and faint dots in the hero and closing.
- Manrope variable type, locally loaded with `next/font/local`. Hero display 38–64px, weight 600, line height 1.08, tracking -0.04em. The headline reads “Give your idea / a clearer next step.” with a teal final phrase and no underline. It wraps naturally on narrow screens. Supporting copy stays about 65 characters wide.
- 4px spacing increments; 1120px inner content width. Center the idea form at a maximum 540px. Use a 32px rounded textured hero, an 18px white form, and slightly rotated perimeter cards on desktop. At 900px, remove the miniature cards; on mobile retain a small idea-note illustration and disable decorative scroll travel. The primary action remains in the first viewport.
- Interactive targets at least 44px. Teal focus outlines, explicit labels, scoped selection/caret colors. Border for inputs, soft elevation for the mobile navigation disclosure. Decorative accents never communicate status alone.
- Feedback 140ms. Entrances take 480ms with 90ms stagger, opacity and small transforms. Isolated client components bound hero travel to 42px and showcase illustration travel to 22px, updating only while visible. The report panels enter as three readable sheets, followed by brief benefit and heading entrances. Normal scrolling is retained; no pinning, continuous loops, animation dependency, or simulated research progress. Forms do not move or wait for animation. Reduced motion immediately shows the final composition, including when the preference changes during use. Mobile removes parallax and uses 8px entrances. Server-rendered lower content remains readable without enhancement scripts; focused content immediately becomes fully visible.
- Lower-section headings are centered at 28–44px, weight 550. The white sample report sits over two rotated sheets on a 32px sage stage. Three columns become a simple vertical reading order on mobile. Miniature illustrations remain outside report text and controls. Benefits use three equal desktop cards and compact image/text rows on mobile, stacking at 360px. Keep natural content height and visible HTML links.

## Original illustration assets

The landing uses `public/illustrations/idea-note-v1.png`, `evidence-book-v1.png`, and `experiment-lightbulb-v1.png`, generated with the built-in imagegen tool. All three are transparent 1254×1254 PNGs, served through Next's image optimizer with responsive sizes. Keep the source alpha and dimensional lighting. The exact prompts are retained in `docs/design/ASSETS.md`. Decorative images have empty alt text; readable content is HTML and the branching mark stays SVG.

## Behavior and evidence

The landing form uses the existing idea composer and draft format. Valid submission saves locally and opens `/new`; it never starts research. Examples set the matching software/product/service category. Errors preserve input and focus the field. The mobile navigation is a native disclosure with keyboard activation, Escape close/focus restoration, and closing links.

The scheduling preview derives from the deterministic sample report and is explicitly labeled “Illustrative sample,” with a visible explanation that it is not live research. Product links open the official websites; descriptions and hypotheses do not establish current details or retrieved-page provenance. The sample shows alternatives, a labeled hypothesis, an unanswered question, and a manual experiment. Report-page redesign remains phase 5. Reports separate cited observations, hypotheses, and user-entered assumptions. Citations remain near claims; a receipt is not proof of every interpretation. Public shares expose immutable report snapshots only. Never imply novelty, market demand, financial predictions, or sponsor success without evidence.

Later phases preserve context through authentication and require explicit research submission after review. Libraries distinguish device-local drafts from saved reports. Empty states provide a useful next action; failures preserve work and explain recovery. Paid calls retain reservations and operation records; uncertain charges require reconciliation.
