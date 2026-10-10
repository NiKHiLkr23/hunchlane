import { Inngest, NonRetriableError } from "inngest";
import { internalRun, progress, finishRun, failRun,reserveCrustSlot } from "./store";
import { startResponse, pollResponse, discoveryParams, verificationParams, compositionParams, mergeEvidence, assembleReport, type ResearchEvidence } from "./research";
import { modelIdeaWithCfo } from "./cfo";
import { sponsoredComposition } from "./sponsored-model";
import { checkCrustAccount,planCrustResearch,searchCrust,selectCrustPages,fetchCrustPages } from "./crustdata";
import { crustEvidence,type SearchReceipt } from "./crustdata-parse";
import { CRUST_CREDITS } from "./research-provider";
export const inngest = new Inngest({ id: "hunchlane", checkpointing: { maxRuntime: "40s" } });
export const researchFunction = inngest.createFunction({
  id: "research-idea", triggers: { event: "hunchlane/research.created" },
  concurrency: [{ limit: 2 }, { limit: 1, key: "event.data.ownerId" }], retries: 1,
}, async ({ event, step }) => {
  const ownerId = event.data.ownerId;
  if (typeof ownerId !== "string" || !ownerId.trim()) throw new NonRetriableError("Research owner is required");
  const runId = String(event.data.runId);
  const run = await step.run("load-run", () => internalRun(runId, ownerId));
  if (run.status === "complete") return { runId, complete: true };
  const parent = run.parentId ? await step.run("load-parent", () => internalRun(run.parentId!, ownerId)) : null;
  const previous = parent?.report || null;
  try {
    let evidence:ResearchEvidence;
    await step.run("discovering", () => progress(runId,"discovering"));
    if(run.provider === "crustdata"){
      await step.run("crust-account",()=>checkCrustAccount(CRUST_CREDITS[previous?"refinement":"full"]));
      const plan=await step.run("crust-plan",()=>planCrustResearch(runId,run.brief,previous));
      const searches:SearchReceipt[]=[];
      for(let i=0;i<plan.queries.length;i++){
        const slot=await step.run(`crust-search-slot-${i}`,()=>reserveCrustSlot());
        await step.sleepUntil(`crust-search-wait-${i}`,slot);
        searches.push(await step.run(`crust-search-${i}`,()=>searchCrust(runId,i,plan.queries[i])));
      }
      await step.run("verifying",()=>progress(runId,"verifying"));
      const urls=await step.run("crust-select",()=>selectCrustPages(runId,run.brief,searches));
      if(urls.length){const slot=await step.run("crust-fetch-slot",()=>reserveCrustSlot());await step.sleepUntil("crust-fetch-wait",slot);}
      const pages=await step.run("crust-fetch",()=>fetchCrustPages(runId,urls));
      evidence=crustEvidence(searches,pages,urls);
    }else{
    const discoveryId = await step.run("start-discovery", () => startResponse(runId,"discovery",discoveryParams(run.brief,previous)));
    let discovery: unknown = null;
    for (let i=0; i<60 && !discovery; i++) {
      discovery = await step.run(`poll-discovery-${i}`, () => pollResponse(runId,"discovery",discoveryId));
      if (!discovery) await step.sleep(`wait-discovery-${i}`,"5s");
    }
    if (!discovery) throw new Error("RESEARCH_TIMEOUT");
    await step.run("verifying", () => progress(runId,"verifying"));
    const verificationId = await step.run("start-verification", () => startResponse(runId,"verification",verificationParams(run.brief,discovery as ResearchEvidence,!!previous)));
    let verification: unknown = null;
    for (let i=0; i<60 && !verification; i++) {
      verification = await step.run(`poll-verification-${i}`, () => pollResponse(runId,"verification",verificationId));
      if (!verification) await step.sleep(`wait-verification-${i}`,"5s");
    }
    if (!verification) throw new Error("RESEARCH_TIMEOUT");
    evidence = mergeEvidence(discovery as ResearchEvidence,verification as ResearchEvidence);
    }
    await step.run("composing", () => progress(runId,"composing"));
    let content: unknown = null;
    if(process.env.LITELLM_API_KEY){
      content=await step.run("sponsored-composition",()=>sponsoredComposition(runId,run.brief,evidence,previous));
    }else{
      const contentId = await step.run("start-composition", () => startResponse(runId,"composition",compositionParams(run.brief,evidence,previous)));
      for (let i=0; i<60 && !content; i++) {
        content = await step.run(`poll-composition-${i}`, () => pollResponse(runId,"composition",contentId));
        if (!content) await step.sleep(`wait-composition-${i}`,"5s");
      }
    }
    if (!content) throw new Error("RESEARCH_TIMEOUT");
    const report = await step.run("validate-evidence", async () => assembleReport(content,evidence,run.brief,previous));
    await step.run("finances", () => progress(runId,"finances"));
    const finance = await step.run("cfo-model", () => modelIdeaWithCfo(runId,run.brief));
    await step.run("save-report", () => finishRun(runId,{ ...report,finance }));
    return { runId, complete: true };
  } catch (error) {
    const uncertain = error instanceof Error && error.message === "RECONCILIATION_REQUIRED";
    await step.run("save-error", () => failRun(runId,uncertain ? "A provider request needs a check before retrying. Your progress is saved." : "Research paused before the report was ready. Your progress is saved; you can retry from the last checkpoint."));
    throw new NonRetriableError(uncertain ? "Provider reconciliation required" : "Research paused", { cause: error });
  }
});
