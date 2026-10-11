import OpenAI from "openai";
import { init, trace, wrapOpenAI, flush } from "neatlogs";
import { operationContext } from "./operation-context";
let ready: Promise<void> | undefined;
export async function initializeTelemetry() {
  if (!process.env.NEATLOGS_API_KEY) return;
  ready ??= init({
    apiKey: process.env.NEATLOGS_API_KEY,
    endpoint: "https://ingest.neatlogs.com",
    workflowName: "idea-research",
  });
  await ready;
}
export async function openaiClient() {
  if (!process.env.OPENAI_API_KEY || !process.env.NEATLOGS_API_KEY)
    throw new Error("INTEGRATIONS_NOT_READY");
  await initializeTelemetry();
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 0,
    timeout: 25000,
  });
  // The SDK wrapper captures prompts and replies. Continuous runs keep those only in owner-scoped receipts.
  return operationContext.getStore() ? client : wrapOpenAI(client);
}
export async function observed<T>(
  runId: string,
  phase: string,
  fn: () => Promise<T>
): Promise<T> {
  await initializeTelemetry();
  try {
    const result = await trace(
      {
        kind: "WORKFLOW",
        name: phase,
        sessionId: runId,
        captureInput: false,
        captureOutput: false,
      },
      async (span) => {
        span.setAttribute("hunchlane.run_id", runId);
        // Correlate provider receipts with authenticated Neatlogs readback without logging prompts or credentials.
        console.info(
          JSON.stringify({
            event: "hunchlane.trace",
            runId,
            phase,
            traceId: span.spanContext().traceId,
          })
        );
        if (!operationContext.getStore()) return { value: await fn() };
        // Provider/parser errors may contain private excerpts. Record only failure metadata in the trace.
        try {
          return { value: await fn() };
        } catch (error) {
          span.setAttribute("hunchlane.operation_failed", true);
          return { error };
        }
      }
    );
    if ("error" in result) throw result.error;
    return result.value;
  } finally {
    if (ready) await flush().catch(() => undefined);
  }
}
