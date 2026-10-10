"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Decorative scroll movement only. Drafts and navigation never depend on it. */
export function HeroMotion({ children }: { children: ReactNode }) {
  const hero = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = hero.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 760px)");
    let frame = 0;
    let visible = true;

    function update() {
      frame = 0;
      if (!element) return;
      if (reduced.matches || narrow.matches) {
        element.style.setProperty("--hero-drift", "0");
        return;
      }
      const bounds = element.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -bounds.top / bounds.height));
      element.style.setProperty("--hero-drift", progress.toFixed(3));
    }

    function schedule() {
      if (!frame && visible) frame = window.requestAnimationFrame(update);
    }

    function preferenceChanged() {
      if (frame) window.cancelAnimationFrame(frame);
      update();
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    observer.observe(element);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", preferenceChanged);
    reduced.addEventListener("change", preferenceChanged);
    narrow.addEventListener("change", preferenceChanged);
    update();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", preferenceChanged);
      reduced.removeEventListener("change", preferenceChanged);
      narrow.removeEventListener("change", preferenceChanged);
    };
  }, []);

  return <section ref={hero} className="studio-hero dimensional-hero" aria-labelledby="studio-title">{children}</section>;
}
