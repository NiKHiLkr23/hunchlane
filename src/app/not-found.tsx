import Link from "next/link";
export default function NotFound(){return <main id="main" className="not-found-page page-container"><section className="empty-state"><h1>This report isn’t here.</h1><p>The link may have expired, been revoked, or belong to a different account.</p><Link href="/" className="button button-primary">Back to Hunchlane</Link></section></main>;}
