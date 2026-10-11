import { AgentMessageSchema } from "@/core/agent";
import { requireOwner, sameOrigin, apiError } from "@/server/auth";
import { appendAgentMessage } from "@/server/agent-store";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request); const owner = await requireOwner();
    const text = await request.text(); if (text.length > 16000) return Response.json({ error: "Keep your message within 500 characters." }, { status: 413 });
    const parsed = AgentMessageSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return Response.json({ error: "Check your message and try again." }, { status: 400 });
    return Response.json(await appendAgentMessage((await params).id, owner, parsed.data), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
