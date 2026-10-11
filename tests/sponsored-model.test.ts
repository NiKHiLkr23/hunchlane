import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {z} from "zod";
const mocks=vi.hoisted(()=>({operation:vi.fn(),claimOperation:vi.fn(),saveOperation:vi.fn(),saveProviderReceipt:vi.fn(),create:vi.fn(),options:vi.fn(),wrap:vi.fn()}));
vi.mock("@/server/store",()=>({operation:mocks.operation,claimOperation:mocks.claimOperation,saveOperation:mocks.saveOperation,saveProviderReceipt:mocks.saveProviderReceipt}));
vi.mock("@/server/telemetry",()=>({observed:async(_id:string,_phase:string,fn:()=>Promise<unknown>)=>fn()}));
vi.mock("neatlogs",()=>({wrapOpenAI:mocks.wrap}));
vi.mock("openai",()=>({default:class {chat={completions:{create:mocks.create}};constructor(options:unknown){mocks.options(options);}}}));
import {sponsoredJson} from "@/server/sponsored-model";
import {operationContext} from "@/server/operation-context";
const schema=z.object({answer:z.string()});
beforeEach(()=>{vi.stubEnv("LITELLM_API_KEY","test");vi.stubEnv("LITELLM_MODEL","claude-sonnet-4.6");mocks.claimOperation.mockResolvedValue(true);mocks.wrap.mockImplementation((client:unknown)=>client);});
afterEach(()=>{vi.resetAllMocks();vi.unstubAllEnvs();});
it("uses the SDK timeout default with automatic retries disabled and journals the result",async()=>{
  mocks.create.mockResolvedValue({choices:[{message:{content:'{"answer":"done"}'},finish_reason:"stop"}]});
  expect(await sponsoredJson("run","phase",schema,"instructions",{idea:"test"},100)).toEqual({answer:"done"});
  expect(mocks.options).toHaveBeenCalledWith(expect.objectContaining({maxRetries:0}));
  expect(mocks.options.mock.calls[0][0]).not.toHaveProperty("timeout");
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(mocks.saveOperation).toHaveBeenCalledWith("run","phase",{answer:"done"},0);
});
it("returns cached completed content without constructing a client or making a call",async()=>{
  mocks.operation.mockResolvedValue({state:"complete",result:{answer:"cached"}});
  expect(await sponsoredJson("run","phase",schema,"instructions",{},100)).toEqual({answer:"cached"});
  expect(mocks.options).not.toHaveBeenCalled();expect(mocks.create).not.toHaveBeenCalled();expect(mocks.claimOperation).not.toHaveBeenCalled();
});
it("omits prompt-capturing wrappers for continuous sponsored calls",async()=>{
  mocks.create.mockResolvedValue({choices:[{message:{content:'{"answer":"done"}'},finish_reason:"stop"}]});
  await operationContext.run({owner:"fixture",revision:0,lease:"fixture"},()=>sponsoredJson("run","phase",schema,"instructions",{},100));
  expect(mocks.wrap).not.toHaveBeenCalled();
  expect(mocks.options).toHaveBeenCalledWith(expect.objectContaining({timeout:55000,maxRetries:0}));
});
it("leaves a failed provider call for reconciliation without a replay",async()=>{
  mocks.create.mockRejectedValue(new Error("connection interrupted"));
  await expect(sponsoredJson("run","phase",schema,"instructions",{},100)).rejects.toThrow("connection interrupted");
  expect(mocks.create).toHaveBeenCalledTimes(1);expect(mocks.saveOperation).not.toHaveBeenCalled();
  mocks.operation.mockResolvedValue({state:"creating"});
  await expect(sponsoredJson("run","phase",schema,"instructions",{},100)).rejects.toThrow("RECONCILIATION_REQUIRED");
  expect(mocks.create).toHaveBeenCalledTimes(1);
});
it("retains the raw model output before schema parsing and recovers it without another call",async()=>{
  mocks.create.mockResolvedValue({id:"receipt-1",choices:[{message:{content:'{"wrong":true}'},finish_reason:"stop"}]});
  await expect(sponsoredJson("run","phase",schema,"instructions",{},100)).rejects.toThrow();
  expect(mocks.saveProviderReceipt).toHaveBeenCalledWith("run","phase",expect.objectContaining({text:'{"wrong":true}',responseId:"receipt-1"}),0);
  expect(mocks.saveOperation).not.toHaveBeenCalled();
  mocks.operation.mockResolvedValue({state:"received",raw_receipt:{text:'{"answer":"recovered"}',finishReason:"stop"}});
  expect(await sponsoredJson("run","phase",schema,"instructions",{},100)).toEqual({answer:"recovered"});
  expect(mocks.create).toHaveBeenCalledTimes(1);
});
