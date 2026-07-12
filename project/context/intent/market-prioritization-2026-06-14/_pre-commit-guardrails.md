# Pre-commit guardrails — christensen-disruption × devtool

**Date:** 2026-06-15
**Status:** Draft for Owner sign-off
**Bet being guarded:** Top-1 from market-prioritization-2026-06-14 — `christensen-disruption__devtool-companies` (ANCHOR BET)

## Executive summary

Twelve guardrails total, consolidated from three independent sources: the original CEO recommendation (3), Mesa Técnica (5), and Mesa Legal (5), with one merge across tables and one tightening adjudication by the chair. **Nine are PRE-COMMIT REQUIRED** and must be signed before lighthouse contract #1 is drafted. **Three are ONGOING DISCIPLINE** — the seam must exist at contract day, but the artifact may land by day-30 (Pablo's portability CI) or operate quarter-over-quarter (the CEO calendar reservation, the antitrust posture).

The **single highest-leverage guardrail is G-004: the `_signals.jsonl` envelope v1.0 freeze with SHA-pinning in the lighthouse contract.** Three independent panels — sequencing/strategy, irreversibility/platform, and legal/regulatory — converged on this artifact from non-overlapping angles. It is not a logging format. It is the public API of the company, the queryable proof of the 30-minute slice, the substrate of the recruiting moat, and the document a regulator will subpoena in 2028. Everything else in this list is downstream of it.

If the Owner signs nothing else, sign G-004. If the Owner signs G-004 and nothing else, the bet is still legally radioactive and operationally fragile. Sign all nine.

## The full guardrail list (ranked, deduplicated)

| ID | Source | One-line statement | Owner | Verification artifact | Status | Block trigger |
|---|---|---|---|---|---|---|
| **G-001** | market-prio | 25% CEO calendar reservation for non-devtool segments, written and Owner-signed | CEO | Calendar block visible in Greg's calendar; weekly check in `current-status.md` | **PRE-COMMIT REQUIRED** | Lighthouse contract #1 |
| **G-002** | market-prio | Day-one paid SKU structurally hard to self-host (cross-team benchmarks, federated corpus search, recurring audit re-runs — NOT SOC2 export) | CFO + PM | `paid-sku-spec.md` signed by CFO + Owner before MSA template ready | **PRE-COMMIT REQUIRED** | MSA template draft |
| **G-003** | market-prio | One lighthouse first; day-60 minimum-viable-delta signal-gate in `_signals.jsonl` before any second lighthouse contract is signed | CMO + CRO | `lighthouse-1-slice.md` signed; day-60 gate file referenced in MSA | **PRE-COMMIT REQUIRED** | Lighthouse contract #2 |
| **G-004** | Mesa Técnica (Staff, Mario, PM, Pablo) | `_signals.jsonl` envelope v1.0 frozen — schema_version, timestamp, actor, event_type, release_id, payload_namespace, payload — published in public RFC repo, SHA-pinned in lighthouse contract #1, validator CLI enforced in CI, no-breaking-change-before-v2.0 stability policy | Staff (publish) + Mario (freeze) | RFC repo commit SHA + validator CLI green in CI + MSA appendix citing the SHA | **PRE-COMMIT REQUIRED** | Lighthouse contract #1 |
| **G-005** | Mesa Técnica (Mario) | Halloway-Ratchet entries per envelope field plus a bet-#2 (regulated/Model Risk) buyer-persona reviewer sign-off on the envelope (not the payload) | Mario + CLO | Reviewer sign-off doc attached to G-004 RFC | **PRE-COMMIT REQUIRED** | Lighthouse contract #1 |
| **G-006** | Mesa Técnica (PM) | Signed `lighthouse-1-slice.md` with a real fresh-laptop 30-minute walkthrough recording AND explicit OUT-OF-SCOPE kill-list (hosted dashboard, IDE plugin, guided onboarding) with a contract downgrade clause if any killed capability ships | PM | `lighthouse-1-slice.md` + video recording + kill-list clause in MSA | **PRE-COMMIT REQUIRED** | Lighthouse contract #1 |
| **G-007** | Mesa Técnica (CTO add) | Bus-to-`_signals.jsonl` lineage invariant — every jsonl line reconstructible as a pure function of Bus log + release_id, CI replay job, no-side-channel-writes lint rule | CTO | CI replay green; lint rule in repo | **PRE-COMMIT REQUIRED** | Lighthouse contract #1 |
| **G-008** | Mesa Técnica (Pablo) | Two-provider eval-portability CI on frozen public eval set (≥30 scenarios), single LLMProvider interface seam, behavioral-equivalence diff emitted to `_signals.jsonl` | CAIO (Pablo) | LLMProvider seam at contract day; CI run as day-30 lighthouse deliverable | **ONGOING DISCIPLINE** (seam pre-commit; CI day-30) | Day-30 lighthouse milestone |
| **G-009** | Mesa Legal (CLO) — **MERGED with CRO-Risk DPA appendix** | Regulated-Segment Carve-Out Rider naming three forbidden terms — MFN, perpetual on-prem/source-escrow, uncapped IP indemnification — plus Joint-Custodian DPA appendix (90-day operational telemetry cap, k≥5 cohort anonymity at publication gate); CLO non-sign list, CEO countersignature required to waive | CLO + CRO-Risk | Carve-Out Rider attached to MSA template; non-sign list in CLO playbook | **PRE-COMMIT REQUIRED** | MSA template draft |
| **G-010** | Mesa Legal (CISO) | Claim Altitude Register + Representation Altitude Lock MSA clause, with third-party cryptographic attestation; every wedge security claim survives verbatim under SR 11-7 and NYDFS Part 500 | CISO | Claim Altitude Register file + attestation contract; MSA clause language | **PRE-COMMIT REQUIRED** | MSA template draft |
| **G-011** | Mesa Legal (CCO) | Single Control Plane, Two Evidence Surfaces — Control Matrix v0 dual-mapped to wedge and upmarket frameworks; dormant-tier evidence pipes wired silent-running from sprint 1 | CCO | `control-matrix-v0.md` + sprint-1 pipe scaffolding evidence | **PRE-COMMIT REQUIRED** | Lighthouse contract #1 |
| **G-012** | Mesa Legal (CRO-Risk lens-pushback) — separate from G-009 | Published-dissent corpus (Halloway Ratchet logs, §32 Red-Team transcripts) reclassified as Editorial/Research Publication with First-Amendment-style standing, distinct from operational telemetry; publication pipeline severs customer-identifying linkage at write time | CRO-Risk + CLO | Editorial classification policy + write-time linkage-sever code path | **PRE-COMMIT REQUIRED** | First public artifact publication |
| **G-013** | Mesa Legal (lens-added) | Antitrust Posture Pre-Commitment — board-resolved Interoperability Commitment registered before ~50 paying teams: (a) Bus protocol open spec under permissive license, (b) one-click customer data portability, (c) written non-discrimination on cross-team benchmark queries | CLO + CTO (joint) | Board resolution; published spec; portability endpoint; non-discrimination policy | **ONGOING DISCIPLINE** (trigger before ~50 teams) | Substrate critical mass (~50 teams) |

## Where the three sources converged (load-bearing)

**`_signals.jsonl` envelope v1.0 (G-004).** Mesa Técnica froze it as a schema and SHA-pinning artifact. Mesa Legal hit the same surface from the regulator angle — the Claim Altitude Register (G-010), Control Matrix dual-mapping (G-011), and Editorial Publication classification (G-012) all assume a single canonical record. The original market-prio synthesis named `_signals.jsonl` as the positioning statement, the marketing artifact, the sales asset, and the falsification test, all at once. When the strategy table, the platform table, and the legal table independently treat the same file as load-bearing, the file is no longer a measurement output — it is the company's public API. **G-004 is the most load-bearing guardrail in this entire bet.** If it is not signed, no other guardrail can be enforced because they all reference it.

## Where the three sources disagreed (and how Greg adjudicates)

**Tension: what does v1.0 include?** Mario wanted the envelope rich enough that a bet-#2 Model Risk reviewer could sign off (cross-segment fields: audit, lineage, attestation). PM wanted it minimal enough that a staff engineer could hit the 30-minute slice with zero hosted surface. Mesa Legal wanted enough regulatory hooks that the upmarket frameworks (SR 11-7, NYDFS, GDPR Article 22) had a place to land without a future schema break. Three legitimate, mutually-load-bearing views.

**Greg's adjudication, as chair:** bind to Staff's envelope/payload split. **Envelope v1.0 is frozen, minimal, and ships in the slice** — seven fields: `schema_version`, `timestamp`, `actor`, `event_type`, `release_id`, `payload_namespace`, `payload`. **Payload namespaces** (`devtool.*`, `regulated.*`, `agency.*`) **evolve independently under the Halloway Ratchet.** The bet-#2 reviewer signs the envelope, not the payload. This satisfies Mario's cross-segment generalization test, preserves PM's 30-minute slice, and gives Mesa Legal a stable substrate to anchor the Claim Altitude Register against. The disagreement is resolved by layering, not by compromise.

## The deduplication

Two merges. **Merge 1: G-009 absorbs the CRO-Risk operational-telemetry DPA appendix into the CLO Carve-Out Rider.** Both surfaced the same load-bearing artifact — the MSA appendix that protects the upmarket bet from terms signed at deal #1 — from different sides. Keeping them separate would create two parallel contract documents fighting for the same MSA real estate. **Merge 2: G-012 is kept separate from G-009** even though both originated in Mesa Legal, because the CRO-Risk lens-pushback explicitly demanded that the published-dissent corpus be classified differently from operational telemetry. Collapsing them would re-create the bug the lens caught. **Non-merge of note:** Pablo's portability CI (G-008) overlaps with Mario's Halloway Ratchet (G-005) on cross-segment generalization, but they enforce different invariants — Pablo on cross-provider behavior, Mario on cross-segment schema evolution — and merging would lose one. Attribution preserved across all merges so future-Owner can trace each guardrail to its source table.

## What this list does NOT guardrail

Four risks we are explicitly accepting as unguarded. **(1) Narrative-half-life cost** — every public lighthouse becomes a story we must keep alive; CS scaling is not budgeted. **(2) DevRel headcount** — $300-500K/year is named in the recommendation but not enforced by any guardrail here; this is intentional, since over-staffing DevRel would convert the dogfood model into a content-marketing function. **(3) Hosted-margin trap on the paid SKU** — G-002 prevents the SKU from being trivially self-hosted, but does not guarantee hosted-margin economics; CFO will need to revisit at month 6. **(4) Lighthouse-cascade risk on a single denominator** — G-003's "one lighthouse first" is sequencing, not insurance; if lighthouse #1 has a non-substrate-related bad quarter (layoffs, founder drama), the corpus will look flat and we have no second arc warmed up. We accept this; mitigating it would require funding bet #3 (`lean-startup__devtool`) as a parallel stream, which the portfolio shape explicitly rejects.

## Owner sign-off block

The Owner reads each guardrail, decides, and signs. Any unchecked box blocks the corresponding decision (column 7 of the table above).

- [ ] **G-001** — 25% CEO calendar reservation
  Signature: _____________________________  Date: __________

- [ ] **G-002** — Day-one paid SKU structurally hard to self-host
  Signature: _____________________________  Date: __________

- [ ] **G-003** — One lighthouse first; day-60 signal-gate
  Signature: _____________________________  Date: __________

- [ ] **G-004** — `_signals.jsonl` envelope v1.0 freeze + SHA-pinning (LOAD-BEARING)
  Signature: _____________________________  Date: __________

- [ ] **G-005** — Halloway Ratchet + bet-#2 reviewer sign-off on envelope
  Signature: _____________________________  Date: __________

- [ ] **G-006** — Signed `lighthouse-1-slice.md` + 30-min walkthrough + kill-list
  Signature: _____________________________  Date: __________

- [ ] **G-007** — Bus-to-`_signals.jsonl` lineage invariant
  Signature: _____________________________  Date: __________

- [ ] **G-009** — Regulated-Segment Carve-Out Rider + Joint-Custodian DPA (merged)
  Signature: _____________________________  Date: __________

- [ ] **G-010** — Claim Altitude Register + Representation Altitude Lock
  Signature: _____________________________  Date: __________

- [ ] **G-011** — Single Control Plane, Two Evidence Surfaces (Control Matrix v0)
  Signature: _____________________________  Date: __________

- [ ] **G-012** — Editorial/Research Publication classification for dissent corpus
  Signature: _____________________________  Date: __________

(G-008 and G-013 are ONGOING DISCIPLINE — acknowledged here, not signed pre-commit.)

## What happens after sign-off

The moment the Owner returns a signed copy of this list, Coordinator publishes the signed list as `_pre-commit-guardrails-SIGNED.md` and notifies the bench. **Mario opens the envelope-freeze PR in the public RFC repo (G-004).** **Staff wires the validator CLI into CI and the Bus replay job (G-007).** **CLO drafts the Carve-Out Rider and the MSA template incorporating G-009, G-010, G-011 by reference (G-009–G-011).** **PM begins fresh-laptop 30-min slice recording and kill-list (G-006).** **Greg blocks the 25% calendar reservation immediately (G-001)** and posts a weekly check in `current-status.md`. **CFO + PM produce `paid-sku-spec.md` within five business days (G-002).** No lighthouse outreach begins until the Carve-Out Rider, MSA template, and envelope SHA are committed. Lighthouse contract #1 cannot be drafted until all nine PRE-COMMIT REQUIRED guardrails have a green verification artifact.

## Provenance

- Workflow: `market-prioritization-2026-06-14`
- Sources: `_recommendation.md` (Greg, 2026-06-14); Mesa Técnica synthesis (Staff/Mario/PM/Pablo/CTO, 2026-06-15); Mesa Legal synthesis (CLO/CISO/CCO/CRO-Risk + lens-added, 2026-06-15)
- Consolidator: Greg (CEO), as chair across both panels
- Sealed: 2026-06-15 (draft for Owner sign-off)
