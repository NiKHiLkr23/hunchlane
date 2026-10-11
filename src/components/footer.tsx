import Link from "next/link";
import { LaneMark } from "./brand";

const columns = [
  [
    ["How it works", "/#how-it-works"],
    ["Sample report", "/sample"],
  ],
  [
    ["X (formerly Twitter)", "https://x.com/nikhilkr_tw"],
    ["Contact Us", "mailto:hi@nikhilkr.in"],
  ],
] as const;

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#f3f4f0] font-[family-name:var(--font-studio),sans-serif] text-[#23332e] bg-[radial-gradient(circle,#c5cdc4_0.7px,transparent_0.75px)] [background-size:8px_8px]">
      <div className="relative z-10 mx-auto w-full max-w-[1040px] px-6 pb-20 pt-10 sm:px-10 sm:pb-40 sm:pt-16 lg:pb-52 lg:pt-20">
        <div className="grid items-start gap-7 sm:gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <div>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2.5"
              aria-label="Hunchlane home"
            >
              <LaneMark className="text-[var(--teal)]" />
              <span className="text-[22px] font-extrabold tracking-[-0.04em]">
                hunchlane<span className="text-[#89a18d]">.</span>
              </span>
            </Link>
            <p className="mb-0! mt-4! max-w-[18ch] text-[28px] font-semibold leading-[1.12] tracking-[-0.045em] sm:mt-8! sm:max-w-[14ch] sm:text-[clamp(32px,4vw,44px)] sm:leading-[1.08]">
              Give your idea a clearer next step.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:gap-x-14">
            {columns.map((links) => (
              <ul key={links[0][0]} className="m-0 list-none p-0!">
                {links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-flex min-h-11 items-center gap-2 text-sm text-[#5d6c63] transition-colors hover:text-[#175d50]"
                    >
                      <span className="shrink-0" aria-hidden="true">→</span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
        <div className="mt-8 border-t border-[#23332e14] pt-5 text-xs leading-relaxed text-[#5d6c63] sm:mt-14">
          <p className="m-0!">© 2026 Hunchlane. All rights reserved.</p>
          <p className="mb-0! mt-2!">Built for Neathacks.</p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[-0.1em] z-0 select-none whitespace-nowrap text-center text-[19vw] font-semibold leading-[0.72] tracking-[-0.075em] text-zinc-950/[0.035] sm:text-[clamp(8rem,20vw,19rem)]"
      >
        hunchlane
      </div>
    </footer>
  );
}
