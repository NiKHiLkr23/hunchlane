import { z } from "zod";

export const IdeaBriefSchema = z.object({
  idea: z.string().trim().min(20, "Describe your idea in at least 20 characters.").max(3000),
  audience: z.string().trim().max(300).default(""),
  location: z.string().trim().max(150).default(""),
  category: z.enum(["software", "physical", "service"]),
  answers: z.record(z.string(), z.string().max(500)).default({}),
});
export type IdeaBrief = z.infer<typeof IdeaBriefSchema>;
export const SourceSchema = z.object({ id: z.string(), url: z.string().url(), title: z.string(), retrievedAt: z.string(), kind: z.enum(["official", "discussion", "other"]), excerpt: z.string().max(900), evidenceLevel: z.enum(["search_preview", "page_text"]).optional() });
export type EvidenceSource = z.infer<typeof SourceSchema>;
const ClaimSchema = z.object({ text: z.string().max(1500), sourceIds: z.array(z.string()), nature: z.enum(["observation", "hypothesis"] ) });
export const CompetitorSchema = z.object({ name: z.string(), url: z.string().url(), match: z.enum(["close", "adjacent"]), description: ClaimSchema, overlap: ClaimSchema, difference: ClaimSchema, pricing: ClaimSchema });
export type CompetitorMatch = z.infer<typeof CompetitorSchema>;
export const ResearchContentSchema = z.object({
  title: z.string().max(100), verdict: z.enum(["close_matches", "related_options", "insufficient_evidence"]),
  summary: ClaimSchema, competitors: z.array(CompetitorSchema).max(5),
  angles: z.array(z.object({ title: z.string(), explanation: ClaimSchema, test: z.string() })).max(3),
  unknowns: z.array(z.string()).max(6),
  experiment: z.object({ title: z.string(), steps: z.array(z.string()).max(5), successSignal: z.string(), cost: z.string() }),
  searchNotes: z.array(z.string()).max(6),
  changes: z.array(z.string()).max(6),
});
export type ResearchContent = z.infer<typeof ResearchContentSchema>;
export const FinancialInputsSchema = z.object({
  currency: z.enum(["USD", "INR", "EUR", "GBP"]),
  price: z.number().finite().min(0).max(1000000),
  variableCost: z.number().finite().min(0).max(1000000),
  fixedCost: z.number().finite().min(0).max(10000000),
  startingUnits: z.number().finite().min(0).max(1000000),
  monthlyGrowth: z.number().finite().min(-1).max(3),
  startingCapital: z.number().finite().min(0).max(100000000).nullable(),
});
export type FinancialInputs = z.infer<typeof FinancialInputsSchema>;
export type FinancialScenario = { name: "Conservative" | "Base" | "Optimistic"; months: { month: number; units: number; revenue: number; variableCost: number; fixedCost: number; profit: number; cash: number | null }[]; annualRevenue: number; annualProfit: number; breakEvenUnits: number | null };
export type FinancialResult = { status: "verified" | "unavailable"; provider: "cfo.ai"; message: string; modelUrl?: string; receipt?: string; scenarios?: FinancialScenario[]; inputs?: FinancialInputs };
export type ResearchReport = ResearchContent & { sources: EvidenceSource[]; createdAt: string; brief: IdeaBrief; finance: FinancialResult; version: number };
export const STAGES = ["queued", "discovering", "verifying", "composing", "finances", "complete"] as const;
export type RunStage = typeof STAGES[number];
export type RunState = { id: string; brief: IdeaBrief; status: "queued" | "running" | "complete" | "failed"; stage: RunStage; createdAt: string; error: string | null; parentId: string | null; report: ResearchReport | null; dispatched: boolean; provider: "openai" | "crustdata" };

export function clarify(brief: Pick<IdeaBrief, "audience" | "location" | "category">) {
  const questions: { id: string; label: string; hint: string }[] = [];
  if (!brief.audience) questions.push({ id: "audience", label: "Who would you help first?", hint: "For example, students living away from home. “Not sure” is fine." });
  questions.push(brief.category === "software" ? { id: "difference", label: "What would make it feel different?", hint: "A simpler experience, a specific problem, or a different price?" } : { id: "delivery", label: "How would someone get it?", hint: "Online, in your neighborhood, delivered to their door…" });
  return questions.slice(0, 2);
}
