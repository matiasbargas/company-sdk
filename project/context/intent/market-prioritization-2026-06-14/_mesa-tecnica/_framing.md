# Mesa Técnica framing memo (chaired by CTO Nicolás)

## The bet we are guardrailing

The christensen-disruption × devtool bet is, in technical terms, a commitment to ship **a CLI-and-markdown native substrate that lives inside the customer's existing dev environment** — their repo, their PR flow, their CI runners, their IDE — while simultaneously publishing **a queryable, append-only corpus** (`_signals.jsonl`, Layer A/B/C, Bus log) as the load-bearing product surface that buyers evaluate publicly. This forces three day-1 architecture commitments: (1) the substrate must be **portable into a host dev stack** (git-native storage, no required SaaS dependency, no proprietary daemon) because the buyers are the engineers themselves and they will reject a walled garden; (2) the **paid layer must be structurally hard to self-host** (cross-team benchmark queries, federated corpus search under NDA, recurring audit re-runs) because the same engineers who adopt the OSS will absolutely rebuild a $30K invoice over a weekend if the architecture lets them; (3) the **AI layer (agents, evaluation, model topology) must be portable across providers** because devtool buyers will benchmark our model choices in public and our 18-month exposure to provider lock-in is the riskiest single technical asset on the balance sheet. The integration surface area is broader than the file admits: PR webhooks, CI artifacts, IDE plugins, container runtimes, telemetry pipes, and — critically — the regulated bet (#2) reads from the same corpus six months later, so every schema and contract decision made for the devtool wedge becomes a constraint on the BFSI/health logo. This is not a wedge architecture. It is a substrate architecture with a wedge GTM, and the panel must guardrail it as such.

## The four questions each panelist must answer

**Mario (Chief Engineer — irreversibility):** Of the three day-1 commitments above (git-native storage, paid-layer self-host resistance, AI provider portability), which one, if shipped wrong at the first lighthouse, costs **more than six engineer-months and at least one breaking schema migration** to reverse when the regulated bet (#2) reads from the same corpus in Q1 2027 — and what single architectural invariant, written before lighthouse contract #1, prevents that reversal cost?

**PM (product scope):** What is the **smallest first-30-minutes slice** that lets a devtool-co staff engineer (the actual buyer) experience the disruption thesis — *"my team's accumulated judgment is now queryable and compounding"* — using only their own repo, their own PRs, and their own retros as input, and which three capabilities currently in our heads must be **explicitly excluded from that slice** because they convert it from a substrate into a vendor pitch?

**Staff Engineer (contracts, platform primitives):** Which **single interface contract** (Bus message schema, `_signals.jsonl` line format, Layer B domain schema, or the agent-spawning protocol) determines whether the substrate is *portable into the customer's existing dev stack* versus *a parallel system they have to mirror data into* — and what is the minimum stable contract surface, versioned and frozen before lighthouse #1, that makes the portable answer the default?

**Pablo / CAIO (AI strategy):** Of the AI commitments embedded in the substrate (model provider, agent topology, evaluation framework, prompt format, context-loading strategy), which one creates the **largest 18-month exit-cost** if the underlying technology shifts — and what is the **provider-agnostic abstraction**, defined before the first paying lighthouse, that lets us swap that layer in a single sprint instead of a re-platform?

## The pattern these questions must follow

- **Mario** is uniquely positioned to surface **schema-and-storage irreversibility that the GTM team cannot see** — the failure mode where the devtool wedge ships a corpus shape that the regulated bet six months later cannot inherit without a breaking migration the lighthouse will refuse to sign.
- **PM** is uniquely positioned to surface **scope creep into vendor surface area** — the failure mode where the "30-minute first slice" silently grows IDE plugins, hosted dashboards, and onboarding flows that turn the wedge into a SaaS pitch the engineer-buyer was supposed to reject.
- **Staff Engineer** is uniquely positioned to surface **contract drift across the substrate boundary** — the failure mode where each lighthouse negotiates a different Bus schema or signal format, and within two quarters we own N forks of the "stable" interface and zero portability.
- **Pablo / CAIO** is uniquely positioned to surface **AI-stack lock-in disguised as pragmatism** — the failure mode where the first lighthouse runs on a single provider's tool-use API, a single evaluation framework, and a hardcoded agent topology, and the 18-month substrate inherits an exit cost no GTM bet can amortize.

## Provenance

- Framed: 2026-06-15
- Chair: CTO (Nicolás Oslo)
- Inputs: `_recommendation.md`, `alternatives/christensen-disruption__devtool-companies.md`, `_product-vision.md`
- Panelists: Mario (Chief Engineer), PM, Staff Engineer, Pablo (CAIO)
