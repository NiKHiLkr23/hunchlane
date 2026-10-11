/** Event partners from the public neatHack page. Not customers, and not proof the product works. */
const partners = [
  { id: "neatlogs", name: "neatlogs", href: "https://neatlogs.com" },
  { id: "entire", name: "Entire", href: "https://entire.io" },
  { id: "cfo", name: "cfo.ai", href: "https://cfo.ai" },
  { id: "crustdata", name: "Crustdata", href: "https://crustdata.com" },
  { id: "aws", name: "AWS", href: "https://aws.amazon.com" },
  { id: "litellm", name: "LiteLLM", href: "https://litellm.ai" },
  { id: "orchestrator", name: "Orchestrator", href: "https://orchestrator.inc" },
] as const;

function PartnerGroup({ hidden = false }: { hidden?: boolean }) {
  const marks = [...partners, ...partners];
  return <ul className="sponsor-group" aria-hidden={hidden || undefined}>{marks.map((partner, index) => {
    const decorative = hidden || index >= partners.length;
    return <li key={`${partner.id}-${index}`}><a className="sponsor-mark" data-mark={partner.id} href={partner.href} target="_blank" rel="noreferrer" tabIndex={decorative ? -1 : undefined} aria-hidden={decorative ? true : undefined}>{partner.name}{decorative ? null : <span className="sr-only"> — official website, opens a new tab</span>}</a></li>;
  })}</ul>;
}

export function SponsorCarousel() {
  return <section className="sponsor-carousel" aria-labelledby="sponsor-title">
    <p id="sponsor-title" className="sponsor-kicker">Neathacks partners</p>
    <div className="sponsor-viewport">
      <div className="sponsor-track">
        <PartnerGroup/>
        <PartnerGroup hidden/>
      </div>
    </div>
  </section>;
}
