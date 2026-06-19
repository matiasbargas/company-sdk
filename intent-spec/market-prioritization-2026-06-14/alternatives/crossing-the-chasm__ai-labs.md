# Alternative: Crossing the Chasm × AI labs / research orgs

**Framework:** Crossing the Chasm
**Segment:** AI labs / research orgs
**Generated:** 2026-06-14

## The market direction in one sentence

Frontier AI research groups adopt team-sdk as the provenance-and-peer-review substrate for multi-agent research programs, where every claim, critique, and revision is cryptographically traceable to its originating loop.

## What the framework reveals about this segment

Crossing the Chasm forces a brutal narrowing: the beachhead inside "AI labs" is not the entire segment but a specific tribe — the **interpretability and alignment research groups inside frontier labs (Anthropic Alignment, OpenAI Superalignment-successor teams, DeepMind Safety, plus aligned academic labs like MATS, Redwood, FAR AI)**. Their pain is acute and unique: they run dozens of parallel agent-based experiments where the *provenance of a hypothesis* is as load-bearing as the result. They currently bolt this together with W&B + Notion + Slack + ad-hoc red-team scripts. They are pragmatist-adjacent visionaries — they will adopt a substrate that makes their critique-revise loops first-class, and when they publish using it, the rest of the AI-native world follows because prestige flows downhill from these labs. The bowling pin: alignment teams → broader frontier-lab research orgs → applied-AI product teams at those same companies → AI-native startups.

## The team-sdk value proposition for this segment, via this framework

The configuration that lands: **Section 32 Critique-Revise and Red-Team loops as the headline feature, with the Halloway Ratchet (§24) reframed as "irreversibility guard for research claims."** Layer B becomes the *experiment context corpus* — every prompt variant, every eval result, every disagreement between agents is shaped evidence, queryable forever. The Bus protocol gives them what no existing tool does: a typed, structured record of agent-to-agent disagreement with full lineage. `_signals.jsonl` becomes the lab's friction ledger across studies. The 20+ agent roles are repurposed as *adversarial reviewer personas* — CISO becomes a safety-case reviewer, CLO becomes a publication-ethics reviewer, Mario becomes the irreversible-claim gate. The four cadences map cleanly onto how these teams already work: paper sprint, weekly readout, quarterly research direction review.

## GTM motion implied

**Community-led with sponsored beachhead seeding.** Crossing the Chasm in this segment is not sales-led — these orgs cannot be cold-emailed into adoption. The motion is: open-source the substrate (already true), publish a co-authored paper with one alignment team showing measurable improvement in critique-loop quality, sponsor a small grant program (5-10 labs, $25k each in compute + integration support), then let conference talks (NeurIPS, ICLR safety workshops) do the pulling. Visionaries publish using team-sdk; pragmatist labs follow because reviewer 2 starts asking "where is your provenance corpus?"

## Monetization shape

Hybrid: free OSS core + paid managed provenance/audit tier for labs that need SOC2-grade claim lineage + research grants as direct revenue from foundations (Open Phil, Survival and Flourishing).

## Honest weaknesses of this alternative

The combination is awkward in two places. First, Crossing the Chasm assumes a chasm exists between visionaries and pragmatists *within a buying market* — but AI labs are not really a "market" in Moore's sense; they are a prestige network where adoption decisions are made by individual researchers, not procurement. The framework strains. Second, the beachhead (alignment teams) is tiny — maybe 300 people globally — and their willingness to pay is genuinely moderate, not high. Winning them costs more than they pay. The bet only works if downstream pull (applied teams, startups) actually materializes, and that pull is theoretical until proven. There is also a real risk that labs view team-sdk as competitive with their internal infra and quietly fork rather than adopt.

## Self-score (rough, will be re-scored by triage agent)

- Viability (0-10): 6. High prestige value and clean fit with §32 loops, but the beachhead is too small to sustain the business and the pull-through is unproven.
- Market growth potential (0-10): 7. If the downstream cascade works the TAM is enormous; if it does not, you have built a niche tool for 300 researchers.
