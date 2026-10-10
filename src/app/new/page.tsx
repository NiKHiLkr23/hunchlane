import { auth } from "@clerk/nextjs/server";
import { IdeaConversation } from "@/components/idea-conversation";
export const dynamic = "force-dynamic";
export default async function NewIdea({ searchParams }: { searchParams: Promise<{ fresh?: string }> }) {
  const fresh = (await searchParams).fresh === "1";
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  const signedIn = configured ? Boolean((await auth()).userId) : false;
  return <IdeaConversation key={fresh ? "fresh" : "saved"} fresh={fresh} signedIn={signedIn} authConfigured={configured}/>;
}
