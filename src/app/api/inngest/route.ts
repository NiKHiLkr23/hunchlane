import { serve } from "inngest/next";
import { inngest,researchFunction } from "@/server/inngest";
export const runtime = "nodejs";
export const maxDuration = 60;
export const { GET,POST,PUT } = serve({client:inngest,functions:[researchFunction]});
