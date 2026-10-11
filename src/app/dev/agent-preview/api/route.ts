import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { openingConversation, AgentMessageSchema } from "@/core/agent";
import { IdeaBriefSchema, type RunState } from "@/core/types";
import { sampleReport } from "@/core/sample";
type Fixture = { run: RunState; scenario: string; polls: number };
const fixtures = new Map<string, Fixture>();
const allowed = () => process.env.NODE_ENV === "development" && process.env.HUNCHLANE_UI_PREVIEW === "1";
export async function POST(request: Request) {
  if (!allowed()) return new Response(null, { status: 404 });
  const body = await request.json(), cookieStore = await cookies();
  if (body.mode === "autonomous") {
    const parsed = IdeaBriefSchema.safeParse(body.brief); if (!parsed.success || !/^[0-9a-f-]{36}$/.test(body.id)) return Response.json({ error: "Invalid fixture input" }, { status: 400 });
    const now = new Date().toISOString(), token = cookieStore.get("hunchlane-agent-preview")?.value || randomUUID();
    const existing = fixtures.get(token);
    if (existing && existing.run.id === body.id) return Response.json({ id: body.id, run: existing.run }, { status: 202 });
    const run: RunState = { id: body.id, brief: parsed.data, status: "running", stage: "discovering", createdAt: now, error: null, parentId: null, report: null, dispatched: true, provider: "crustdata", mode: "autonomous", agent: { conversation: openingConversation(parsed.data, now), revision: 0, lockedRevision: null, cursor: "crust-search-0", deadlineAt: new Date(Date.now() + 1200000).toISOString(), nextAttemptAt: now, recovery: "working", finalBrief: null } };
    fixtures.set(token, { run, scenario: body.scenario, polls: 0 });
    cookieStore.set("hunchlane-agent-preview", token, { httpOnly: true, sameSite: "strict", path: "/dev/agent-preview", maxAge: 3600 });
    return Response.json({ id: run.id, run }, { status: 202 });
  }
  const fixture = fixtures.get(cookieStore.get("hunchlane-agent-preview")?.value || ""), parsed = AgentMessageSchema.safeParse(body);
  if (!fixture || !parsed.success || body.runId !== fixture.run.id) return Response.json({ error: "Fixture not found" }, { status: 404 });
  const input = parsed.data, agent = fixture.run.agent!;
  const existing=agent.conversation.messages.find(m=>m.id===input.id);
  if(existing && (existing.text!==input.text || existing.questionId!==input.questionId || Boolean(existing.useJudgment)!==Boolean(input.useJudgment))) return Response.json({error:"Conflicting message"},{status:409});
  if (!existing) {
    const createdAt=new Date().toISOString();
    agent.conversation.messages.push({ id: input.id, role: "user", text: input.text, questionId:input.questionId,useJudgment:input.useJudgment,createdAt, followUp: agent.lockedRevision !== null });
    if(agent.lockedRevision===null){
      const question = agent.conversation.questions.find(q => q.id === input.questionId); if (question) question.answer = input.text;
      if (!input.useJudgment) {
        agent.revision++; fixture.run.brief.answers[input.questionId || input.id] = input.text.slice(0, 500);
        if(input.questionId==="audience") fixture.run.brief.audience=input.text.slice(0,300);
        agent.conversation.briefRevisions?.push({revision:agent.revision,brief:structuredClone(fixture.run.brief),createdAt});
      }
    }
  }
  return Response.json(fixture.run);
}
export async function GET(request: Request) {
  if (!allowed()) return new Response(null, { status: 404 });
  const fixture = fixtures.get((await cookies()).get("hunchlane-agent-preview")?.value || "");
  if (!fixture || fixture.run.id !== new URL(request.url).searchParams.get("id")) return Response.json({ error: "Fixture not found" }, { status: 404 });
  fixture.polls++;
  if (fixture.scenario === "recovering") fixture.run.agent!.recovery = "recovering";
  if ((fixture.scenario === "complete" || fixture.scenario === "failure") && fixture.polls >= 2 && !["complete","failed"].includes(fixture.run.status)) {
    fixture.run.status = fixture.scenario === "complete" ? "complete" : "failed";
    fixture.run.stage = "complete"; fixture.run.agent!.lockedRevision = fixture.run.agent!.revision;
    fixture.run.agent!.finalBrief = structuredClone(fixture.run.brief);
    if (fixture.scenario === "complete") fixture.run.report = { ...structuredClone(sampleReport), brief: structuredClone(fixture.run.brief), title: "A first look at your idea", searchNotes: ["Deterministic illustrative fixture; no live research."] };
    fixture.run.agent!.conversation.activity = [...fixture.run.agent!.conversation.activity.filter(a => a.id !== "final"), { id: "final", text: fixture.scenario === "complete" ? "Your report is ready. Here’s a useful next step." : "I couldn’t retrieve enough usable evidence for a reliable report. Your idea is saved.", createdAt: new Date().toISOString() }];
  }
  return Response.json(fixture.run, { headers: { "Cache-Control": "no-store" } });
}
