import { auth } from "@clerk/nextjs/server";
import { providerReady } from "./research-provider";
import { ACCOUNT_ALLOWANCES } from "@/core/budget";
export async function requireOwner() {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) throw new Error("AUTH_NOT_CONFIGURED");
  const { userId } = await auth(); if (!userId) throw new Error("UNAUTHENTICATED"); return userId;
}
export function sameOrigin(request: Request) { const origin = request.headers.get("origin"); if (!origin || origin !== new URL(request.url).origin) throw new Error("INVALID_ORIGIN"); }
export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  const messages: Record<string, [number,string]> = {
    RUN_NOT_FOUND:[404,"This conversation was not found."], SUBMISSION_CONFLICT:[409,"This submission already has different saved content."], CONVERSATION_LIMIT:[409,"This conversation is full. Your existing messages are saved."], INVALID_QUESTION:[400,"This question is no longer available."],
    UNAUTHENTICATED: [401,"Sign in to research and save your idea."], AUTH_NOT_CONFIGURED: [503,"Sign-in is being connected. You can explore the sample report."],
    DATABASE_NOT_CONFIGURED: [503,"Your library is being connected. Please try again later."], INVALID_ORIGIN: [403,"This request could not be verified."],
    BUDGET_EXHAUSTED: [429,"The research credit allowance is exhausted. Please try later."],
    ACCOUNT_QUOTA_EXHAUSTED: [409,`Your account allows ${ACCOUNT_ALLOWANCES.full} full reports and ${ACCOUNT_ALLOWANCES.refinement} refinements.`],
    REFINEMENT_NOT_ALLOWED: [409,"This report cannot be refined again."], RECONCILIATION_REQUIRED: [409,"This run needs a provider check before it can be retried. Its progress is saved."],
    INTEGRATIONS_NOT_READY: [503,"Live research is being connected. You can explore the sample report in the meantime."],
  };
  const [status, text] = messages[message] || (message.includes("one_active") ? [409,"You already have research in progress. One report can run at a time."] : message.includes("duplicate key") ? [409,"This submission already exists. Open your saved conversation."] : [500,"We couldn’t complete that request. Your draft is still here. Please try again."]);
  return Response.json({ error: text }, { status });
}
export function researchReady() { return Boolean(process.env.DATABASE_URL && providerReady() && process.env.NEATLOGS_API_KEY && (process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === "1")); }
