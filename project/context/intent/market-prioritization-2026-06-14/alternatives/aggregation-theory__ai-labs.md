# Alternative: Aggregation Theory (Thompson) × AI labs / research orgs

**Framework:** Aggregation Theory (Thompson)
**Segment:** AI labs / research orgs
**Generated:** 2026-06-14

## The market direction in one sentence

team-sdk becomes the substrate that aggregates demand from AI labs' research pods by owning the relationship with each pod's accumulated judgment, modularizing the upstream supply of agent perspectives, evals, and provenance backends.

## What the framework reveals about this segment

Aggregation Theory says the winner owns the customer relationship and commoditizes the upstream. For AI labs, the "customer" inside the lab is the research pod — the 3-8 person team running experiments, debating directions, writing papers, shipping checkpoints. Today that relationship is owned by nothing: it scatters across Slack, Notion, W&B, internal eval harnesses, and a half-dozen agent frameworks. The supply side — models, eval suites, provenance tools, agent role libraries, peer-review tooling — is fragmenting fast and labs already build their own. team-sdk's aggregation play is to own the pod's *self-representation layer* (Layer A/B/C, Bus, retros, decision log) and modularize everything upstream: any model behind the agents, any eval harness behind the §32 critique loop, any provenance store behind the Halloway Ratchet. The pod's compounding judgment becomes the lock-in, not the tooling.

## The team-sdk value proposition for this segment, via this framework

The configuration that lands: a **research-pod fork** of team-sdk where the 20 roles are reshaped into research archetypes (PI, methods reviewer, replication lead, ethics, reviewer-2-in-residence, ablation skeptic), the §32 Critique-Revise and Red-Team loops become first-class peer-review rituals run before any paper draft or checkpoint release, the Halloway Ratchet doctrine encodes provenance and reproducibility as immune-system properties, and the quarterly cadence ladders to conference deadlines. Layer B holds the pod's domain corpus — datasets, experimental priors, prior negative results, ablation history — queryable by every agent and human. The aggregation hook: once a pod's `_signals.jsonl` and decision log live in team-sdk, switching cost is the loss of compounding context across model generations.

## GTM motion implied

**Community-led, with a prestige flywheel.** Labs do not buy through sales reps; they adopt through citations and visible practice. The motion is: open the substrate, seed adoption with 2-3 prestige pods (independent labs, university groups doing interpretability or alignment), let them contribute roles and loop patterns back upstream (the segment notes explicitly flag this willingness), publish the substrate-as-method in workshops (NeurIPS ML Reproducibility, ICML position papers), and let pod-to-pod prestige diffusion do the rest. Aggregation Theory fits: the more pods on the substrate, the richer the shared role library and loop patterns, the more attractive to the next pod.

## Monetization shape

Hybrid — free open-source substrate + paid hosted provenance/audit layer + sponsored role packs from infra vendors.

## Honest weaknesses of this alternative

The combo is genuinely awkward in two places. First, Aggregation Theory presumes the aggregator owns *demand* against a fragmented supply — but AI labs are themselves *suppliers* of the underlying intelligence, so we are trying to aggregate the demand-side of pods inside organizations that produce the supply we modularize. That inversion is interesting but slippery. Second, the "moderate willingness to pay" in the segment notes is the killer: prestige adoption produces citations, not revenue, and the hosted-provenance monetization assumes labs care enough about audit to pay — many will just self-host. The aggregation may compound prestige faster than cash, which is a strategic asset but not an 18-month winning-condition asset.

## Self-score (rough, will be re-scored by triage agent)

- Viability (0-10): 5. Real adoption path via prestige, but monetization is thin and the supplier/aggregator inversion is unresolved.
- Market growth potential (0-10): 7. Pod count is exploding across labs and the prestige flywheel compounds non-linearly if seeded right.
