import { notFound } from "next/navigation";
import { AgentConversation } from "@/components/agent-conversation";
export const dynamic = "force-dynamic";
export default async function AgentPreview({ searchParams }: { searchParams: Promise<{ scenario?: string; start?: string }> }) {
  if (process.env.NODE_ENV !== "development" || process.env.HUNCHLANE_UI_PREVIEW !== "1") notFound();
  const { scenario, start } = await searchParams;
  return <><div className="chat-preview-bar">Design preview · deterministic research fixtures · no paid calls or account impersonation</div><AgentConversation preview scenario={scenario || "running"} continueIntent={start}/></>;
}
