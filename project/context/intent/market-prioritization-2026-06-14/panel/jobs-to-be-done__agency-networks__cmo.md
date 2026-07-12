# Panel deep-score: jobs-to-be-done__agency-networks — CMO lens

**Scored by:** CMO (M3, Medellín)
**Date:** 2026-06-14
**Alternative:** `jobs-to-be-done__agency-networks`

## Lens

Market context, positioning, competitive narrative, brand differentiation, launch viability — would I, as the person responsible for how this product enters the world and what people believe about it, sign off on the team executing this direction?

## What the alternative gets right (from my chair)

- The JTBD sentence — "make the receiving pod sound institutionally competent on day three, not week three" — passes the "so what?" test in one read. That is a positioning gift; most alternatives in the batch require three rewrites to get there.
- The ROI math (ramp days × realized billable rate) is partner-credible and number-anchored. Messaging can lean on a real economic delta, not a vibe.
- The Layer-B-exportable-to-client mechanic is a genuine anti-lock-in differentiator that can headline a positioning statement (most B2B substrate plays cannot make this claim).
- Partner-led peer-network GTM (Bureau of Digital, SoDA) is the correct channel for this buyer. Agency partners do not buy from cold outbound; they buy from each other.

## Scores

- **Viability (CMO sign-off): 6/10.** The positioning is sharp and the GTM motion is well-understood, but two unresolved problems block sign-off (see Risk below). I would not approve a launch into this segment without an explicit decision on whose brand goes in front of the end client.
- **Market growth potential (CMO read): 5/10.** The job grows; the segment-as-buyer shrinks; the underlying client-via-agency channel expands enormously if played right (see Upside). Net 5 reflects the tension.

## Risk not named — category collision and brand invisibility

Agencies already own a deeply entrenched mental model for "the thing that ramps a new pod." It is called *the playbook* or *the methodology*. Every credible agency carries a methodology brand — Pivotal Labs' "lab method," IDEO's "design thinking," Thoughtworks' "patterns," ustwo's "studio process." That methodology brand is partner identity, recruiting tool, and pricing-power lever. It is not negotiable.

Selling team-sdk into this segment forces a binary:

- **Option A — we keep our brand visible.** We are now competing with the partner's methodology brand, which is the asset their margins rest on. They will reject the framing or smother it in their own wrapper.
- **Option B — we go white-label and carry their methodology.** Adoption is easier, but our positioning statement is *owned by the agency*. Every win is anonymous. The case study is gated by partner approval and routinely denied (NDA, competitive sensitivity, "we don't want our clients to know our tooling stack"). We become invisible infrastructure.

This matters specifically because our 18-month winning condition depends on **publicly observable friction-delta signal** — the devtool bet's whole leverage. The agency segment is structurally a *brand-invisibility tax* paid against that compounding narrative engine. Every other top-10 alternative can produce a logo, a screenshot, a public retro link, a `_signals.jsonl` snippet from a named team. Agencies, by trade-craft and contract, cannot. The alternative names multi-tenancy and consolidation as risks; it does not name that **the marketing economics of this segment are anonymized by construction**, which is a different and more serious problem for a category-creation play in year one.

## Upside undersold — Layer-B-exportable as the actual GTM motion for downstream segments

The alternative treats the "export Layer B to client at engagement end" as a Constraint-1-friendly feature that converts lock-in into a deliverable. That framing is correct but small. The real CMO read:

**Every successful agency engagement ends with the end client receiving a working, domain-populated team-sdk corpus — fully shaped to their business, full of judgment artifacts, operationally live — that the client did not pay us to build.**

The agency, billing at agency rates, has performed our customer onboarding for us. The client (who is not an agency — they are a real product company in devtool, regulated enterprise, fintech, healthcare, etc.) is now sitting on a substrate they already depend on. From this state two things become available that no other top-10 alternative produces:

1. **Direct conversion path.** The client either continues paying team-sdk to maintain the corpus (annuity revenue we did not have to acquire) or hires their next pod into the substrate (seat expansion we did not have to sell).
2. **Trojan-horse distribution into the segments we are already attacking.** Devtool clients of consultancies are *exactly* the segment #1 anchors on. Regulated-enterprise clients of consultancies are #2 and #3. The agency play, structured this way, becomes a **paid distribution channel into the segments where our brand-visible compounding narrative actually works**.

The alternative scores itself V7/G5 and treats the agency segment as a bounded, modestly-growing diversification bet. From the CMO chair, structured as a downstream-distribution motion rather than a terminal revenue motion, this is the only top-10 alternative that *expands* the effective TAM of every other top-10 alternative. That is undersold by an order of magnitude in the original write-up.

## Positioning implications (what I would write if this went forward)

For the *agency partner* audience: "team-sdk is the substrate your pods carry into every engagement so a new hire is fluent on day three and the client owns it on day ninety." (JTBD-shaped, anti-lock-in claim leading.)

For the *downstream client* audience, post-engagement: "Your team already runs on team-sdk. Keep the corpus your last pod built; let the next pod inherit it." (Conversion-shaped, agency-distributed.)

The methodology-brand collision is resolved by explicitly positioning team-sdk as **the substrate that carries any methodology**, including theirs. We are not the playbook. We are what the playbook runs on. This is the only positioning that survives Option A vs Option B above.

## Launch viability constraints

- **Cannot launch without multi-tenancy isolation shipped and externally attestable.** The "Layer B per client, exportable" claim is table-stakes; if it fails once, the segment closes. The alternative names this; I am underscoring it as a *messaging blocker*, not just an engineering blocker. We do not own this segment's category-claim until the isolation story is provable in a one-page security brief.
- **Cannot use anonymized case studies as the primary proof artifact.** They will not compound. The launch sequence must include at least one named-client export-handoff that the client agrees to co-publish — this is the single hardest GTM ask in the segment and must be locked with the first design-partner agency before signing.
- **Cannot anchor company narrative here.** The brand-invisibility problem means agency wins are revenue but not narrative. The narrative engine must come from #1 (devtool) or #4 (zero-to-one observability framing); agency is a parallel revenue track, not a story track.

## Verdict — probe

The job is real and the export-to-client lever is, structured correctly, a category-creation gift worth a design-partner motion in parallel with the devtool wedge. But this cannot be an anchor bet from a marketing standpoint: brand invisibility and methodology collision make it a poor compounding-narrative segment, and the downstream-distribution upside requires us to deliberately design the engagement contract and the post-engagement conversion motion *before* we sell the first agency, not after.

**Probe shape I would approve:** One flagship mid-tier agency design partner, structured with (a) co-publishing rights on the case study locked at signature, (b) Layer B export contract that includes the client-side conversion handoff team-sdk runs directly, (c) multi-tenancy isolation shipped before any second agency signs. If those three lock, we have a non-correlated revenue stream AND a paid distribution channel into segments #1/#2/#3. If any of the three slips, kill and reinvest in the devtool wedge.

## Output contract

```json
{
  "alt_id": "jobs-to-be-done__agency-networks",
  "role": "cmo",
  "viability_score": 6,
  "market_growth_score": 5,
  "risk_not_named": "Category collision + brand invisibility — agencies already own the 'methodology brand' (Pivotal lab method, IDEO design thinking, Thoughtworks patterns) which is their pricing-power lever; we either compete with it (rejected) or hide behind it (anonymized wins, denied case studies, no compounding narrative). Every other top-10 alternative produces a public logo/screenshot/_signals.jsonl artifact; the agency segment is structurally anonymized by trade-craft and contract, taxing the publicly-observable friction-delta signal that the 18-month winning condition depends on.",
  "upside_undersold": "Layer-B-exportable-to-client is undersold as a feature when it is actually the GTM motion. Every successful engagement ends with the end client (a real product company in devtool/regulated/fintech) sitting on a working, domain-populated team-sdk corpus the agency paid to build. That converts the bounded agency-segment TAM into a paid distribution channel into the unbounded downstream segments we attack with #1/#2/#3 — the only top-10 alternative that expands the effective TAM of every other top-10 alternative rather than diversifying alongside them.",
  "verdict": "probe"
}
```
