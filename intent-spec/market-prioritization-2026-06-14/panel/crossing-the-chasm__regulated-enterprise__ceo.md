# CEO panel score — crossing-the-chasm × regulated enterprise

**Role:** Greg (CEO)
**Alternative:** `crossing-the-chasm__regulated-enterprise`
**Date:** 2026-06-14
**Lens:** strategic clarity, 18-month winning condition, what to NOT build, the bet that shapes the company.

---

## Strategic stance in one paragraph

This is a real, fundable, executable wedge — and it is also the bet most likely to reshape the company into something other than what `_product-vision.md` promised. The Tier-2 AI Model Risk & Governance lead at ~800 BFSI/health-payer institutions is a sharper beachhead than I expected to see in this batch, and the 2027 audit cliff is a once-a-decade timing window. But the winning condition is **not** revenue — it is "50 teams whose `_signals.jsonl` shows ≥30% friction-reduction Q-over-Q for two consecutive quarters." A regulated buyer who buys for audit evidence will not generate that signal even when they pay us. We could clear ACV plan and miss the winning condition entirely. That is the tension I have to score against.

## Scores

### Viability from CEO lens: **6/10**

I would sign off — conditionally — but I would not let this be the *anchor* bet. The conditions:

- It runs as the **revenue grounding bet (second priority)**, paired with #3 (Christensen-disruption bottom-up) as the file already implies. Not the front of the company.
- 3 named design-partner accounts close inside 6 months, or we pause the field motion and reconsider. The 6-18 month cycle is not survivable as a sole revenue path against a Dec 2027 deadline if the funnel doesn't move in H2 2026.
- Big-4 channel conversations open by end of Q3 2026, signed reseller agreement with at least one by Q1 2027. Without channel leverage, the per-deal CAC kills the math.
- Layer B is positioned as the judgment corpus first, audit artifact as byproduct — and that positioning discipline is enforced in every sales conversation. The first time a deck flips the order, we have started becoming a GRC vendor.
- We do not modify the substrate's data model to accommodate audit-export requirements. We can wrap, we can map controls, we can not bend Layer B into a compliance schema.

What lowers the score below an 8 (the self-score): the alternative's own admission — "the substrate has to be sold as a control framework first and a learning system second, which inverts the product's own self-description" — is the load-bearing risk. Inverted positioning at the sales tip leaks back into the roadmap within two quarters. I have seen this pattern destroy three product theses I respected. The triage call to pair this with #3 mitigates but does not eliminate.

### Market growth potential from CEO lens: **8/10**

The market is real and the timing is exact. EU AI Act compliance deadlines bite mid-2027. NYDFS Part 500 amendments are already in force. HHS AI-use audit guidance is published. Boards at Tier-2 institutions have a documented mandate and no defensible answer. ISO 42001 certification programs are ramping. The TAM is not the question; the *durability of growth past the beachhead* is. The alternative correctly notes saturation around 800 accounts before we need to jump segments — that is fine for the 18-month window but worth flagging as a 2028 problem the company will inherit. I score market growth one point above the self-score because the audit cliff is even sharper than the file frames it (multiple jurisdictions converging in the same 18-month window create compounding urgency the file treats as additive).

---

## Risk not named by the alternative

**The substrate becomes evidence in a regulatory action against our customer — and we are subpoenaed.**

The file names control-mapping, positioning drift, and beachhead saturation. It does not name the discovery-and-subpoena exposure. If team-sdk is the system of record for an AI Model Risk team's decision provenance, and that team's AI model causes harm (fair-lending violation, denied claim, biased adverse action), team-sdk's corpus is **the** discoverable artifact. Plaintiff's counsel will subpoena us — not just our customer — for the Section 24 Halloway Ratchet log, the Section 32 Red-Team transcripts, the dissent annotations from CISO and CLO agents. We become a third-party discovery target on every adverse-event matter our customers face. This requires:

- Customer-controlled keys / BYOK so we *cannot* produce the corpus on subpoena (we can only point at the customer).
- A data-processing agreement that explicitly makes the customer the controller and us the processor with zero retention.
- Cyber/E&O insurance scaled to a regulated-customer book before we sign deal #1.
- A legal review of every "audit-survived" case study before publication — because a published case study naming the customer is a roadmap for plaintiff discovery.

None of that is in the alternative. The Big-4 channel partner will surface this in week one of vendor risk review, and we will look unprepared. The CEO-level decision: do we architect for customer-controlled keys *before* taking the first regulated deal, or do we take the risk for early ARR and pay for it in legal cost and forced re-architecture later? I would architect first. That is a 3-6 month investment that delays the revenue case but protects the company.

---

## Upside undersold by the alternative

**Sales-led + Big-4 channel is the only motion that produces a CEO-grade reference book inside 18 months.**

The alternative scores this as "revenue grounding bet" and prices it at $80-150k land, $300-500k expand. That is the visible upside. The undersold upside is the **reference economy**: 3 audit-survived deployments at named Tier-2 banks, co-published with a Big-4 advisory practice, becomes the single most credible "this works" artifact the company will ever produce. That artifact:

1. Sells the devtool bet for us. The devtool segment will not buy on devtool references — they will buy on "if a regulated bank trusted this corpus for their AI Model Risk program, our PR-merge workflow is safe." Cross-segment credibility transfer runs *from* regulated *to* devtool, not the other way.
2. Sells the agency bet for us. Agency network buyers (Porter / JTBD pair, #6/#7) need to tell their *own* enterprise clients that the substrate is enterprise-grade. The Big-4 co-published case study is that proof.
3. Becomes the basis for a CEO-grade narrative we cannot build any other way. "team-sdk is the substrate of record for AI-augmented teams in regulated industries" is a sentence that opens every door — venture, board, executive search, distribution partners — and it is only earnable through this bet.

The CEO undersold this because the file is scoped to the segment's own ROI. The cross-segment narrative leverage is a strategy-layer asset the segment-layer analysis cannot price. That is the upside I see that the alternative's author could not.

---

## Verdict: **probe**

Not "go." Not "kill." **Probe.**

Specifically:
- Open conversations with 2 Big-4 advisory practices (Deloitte AI Risk + EY AI Assurance are my first picks) in Q3 2026. Question: would they channel team-sdk under their advisory engagement as the evidence layer.
- Open 3 design-partner conversations with named Tier-2 institutions (one Regional Fed-supervised bank, one state-supervised insurer, one regional health payer). Question: do they have a control-mapping budget line for FY2027.
- Architect customer-controlled keys / zero-knowledge corpus *before* signing deal #1. Treat this as a non-negotiable.
- Hold 18-month full commitment until the parallel devtool wedge (#1) shows a `_signals.jsonl` friction-delta curve from a real design partner. The devtool signal is the proof the substrate works; the regulated motion is the proof the company is fundable. We need both — but in that order.
- Decision trigger: if both Big-4 channels say no AND no design partner signs an LOI by end of Q4 2026, downgrade to "kill" and reroute that field investment into the agency pair (#6/#7). If either of those tests passes, upgrade to "go" on the paired-with-#3 plan.

The reason I am not at "go": the winning condition is friction-reduction signals, not revenue. A regulated buyer who pays us $300k and never opens the four-cadence loop has not advanced the winning condition. We need to know — before we commit field sales headcount — that the regulated buyer actually *uses* the substrate the way the substrate needs to be used to produce the signal. That is what the probe answers.

The reason I am not at "kill": the timing window for the 2027 audit cliff does not come around again. The reference economy is real. And `_product-vision.md` says "infrastructure for how a team represents and improves itself" — a regulated AI Model Risk team that adopts this *is* representing themselves more truthfully. The fit is not wrong, just narrow. Probing this carefully is the right call.

---

## Strategic clarity statement

If this bet wins, the company shape is: **infrastructure-grade context substrate for regulated AI-augmented teams, distributed through Big-4 advisory channel, with a devtool community wing for category credibility.** That is a real company. It is not the company the product vision wrote a love letter to, but it is not incompatible with the vision either.

If this bet wins *as the anchor*, the company shape is: **GRC vendor with an interesting underlying architecture.** That is a different company. The Owner deserves to choose which.

I would not let this be the anchor. I would let it be the revenue floor that the devtool anchor (#1) stands on.
