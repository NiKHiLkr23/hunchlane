import { sampleCostModel, sampleStudy } from "@/core/sample-study";
import "./sample-study.css";

export function SampleOverview() {
  return <section className="sample-study" aria-labelledby="sample-journey-title">
    <div className="section-intro"><span className="eyebrow">THE PRODUCT VISION</span><h2 id="sample-journey-title">One idea, carried all the way through.</h2><p>{sampleStudy.positioning}</p></div>
    <p className="sample-study-audience">{sampleStudy.audience}</p>
    <ol className="sample-journey">{sampleStudy.journey.map((step, index) => <li key={step.title}>
      <span className="sample-step-number">0{index + 1}</span><div><h3>{step.title}</h3><span className="sample-stage-status">{step.status}</span><p>{step.detail}</p></div>
    </li>)}</ol>
    <div className="sample-decision"><span className="eyebrow">PROPOSED NEXT DECISION</span><p>{sampleStudy.decision}</p></div>
  </section>;
}

export function SampleStrategy() {
  return <section className="sample-study" aria-labelledby="sample-strategy-title">
    <div className="section-intro"><span className="eyebrow">HYPOTHESES TO TEST</span><h2 id="sample-strategy-title">Why Hunchlane could work. What could stop it.</h2><p>The advantage has to show up in customer outcomes. These are proposed explanations, not proven demand or competitor shortcomings.</p></div>
    <div className="sample-strategy-grid">
      <article><h3>Reasons it could work</h3>{sampleStudy.advantages.map(item => <div className="sample-reason" key={item.title}><h4>{item.title}</h4><p>{item.detail}</p></div>)}</article>
      <article><h3>Reasons it could fail</h3>{sampleStudy.risks.map(item => <div className="sample-reason" key={item.title}><h4>{item.title}</h4><p>{item.detail}</p></div>)}</article>
    </div>
  </section>;
}

export function SampleNumbers() {
  const finance = sampleStudy.financial;
  const model = sampleCostModel();
  const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: finance.currency, maximumFractionDigits: 0 }).format(amount);
  return <section className="sample-study sample-numbers" aria-labelledby="sample-numbers-title">
    <div className="section-intro"><span className="eyebrow">ILLUSTRATIVE ASSUMPTIONS · USD / MONTH</span><h2 id="sample-numbers-title">What would sustainable delivery cost?</h2><p>{finance.note}</p></div>
    <div className="sample-strategy-grid">
      <article><h3>Chosen inputs</h3><dl className="sample-costs"><div><dt>Price per paying customer</dt><dd>{money(finance.monthlyPrice)}</dd></div>{finance.costs.map(cost => <div key={cost.label}><dt>{cost.label}</dt><dd>{money(cost.amount)}</dd></div>)}<div><dt>Variable cost per customer</dt><dd>{money(model.variableCost)}</dd></div><div><dt>Monthly fixed costs</dt><dd>{money(finance.fixedCost)}</dd></div></dl></article>
      <article><h3>The arithmetic</h3><p className="sample-model-metric">{money(model.contribution)}<span>contribution per customer before fixed costs</span></p><p>{money(finance.monthlyPrice)} price − {money(model.variableCost)} variable cost = {money(model.contribution)}.</p><p className="sample-model-metric">{model.breakEvenCustomers}<span>paying customers to cover the entered costs</span></p><p>{money(finance.fixedCost)} fixed costs ÷ {money(model.contribution)} contribution, rounded up. This does not establish full business break-even.</p></article>
    </div>
    <div className="sample-table-wrap"><table className="sample-cost-table"><caption>Monthly sensitivity at the same assumed price and costs</caption><thead><tr><th scope="col">Customers</th><th scope="col">Revenue</th><th scope="col">Costs</th><th scope="col">Result</th></tr></thead><tbody>{model.scenarios.map(row => <tr key={row.customers}><th scope="row">{row.customers}</th><td>{money(row.revenue)}</td><td>{money(row.cost)}</td><td>{money(row.result)}</td></tr>)}</tbody></table></div>
    <p className="fine-print">No CFO.ai model was created. This static example is local arithmetic, not a forecast, quoted delivery cost, or available subscription plan.</p>
  </section>;
}
