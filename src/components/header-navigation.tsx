"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import { LaneMark } from "./brand";
import { AuthActions } from "./auth-actions";

export function HeaderNavigation({ authConfigured }: { authConfigured: boolean }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const account = authConfigured ? <AuthActions/> : <Link href="/sign-in" className="nav-signin">Sign in <ArrowUpRight size={16}/></Link>;

  if (pathname !== "/") return <header className="site-header"><div className="header-inner"><Link className="brand" href="/" aria-label="Hunchlane home"><LaneMark/><span>hunchlane<span className="brand-dot">.</span></span></Link><nav aria-label="Main navigation"><Link href="/sample">Sample report</Link><Link href="/library">My ideas</Link>{account}</nav></div></header>;

  function closeMenu() { if (menu.current) menu.current.open = false; }

  return <header className="atlas-header">
    <div className="atlas-header-inner">
      <Link className="brand atlas-brand" href="/" aria-label="Hunchlane home"><LaneMark/><span>hunchlane<span className="brand-dot">.</span></span></Link>
      <nav className="atlas-desktop-nav" aria-label="Main navigation"><Link href="#how-it-works">How it works</Link><Link href="/sample">Sample report</Link></nav>
      <div className="atlas-header-actions">
        {account}
        <details className="atlas-mobile-menu" ref={menu} onKeyDown={event => {
          if (event.key === "Escape") { closeMenu(); menu.current?.querySelector("summary")?.focus(); }
        }}>
          <summary aria-label="Navigation menu"><Menu size={20}/></summary>
          <nav aria-label="Mobile navigation"><Link href="#how-it-works" onClick={closeMenu}>How it works</Link><Link href="/sample" onClick={closeMenu}>Sample report</Link><Link href="/library" onClick={closeMenu}>My ideas</Link></nav>
        </details>
      </div>
    </div>
  </header>;
}
