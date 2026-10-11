import { afterEach, beforeEach, expect, it, vi } from "vitest";
const telemetry=vi.hoisted(()=>({wrap:vi.fn((client:unknown)=>client),attributes:vi.fn(),traceResolved:vi.fn(),trace:vi.fn()}));
vi.mock("openai",()=>({default:class {responses={};}}));
vi.mock("neatlogs",()=>({init:async()=>{},flush:async()=>{},wrapOpenAI:telemetry.wrap,trace:telemetry.trace}));
import { operationContext } from "@/server/operation-context";
import { observed, openaiClient } from "@/server/telemetry";
beforeEach(()=>{
  vi.clearAllMocks(); vi.stubEnv("OPENAI_API_KEY","fixture"); vi.stubEnv("NEATLOGS_API_KEY","fixture");
  telemetry.trace.mockImplementation(async(_options:unknown,fn:(span:unknown)=>Promise<unknown>)=>{
    const value=await fn({setAttribute:telemetry.attributes,spanContext:()=>({traceId:"fixture-trace"})});
    telemetry.traceResolved();return value;
  });
});
afterEach(()=>vi.unstubAllEnvs());
const context={owner:"fixture-owner",revision:0,lease:"fixture-lease"};
it("does not attach the prompt-capturing SDK wrapper to continuous provider calls",async()=>{
  await operationContext.run(context,()=>openaiClient());expect(telemetry.wrap).not.toHaveBeenCalled();
  await openaiClient();expect(telemetry.wrap).toHaveBeenCalledTimes(1);
});
it("keeps private provider/parser error text out of continuous monitoring traces",async()=>{
  const log=vi.spyOn(console,"info").mockImplementation(()=>{}),error=Error("Private idea and provider output excerpt");
  try {
    await expect(operationContext.run(context,()=>observed("fixture-run","composition",async()=>{throw error;}))).rejects.toBe(error);
    expect(telemetry.traceResolved).toHaveBeenCalledTimes(1);
    expect(telemetry.trace).toHaveBeenCalledWith(expect.objectContaining({captureInput:false,captureOutput:false}),expect.any(Function));
    expect(telemetry.attributes).toHaveBeenCalledWith("hunchlane.operation_failed",true);
    expect(JSON.stringify(telemetry.attributes.mock.calls)).not.toContain(error.message);
    expect(JSON.stringify(log.mock.calls)).not.toContain(error.message);
  } finally {log.mockRestore();}
});
