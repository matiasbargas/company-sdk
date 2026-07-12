# Panel score — `blue-ocean__devtool-companies` — CEO (Greg)

**Role lens:** strategic clarity, 18-month winning condition, what to NOT build, the bet that shapes the company.
**Date:** 2026-06-14
**Anchor:** 50 paying teams by Dec 2027 with `_signals.jsonl` showing ≥30% friction reduction Q-over-Q for two consecutive quarters.

---

## Viability from CEO domain: 7/10

Would I sign off on the team executing this direction? Yes, conditionally — and only as the **category-creation narrative stream** within the devtool wedge cluster (top-10 slots #1, #4, #5, #8, #9), not as a standalone bet.

What earns the 7:
- The Eliminate/Reduce/Raise/Create discipline produces a **product-marketing skeleton** the other devtool alternatives don't generate. "Eliminate the standalone retro tool / orphaned ADR repo" is a one-sentence buyer-identification line. That is rare and load-bearing.
- The "operating substrate of the team that ships your favorite dev tool" positioning is a **legitimate category claim** that lets us refuse adjacent categorizations (knowledge management, project management, AI copilot) without sounding defensive. Saying what we are not is half the CEO job.
- The dogfood-as-marketing mechanic ladders directly to the winning condition: design-partner `_signals.jsonl` summaries published quarterly *are* the proof the substrate works. Marketing and product-truth collapse into the same artifact. That alignment is strategically clean.

What costs the 3:
- The honest weakness in the file (lighthouse fragility — "one design partner abandoning publicly does more damage than ten quiet wins") is a **company-shaping risk**, not a marketing risk. We would be operating a business whose narrative depends on the goodwill of 3-5 outside CTOs we don't control. That is a category-creation tax I would only pay if the design-partner sequencing is owned at C-suite level from day one.
- Blue Ocean as a framework rewards category creation, but **categories take 24-36 months to stick**, and our window is 18. We can produce the skeleton; we cannot rely on the category to do the closing work inside the window.
- The framework is silent on what we do when the first design partner asks for a feature that violates Constraint 1 (Layer A as recruiting weapon means *we* hold the published values bar — and lighthouses will want to bend it).

I would sign off on this as one of five parallel devtool streams. I would not sign off on it as the lead narrative.

## Market growth potential from CEO domain: 6/10

Match the self-score. The dev-tool segment is finite (~2000 serious companies) and category-creation growth is non-linear (S-curve, late inflection). For an 18-month winning condition measured in 50 paying teams with observable friction-delta curves, the blue ocean *as growth driver* arrives late.

However: per-account compounding through technical-hiring and conference distribution is real. A team that lands 5 lighthouses by Q2-2027 gets disproportionate inbound through LeadDev/QCon/KubeCon channels. The growth shape is **plateau-then-spike**, not steady. Strategic CEOs price plateau-then-spike at 6, not 7, because the plateau eats most of our window.

## Risk the alternative did not name

**The lighthouse-CTO-leaves-the-company risk.** The file admits lighthouse fragility but frames it as "design partner abandons team-sdk." The deeper risk: VP Eng / Head of Platform at design-partner companies **turn over at 18-24 month cadence**. Even a fully committed lighthouse champion who loves the substrate will be at a different company before our winning-condition deadline. The substrate stays; the public dogfood signal evaporates the day the champion's title changes on LinkedIn. Their successor inherits a tool they didn't choose and a public commitment they didn't make. Probability of at least 2 of 5 lighthouse champions departing inside 18 months is realistically 60-70% based on industry tenure data. The alternative treats champions as durable; they are not. **Mitigation requires institutionalizing the dogfood at the engineering-org level (team rituals, PR templates, onboarding docs) so the substrate survives a champion change — and that institutionalization is itself a 6-9 month project per lighthouse.** This is the bet that shapes the company: we are not selling to CTOs, we are infiltrating engineering org muscle memory before champions rotate.

## Upside the alternative undersold

**Layer A (Constraints + Soul) published as queryable engineering values is a CEO-grade asset, not a recruiting bullet.** The file mentions Layer A becomes "the company's published engineering values, queryable by every agent and every new hire" and treats it as a recruiting weapon. That undersells the strategic value by an order of magnitude.

Engineering values today are PDFs nobody reads. A *queryable, agent-enforced* values corpus means: every PR review automatically references the published constraint; every architectural decision logged to `history.md` is a public record of how the company's stated values actually shaped a real call; every irreversible decision becomes a values-in-action artifact discoverable from the outside. This is the first time in the history of engineering organizations that **stated values and operating behavior are queryable as the same artifact**. For a CEO trying to recruit, retain, and signal trust to a market that has watched 5 years of engineering-values-washing, this is not a "raise" axis on a Blue Ocean canvas — this is a **strategic differentiator with zero competitors and zero adjacent substitutes**. It is the only thing on this canvas that is genuinely unreplicable inside 24 months. The author treated it as a tactical recruiting win. It is a company-shaping moat — possibly the deepest moat in the entire top-10.

## What to NOT build (CEO mandate if we proceed)

- Do **not** build a "team-sdk for dev-tool companies" SKU. The substrate is the substrate. Vertical SKUs are how horizontal categories die.
- Do **not** publish design partner `_signals.jsonl` summaries without an editorial bar owned by Greg + CMO. One sloppy summary destroys 3 lighthouses of compounding.
- Do **not** chase the IDE-maker buyer first. IDE companies have the strongest NIH reflex. Lead with observability or CI/CD where the buyers are already comfortable adopting opinionated infrastructure.

## 18-month winning condition contribution

This alternative contributes the **product-marketing skeleton** (Eliminate/Reduce/Raise/Create) and the **category claim** ("operating substrate of teams that ship your favorite dev tool"). Both are exportable to bets #1, #4, #5, #9. As an independent revenue path it delivers maybe 5-10 of the 50-team target. As a narrative engine that lifts the other devtool bets, it is high-leverage.

## Verdict: probe

This is a **narrative-stream probe**, not a standalone go. Run a 90-day probe in parallel with the disruption-led devtool bet (#1) to test two specific hypotheses:
1. Will 2 of 5 invited lighthouse VPs publicly commit to quarterly `_signals.jsonl` summaries inside 90 days? (If yes → upgrade to go and own the dogfood editorial bar at C-suite level.)
2. Does the queryable-Layer-A demo land with engineering-org leaders as a moat-grade differentiator (≥3 of 5 ask "can I use just this part")? (If yes → that becomes the wedge, not the category positioning.)

Kill if neither hypothesis lands by day 90. Go if either lands cleanly. The probe is cheap because the marketing skeleton work is reusable across the whole devtool cluster regardless of outcome.

**Strategic call:** the category-creation bet is real but the lighthouse-champion-tenure risk is structural and not mitigated in the file. We adopt the framework's product-comms output, we own the champion-tenure problem as a CEO-level risk, and we let the disruption bet (#1) lead the wedge while this one supplies the narrative architecture.
