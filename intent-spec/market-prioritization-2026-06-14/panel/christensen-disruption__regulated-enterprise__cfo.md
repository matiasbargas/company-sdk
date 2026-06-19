# Panel score — christensen-disruption__regulated-enterprise (CFO lens)

**Scorer:** Valeria Amsterdam, CFO
**Date:** 2026-06-14
**Anchor:** 18-month winning condition — 50 paying teams by Dec 2027.

## Lens

Unit economics, CAC payback, runway implication, gross margin, ARR shape, capital efficiency. I read the numbers, then I read what the numbers do to runway.

## Scores

### Viability from the CFO domain: 5 / 10

The financial shape of this bet is structurally awkward and I would not sign off on it as the *anchor* spend without significant guardrails.

Why a 5, not lower:
- Open-source core + per-team evidence-pack monetization is a known shape with defensible gross margin (software COGS, no professional services trap *if* the framework packs are productized).
- Hybrid PLG-into-enterprise can produce a real CAC payback story *if* the bottom-up wedge actually closes a paid tier inside 9 months — which is the only payback window the 18-month winning condition tolerates.
- The "GRC feeds, doesn't replace" positioning preserves the small initial ACV that classical disruption requires — you can sell a $15K-40K per-pod evidence-pack subscription without triggering enterprise procurement.

Why a 5, not higher:
- **ARR shape is bimodal and the bottom mode is too small.** A per-pod-evidence-pack at $15-40K ACV needs ~1,250-3,300 paid pods to reach a meaningful ARR floor — and the disruption framing explicitly stays below the GRC budget radar until it surfaces, meaning the first 18 months we are stacking five-figure deals while burning enterprise-grade COGS (SOC 2 Type II, HIPAA BAAs, FedRAMP-adjacent posture, data-residency tooling). That is **negative gross margin until volume**, and volume is exactly what bottom-up motions in regulated segments deliver slowly.
- **CAC is mispriced in the file.** The alternative names "MRM consultancy partnerships" as a partner channel but does not cost it. MRM consultancies (Promontory, Treliant, Crowe MRM practice) take 20-35% of first-year ACV and require 3-6 months of joint enablement before they introduce a single account. That is a real CAC, not a free channel.
- **The "co-opt or block" risk is a financial risk, not just a strategic one.** When the CISO/CCO discovers the substrate is producing audit evidence, the realistic outcome 60% of the time is *not* expansion — it is a stop-work memo while procurement assesses, followed by either (a) a vendor risk gauntlet that delays revenue 6-12 months or (b) an internal mandate to migrate the evidence to the GRC platform of record. Either outcome turns a healthy net-dollar-retention curve into a churn cliff inside the 18-month window.
- **Right-to-erasure architectural debt is a balance-sheet item.** The append-only Layer B as personnel-attributable record creates a contingent GDPR/UK-DPA liability that, if a single supervisory authority complaint lands, eats 6-12 months of engineering at fully-loaded rates. That cost is not in the alternative's model.
- **Runway implication of FedRAMP for govtech is the killer line item I do not see acknowledged.** FedRAMP Moderate is conservatively $1.5-2.5M and 12-18 months for a first-time sponsor; FedRAMP High is $2.5-5M. The govtech sub-segment is structurally inaccessible without that spend, and the alternative names "govtech" in the segment title without naming the cost.

Net: viable as a *paired* bet with the chasm-regulated top-down play (#2 in triage) which carries the procurement gauntlet on enterprise ACVs, but not viable as a standalone capital-efficient bet on the 18-month clock.

### Market growth potential from the CFO domain: 7 / 10

The wave is real and the financial demand signal is strong:

- EU AI Act Article 12 logging, DORA ICT-risk evidence, FDA SaMD GMLP, FFIEC SR 11-7, NYDFS Part 500 — these are not soft trends; they are *budgeted line items* in 2026-2028 for BFSI, health-payer, and pharma CFOs. The model-risk-management software market is forecasted at ~20-25% CAGR through 2028 by every analyst I trust (and several I don't).
- WTP for audit-grade evidence is structurally higher than WTP for developer productivity — buyers route spend to risk-reduction faster than to efficiency.
- The "compliance budget is annual, not discretionary" feature of this segment is, from a CFO lens, a *gross margin gift*: annual prepayment improves working capital and reduces collections risk.

Why a 7, not a 9:
- The growth is concentrated in *frameworks* (EU AI Act packs, DORA packs) not in *teams*. Revenue-per-team is capped by team size, and regulated org structures have small ML/data-eng pod counts (3-12 pods per enterprise). The market grows but the per-account ceiling is lower than it looks.
- The growth window for the *disruption foothold specifically* closes faster than the broader market — AI-governance incumbents (Credo AI, Holistic AI, Fairly, Monitaur) are moving down into the team workflow, and the disruption window the alternative bets on is probably 18-24 months, not 36.

## Risk the alternative did not name (CFO lens)

**The framework-pack monetization model is a working-capital bear trap that will compress gross margin below SaaS norms within 18 months.** Every new regulatory framework (EU AI Act, DORA, FDA GMLP, FFIEC, HIPAA, NYDFS Part 500, state-level US AI laws, UK AI bill, Singapore AI Verify, Japan METI guidelines, CCPA AI amendments) requires an evidence-pack to be built, kept current as the regulation evolves, and *re-certified by a credentialed third party* for the artifact to be auditor-defensible. The cost structure is **product engineering + ongoing regulatory counsel retainer + Big-4 or boutique re-certification cadence**, recurring annually per framework. The file's "paid per-team evidence-export and framework-mapping packs" line implies these are productized once and sold many times — they are not. They are closer to a **regulatory consulting margin profile (40-55% gross margin) than a SaaS margin profile (75-85%)**, and that delta — 25-30 margin points — is the difference between a venture-fundable trajectory and a services-trapped one. The 50-team winning condition does not specify margin shape, but the *next* 50 teams will, and we will discover the trap exactly when we need to raise.

## Upside the alternative undersold (CFO lens)

**Annual-prepaid framework subscriptions structurally inflate ARR-to-cash ratio in a way that materially extends runway under typical SaaS funding multiples — and the regulated segment's procurement preference is *already* annual prepay.** The alternative monetizes as "per-team evidence-export and framework-mapping packs, plus per-seat enterprise tier" without naming the cash-flow shape. In this segment, that shape is: annual term, paid upfront, with multi-year discounts at 15-20%. For a company at our stage, $1M of annual-prepaid ARR is worth roughly $1M-1.2M of immediate cash plus durable revenue recognition, whereas $1M of monthly-billed devtool ARR is worth $80-90K of immediate cash and a 12-month deferred recognition curve. On the *same* ARR number, the regulated motion produces **6-12 months of additional runway** versus the devtool motion. That runway extension is a strategic asset the alternative treats as zero — it is the single biggest reason to keep this bet alive as a *paired* play with the devtool wedge, because the devtool wedge proves the substrate works and the regulated wedge funds the team that proves it.

## Verdict: probe

I would not kill this. The market growth signal is real, the cash-flow shape is genuinely good, and the bottom-up disruption foothold avoids the procurement gauntlet that kills most regulated SaaS plays in cycle 1.

But I would not go all-in either. The unit economics have three named-but-unpriced risks (MRM partner CAC, FedRAMP for govtech, evidence-pack recertification cost) and one unnamed margin trap (framework-pack services margin compression). Until those are modeled with defensible assumptions, this is a **probe** — fund 1-2 design-partner relationships at a regulated ML platform, instrument the actual CAC and evidence-pack production cost over one quarter, and re-score with real numbers before scaling spend.

Specifically: probe means **≤ 15% of the next two quarters' fully-loaded burn**, with a hard re-decision gate at the end of Q3 2026 against three quantitative criteria: (1) one signed paid design partner at ≥ $20K ACV, (2) measured evidence-pack production cost ≤ 20% of pack ACV at second pack, (3) named MRM partner with a written commercial term sheet. Miss two of three → kill. Hit all three → go.

## Agency check

This output makes the reader more capable of pricing a regulated GTM bet, not more dependent. It teaches the cost categories the alternative left implicit (FedRAMP, MRM partner economics, evidence-pack recertification) so a future PM, CRO, or CEO can re-do the calculation without me. Constraint 1 passes.
