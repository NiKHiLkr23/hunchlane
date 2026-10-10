import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
export default function SignUpPage() { return <main id="main" className="auth-page">{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY ? <SignUp/> : <section className="empty-state"><h1>Accounts are being connected.</h1><Link href="/sample">Explore a sample report</Link></section>}</main>; }
