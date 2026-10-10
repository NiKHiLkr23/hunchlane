import { describe,it,expect } from "vitest";
import { modelScenarios,verifyFinancials } from "@/core/finance";
import { FinancialInputsSchema,IdeaBriefSchema,clarify,type EvidenceSource } from "@/core/types";
import { validateEvidence,safeWebUrl } from "@/core/evidence";
import { sampleReport } from "@/core/sample";
import { canReserve,estimateCents } from "@/core/budget";
const base={currency:"USD" as const,price:10,variableCost:4,fixedCost:120,startingUnits:30,monthlyGrowth:0,startingCapital:null};
describe("financial arithmetic",()=>{
  it("models a twelve-month service or product with explicit costs",()=>{const model=modelScenarios(base).find(s=>s.name==="Base")!;expect(model.annualRevenue).toBe(3600);expect(model.annualProfit).toBe(720);expect(model.breakEvenUnits).toBe(20);expect(model.months.every(m=>m.cash===null)).toBe(true);});
  it("shows a loss at zero sales, and does not invent cash",()=>{const model=modelScenarios({...base,startingUnits:0})[1];expect(model.annualProfit).toBe(-1440);expect(model.months[0].cash).toBeNull();});
  it("does not imply break-even with negative contribution",()=>{expect(modelScenarios({...base,variableCost:12})[1].breakEvenUnits).toBeNull();});
  it("tracks capital only when explicitly supplied",()=>{const model=modelScenarios({...base,startingCapital:100})[1];expect(model.months[11].cash).toBe(820);});
  it("rejects invalid money, currency and growth",()=>{expect(()=>modelScenarios({...base,price:Infinity})).toThrow();expect(FinancialInputsSchema.safeParse({...base,currency:"USD/INR"}).success).toBe(false);expect(()=>modelScenarios({...base,monthlyGrowth:4})).toThrow();});
  it("independently rejects incorrect CFO.ai results",()=>{const remote=modelScenarios(base);remote[1].months[5].profit+=10;expect(()=>verifyFinancials(base,remote)).toThrow("arithmetic mismatch");});
  it("verifies all scenarios and annual totals",()=>{const remote=modelScenarios(base);expect(verifyFinancials(base,remote)).toEqual(remote);remote[0].annualRevenue+=5;expect(()=>verifyFinancials(base,remote)).toThrow("totals mismatch");});
});
describe("evidence",()=>{
  it("rejects page verification claims supported only by search previews",()=>{const report=structuredClone(sampleReport);report.summary.text="Free. Verified from the official listing.";report.summary.sourceIds=[report.sources[0].id];const sources:EvidenceSource[]=report.sources.map(source=>({...source,evidenceLevel:"search_preview"}));expect(()=>validateEvidence(report,sources)).toThrow("search preview");sources[0]={...sources[0],evidenceLevel:"page_text"};expect(validateEvidence(report,sources)).toBe(report);report.summary.text="Pricing not verified from the official listing; the preview suggests a free option.";expect(validateEvidence(report,sources.map(source=>({...source,evidenceLevel:"search_preview" as const})))).toBe(report);});
  it("rejects source IDs that never came back from search",()=>{const report=structuredClone(sampleReport);report.summary.sourceIds=["invented"];expect(()=>validateEvidence(report,report.sources)).toThrow("not retrieved");});
  it("requires citations for observations but permits explicit hypotheses",()=>{const report=structuredClone(sampleReport);report.summary.sourceIds=[];expect(()=>validateEvidence(report,report.sources)).toThrow("must have a source");report.summary.nature="hypothesis";expect(validateEvidence(report,report.sources)).toBe(report);});
  it("refuses an unsupported competitor host and inconsistent verdict",()=>{const report=structuredClone(sampleReport);report.competitors[0].url="https://made-up.example/";expect(()=>validateEvidence(report,report.sources)).toThrow("not retrieved");report.competitors=[];expect(()=>validateEvidence(report,report.sources)).toThrow("no close match");});
  it("never renders unsafe URL schemes or private hosts",()=>{for(const url of ["javascript:alert(1)","http://example.com","https://localhost/","https://127.0.0.1/","https://169.254.169.254/","https://user:pass@example.com"])expect(safeWebUrl(url)).toBe(false);expect(safeWebUrl("https://example.com/pricing")).toBe(true);});
});
describe("idea and budget boundaries",()=>{
  it("supports software, physical and service ideas with at most two clarifications",()=>{for(const category of ["software","physical","service"] as const){const brief=IdeaBriefSchema.parse({...sampleReport.brief,category});expect(clarify(brief).length).toBeLessThanOrEqual(2);}});
  it("enforces idea length and bounded answers",()=>{expect(IdeaBriefSchema.safeParse({...sampleReport.brief,idea:"tiny"}).success).toBe(false);expect(IdeaBriefSchema.safeParse({...sampleReport.brief,answers:{a:"x".repeat(501)}}).success).toBe(false);});
  it("conservatively rounds usage and refuses over-budget allocations",()=>{expect(estimateCents(1000000,1000000,8)).toBe(533);expect(canReserve(1500,1470,40)).toBe(false);expect(canReserve(1500,1425,75)).toBe(true);});
});
