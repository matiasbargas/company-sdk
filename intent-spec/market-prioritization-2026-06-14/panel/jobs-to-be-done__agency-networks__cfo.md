# CFO deep-score — jobs-to-be-done__agency-networks

**Role:** CFO (Valeria Amsterdam)
**Lens:** Unit economics, CAC payback, runway implication, gross margin, ARR shape, capital efficiency
**Date:** 2026-06-14

---

## Verdict at a glance

| Dimension | Score | One-line reasoning |
|---|---|---|
| Viability (from CFO domain) | 5/10 | ROI math is real and immediate, but the ARR shape is the worst of the top-10: lumpy, churn-correlated to engagement turnover, with a gross-margin drag I do not believe the alternative priced in. |
| Market growth potential (from CFO domain) | 4/10 | Agency P&Ls are structurally contracting under AI pressure — total billable hours per engagement are falling, which compresses both their willingness-to-pay ceiling AND our usage-based unit. |
| **Verdict** | **probe** | Worth a small, capital-disciplined design-partner motion to validate multi-tenancy build cost and per-engagement ACV — but I will not sign off on full GTM allocation against the devtool wedge. |

---

## What the unit economics actually look like (the alternative did not show this math)

The alternative quotes "trivial ROI math" by hand-waving billable rates against ramp days. That is the *agency's* ROI on adoption. It says nothing about *our* ROI on selling to them. Let me run the numbers I would actually defend in a board pack.

**Pricing surface assumed:** per-active-engagement license + seat tier + Layer B export premium.

**Per-account model (mid-tier consultancy, 50-200 people, 8-15 active engagements):**

| Line | Value | Assumption |
|---|---|---|
| Active engagements | 10 (midpoint) | Stated in alternative |
| Per-engagement license | $400/mo | Anchored to ~1/3 of one ramp-day's billable savings at $1,200 blended rate — well below psychological threshold |
| Seats per engagement avg | 5 | Pod-sized |
| Per-seat upsell | $40/mo | Wedge price; agencies are seat-price-sensitive |
| Layer B export premium | $2K one-time per engagement-end | Captures the "deliverable" upside |
| ACV (run-rate) | ~$72K/yr | (10 × $400 + 10 × 5 × $40) × 12 |
| Plus episodic export revenue | ~$24K/yr | Assuming 12 engagements close/yr per account |
| **Realistic ACV** | **~$96K/yr** | |

That ACV is healthy in absolute terms, but the **shape** is the problem. Engagement churn is not a tail event — it is the *business model*. A mid-tier consultancy ends and starts engagements continuously, so our usage-license MRR breathes in and out with their book. The alternative treats per-engagement licensing as if it were per-seat SaaS. It is not. It is closer to a metered contract, and metered contracts have:

- **Higher gross revenue retention volatility** (engagements end, so the meter ticks down even if the customer loves the product)
- **Lower NRR ceiling** unless we cross-sell hard — and the cross-sell surface inside an agency is narrow
- **Forecasting nightmares** at small N — the first 20 agency accounts will look like a sawtooth, not a SaaS curve, which kills the next-round narrative

**CAC payback math — the part that worries me most:**

The alternative says "partner-led, anchored by a flagship network." Translation in CFO language: **founder-led enterprise sales with 9-18 month cycles, $30-60K fully-loaded CAC per account, no PLG funnel.** At $96K ACV and ~70% gross margin (more on margin below), gross profit per account is ~$67K. At $45K CAC midpoint, **CAC payback is ~8 months — but that assumes 100% of seats and engagements are billed on day one**, which never happens in agency lands. Realistic payback is **14-18 months**. That is fine for an enterprise SaaS company with $20M ARR; it is dangerous for a pre-revenue substrate company with an 18-month winning condition window.

Compare to the devtool wedge (#1): bottom-up adoption, sub-$10K CAC, payback measured in quarters not years. The agency bet's CAC payback alone disqualifies it as an anchor, which Greg's triage already concluded — but I want it on record from the finance side.

---

## Gross margin — the silent killer the alternative did not name

Per-engagement licensing in a multi-tenant context means **per-engagement infrastructure cost**: every Layer B corpus is an isolated tenant slice with its own retrieval index, its own access control, its own audit trail (because agencies have contractual data-isolation obligations to their clients). At scale, that is:

- Higher compute-per-dollar-of-revenue than a pure per-seat SaaS (every active engagement burns retrieval + embedding + LLM tokens even when seats are quiet)
- Per-tenant operational overhead (provisioning, isolation testing, export pipelines)
- Layer B export-to-client is a *services-flavored* delivery — somebody has to validate the export, scrub agency-internal context, sign off on data hygiene

Realistic gross margin in steady state: **60-70%, not the 80-85% the devtool or regulated paths would deliver.** Over a 50-account portfolio, that is a 10-20 point gross margin compression versus the anchor bet. On $5M ARR that is $500K-$1M in gross profit *gone* — which, at our stage, is a full engineer-year of runway.

The alternative says "multi-tenancy isolation is unbuilt engineering work" but treats it as a one-time build cost. It is not. It is a **permanent gross-margin tax**. That tax has to be on the model.

---

## ARR shape and capital efficiency

The agency path produces ARR that is:

- **Lumpy** — engagement-driven, not seat-driven
- **Mid-ACV but high-touch** — sales-led, account management overhead per logo
- **Concentrated** — 50 mid-tier agencies is a *tiny* logo count; one churned flagship account is 2-5% of ARR
- **Geographically/culturally bounded** — agency partner peer networks (Bureau of Digital, SoDA) are predominantly North American and Western European, which violates the diversity-of-perspective goal and concentrates currency risk

Capital efficiency: this segment **requires building multi-tenancy first** before producing one dollar of revenue. The devtool wedge produces signal (and likely revenue) on the existing architecture. The agency bet asks for a capital outlay (engineering quarters spent on isolation + audit + export) **before** the first sale. From a finance-discipline standpoint, that is a worse bet than a self-serve devtool wedge that monetizes on the architecture we already have.

---

## RISK NOT NAMED — the partner-comp absorption problem

This is the risk only finance is positioned to see, and it does not appear in the alternative or in Greg's triage.

**Agency partners are taxed on profit distributions, not on revenue.** When a partner-led consultancy adopts internal infrastructure that does not directly produce billable hours, the cost comes out of **partner distributions in the current quarter**. There is no separate "infrastructure budget" — agencies typically run on 12-18% net margin after partner draws, and any non-billable software spend reduces draws dollar-for-dollar.

This creates a buying pattern the alternative completely misreads:

1. **The buyer is also the person paying out-of-pocket.** A practice lead signing a $96K/yr contract is taking $96K out of *their own annual distribution* in year one (before any ramp-time savings show up in cash). That is fundamentally different from a salaried CTO at a devtool company expensing $96K against an opex budget they do not personally own.
2. **The savings show up in *fewer non-billable hours*, not in *more revenue*.** Ramp-time savings convert to billable capacity only if there is demand to absorb the capacity. In a contracting agency segment (the alternative admits this), the saved hours often become *idle* hours — which means the ROI math the partner runs in their head is "I am paying $96K in cash to make my people less busy."
3. **Year-one cash flow is negative for the partner personally.** Most partners will not absorb that voluntarily. They will either (a) pass the cost through to clients as a markup line item (which most MSAs prohibit or make awkward), (b) take it from staff bonus pools (which kills the "people first" buyer reputation), or (c) defer adoption to "next year when we are bigger." Option (c) is the dominant outcome and is invisible until renewal time.

**Concrete consequence:** Our ARR forecast will look healthy in pipeline (logos engaged, contracts circulating) but show **3-6 month delays at close for partner-comp reasons that no AE will surface** — because the partner does not want to say "I cannot personally afford this right now." We will misread it as "long sales cycles" and overinvest in champion-building when the real lever is reframing the commercial structure (e.g., contingent pricing tied to realized billable-rate uplift, or per-engagement billing the partner can pass through to the client engagement budget as a recoverable expense).

Neither Greg's triage (which named structural margin pressure) nor the alternative (which named agencies as "bad buyers of internal infrastructure") got specific about *why* the buying behavior is broken. The reason is partner-distribution mechanics, and it is fixable only with a pricing innovation, not a positioning one.

---

## UPSIDE UNDERSOLD — Layer B export as a billable deliverable changes the gross margin story

The alternative correctly identifies "Layer B export to client at engagement end" as Constraint-1-friendly (turns substrate from lock-in into deliverable). It then prices it as a "premium" — implying a modest upsell.

It massively undersold this.

**If the Layer B export is a billable deliverable inside the agency's own MSA**, it is not our revenue line item — it is a **billable hour multiplier for the agency itself**. The agency charges the client (at the agency's blended rate) for the "context handover artifact" the substrate produces. That moves our cost from "internal infrastructure spend the partner absorbs" to "a tool that *makes* billable hours."

The unit economics implication:

- Agency P&L changes: substrate cost becomes a passed-through expense, not a partner-comp absorption, which **eliminates the risk-not-named above**
- Our ACV ceiling rises: we can charge per-export premium of $5-15K (anchored to 20-40 billable hours of "context engineering work" the agency would otherwise do manually), not $2K
- **NRR shifts from <100% (engagement churn drag) to >120%** because export revenue compounds with engagement *volume*, not engagement *retention*. An agency that closes 24 engagements/year buys twice as many exports as one closing 12 — even at flat seat count.
- Gross margin on exports is high (80%+) because the marginal cost is compute, not human review, if we automate the export pipeline correctly

This is the only path I can see where the agency bet produces ARR shape competitive with the devtool wedge. The alternative buried it in a one-line monetization bullet. **Treat the export as the primary product, the license as the entry point.**

Also undersold: the **portfolio benchmark** value. Once we have 10+ agencies running Layer B per engagement, we have a uniquely valuable dataset — anonymized, properly governed — about *which kinds of context investments correlate with engagement renewal*. That is a defensible analytics product an agency network would pay six figures for, and it does not require any of the multi-tenant federation work that killed `network-effects__agency-networks` in triage. It is single-tenant aggregation over our own data. Diana (CAO) would build this in six weeks once the corpus exists.

---

## What "probe" looks like, financially

I will sign off on **one design-partner motion**: $30-50K of engineering cost to build a minimum-viable multi-tenancy slice (logical isolation, not full vault-grade), $20K of CRO/CMO outreach to land one mid-tier flagship, **with two explicit gates**:

1. **By month 3:** signed design-partner contract with at least one paying engagement at $400+/mo license and explicit commitment to test the Layer B export workflow at engagement end.
2. **By month 6:** measured ramp-time delta with hard timesheet evidence (not partner anecdote) AND a draft commercial structure that solves the partner-comp absorption problem (most likely: per-engagement billing pass-through clause in their MSA).

If both gates pass, we scale a small partner-led motion in parallel with devtool. If either gate misses, we kill the agency bet and reallocate the engineering quarters to deepening the devtool wedge. Total downside exposure: ~$70K capital and one engineering-quarter — well within the envelope, and the learnings (multi-tenancy patterns, export pipelines) are transferable to the regulated triad if the agency path dies.

I will not approve full GTM allocation. The CAC payback math and ARR shape do not justify treating this as an anchor or co-anchor. It is a probe — and the probe's success criteria are the export-as-deliverable hypothesis and the partner-comp-pricing solution, not the ramp-time ROI the alternative leads with.

---

## Output contract

```json
{
  "alt_id": "jobs-to-be-done__agency-networks",
  "role": "cfo",
  "viability_score": 5,
  "market_growth_score": 4,
  "risk_not_named": "Agency partners are taxed on profit distributions, so internal-infrastructure spend comes directly out of current-quarter partner draws. The buyer is also the person paying out-of-pocket in cash, while ramp-time savings convert to fewer non-billable hours rather than more revenue — which means year-one personal cash flow is negative for the partner signing the contract. This produces 3-6 month invisible close-delays that look like 'long sales cycles' but are actually partner-comp absorption resistance; the fix is a pricing innovation (per-engagement pass-through to client MSAs), not a positioning one.",
  "upside_undersold": "Layer B export-to-client is priced as a 'premium' but should be the primary revenue line. If structured as a billable deliverable inside the agency's MSA (charged to the client at the agency's blended rate as 'context handover'), it converts substrate cost from a partner-comp absorption into a billable-hour multiplier, eliminates the buying-behavior risk, raises NRR above 120% by compounding with engagement volume rather than retention, and produces 80%+ gross margin episodic revenue. Combined with a single-tenant cross-account benchmark product (no federation required), this is the only path where agency ACV shape competes with the devtool wedge.",
  "verdict": "probe"
}
```
