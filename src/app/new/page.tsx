import { auth } from "@clerk/nextjs/server";
import { IdeaComposer } from "@/components/idea-composer";
export const dynamic = "force-dynamic";
export default async function NewIdea({ searchParams }: { searchParams: Promise<{ fresh?: string }> }) {
  const fresh = (await searchParams).fresh === "1";
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  const signedIn = configured ? Boolean((await auth()).userId) : false;
  return <main id="main" className="narrow-page"><div className="page-intro"><span className="eyebrow">YOUR NEXT POSSIBILITY</span><h1>Every good idea<br/>starts as a hunch.</h1><p>Let’s find out what’s already out there, and what you could do differently.</p></div><IdeaComposer key={fresh ? "fresh" : "saved"} fresh={fresh} signedIn={signedIn} authConfigured={configured}/><p className="below-form">Usually a few minutes · One report and one refinement per person during the hackathon</p></main>;
}
