# CLO Camila — Mesa Legal panel input

**Chair:** Christensen-disruption lens
**Focus:** Contract terms with first devtool lighthouse that preserve or foreclose the upmarket move
**Date:** 2026-06-15
**Confidence:** High on the structural shape; jurisdiction-specific drafting requires outside counsel before signature.

---

## Your one-line guardrail

**No first-lighthouse contract is signed without a written "Regulated-Segment Carve-Out" rider that (a) caps IP indemnification at 12 months of fees paid with sole-control-of-defense by us, (b) reserves the right to ship a non-self-hostable hosted SKU and a separate regulated-tier SKU with different terms, and (c) excludes MFN, source-escrow-on-insolvency, perpetual on-prem rights, and most-favored-jurisdiction clauses by name.**

## Why this guardrail (your domain prior, channeled through the disruption lens)

Christensen assumes the incumbent declines to defend because the segment is unattractive — but the incumbent's general counsel is a sunk cost who can fire a C&D, a patent claim, or an indemnification-cascade demand for zero incremental dollars. Worse: a sophisticated devtool lighthouse (Series A/B, engineer-buyer, often ex-incumbent legal patterns) will ask for exactly the terms that look reasonable on a $30K seat deal and that **structurally foreclose the upmarket move into BFSI/health-payer at month 18** — MFN ("you can't sell this cheaper to anyone else") locks regulated pricing to devtool pricing; perpetual on-prem source-availability clauses make the "structurally hard-to-self-host paid layer" (CFO's risk #2 in `_recommendation.md`) legally impossible to enforce later; uncapped IP indemnification with broad "ingested content" definitions creates the contingent-liability shape that killed `jobs-to-be-done__regulated-enterprise` in the recommendation. The legal failure mode is not a single bad clause — it is the **standard SaaS MSA the lighthouse will send first**, which the engineer-founder will sign because the deal is small. The CLO seat is the only one that sees these clauses as upmarket-killing rather than annoying.

## The specific cost of NOT having this guardrail

Three concrete exposures, sized:

1. **MFN pricing trap.** If lighthouse #1 signs at $30K/year with an MFN, the Tier-2 BFSI deal at $130K landing ACV (per recommendation #2) triggers either a refund/credit obligation or a renegotiation that resets all downstream pricing. Cost: $100K-$400K of foregone year-1 ARR per regulated deal, multiplied by 15 deals over 24 months = **$1.5M-$6M in capped upmarket pricing**, plus the deal-flow chilling effect once the MFN is known to procurement.
2. **Uncapped IP indemnification on ingested corpus.** Devtool lighthouse runs OSS the substrate ingests (RFCs, source, observability schemas — some AGPL/SSPL/BUSL-tainted per framing memo). A single NPE claim against the ingested code becomes our defense obligation. Defense cost alone: **$2M-$8M per litigation event**; settlement leverage gone. This is the "you indemnify us against your own ingestion" trap named in the framing memo.
3. **Lost upmarket option.** Perpetual on-prem rights granted to lighthouse #1 mean the hosted-only regulated SKU (CFO's "structurally hard-to-self-host paid layer") is contestable as discriminatory dealing. Cost: **the entire bet #2 revenue grounding**, because a Big-4 channel partner cannot offer differentiated hosted economics if a $30K seat customer has perpetual self-host parity.

## How to verify the guardrail holds (the artifact)

The verification artifact is a **two-document package, board-resolved, signed before any lighthouse term sheet is countersigned**:

1. **Regulated-Segment Carve-Out Rider** (template, ~6 pages) — appended to every devtool MSA, drafted in plain English with the three no-sign clauses explicitly named and a redline-detection checklist for AE/sales. The rider preserves: (a) hosted-only SKU with different terms, (b) regulated-tier SKU with separate IP indemnification and DPA shape, (c) right to refuse self-host for the paid layer, (d) MFN exclusion limited to "same SKU, same support tier, same volume band." The rider FORECLOSES: MFN across SKUs, source escrow on insolvency or change-of-control, perpetual on-prem rights, most-favored-jurisdiction (forum-shop trap), broad IP indemnification covering ingested OSS or customer-supplied corpus.
2. **CLO non-sign list, board-resolution-attached** — the seven clauses from the contract-review template plus the three disruption-specific ones (MFN, perpetual on-prem, broad indemnification), with CEO countersignature required to waive any single item. This converts "Camila vetoed it" from interpersonal friction into board-resolved policy that survives a deal-fever founder moment.

Both documents are reviewed by outside counsel in our two priority jurisdictions (Delaware + the lighthouse's primary jurisdiction) before signature on deal #1. A redline log is kept in `history.md` for every lighthouse contract showing which carve-out terms were negotiated and which held.

## What you would refuse to let the company sign without this guardrail

**I would block signature on any first-lighthouse MSA that contains an MFN clause, a perpetual on-prem or source-escrow right, or an uncapped IP indemnification covering ingested content — even if the lighthouse threatens to walk and even if the founder asks for a one-time exception.**
