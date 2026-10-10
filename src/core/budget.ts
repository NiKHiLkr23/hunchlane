export const RESERVATIONS = { full: 75, refinement: 40 } as const;
export const PHASE_LIMITS = { discovery: { calls: 4, output: 4500 }, verification: { calls: 4, output: 4500 }, composition: { calls: 0, output: 5500 } };
// Ceiling guard, not a vendor-enforced billing guarantee. Account-level limits must also be configured.
export function estimateCents(inputTokens: number, outputTokens: number, searchCalls: number) { return Math.ceil(inputTokens * .75 / 10000 + outputTokens * 4.5 / 10000 + searchCalls); }
export function canReserve(limit: number, allocated: number, requested: number) { return Number.isSafeInteger(requested) && requested > 0 && allocated + requested <= limit; }
