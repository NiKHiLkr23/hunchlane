"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Menu } from "lucide-react";
import { LaneMark } from "./brand";
import { AuthActions, MyIdeasLink } from "./auth-actions";

export function HeaderNavigation({ authConfigured }: { authConfigured: boolean }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const landing = pathname === "/";
  const authentication = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname === "/sso-callback";
  const chat = pathname === "/new" || pathname.startsWith("/research/") || pathname === "/dev/agent-preview" || pathname === "/dev/research-preview";

  function closeMenu() { if (menu.current) menu.current.open = false; }

  const links = <>
    {landing ? <Link href="/#how-it-works" onClick={closeMenu}>How it works</Link> : <Link href="/home" aria-current={pathname === "/home" ? "page" : undefined} onClick={closeMenu}>Home</Link>}
    {authConfigured && <MyIdeasLink onClick={closeMenu}/>}
    <Link href="/sample" aria-current={pathname === "/sample" ? "page" : undefined} onClick={closeMenu}>Sample report</Link>
  </>;

  return <header className={`app-header${chat ? " app-header-chat" : ""}`}>
    <div className="app-header-inner">
      <Link className="brand" href="/" aria-label="Hunchlane home"><LaneMark/><span>hunchlane<span className="brand-dot">.</span></span></Link>
      {authentication ? <nav className="app-auth-nav" aria-label="Main navigation"><Link href="/sample">Take a look around</Link></nav> : <>
        <nav className="app-desktop-nav" aria-label="Main navigation">{links}</nav>
        <div className="app-header-actions">
          <div className="app-account">{authConfigured ? <AuthActions largeTarget/> : <Link href="/sign-in" className="nav-signin">Sign in</Link>}</div>
          <details className="app-mobile-menu" ref={menu} key={pathname} onKeyDown={event => {
            if (event.key === "Escape") { closeMenu(); menu.current?.querySelector("summary")?.focus(); }
          }}>
            <summary aria-label="Navigation menu"><Menu size={20}/></summary>
            <nav aria-label="Mobile navigation">{links}</nav>
          </details>
        </div>
      </>}
    </div>
  </header>;
}
