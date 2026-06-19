# Rafael (CRO-Risk) — Mesa Legal panel input

**Release:** v2026.Q2.1
**Date:** 2026-06-15
**Focus from the chair:** litigation discovery surface + structural disclosure limits

---

## Your one-line guardrail

**No customer-identifying or financial-modeling-grade signal leaves the lighthouse boundary in a form a plaintiff or short-seller can subpoena from us as third-party custodian — every published artifact is k-anonymized at the cohort layer, the raw `_signals.jsonl` is held by the customer (not us) under a written joint-custodian protocol, and our retention schedule is contractually capped at 90 days for any operational telemetry that maps to a named lighthouse.**

## Why this guardrail (your domain prior, channeled through the disruption lens)

The disruption thesis depends on the incumbent making a rational defensive-investment decision. The legal channel breaks that assumption (framing memo). The CRO-specific variant: **discovery surface is the cheapest weapon of all** because the incumbent doesn't fire it — a *proxy plaintiff* does, and discovery is asymmetric by design. An open-substrate dogfood model publishes exactly the artifacts a sophisticated adversary needs to model our financial fragility (customer concentration, revenue per lighthouse, churn-leading-indicators in friction-deltas), our operational dissent (§32 Critique-Revise transcripts read as evidence of negligence in any product-liability action against the lighthouse), and our internal velocity (Halloway Ratchet logs become "willful disregard" exhibits). The killed JTBD-regulated bet failed because contingent liability destroyed exit optionality; this is the **same failure shape via discovery surface**: a substrate that is a joint custodian of every lighthouse's worst quarter becomes a discounted asset in every diligence. Concretely: when we move upmarket into Tier-2 BFSI in month 18, plaintiff's counsel in any model-risk action against our regulated logo will subpoena every devtool lighthouse's friction signal as comparable evidence — and we will be the custodian served, not the customer.

## The specific cost of NOT having this guardrail

Three sized exposures, all materializing before deal #1 in the regulated tier:

1. **Subpoena response cost as third-party custodian:** $150-400K per matter in outside counsel + e-discovery vendor (Relativity-class) per lighthouse implicated. With 5 lighthouses, expect 2-4 matters/year by month 18 (devtool-segment NPE activity per framing memo + employment actions against lighthouses). $1.2-3.2M annualized run-rate by month 24 — exceeds the entire devtool segment's standalone ARR.
2. **Acquirer diligence discount on joint-custodian exposure:** 15-30% enterprise value haircut at exit, OR seller-funded escrow held for the longest applicable statute (typically 6 years for tort, 10 for fraud). Same balance-sheet shape that killed JTBD-regulated.
3. **Lost-upmarket-option (the disruption-killing one):** Tier-2 BFSI procurement legal will refuse to onboard any vendor whose data architecture makes them a discoverable custodian of *other customers'* operational telemetry. One bad subpoena response published in a 10-K footnote of any lighthouse closes the regulated bet entirely. This is the discovery-surface analog of the framing memo's "single coordinated disclosure" failure mode.

## How to verify the guardrail holds (the artifact)

A **four-document stack signed before the first lighthouse contract**, each independently verifiable:

1. **Joint-Custodian Data Protocol (JCDP) appendix to the MSA** — defines the lighthouse as primary custodian of `_signals.jsonl`, us as processor only for cohort-aggregated derivatives. Explicit subpoena-routing clause: third-party requests for raw signal are routed to the customer; we hold only a hash manifest.
2. **Retention schedule + cryptographic erasure proof** — 90-day cap on operational telemetry mapping to a named lighthouse, with monthly hash-tree attestation we can produce on demand. Anything older than 90 days is structurally non-producible in discovery.
3. **Cohort-k-anonymity threshold (k≥5) baked into the publication pipeline** — no published `_signals.jsonl` excerpt is traceable to a single lighthouse below k=5 cohort size. Validated by a quarterly third-party privacy audit (Truss / IAPP-aligned firm), audit letter in the data room.
4. **Litigation-hold protocol + $5M cyber/E&O policy with third-party-custodian endorsement** — board-resolved, premium paid, broker letter in the data room. Covers the gap between subpoena receipt and JCDP-mediated customer hand-off.

The verification test: a tabletop exercise (run before lighthouse #1 signs) where outside counsel attempts to subpoena our hypothetical custody and the JCDP routes it to the customer in <72 hours, with our raw production limited to the hash manifest.

## What you would refuse to let the company sign without this guardrail

**Any lighthouse MSA that names team-sdk as data controller (rather than processor) for `_signals.jsonl`, or that omits the Joint-Custodian Data Protocol appendix and the 90-day retention cap — including any "we'll add the DPA later" handshake, regardless of how strategic the lighthouse is.**
