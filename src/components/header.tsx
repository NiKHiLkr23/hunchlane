import Link from "next/link";
import { LaneMark } from "./brand";
import { AuthActions } from "./auth-actions";
export function Header() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  return <header className="site-header"><div className="header-inner"><Link className="brand" href="/" aria-label="Hunchlane home"><LaneMark/><span>hunchlane<span className="brand-dot">.</span></span></Link><nav aria-label="Main navigation"><Link href="/sample">Sample report</Link><Link href="/library">My ideas</Link>{configured ? <AuthActions/> : <Link href="/sign-in" className="nav-signin">Sign in <span aria-hidden="true">↗</span></Link>}</nav></div></header>;
}
