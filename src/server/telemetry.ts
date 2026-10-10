import OpenAI from "openai";
import { init, trace, wrapOpenAI, flush } from "neatlogs";
let ready: Promise<void> | undefined;
export async function initializeTelemetry() {
  if (!process.env.NEATLOGS_API_KEY) return;
  ready ??= init({ apiKey: process.env.NEATLOGS_API_KEY, endpoint: "https://ingest.neatlogs.com", workflowName: "idea-research" });
  await ready;
}
export async function openaiClient() {
  if (!process.env.OPENAI_API_KEY || !process.env.NEATLOGS_API_KEY) throw new Error("INTEGRATIONS_NOT_READY");
  await initializeTelemetry();
  return wrapOpenAI(new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0, timeout: 25000 }));
}
export async function observed<T>(runId: string, phase: string, fn: () => Promise<T>): Promise<T> {
  await initializeTelemetry();
  try { return await trace({ kind: "WORKFLOW", name: phase, sessionId: runId, captureInput: false, captureOutput: false }, async span => { span.setAttribute("hunchlane.run_id", runId); return fn(); }); }
  finally { if (ready) await flush().catch(() => undefined); }
}
