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
  const account = authConfigured ? <AuthActions largeTarget={pathname === "/home"}/> : <Link href="/sign-in" className="nav-signin">Sign in <ArrowUpRight size={16}/></Link>;

  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname === "/sso-callback") return <header className="auth-header"><div className="auth-header-inner"><Link className="brand" href="/" aria-label="Hunchlane home"><LaneMark/><span>hunchlane<span className="brand-dot">.</span></span></Link><nav aria-label="Main navigation"><Link href="/sample">Take a look around <ArrowUpRight size={15}/></Link></nav></div></header>;

  if (pathname === "/home" || pathname === "/dev/home-preview") return <header className="desk-header"><div className="desk-header-inner"><Link className="brand" href="/home" aria-label="Hunchlane home"><LaneMark/><span>hunchlane<span className="brand-dot">.</span></span></Link><nav className="desk-nav" aria-label="Main navigation"><Link href="/home" aria-current="page">Home</Link><Link href="/library">My ideas</Link><Link href="/sample">Sample report</Link></nav><div className="desk-account">{account}<details className="desk-menu" ref={menu} onKeyDown={event => { if (event.key === "Escape") { closeMenu(); menu.current?.querySelector("summary")?.focus(); } }}><summary aria-label="Navigation menu"><Menu size={20}/></summary><nav aria-label="Mobile navigation"><Link href="/home" onClick={closeMenu}>Home</Link><Link href="/library" onClick={closeMenu}>My ideas</Link><Link href="/sample" onClick={closeMenu}>Sample report</Link></nav></details></div></div></header>;

  if (pathname !== "/") return <header className="site-header"><div className="header-inner"><Link className="brand" href="/" aria-label="Hunchlane home"><LaneMark/><span>hunchlane<span className="brand-dot">.</span></span></Link><nav aria-label="Main navigation"><Link href="/sample">Sample report</Link><Link href="/library">My ideas</Link>{account}</nav></div></header>;

  function closeMenu() { if (menu.current) menu.current.open = false; }

  return <header className="studio-header">
    <div className="studio-header-inner">
      <Link className="brand studio-brand" href="/" aria-label="Hunchlane home"><LaneMark/><span>hunchlane<span className="brand-dot">.</span></span></Link>
      <nav className="studio-desktop-nav" aria-label="Main navigation"><Link href="#how-it-works">How it works</Link><Link href="/sample">Sample report</Link></nav>
      <div className="studio-header-actions">
        {account}
        <details className="studio-mobile-menu" ref={menu} onKeyDown={event => {
          if (event.key === "Escape") { closeMenu(); menu.current?.querySelector("summary")?.focus(); }
        }}>
          <summary aria-label="Navigation menu"><Menu size={20}/></summary>
          <nav aria-label="Mobile navigation"><Link href="#how-it-works" onClick={closeMenu}>How it works</Link><Link href="/sample" onClick={closeMenu}>Sample report</Link><Link href="/library" onClick={closeMenu}>My ideas</Link></nav>
        </details>
      </div>
    </div>
  </header>;
}
