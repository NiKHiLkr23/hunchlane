import { auth } from "@clerk/nextjs/server";
import { providerReady } from "./research-provider";
export async function requireOwner() {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) throw new Error("AUTH_NOT_CONFIGURED");
  const { userId } = await auth(); if (!userId) throw new Error("UNAUTHENTICATED"); return userId;
}
export function sameOrigin(request: Request) { const origin = request.headers.get("origin"); if (!origin || origin !== new URL(request.url).origin) throw new Error("INVALID_ORIGIN"); }
export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  const messages: Record<string, [number,string]> = {
    UNAUTHENTICATED: [401,"Sign in to research and save your idea."], AUTH_NOT_CONFIGURED: [503,"Sign-in is being connected. You can explore the sample report."],
    DATABASE_NOT_CONFIGURED: [503,"Your library is being connected. Please try again later."], INVALID_ORIGIN: [403,"This request could not be verified."],
    BUDGET_EXHAUSTED: [429,"Research is at its hackathon spending limit. Please try later."],
    REFINEMENT_NOT_ALLOWED: [409,"This report cannot be refined again."], RECONCILIATION_REQUIRED: [409,"This run needs a provider check before it can be retried. Its progress is saved."],
    INTEGRATIONS_NOT_READY: [503,"Live research is being connected. You can explore the sample report in the meantime."],
  };
  const [status, text] = messages[message] || (message.includes("one_allowance") || message.includes("one_active") || message.includes("duplicate key") ? [409,"The hackathon allows one full report and one refinement per person, with one running at a time."] : [500,"We couldn’t complete that request. Your draft is still here. Please try again."]);
  return Response.json({ error: text }, { status });
}
export function researchReady() { return Boolean(process.env.DATABASE_URL && providerReady() && process.env.NEATLOGS_API_KEY && (process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === "1")); }
