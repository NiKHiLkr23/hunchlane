# Hunchlane: assumptions for CFO.ai

These are the inputs and verification record for the actual CFO.ai plan saved on October 10, 2026 (links below). All prices, volumes and costs are hypotheses to test. No payment feature or subscription is currently implemented.

## Product and buyer

Hunchlane helps a first-time builder describe an idea and research existing alternatives, see cited comparisons, choose a possible angle and design a small experiment. It covers apps, physical products and services. The initial buyer hypothesis is an individual exploring a project before spending time or money building it.

Hackathon access offers one full report and one refinement per person. The future paid offer hypothesis is a $5 research pack containing a full report and one refinement. This is a pricing experiment, not an announced price or forecast of willingness to pay.

## Base inputs (USD)

| Input | Assumption | What must be verified |
|---|---:|---|
| Revenue per paid pack | $5.00 | Actual willingness to pay |
| Research cost hypothesis | $1.15 per pack | $0.75 full + $0.40 refinement are app reservations, not measured vendor bills or a guaranteed cap; Crustdata credits and sponsored Claude replacement costs must be priced separately |
| Payment/support allowance | $0.45 per pack | Payment provider quote and support effort; no payment integration exists |
| Total variable cost | $1.60 per paid pack | Replace with observed normal-provider costs after sponsor credits expire |
| Fixed operating costs | $40/month | Hosting, database and job-runner quotes; this is an estimate |
| Paid packs in month 1 | 20 | Test demand; no current customers/revenue |
| Monthly volume growth | 10% | Scenario assumption, not demonstrated traction |
| Starting capital | $200 | Modeling assumption; not a disclosed account balance |
| Modeling period | 12 months | Begin at an assumed commercial launch, after the hackathon |

Temporary hackathon credits should appear as a separate grant in the plan. They must not make ongoing provider costs look permanently free. Neatlogs paid access lasts through the hackathon. The model sponsor offers a limited key allowance and validity period. Crustdata offers 5,000 credits per team, subject to claiming and actual account permissions. CFO.ai credits are provided by the organizers.

Free pilot research has a real acquisition cost. Model 20 free research packs as an initial test: $23 under the unvalidated $1.15 research-cost hypothesis, before other expenses. This is not a proven upper bound. Keep that launch cost separate from recurring paid volume. If offering ongoing free packs, add their costs explicitly instead of assuming they convert into paid sales.

## Modeling request to enter in CFO.ai

> Create a 12-month business plan for Hunchlane, a beginner-friendly idea research app. Use USD. Clearly label every volume, price and cost as an unvalidated assumption. Test a future $5 pack containing one report and one refinement. Assume total variable cost $1.60 per paid pack, fixed costs $40/month, month-one paid volume 20 packs, 10% monthly volume growth and starting capital $200. Add a separate one-time $23 pilot research cost. Show monthly revenue, variable costs, gross profit, fixed costs, operating profit and cash. Show break-even volume and runway where cash becomes negative. Compare conservative volume 12 packs/month with 5% growth, base volume 20 with 10% growth, and optimistic volume 28 with 12.5% growth. Keep temporary sponsor grants separate from sustainable costs. Add a no-growth case and a sensitivity case where research costs double. Do not claim market demand, customer traction or guaranteed profit. Ask for any missing assumptions needed to complete a coherent model.

## Independent checks

- Contribution per paid pack: $5 − $1.60 = $3.40.
- Operating break-even: ceil($40 ÷ $3.40) = 12 paid packs/month, before the one-time pilot cost and taxes.
- Base month 1: revenue $100; variable cost $32; operating profit $28; ending cash $205 after the $23 pilot cost.
- Conservative month 1: revenue $60; variable cost $19.20; operating profit $0.80; ending cash $177.80 after the pilot cost.
- Optimistic month 1: revenue $140; variable cost $44.80; operating profit $55.20; ending cash $232.20 after the pilot cost.

Compare the CFO.ai output to these checks. The app's local end-user calculator does not include the one-time launch cost, and is not evidence that CFO.ai produced this business plan.

## Submission evidence to save

Save the real CFO.ai business plan/model link or export, visible assumptions, scenario comparison and runway explanation. Add a screenshot to the demo showing the actual CFO.ai product and resulting Hunchlane plan. Do not label this draft or a local calculation as the sponsor's output.

For a small validation test, invite 20 people with an idea, ask whether the cited comparisons changed their next step, and test the $5 pack offer without charging until a purchase flow exists. Record outcomes and objections; revise the plan using evidence rather than increasing growth assumptions.

## Exact CFO.ai inputs, checked October 10, 2026

Use the following complete input to remove rounding, cash-timing and sensitivity ambiguity. These are modeling assumptions, not actuals. The app's reservations do not establish sustainable provider costs: a pack can also reserve nine Crustdata credits (five for a report, four for a refinement), plus sponsored model usage. Crustdata's free account check returned 5,200 available credits and one-credit Web Search/Fetch rates today; no USD replacement price was verified.

> Build and save a financial Model and Page named **Hunchlane — Hackathon Business Plan** in CFO.ai. Hunchlane is a pre-revenue beginner idea-research app covering software, physical products and services. It compares existing alternatives using citations, suggests possible angles and a small validation experiment. Our target buyer is an individual deciding whether to build an idea. No paid purchase flow, customers or demand have been demonstrated. Use USD and a hypothetical launch of November 2026 through October 2027. Label all commercial numbers UNVALIDATED ASSUMPTIONS, not actuals or predictions. Create actual saved monthly tables and scenario comparisons, not just a chat explanation.
>
> Price per paid pack = $5; each pack contains one report and one refinement. Research cost hypothesis = $1.15/paid pack; payment and support = $0.45/paid pack; total variable cost = $1.60. Fixed costs = $40/month. Opening cash = $200, a modeling assumption. One-time free pilot = 20 packs in month 1, costing 20 × research cost ($23 in normal cases). Paid pack sales and their cash receipts occur in the same month. Pay all costs in the same month. Assume no debt, capex, inventory, receivables, payables, owner salary or distributions; show pre-tax results and explicitly exclude tax and founder labor from viability conclusions. No recurring free allowance beyond the one-time pilot. No sponsor grants enter cash or recurring cost calculations.
>
> Use six scenarios: Conservative starts at 12 paid packs and grows 5% monthly; Base starts at 20 and grows 10%; Optimistic starts at 28 and grows 12.5%; No growth stays at 20; Double research cost uses Base volume/growth with research cost $2.30, total variable cost $2.75, and one-time pilot cost $46; No sales sells zero packs with normal costs and a $23 pilot. For month m use units = ROUND(initial_units × (1 + growth)^(m − 1), 0), always from the unrounded starting-volume formula, not from the previous rounded month. Round currency to cents. Revenue = units × price; variable costs = units × total variable cost; contribution = revenue − variable costs; operating profit before pilot = contribution − fixed costs; net cash movement = operating profit − pilot cost in month 1; ending cash = opening cash + cumulative net cash movement. Keep pilot costs separately visible to avoid double-counting them.
>
> Show all 12 monthly rows, annual revenue, annual profit after the pilot, ending cash, contribution margin and break-even paid packs/month = CEILING(fixed costs / contribution per pack). Define runway as the first month with negative ending cash, or "not exhausted within 12 months" if none; do not call it infinite. In the zero-sales case cash should first turn negative in month 5. Normal break-even is 12 packs; doubled-research break-even is 18. Base month 1 should show $100 revenue, $32 variable costs, $28 operating profit before pilot and $205 ending cash. Include the caveat that the $1.15 research hypothesis has not been verified against Crustdata and Claude costs after sponsorship ends. Keep temporary, noncash sponsor credits in a separate note with no invented USD value. Save the model and return its actual Page link and an export option for the hackathon submission.

Independent comparison values (local arithmetic only; not CFO.ai output):

| Scenario | Annual revenue | Annual profit after pilot | Month-12 cash | First negative cash month |
|---|---:|---:|---:|---|
| Conservative | $965.00 | $153.20 | $353.20 | Not within 12 months |
| Base | $2,135.00 | $948.80 | $1,148.80 | Not within 12 months |
| Optimistic | $3,485.00 | $1,866.80 | $2,066.80 | Not within 12 months |
| No growth | $1,200.00 | $313.00 | $513.00 | Not within 12 months |
| Double research cost | $2,135.00 | $434.75 | $634.75 | Not within 12 months |
| No sales | $0.00 | −$503.00 | −$303.00 | Month 5 |

## Actual CFO.ai output — October 10, 2026

- [Saved Hunchlane Page](https://app.cfo.ai/nikhil-cfoai-e19c0a15/pages/61b16664-9211-49eb-8dfe-25925b56e3b7), opened successfully in the signed-in workspace. This is the real sponsor product, separate from Hunchlane's local calculator and optional OAuth adapter.
- [CFO.ai creation conversation](https://app.cfo.ai/nikhil-cfoai-e19c0a15/chat/495b7ac5-d62b-4388-90b8-555ce021856f) contains Ari's completed model and a 54 KB `Hunchlane — Hackathon Business Plan.xlsx` attachment. The export is described by CFO.ai as Base tables with working formulas; the Page retains the other scenarios and narrative. Automated download did not complete, so the local workbook has not been inspected.
- The saved Page includes assumptions, monthly tables, annual viability, scenario comparison and charts. Base, Conservative, Optimistic, No growth and No sales revenue/profit/ending-cash values were read from the rendered model and matched the independent checks above. Base month-one cash is $205. The No sales table explicitly shows first negative cash month 5, annual loss $503 and ending cash −$303.
- All six scenarios are present in the scenario picker. Double research cost values were reported by Ari; direct table verification is still pending. Switch the scenario picker, then open the Hunchlane Page in that scenario to load its values.
- The Page labels commercial inputs as unvalidated assumptions, excludes taxes/founder labor and keeps sponsor credits separate without invented dollar values. A local screenshot is saved at `artifacts/cfo/no-sales.png` (ignored by Git).
- These workspace links require CFO.ai account access. No public sharing was enabled. Submission access or a downloaded export still needs to be arranged before judging.
