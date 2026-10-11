export type ResearchProvider = "openai" | "crustdata";
function runCreditAllowance(name: "CRUSTDATA_FULL_REPORT_CREDITS" | "CRUSTDATA_REFINEMENT_CREDITS") {
  const value = Number(process.env[name] || 5);
  if (!Number.isSafeInteger(value) || value < 5 || value > 1000000)
    throw new Error("INVALID_CRUST_RUN_ALLOWANCE");
  return value;
}
// Read lazily: CLI scripts load .env.local after importing this module.
// Admission persists the allowance; changing the environment never funds existing runs.
export const CRUST_CREDITS = {
  get full() { return runCreditAllowance("CRUSTDATA_FULL_REPORT_CREDITS"); },
  get refinement() { return runCreditAllowance("CRUSTDATA_REFINEMENT_CREDITS"); },
} as const;

export function crustCreditBudget() {
  const value = Number(process.env.CRUSTDATA_CREDIT_BUDGET || 0);
  if (!Number.isSafeInteger(value) || value < 0 || value > 1000000) throw new Error("INVALID_CRUST_BUDGET");
  return value;
}

export function researchProvider(): ResearchProvider {
  const value = process.env.RESEARCH_PROVIDER || "auto";
  if (value === "openai" || value === "crustdata") return value;
  if (value !== "auto") throw new Error("UNSUPPORTED_RESEARCH_PROVIDER");
  return process.env.CRUSTDATA_API_KEY && process.env.LITELLM_API_KEY && crustCreditBudget() >= CRUST_CREDITS.full ? "crustdata" : "openai";
}

export function providerReady(provider = researchProvider()) {
  return provider === "crustdata"
    ? Boolean(process.env.CRUSTDATA_API_KEY && process.env.LITELLM_API_KEY && crustCreditBudget() >= CRUST_CREDITS.full)
    : Boolean(process.env.OPENAI_API_KEY);
}
