import type { EvidenceSource, ResearchContent } from "./types";
export function safeWebUrl(value: string) {
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && !/^(localhost|127\.|0\.|\[|.*\.local$)/i.test(u.hostname) && !/^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname); } catch { return false; }
}
export function validateEvidence(report: ResearchContent, sources: EvidenceSource[]) {
  const ids = new Set(sources.map(s => s.id));
  const urls = new Set(sources.map(s => new URL(s.url).hostname.replace(/^www\./, "")));
  const claims = [report.summary, ...report.competitors.flatMap(c => [c.description, c.overlap, c.difference, c.pricing]), ...report.angles.map(a => a.explanation)];
  for (const claim of claims) {
    if (claim.sourceIds.some(id => !ids.has(id))) throw new Error("A claim cites a source that was not retrieved.");
    if (claim.nature === "observation" && !claim.sourceIds.length) throw new Error("An observation must have a source.");
    const cited = sources.filter(source => claim.sourceIds.includes(source.id));
    const verificationText = claim.text.replace(/\b(?:not|never)\s+(?:(?:fully|independently)\s+)?verified\b/gi, "unverified");
    if (/\b(?:verified (?:from|against|on|using)|(?:fully|independently) verified)\b/i.test(verificationText) && cited.length && cited.every(source => source.evidenceLevel === "search_preview")) throw new Error("A search preview cannot establish page verification.");
  }
  for (const competitor of report.competitors) {
    if (!safeWebUrl(competitor.url) || !urls.has(new URL(competitor.url).hostname.replace(/^www\./, ""))) throw new Error("Competitor website was not retrieved.");
  }
  if (report.verdict === "close_matches" && !report.competitors.some(c => c.match === "close")) throw new Error("Close-match verdict has no close match.");
  if (report.verdict === "related_options" && !report.competitors.length) throw new Error("Related-options verdict has no alternatives.");
  return report;
}
