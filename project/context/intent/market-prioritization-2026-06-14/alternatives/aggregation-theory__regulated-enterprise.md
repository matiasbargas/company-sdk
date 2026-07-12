# Alternative: Aggregation Theory (Thompson) × Regulated enterprises (BFSI, healthcare, govtech, pharma)

**Framework:** Aggregation Theory (Thompson)
**Segment:** Regulated enterprises (BFSI, healthcare, govtech, pharma)
**Generated:** 2026-06-14

## The market direction in one sentence

Regulated product teams adopt team-sdk as the canonical substrate that owns their relationship with their own audit reality, modularizing the fragmented stack of GRC tools, auditors, and compliance consultants underneath it.

## What the framework reveals about this segment

Thompson's lens asks: where is the friction between users and supply, and who can own the demand side by collapsing that friction into one experience? In regulated enterprises, the team's "supply" is a sprawling, undifferentiated mess — Archer, ServiceNow GRC, OneTrust, Big Four auditors, specialist consultants, internal audit, regulators, evidence portals, ticketing systems — each demanding the same context in different shapes. The team is the user; the supply is everyone who needs to inspect them. team-sdk's Layer B append-only corpus, §32 generative loops, and BU-routed decision record are structurally what every one of those suppliers is trying to reconstruct after the fact. Aggregation Theory says: own the substrate where the team naturally already does its work, make every audit, control attestation, and regulator query a thin read against that substrate, and the GRC vendors become commoditized backends that read from your corpus rather than gatekeepers the team has to feed.

## The team-sdk value proposition for this segment, via this framework

The configuration that lands hardest: Layer B as the system-of-record for control evidence (every signal carries provenance, every decision carries a Halloway-ratchet rationale, every retro produces auditable diffs); §32 Red-Team and Critique-Revise loops run automatically against new controls, generating the adversarial test artifacts SOC2/ISO/HIPAA/PCI auditors increasingly demand; sprint/quarterly cadences map 1:1 to control review cycles; BU routing means the CISO, CLO, and DPO are first-class consumers of the same corpus the engineers write into. The pitch is not "compliance automation" — it is "your team already produces the evidence; team-sdk makes it queryable by every auditor without a parallel documentation tax."

## GTM motion implied

Sales-led, top-down, with a strong design-partner phase. Aggregation requires a beachhead where the team-sdk substrate becomes the single source of truth — that decision is made by a CISO, Head of Engineering, or Chief Risk Officer, not a developer. 6-18 month cycles fit. The motion: 3-5 lighthouse design partners in BFSI and healthcare, co-developed control-mapping packs (SOC2, HIPAA, DORA, EU AI Act), then channel partnerships with Big Four for downstream pull. Community-led is wrong here; product-led won't clear procurement.

## Monetization shape

Hybrid: high six-figure annual platform license + per-seat for engineers + value-based uplift tied to audit-hour reduction (measured, contractual).

## Honest weaknesses of this alternative

The combination is genuinely awkward in one dimension: Aggregation Theory's power comes from network effects and zero marginal cost of serving the next user — but regulated enterprises are heterogeneous, each with bespoke control mappings, and the substrate has to be deeply customized per customer. That looks more like a services-heavy enterprise software play than a true aggregator. Worse, the "modularized suppliers" (GRC vendors, auditors) have entrenched relationships and will not passively accept being read-only backends — they will fight to remain the system of record. team-sdk's Constraint 1 (no dependency) also sits uncomfortably with regulators who *want* the system to be the authority. The aggregation thesis only holds if team-sdk can land in enough teams to make auditor-side tooling adapt to it rather than the reverse, and that is a multi-year bet with significant capital requirements.

## Self-score (rough, will be re-scored by triage agent)

- Viability (0-10): 6. High willingness-to-pay and real pain meet a long sales cycle and an entrenched incumbent stack — viable but capital-intensive.
- Market growth potential (0-10): 8. AI-era regulatory pressure (EU AI Act, DORA, SR 11-7 updates) is expanding the audit surface faster than incumbent GRC tools can adapt, creating a real aggregation window.
