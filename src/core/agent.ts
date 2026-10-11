import { z } from "zod";
import { clarify, type IdeaBrief, type EvidenceSource, type ResearchReport } from "./types";
import { safeWebUrl, validateEvidence } from "./evidence";

export const AGENT_LIMITS = { deadlineMs: 20 * 60_000, leaseSeconds: 90, retrySeconds: [5, 30, 120], questions: 2 } as const;
export type AgentMessage = { id: string; role: "user" | "assistant"; text: string; createdAt: string; followUp?: boolean; questionId?: string; useJudgment?: boolean };
export type AgentQuestion = { id: string; text: string; suggestions: string[]; answer?: string };
export type AgentActivity = { id: string; text: string; createdAt: string };
export type AgentConversation = { messages: AgentMessage[]; questions: AgentQuestion[]; assumptions: string[]; activity: AgentActivity[]; briefRevisions?: { revision: number; brief: IdeaBrief; createdAt: string }[] };
export type AgentCursor = "queued" | "crust-plan" | "crust-search-0" | "crust-search-1" | "crust-select" | "crust-fetch" | "discovery" | "discovery-poll" | "verification" | "verification-poll" | "composition" | "composition-poll" | "repair" | "repair-poll" | "finalize";
export type AgentState = { conversation: AgentConversation; revision: number; lockedRevision: number | null; cursor: AgentCursor; deadlineAt: string; nextAttemptAt: string; recovery: "working" | "recovering" | "reconciling"; finalBrief: IdeaBrief | null };
export const AgentMessageSchema = z.object({ id: z.string().uuid(), text: z.string().trim().min(1).max(500), questionId: z.enum(["audience", "difference", "delivery"]).optional(), useJudgment: z.boolean().optional() });
export type AgentMessageInput = z.infer<typeof AgentMessageSchema>;

export function openingConversation(brief: IdeaBrief, now: string): AgentConversation {
  return {
    messages: [{ id: "opening", role: "user", text: brief.idea, createdAt: now }],
    questions: clarify(brief).slice(0, AGENT_LIMITS.questions).map(q => ({ id: q.id, text: q.label, suggestions: q.id === "audience" ? ["People like me", "A specific community", "Small businesses"] : q.id === "delivery" ? ["Online", "Locally", "Delivered"] : ["A simpler experience", "A specific audience", "A different approach"] })),
    assumptions: ["Unanswered context remains open; suggested answers are not assumed facts."],
    activity: [{ id: "queued", text: "Your idea is saved. I’m starting the research.", createdAt: now }],
    briefRevisions: [{ revision: 0, brief: structuredClone(brief), createdAt: now }],
  };
}

export function retryDelay(attempt: number, retryAfterSeconds = 0): number | null {
  const delay = AGENT_LIMITS.retrySeconds[attempt - 1];
  return delay === undefined ? null : Math.max(delay, retryAfterSeconds);
}
export function inferCategory(idea: string): IdeaBrief["category"] {
  if (/\b(app|software|platform|website|digital|saas)\b/i.test(idea)) return "software";
  if (/\b(kit|packaging|device|product|bottle|clothing|hardware)\b/i.test(idea)) return "physical";
  if (/\b(service|cafe|café|shop|repair|tutor|salon|restaurant)\b/i.test(idea)) return "service";
  return "software";
}

/** Amend unfinished searches using accepted context without buying another planning operation. */
export function revisedSearchQuery(query: string, brief: IdeaBrief, plannedRevision: number, revision: number) {
  if (plannedRevision === revision) return query;
  const context = [...Object.values(brief.answers).reverse(), brief.audience].filter(Boolean).join("; ").slice(0, 225);
  return context ? `${query.slice(0, 250)} Context: ${context}` : query;
}

/** A receipt directory, not an invented comparison. No interpretation is promoted to observation. */
export function supportedFallback(brief: IdeaBrief, sources: EvidenceSource[], now: string, version = 1): ResearchReport | null {
  const retained = sources.filter(s => safeWebUrl(s.url) && s.excerpt.trim()).slice(0, 35).map((s, i) => ({ ...s, id: `s${i + 1}` }));
  if (!retained.length) return null;
  const report: ResearchReport = {
    title: "A first look at your idea", verdict: "insufficient_evidence",
    summary: { text: "Some source material was retrieved, but a complete alternatives comparison could not be verified. Review the retained passages before drawing conclusions. This does not establish novelty or demand.", nature: "hypothesis", sourceIds: [] },
    competitors: [], angles: [], unknowns: ["Which alternatives most closely address the same problem?", "What does your intended audience use today?", "Current features and pricing remain unverified."],
    experiment: { title: "Understand the current workaround", steps: ["Ask three people how they solve this problem today.", "Record their workaround and one frustration before proposing your solution."], successSignal: "Repeated, specific frustrations worth investigating.", cost: "A few conversations; no purchase required." },
    searchNotes: ["Research coverage is incomplete. Only returned source receipts are retained.", "Search previews are provisional and do not verify the contents of a page."], changes: [],
    sources: retained, brief, createdAt: now, version,
    finance: { status: "unavailable", provider: "cfo.ai", message: "No verified financial model was generated for this report." },
  };
  validateEvidence(report, retained);
  return report;
}
