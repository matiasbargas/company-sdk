# Andrea (CCO-Compliance) — Mesa Legal panel input

**Focus assigned by chair:** compliance posture gap between wedge and upmarket
**Lens:** Christensen-disruption — the wedge's "light, fast, ISO-aligned" posture must be the *same program* that survives Tier-2 BFSI deal #1, or an incumbent weaponizes the gap via a single regulatory complaint.

## Your one-line guardrail

**Before lighthouse contract #1 is signed, the company must commit — in writing, in the board minutes — to a "Single Control Plane, Two Evidence Surfaces" compliance program: every control we ship for the devtool wedge must be designed from day one to produce the evidence artifacts required for SR 11-7 model risk management, NYDFS Part 500, HIPAA §164.308, and EU AI Act Annex IV — even though only the wedge subset is actively monitored at month 1.**

## Why this guardrail (your domain prior, channeled through the disruption lens)

The disruption-killing failure mode I am uniquely positioned to see: the wedge will not fail because we lack a compliance program — it will fail because we will build *two* compliance programs eighteen months apart, and the second one will look architecturally incompatible with the first. An incumbent's General Counsel does not need to prove we are non-compliant in BFSI; they need to file a single ISACA-chapter "concerns" memo, or footnote in a Big-4 audit that "team-sdk's wedge-tier controls do not map to SR 11-7 model lifecycle requirements," and we lose the regulated bet before deal #1 lands. The CLO writes the regulatory map; my failure mode is operationalizing it as a wedge-only program with no upmarket evidence trail. SOC2 Type II at month 9 with no model-inventory, no challenger-model log, no human-in-the-loop attestation register *looks compliant to devtool buyers and disqualifying to a BFSI Model Risk Officer in the same breath*. That gap is the cheapest lever an incumbent can pull.

## The specific cost of NOT having this guardrail

Concrete exposure, sized: (1) Re-architecting the compliance control matrix at month 14 to retrofit SR 11-7 evidence trails costs $400-800K in engineering rework plus 4-6 month delay — and during that window, the first Tier-2 BFSI prospect goes to an incumbent who already has the program. (2) A single ISACA or RMA chapter mention that "team-sdk's controls are not designed for regulated AI use" is unrecoverable within an 18-month window — the regulated buyer's procurement team will not re-open the file. (3) EU AI Act high-risk classification (Aug 2026 enforcement onset for general-purpose AI obligations, full high-risk regime by Aug 2027) penalties run up to 3% of global turnover or €15M; for a Series A company that is existential, but the *real* cost is that the wedge customers — devtool companies who themselves sell into EU markets — will demand Article 50 transparency attestations our wedge-only program cannot produce, and we lose the wedge to compliance churn before we ever lose the upmarket bet. (4) Lost-upmarket-option value: the regulated bet's 3-year prepaid TCV of $400-650K per logo, multiplied by the 5-8 inbound conversations the first audit-survived logo generates (per CRO panel input), is $2-5M of revenue that vanishes if our wedge-tier evidence does not roll up.

## How to verify the guardrail holds (the artifact)

A **Control Matrix v0** must exist before lighthouse contract #1 is signed, with the following structure made auditable via a board resolution:

- One row per control, mapped to BOTH the wedge regulatory surface (SOC2 CC-series, ISO 27001 Annex A, GDPR Article 28) AND the upmarket surface (SR 11-7 §III-V, NYDFS Part 500 §500.11/500.13, HIPAA §164.308/164.312, EU AI Act Article 9-15 high-risk obligations, Article 50 transparency).
- Each control has a designated owner, an evidence artifact format (log schema, attestation template, monitoring frequency), and a "wedge-active / upmarket-dormant" flag.
- Dormant-tier controls must have their *evidence pipe wired and silent-running* from month 1 — i.e., the model inventory, challenger-model log, and human-in-the-loop attestation register are populated continuously from sprint 1, even though no one is reading them yet. The board resolution names this as a non-negotiable budget line ($150-250K year one for compliance engineering inside the platform team, not on top of it).
- Contract clause in the lighthouse MSA: a "Regulatory Roadmap Annex" listing the upmarket frameworks we are building toward, with the customer acknowledging that the program is forward-compatible by design. This converts what would be a *gap* into a *documented architectural intent* — and makes the incumbent's "their controls don't map" complaint factually wrong on day one.

## What you would refuse to let the company sign without this guardrail

I would refuse to let the company sign any lighthouse contract that includes language committing to "current compliance posture" or "compliance roadmap to be determined" — both phrases lock us into the wedge-only program and become the exhibit an incumbent attaches to the regulatory complaint that kills the upmarket bet.
