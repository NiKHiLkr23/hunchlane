import type { EvidenceSource, ResearchContent } from "./types";
export function safeWebUrl(value: string) {
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && !/^(localhost|127\.|0\.|\[|.*\.local$)/i.test(u.hostname) && !/^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname); } catch { return false; }
}
export class EvidenceValidationError extends Error {
  constructor(message: string) { super(message); this.name = "EvidenceValidationError"; }
}
// Recover only by removing unsupported alternatives, never by inventing receipts.
// The original provider response remains in the operation journal.
export function recoverRetrievedAlternatives(report: ResearchContent, sources: EvidenceSource[]): ResearchContent {
  const hosts = new Set(sources.map(source => new URL(source.url).hostname.replace(/^www\./, "")));
  const competitors = report.competitors.filter(competitor => safeWebUrl(competitor.url) && hosts.has(new URL(competitor.url).hostname.replace(/^www\./, "")));
  if (competitors.length === report.competitors.length) return report;
  const removed = report.competitors.filter(competitor => !competitors.includes(competitor));
  const mentionsRemoved = (text: string) => removed.some(competitor => text.toLowerCase().includes(competitor.name.toLowerCase()) || text.includes(new URL(competitor.url).hostname));
  const verdict = report.verdict === "insufficient_evidence" || !competitors.length ? "insufficient_evidence" : report.verdict === "close_matches" && competitors.some(competitor => competitor.match === "close") ? "close_matches" : "related_options";
  const note = `${removed.length} proposed alternative(s) were excluded because their websites were not in the retrieved sources. This report has limited coverage; it does not establish novelty.`;
  return {
    ...report, competitors, verdict,
    summary: { text: competitors.length ? "The retrieved sources support a limited comparison. Treat possible differences as hypotheses to test, and review the cited evidence before deciding what to build." : "There is insufficient retrieved evidence for an alternatives comparison. This does not mean the idea is new.", nature: "hypothesis", sourceIds: [] },
    angles: report.angles.filter(angle => !mentionsRemoved(JSON.stringify(angle))),
    unknowns: report.unknowns.filter(text => !mentionsRemoved(text)),
    changes: report.changes.filter(text => !mentionsRemoved(text)),
    searchNotes: [note, ...report.searchNotes.filter(text => !mentionsRemoved(text))].slice(0, 6),
    experiment: mentionsRemoved(JSON.stringify(report.experiment)) ? { title: "Understand the current workaround", steps: ["Ask three people in your intended audience how they handle this problem today.", "Record their current workaround and one frustration before proposing a solution."], successSignal: "Identify a recurring frustration in at least two conversations.", cost: "Time for three short conversations; no paid tools required." } : report.experiment,
  };
}
export function validateEvidence(report: ResearchContent, sources: EvidenceSource[]) {
  const ids = new Set(sources.map(s => s.id));
  const urls = new Set(sources.map(s => new URL(s.url).hostname.replace(/^www\./, "")));
  const claims = [report.summary, ...report.competitors.flatMap(c => [c.description, c.overlap, c.difference, c.pricing]), ...report.angles.map(a => a.explanation)];
  for (const claim of claims) {
    if (claim.sourceIds.some(id => !ids.has(id))) throw new EvidenceValidationError("A claim cites a source that was not retrieved.");
    if (claim.nature === "observation" && !claim.sourceIds.length) throw new EvidenceValidationError("An observation must have a source.");
    const cited = sources.filter(source => claim.sourceIds.includes(source.id));
    const verificationText = claim.text.replace(/\b(?:not|never)\s+(?:(?:fully|independently)\s+)?verified\b/gi, "unverified");
    if (/\b(?:verified (?:from|against|on|using)|(?:fully|independently) verified)\b/i.test(verificationText) && cited.length && cited.every(source => source.evidenceLevel === "search_preview")) throw new EvidenceValidationError("A search preview cannot establish page verification.");
  }
  for (const competitor of report.competitors) {
    if (!safeWebUrl(competitor.url) || !urls.has(new URL(competitor.url).hostname.replace(/^www\./, ""))) throw new EvidenceValidationError("Competitor website was not retrieved.");
  }
  if (report.verdict === "close_matches" && !report.competitors.some(c => c.match === "close")) throw new EvidenceValidationError("Close-match verdict has no close match.");
  if (report.verdict === "related_options" && !report.competitors.length) throw new EvidenceValidationError("Related-options verdict has no alternatives.");
  return report;
}
