import { FinancialInputsSchema, type FinancialInputs, type FinancialScenario } from "./types";
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export function modelScenarios(raw: FinancialInputs): FinancialScenario[] {
  const inputs = FinancialInputsSchema.parse(raw);
  return ([{ name: "Conservative", scale: .6, growth: .5 }, { name: "Base", scale: 1, growth: 1 }, { name: "Optimistic", scale: 1.4, growth: 1.25 }] as const).map(({ name, scale, growth }) => {
    let cash = inputs.startingCapital;
    const months = Array.from({ length: 12 }, (_, i) => {
      const units = Math.max(0, Math.round(inputs.startingUnits * scale * Math.pow(Math.max(0, 1 + inputs.monthlyGrowth * growth), i)));
      const revenue = money(units * inputs.price), variableCost = money(units * inputs.variableCost);
      const profit = money(revenue - variableCost - inputs.fixedCost);
      cash = cash === null ? null : money(cash + profit);
      return { month: i + 1, units, revenue, variableCost, fixedCost: inputs.fixedCost, profit, cash };
    });
    const contribution = inputs.price - inputs.variableCost;
    return { name, months, annualRevenue: money(months.reduce((sum, m) => sum + m.revenue, 0)), annualProfit: money(months.reduce((sum, m) => sum + m.profit, 0)), breakEvenUnits: contribution > 0 ? Math.ceil(inputs.fixedCost / contribution) : null };
  });
}
export function verifyFinancials(inputs: FinancialInputs, remote: FinancialScenario[]) {
  const expected = modelScenarios(inputs);
  if (remote.length !== 3) throw new Error("CFO.ai must return all three scenarios.");
  for (const scenario of expected) {
    const actual = remote.find(r => r.name === scenario.name);
    if (!actual || actual.months.length !== 12) throw new Error("Incomplete CFO.ai scenario.");
    for (let i = 0; i < 12; i++) {
      for (const key of ["units", "revenue", "variableCost", "fixedCost", "profit", "cash"] as const) {
        const a = actual.months[i][key], b = scenario.months[i][key];
        if ((a === null) !== (b === null) || (a !== null && b !== null && (!Number.isFinite(a) || Math.abs(a - b) > .02))) throw new Error(`CFO.ai arithmetic mismatch: ${scenario.name}, month ${i + 1}, ${key}`);
      }
    }
    if (!Number.isFinite(actual.annualProfit) || !Number.isFinite(actual.annualRevenue) || Math.abs(actual.annualProfit - scenario.annualProfit) > .02 || Math.abs(actual.annualRevenue - scenario.annualRevenue) > .02 || actual.breakEvenUnits !== scenario.breakEvenUnits) throw new Error("CFO.ai annual totals mismatch.");
  }
  return expected;
}
