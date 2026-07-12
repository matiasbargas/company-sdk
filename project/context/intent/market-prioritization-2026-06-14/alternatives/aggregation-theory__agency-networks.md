# Alternative: Aggregation Theory (Thompson) × Agency networks / product consultancies running multiple client teams

**Framework:** Aggregation Theory (Thompson)
**Segment:** Agency networks / product consultancies running multiple client teams
**Generated:** 2026-06-14

## The market direction in one sentence

Practice leads at multi-client product consultancies adopt team-sdk as the cross-engagement substrate that aggregates demand for senior judgment by owning the relationship with every client team and modularizing the staffing upstream.

## What the framework reveals about this segment

Aggregation Theory says the winner is whoever owns the customer relationship at zero marginal cost and uses that ownership to commoditize the suppliers behind them. In an agency network, the partner/practice lead is structurally a *relationship aggregator already*: they own the client-team trust, and they swap in interchangeable senior practitioners (strategists, PMs, tech leads) behind that trust. The pain is that the "supplier" — senior judgment — is not actually interchangeable today, because each client team carries tacit context that evaporates between engagements and between staffed humans. team-sdk's Layer A/B/C corpus is the modularization layer: it lets the partner aggregate demand ("you're hiring our practice") while commoditizing the upstream ("any senior we staff plugs into the client's living substrate on day one"). The corpus, not the human, becomes what the client is renting continuity from.

## The team-sdk value proposition for this segment, via this framework

The configuration that lands: multi-tenant Layer B per client engagement (each client team's domains, decisions, constraints live in their own corpus the partner holds in escrow), Layer A shared across the practice (the agency's house principles, quality bars, Halloway Ratchet doctrine), and a cross-engagement signals layer where `_signals.jsonl` patterns flow up to practice-lead dashboards. The four-cadence metabolism (loop → daily → sprint → quarterly) maps cleanly onto agency billing cycles. Section 32 Critique-Revise loops become the agency's defensible "senior review" deliverable productized. The Bus protocol with BU lead routing is sold as "your engagement never loses context when we rotate staffing." What the partner sells the client is no longer hours — it is *continuity-of-judgment-as-a-service*, with team-sdk as the substrate that makes the claim true.

## GTM motion implied

Partner-led with a community overlay. Aggregation requires direct relationships with the aggregators themselves — meaning we sell to ~200-500 practice leads at top product consultancies (Thoughtworks, Pivotal-descended shops, regional design+build firms, Crew/Toptal-adjacent networks) one conversation at a time, because each one owns a portfolio of client relationships we instantly inherit. A complementary community motion runs in parallel: a Practice Leads Council where partners share anonymized `_signals.jsonl` patterns, which simultaneously fuels word-of-mouth and creates network effects across the aggregation tier itself. Bottom-up adoption by individual consultants is explicitly blocked — the value only compounds when the partner owns the corpus across engagements.

## Monetization shape

Hybrid: per-active-engagement license (the multi-tenant unit) + practice-wide platform fee tied to consultant headcount, with a value-based kicker on engagement renewal rate lift.

## Honest weaknesses of this alternative

The combination is forced in one structural way: Aggregation Theory's textbook examples (Google, Netflix, Uber) own a *consumer* relationship at internet scale with zero marginal cost — agencies are a B2B2B aggregator with very high marginal cost per relationship and ~hundreds, not millions, of aggregators globally. We are not building Aggregation Theory's canonical shape; we are using it as a lens on a niche tier. Also: agencies have a deep, rational incentive to resist commoditizing their senior judgment — the very thing team-sdk's modularization promises. Selling "we make your seniors more interchangeable" to a partner whose pricing power rests on the opposite belief is a knife-edge pitch. Finally, multi-tenant data isolation is non-negotiable for this segment and adds engineering surface team-sdk has not yet shaped.

## Self-score (rough, will be re-scored by triage agent)

- Viability (0-10): 6. The buyer is reachable and the pain is acute, but the pitch contradicts the partner's pricing-power instincts and requires winning multi-tenant before product-market fit.
- Market growth potential (0-10): 5. The aggregator tier is small (~500 global accounts) and growing slowly; ceiling is real even with strong penetration, though each account carries 5-50 downstream client teams.

## Output contract

Return ONLY:

{ "id": "aggregation-theory__agency-networks", "one_sentence": "Practice leads at multi-client product consultancies adopt team-sdk as the cross-engagement substrate that aggregates demand for senior judgment by owning the client relationship and modularizing staffing upstream.", "viability_self_score": 6, "market_growth_self_score": 5, "gtm_motion": "partner-led with practice-leads community overlay", "monetization": "hybrid: per-engagement license + practice platform fee + renewal-lift kicker", "honest_weakness": "The pitch asks partners to commoditize the senior judgment their pricing power rests on, and the aggregator tier is hundreds — not millions — of accounts, so the Aggregation Theory shape is being used as a niche lens rather than its canonical consumer-scale form." }
