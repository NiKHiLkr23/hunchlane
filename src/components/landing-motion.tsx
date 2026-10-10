"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Progressive decoration: content, focus and navigation work without motion. */
export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 760px)");
    const stage = element.querySelector<HTMLElement>("[data-unfold]");
    const reveals = element.querySelectorAll<HTMLElement>("[data-reveal]");
    let frame = 0;
    let stageVisible = false;

    function update() {
      frame = 0;
      if (!stage) return;
      if (reduced.matches || narrow.matches) {
        stage.style.setProperty("--showcase-progress", "1");
        return;
      }
      const top = stage.getBoundingClientRect().top;
      // Unfold within the normal viewport; no pinning or added scroll distance.
      const progress = Math.min(1, Math.max(0, (window.innerHeight * .85 - top) / (window.innerHeight * .65)));
      stage.style.setProperty("--showcase-progress", progress.toFixed(3));
    }

    function schedule() {
      if (!frame && stageVisible && !reduced.matches && !narrow.matches) frame = window.requestAnimationFrame(update);
    }

    function preferenceChanged() {
      if (frame) window.cancelAnimationFrame(frame);
      element?.setAttribute("data-motion", reduced.matches ? "off" : "on");
      if (reduced.matches) reveals.forEach(item => item.setAttribute("data-revealed", ""));
      update();
    }

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-revealed", "");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    reveals.forEach(item => revealObserver.observe(item));
    const stageObserver = new IntersectionObserver(([entry]) => {
      stageVisible = entry.isIntersecting;
      if (stageVisible) schedule();
    });
    if (stage) stageObserver.observe(stage);
    preferenceChanged();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", preferenceChanged);
    reduced.addEventListener("change", preferenceChanged);
    narrow.addEventListener("change", preferenceChanged);

    return () => {
      revealObserver.disconnect();
      stageObserver.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", preferenceChanged);
      reduced.removeEventListener("change", preferenceChanged);
      narrow.removeEventListener("change", preferenceChanged);
      element.removeAttribute("data-motion");
      stage?.style.removeProperty("--showcase-progress");
    };
  }, []);

  return <div ref={root} className="landing-details">{children}</div>;
}
