import { serve } from "inngest/next";
import { inngest,researchFunction,agentFunction,agentRecoveryFunction } from "@/server/inngest";
export const runtime = "nodejs";
export const maxDuration = 300;
export const { GET,POST,PUT } = serve({client:inngest,functions:[researchFunction,agentFunction,agentRecoveryFunction]});
