import { AgentMessageSchema } from "@/core/agent";
import { requireOwner, sameOrigin, apiError } from "@/server/auth";
import { appendAgentMessage, pendingAgentWake } from "@/server/agent-store";
import { dispatchAgentWake } from "@/server/inngest";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request); const owner = await requireOwner();
    const text = await request.text(); if (text.length > 16000) return Response.json({ error: "Keep your message within 500 characters." }, { status: 413 });
    const parsed = AgentMessageSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return Response.json({ error: "Check your message and try again." }, { status: 400 });
    const id = (await params).id;
    const run = await appendAgentMessage(id, owner, parsed.data);
    // The last answer saves a wake atomically. Failed delivery is recovered by the outbox cron.
    try {
      const wake = await pendingAgentWake(id, owner);
      if (wake) await dispatchAgentWake(wake);
    } catch {
      console.warn(JSON.stringify({event:"hunchlane.agent.dispatch_pending",runId:id}));
    }
    return Response.json(run, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
