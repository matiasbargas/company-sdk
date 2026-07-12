# Alternative: Jobs-to-be-Done × AI labs / research orgs

**Framework:** Jobs-to-be-Done
**Segment:** AI labs / research orgs
**Generated:** 2026-06-14

## The market direction in one sentence

AI labs hire team-sdk to make every research claim auditably reproducible by encoding the lab's reasoning chain, dissent, and provenance into a queryable substrate co-owned by humans and agents.

## What the framework reveals about this segment

The JTBD lens cuts past the obvious "labs need orchestration" framing. The real job an AI lab hires tooling for is not "coordinate agents" — they already have bespoke harnesses for that. The functional job is **"preserve the chain of reasoning from hypothesis to published claim such that any reviewer (internal, external, future-self, regulator) can interrogate it."** The emotional job is **relief from the dread of an unreproducible result surfacing post-publication.** The social job is **prestige earned through visible rigor** — being the lab whose methodology other labs cite as the standard. Current alternatives (Weights & Biases, lab notebooks, ad-hoc Notion pages, custom Python harnesses) handle artifact storage but fail at the reasoning-chain job: they capture what was run, not why, what was dissented, what was discarded, or who challenged whom. The job is being underserved precisely where team-sdk is strongest.

## The team-sdk value proposition for this segment, via this framework

The configuration that lands hardest: Section 24 Halloway Ratchet doctrine reframed as **a research provenance ledger** — every claim, every revision, every retracted line traceable through `history.md`. The Section 32 Critique-Revise and Red-Team loops become **adversarial peer review as a default substrate behavior**, not an event. The Bus protocol (FROM/TO/PRIORITY) becomes the **citable record of internal dissent** — when a junior researcher challenges a senior's framing, that exchange is part of the published methodology, not lost in Slack. Layer B becomes the lab's **shared domain understanding** of its research direction, queryable by any agent or human onboarding to a project. The four cadences map naturally onto experiment → daily-standup → paper-sprint → quarterly-research-review. This is the rare segment where team-sdk's full doctrinal weight is an asset, not overhead.

## GTM motion implied

**Community-led, with prestige seeding.** Labs do not respond to outbound. They respond to other labs they respect adopting something first. The motion: open-source the substrate fully, seed adoption with 2-3 mid-tier labs willing to publish methodology papers that *cite team-sdk as their reasoning infrastructure*, then let the prestige cascade. Workshop presence at NeurIPS / ICML / ICLR. The framework demands community-led because JTBD says the social job (prestige) is co-equal with the functional job — and prestige cannot be sold, only earned through visible peer adoption.

## Monetization shape

Hybrid: open-source core + paid hosted ledger / compliance-grade provenance attestation for labs publishing under regulatory scrutiny (EU AI Act, NIST). Substrate evolution contributions flow back free.

## Honest weaknesses of this alternative

The (JTBD × AI labs) pairing is awkward in one specific way: JTBD presumes a *purchase decision* made by an identifiable buyer hiring the product for a job. Research labs do not buy infrastructure this way — adoption is bottom-up by individual researchers, ratified by PIs months later, and rarely tied to a budget line. The "job to be done" framing is real, but the "hire" verb is metaphorical. Additionally, labs may prefer to *build their own substrate as a research contribution* rather than adopt one — meaning team-sdk competes with the lab's own publication incentives. The segment's willingness-to-pay is moderate, capping monetization upside even at full adoption.

## Self-score (rough, will be re-scored by triage agent)

- Viability (0-10): 6. Strong product-job fit and prestige tailwind, but monetization ceiling and bottom-up adoption velocity cap near-term ARR.
- Market growth potential (0-10): 7. AI lab count and per-lab tooling spend both growing fast through 2027, and provenance becomes regulatorily mandated, which expands the job's urgency.
