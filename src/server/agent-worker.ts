import { ResearchContentSchema, type IdeaBrief, type ResearchReport, type RunStage } from "@/core/types";
import { supportedFallback, retryDelay, revisedSearchQuery, type AgentCursor } from "@/core/agent";
import { db, ownedRun, operation, reserveCrustSlot } from "./store";
import { acquireAgentLease, agentAttempts, finishAgent, freezeAgentBrief, scheduleAgent, unlockUncharged, type Wake } from "./agent-store";
import { operationContext } from "./operation-context";
import { discoveryParams, verificationParams, compositionParams, startResponse, pollResponse, extractEvidence, mergeEvidence, assembleReport, type ResearchEvidence } from "./research";
import { checkCrustAccount, planCrustResearch, searchCrust, selectCrustPages, fetchCrustPages } from "./crustdata";
import { crustEvidence, parseSearch, parsePages, type SearchReceipt, type PageReceipt } from "./crustdata-parse";
import { sponsoredJson, sponsoredComposition } from "./sponsored-model";
import { modelIdeaWithCfo } from "./cfo";

export async function retainedEvidence(id: string, owner: string): Promise<ResearchEvidence> {
  const rows = await db()`select o.phase,o.result,o.raw_receipt from provider_operations o join runs r on r.id=o.run_id
    where r.id=${id} and r.owner_id=${owner} and (o.state='complete' or o.raw_receipt is not null)`;
  const searches: SearchReceipt[] = [], pages: PageReceipt[] = [], parts: ResearchEvidence[] = [];
  const selected = rows.find(r => r.phase === "crust-select")?.result as { urls?: string[] } | undefined;
  for (const row of rows) {
    try {
      if (String(row.phase).startsWith("crust-search-")) searches.push(row.result ? row.result as SearchReceipt : parseSearch(receiptBody(row.raw_receipt)));
      if (row.phase === "crust-fetch") pages.push(...(row.result ? row.result as PageReceipt[] : parsePages(receiptBody(row.raw_receipt), selected?.urls || [])));
      if (row.phase === "discovery" || row.phase === "verification") parts.push(row.result ? row.result as ResearchEvidence : extractEvidence(row.raw_receipt as Parameters<typeof extractEvidence>[0]));
    } catch { /* Invalid receipts are preserved in the journal, never converted into evidence. */ }
  }
  if (searches.length) parts.push(crustEvidence(searches, pages, selected?.urls || []));
  return mergeEvidence(...parts);
}

function receiptBody(receipt: unknown) { const body=(receipt as {body:unknown}).body;return typeof body === "string" ? JSON.parse(body) : body; }

/** One bounded unit of work. Leases and paid-operation claims, not browser activity, own progress. */
export async function advanceAgent(id: string, owner: string): Promise<Wake | null> {
  const acquired = await acquireAgentLease(id, owner); if (!acquired) return null;
  const lease: string = acquired;
  const run = await ownedRun(id, owner); if (!run?.agent) return null;
  const agent = run.agent;
  return operationContext.run({ owner, revision: agent.lockedRevision ?? agent.revision, lease }, async () => {
    const previous = run.parentId ? (await ownedRun(run.parentId, owner))?.report || null : null;
    let brief = agent.finalBrief || run.brief;
    const next = (cursor: AgentCursor, stage: RunStage, seconds = 0, activity?: string) => scheduleAgent(id, owner, lease, cursor, stage, seconds, "working", activity);
    async function fallback() {
      const frozen = await freezeAgentBrief(id, owner, lease); brief = frozen?.agent?.finalBrief || brief;
      const evidence = await retainedEvidence(id, owner);
      const report = supportedFallback(brief, evidence.sources, new Date().toISOString(), previous ? previous.version + 1 : 1);
      if (report) addContext(report, frozen?.agent?.conversation.questions || []);
      await finishAgent(id, owner, lease, report);
      console.info(JSON.stringify({ event: "hunchlane.agent.final", runId: id, outcome: report ? "limited_report" : "no_evidence" }));
      return null;
    }
    if (Date.now() >= Date.parse(agent.deadlineAt)) return fallback();
    const cursor = agent.cursor;
    try {
      switch (cursor) {
        case "queued": return next(run.provider === "crustdata" ? "crust-plan" : "discovery", "discovering", 0, "Looking for alternatives and current workarounds.");
        case "crust-plan":
          await checkCrustAccount(run.parentId ? 4 : 5);
          await planCrustResearch(id, brief, previous);
          return next("crust-search-0", "discovering");
        case "crust-search-0": case "crust-search-1": {
          const planned = await operation(id, "crust-plan");
          const plan = planned?.result as { queries?: string[] } | undefined;
          const queries = plan?.queries || [brief.idea.slice(0, 500), `${brief.idea.slice(0, 450)} alternatives features pricing`];
          const index = cursor === "crust-search-0" ? 0 : 1;
          if (index < (previous ? 1 : queries.length)) {
            // Persisted rate-limit slot; schedule before claiming a paid operation.
            const slotPhase = `${cursor}-slot`;
            const slotRows = await db()`select failure_history from provider_operations where run_id=${id} and phase=${slotPhase}
              and exists(select 1 from runs where id=${id} and owner_id=${owner})`;
            let at = (slotRows[0]?.failure_history as { at?: string }[] | undefined)?.[0]?.at;
            if (!at) {
              at = await reserveCrustSlot();
              await db()`insert into provider_operations(run_id,phase,state,failure_history,brief_revision) select ${id},${slotPhase},'complete',${JSON.stringify([{ at }])}::jsonb,${agent.revision}
                where exists(select 1 from runs where id=${id} and owner_id=${owner}) on conflict do nothing`;
            }
            if (Date.parse(at) > Date.now()) return next(cursor, "discovering", Math.ceil((Date.parse(at) - Date.now()) / 1000));
            await searchCrust(id, index, revisedSearchQuery(queries[index], brief, Number(planned?.brief_revision || 0), agent.revision));
          }
          return next(index === 0 && !previous ? "crust-search-1" : "crust-select", index === 0 && !previous ? "discovering" : "verifying", 0, index === 0 && !previous ? undefined : "Checking the closest matches against retrieved sources.");
        }
        case "crust-select": {
          const searches = [];
          for (const phase of ["crust-search-0", "crust-search-1"]) { const saved = await operation(id, phase); if (saved?.state === "complete") searches.push(saved.result as SearchReceipt); }
          await selectCrustPages(id, brief, searches);
          return next("crust-fetch", "verifying", Math.max(0, Math.ceil((Date.parse(await reserveCrustSlot()) - Date.now()) / 1000)));
        }
        case "crust-fetch": {
          const selected = (await operation(id, "crust-select"))?.result as { urls?: string[] } | undefined;
          await fetchCrustPages(id, selected?.urls || []);
          return next("composition", "composing", 0, "Finding a useful next step from the evidence.");
        }
        case "discovery": await startResponse(id, "discovery", discoveryParams(brief, previous)); return next("discovery-poll", "discovering", 5);
        case "discovery-poll": {
          const saved = await operation(id, "discovery");
          if (!saved?.response_id) throw new Error("RECONCILIATION_REQUIRED");
          const result = await pollResponse(id, "discovery", saved.response_id);
          return result ? next("verification", "verifying", 0, "Checking the closest matches against retrieved sources.") : next(cursor, "discovering", 5);
        }
        case "verification": await startResponse(id, "verification", verificationParams(brief, await retainedEvidence(id, owner), Boolean(previous))); return next("verification-poll", "verifying", 5);
        case "verification-poll": {
          const saved = await operation(id, "verification");
          if (!saved?.response_id) throw new Error("RECONCILIATION_REQUIRED");
          const result = await pollResponse(id, "verification", saved.response_id);
          return result ? next("composition", "composing", 0, "Finding a useful next step from the evidence.") : next(cursor, "verifying", 5);
        }
        case "composition": case "repair": {
          const frozen = await freezeAgentBrief(id, owner, lease); brief = frozen?.agent?.finalBrief || brief;
          operationContext.getStore()!.revision = frozen?.agent?.lockedRevision ?? agent.revision;
          const evidence = await retainedEvidence(id, owner);
          if (!evidence.sources.length) return fallback();
          const phase = cursor === "repair" ? "composition-repair" : "composition";
          if (process.env.LITELLM_API_KEY) {
            if (cursor === "repair") {
              const params = compositionParams(brief, evidence, previous);
              await sponsoredJson(id, "sponsored-repair", ResearchContentSchema, `${String(params.instructions)} The prior draft failed validation. Produce a fresh conservative report. Omit unsupported claims; insufficient evidence is acceptable.`, { brief, untrustedEvidence: evidence }, 5500);
            } else await sponsoredComposition(id, brief, evidence, previous);
            return next("finalize", "composing");
          }
          await startResponse(id, phase, compositionParams(brief, evidence, previous));
          return next(cursor === "repair" ? "repair-poll" : "composition-poll", "composing", 5);
        }
        case "composition-poll": case "repair-poll": {
          const phase = cursor === "repair-poll" ? "composition-repair" : "composition", saved = await operation(id, phase);
          if (!saved?.response_id) throw new Error("RECONCILIATION_REQUIRED");
          return await pollResponse(id, phase, saved.response_id) ? next("finalize", "composing") : next(cursor, "composing", 5);
        }
        case "finalize": {
          const evidence = await retainedEvidence(id, owner);
          const content = (await operation(id, "sponsored-repair"))?.result || (await operation(id, "composition-repair"))?.result || (await operation(id, "sponsored-composition"))?.result || (await operation(id, "composition"))?.result;
          const report = assembleReport(content, evidence, brief, previous);
          const finance = await modelIdeaWithCfo(id, brief).catch(() => ({ status: "unavailable" as const, provider: "cfo.ai" as const, message: "No verified financial model was generated." }));
          if((await operation(id,"cfo"))?.state === "creating") console.error(JSON.stringify({event:"hunchlane.agent.reconciliation_required",runId:id,phase:"cfo"}));
          const final: ResearchReport = { ...report, finance }; addContext(final, agent.conversation.questions);
          await finishAgent(id, owner, lease, final);
          console.info(JSON.stringify({ event: "hunchlane.agent.final", runId: id, outcome: "report" }));
          return null;
        }
      }
    } catch (error) {
      const phase = cursor === "repair-poll" ? "composition-repair" : cursor === "composition-poll" ? "composition" : cursor === "discovery-poll" ? "discovery" : cursor === "verification-poll" ? "verification" : cursor === "repair" ? (process.env.LITELLM_API_KEY ? "sponsored-repair" : "composition-repair") : cursor === "composition" && process.env.LITELLM_API_KEY ? "sponsored-composition" : cursor;
      const saved = await operation(id, phase);
      const uncertain = saved?.state === "creating";
      const invalid = saved?.state === "received" || (error instanceof Error && (error.name === "EvidenceValidationError" || error.name === "ZodError"));
      const attempts = saved?.state === "failed_uncharged" ? (saved.attempts || 1)-1 : await agentAttempts(id, owner), delay = retryDelay(attempts + 1, saved?.retry_after_seconds || 0);
      console.info(JSON.stringify({ event: "hunchlane.agent.recovery", runId: id, phase, classification: uncertain ? "uncertain" : invalid ? "invalid_output" : "safe_or_terminal", attempt: attempts + 1 }));
      if (uncertain) console.error(JSON.stringify({event:"hunchlane.agent.reconciliation_required",runId:id,phase}));
      if (saved?.state === "failed_uncharged" && (saved.attempts || 1) < 4 && delay !== null) {
        await unlockUncharged(id, owner, phase);
        // A new confirmed-uncharged request must obtain a fresh provider rate-limit slot.
        await db()`delete from provider_operations where run_id=${id} and phase=${`${cursor}-slot`} and exists(select 1 from runs where id=${id} and owner_id=${owner})`;
        return scheduleAgent(id, owner, lease, cursor, run.stage, delay, "recovering", undefined, false);
      }
      if (cursor === "crust-plan" && (uncertain || invalid)) return next("crust-search-0", "discovering");
      if (cursor === "crust-select" && (uncertain || invalid)) return next("composition", "composing", 0, "Preparing the report from the evidence available.");
      if ((cursor === "composition" || cursor === "composition-poll" || cursor === "finalize") && invalid && !await operation(id, process.env.LITELLM_API_KEY ? "sponsored-repair" : "composition-repair")) return next("repair", "composing");
      if (uncertain) {
        // No provider lookup exists for an unknown synchronous creation. Preserve and alert; do not resend.
        if (run.provider === "crustdata" || phase.startsWith("sponsored-")) return fallback();
        return scheduleAgent(id, owner, lease, cursor, run.stage, 60, "reconciling", undefined, false);
      }
      const terminal = invalid || error instanceof Error && /ALLOWANCE|BALANCE|UNVERIFIED|INCOMPLETE|NOT_READY|UNSUPPORTED/.test(error.message);
      if (!terminal && delay !== null) return scheduleAgent(id, owner, lease, cursor, run.stage, delay, "recovering", undefined, false);
      if (cursor === "crust-search-0") return next(previous ? "crust-select" : "crust-search-1", "discovering");
      if (cursor === "crust-search-1") return next("crust-select", "verifying");
      if (cursor === "verification" || cursor === "verification-poll" || cursor === "crust-fetch" || cursor === "crust-select") return next("composition", "composing", 0, "Preparing the report from the evidence available.");
      return fallback();
    }
  });
}
function addContext(report: ResearchReport, questions: { text: string; answer?: string }[]) {
  const unanswered = questions.filter(q => !q.answer || q.answer === "Use your judgment.").map(q => q.text);
  report.unknowns = [...new Set([...report.unknowns, ...unanswered])].slice(0, 6);
  report.searchNotes = ["The report covers the original idea and context accepted before report preparation. Later direction changes are saved for a follow-up.", ...report.searchNotes].slice(0, 6);
}
