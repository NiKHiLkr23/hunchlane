import { auth } from "@clerk/nextjs/server";
import { autonomousEnabled } from "@/server/agent-store";
import { AgentConversation } from "@/components/agent-conversation";
import { IdeaConversation } from "@/components/idea-conversation";
export const dynamic = "force-dynamic";
export default async function NewIdea({ searchParams }: { searchParams: Promise<{ fresh?: string; start?: string }> }) {
  const params=await searchParams;
  const fresh = params.fresh === "1";
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  const ownerId=configured ? (await auth()).userId : null;
  const signedIn=Boolean(ownerId);
  if(autonomousEnabled()) return <AgentConversation key={fresh ? "fresh" : "saved"} fresh={fresh} signedIn={signedIn} ownerId={ownerId} authConfigured={configured} continueIntent={params.start}/>;
  return <IdeaConversation key={fresh ? "fresh" : "saved"} fresh={fresh} signedIn={signedIn} authConfigured={configured}/>;
}
