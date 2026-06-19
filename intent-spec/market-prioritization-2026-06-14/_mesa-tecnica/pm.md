# PM (Priya Cairo) — Mesa Técnica panel input

**Chair:** Nicolás (CTO)
**Focus assigned:** product scope discipline + the smallest demonstration slice
**Date:** 2026-06-15

---

## Your one-line guardrail

**The lighthouse contract names a single, signed "30-minute slice" — staff engineer points the CLI at their own repo, runs one shaped retro on a real merged PR from the last sprint, and queries `_signals.jsonl` for a friction pattern across two prior retros — and any capability not required to make that slice complete in 30 minutes is contractually OUT of v1, listed by name, with a written kill-test the engineer can run to prove the slice ran on their machine without our hands on the keyboard.**

## Why this guardrail (your domain prior)

The failure mode I am uniquely positioned to see is not technical drift — it is the **slow conversion of a substrate into a vendor pitch**. Every devtool lighthouse I have ever watched starts with "just point the CLI at your repo" and ends, 90 days later, with a hosted dashboard the customer's CISO has to review, an onboarding video the engineer never watched, and an IDE plugin that exists because someone on our side wanted a demo screenshot. None of those things were in the original brief. They arrived one by one, each justified individually, each invisible at the scope-review level. The disruption thesis in #1 only holds if the engineer-buyer experiences the product **inside their existing dev environment, alone, in under 30 minutes, with no human from our side present**. The moment we add a "guided session" or a "hosted preview," we are no longer a substrate — we are Linear with extra JSON, and Linear wins that fight. Scope creep here is not a delivery risk. It is a **category risk**: it moves us into a market segment the panel explicitly killed.

## The specific cost of NOT having this guardrail

Concretely: **3-4 engineer-months of work that has to be ripped out before lighthouse #2**, plus a Q1 2027 repositioning cost that the CMO's narrative-half-life risk turns into a 2-quarter brand recovery. If lighthouse #1 ships with a hosted dashboard, an IDE plugin, and a guided onboarding (the three capabilities I list as kill-targets below), those features will (a) anchor the second lighthouse's expectations — every subsequent customer will demand them — (b) become load-bearing in the marketing artifact (`_signals.jsonl` excerpts will reference dashboard URLs that are not part of the OSS), and (c) be cited by the regulated bet (#2) as the "production experience" the BFSI buyer evaluates — at which point a feature we built for a 30-engineer devtool company becomes the spec for a Tier-2 bank's audit-survived deployment. The reversibility cost is not the code. It is the **public commitment** embedded in lighthouse #1's `_signals.jsonl` that we cannot un-publish.

## How to verify the guardrail holds (the test)

Concrete artifact, not a meeting: **a `lighthouse-1-slice.md` file, committed to the project repo before contract signature, containing (1) the exact `git clone` → `sdk-init` → `sdk-doc retro` → `sdk-doc signals query` command sequence the staff engineer runs, (2) a stopwatch test where a member of our team who has never seen the lighthouse's repo runs that exact sequence on a fresh laptop against a public repo and posts the recorded session — under 30 minutes wall-clock, zero out-of-band Slack messages, zero "let me just SSH in" interventions — and (3) an explicit OUT-OF-SCOPE list naming, by name, the three capabilities killed: hosted dashboard, IDE plugin, guided onboarding flow.** The contract clause: if any of the three killed capabilities ships to lighthouse #1, the lighthouse is downgraded from "reference" to "design partner" in the public artifact, with no `_signals.jsonl` publication rights. That is the gate — a recorded video and a signed scope kill-list, before the contract closes.

## What you would refuse to sign without this guardrail

I will not sign the lighthouse #1 mission brief for the Betting Table if it contains any hosted UI surface, any IDE plugin, or any "white-glove onboarding" line item — because each of those silently converts the substrate bet into the vendor-pitch bet the panel killed.

---

## Provenance

- Panelist: PM (Priya Cairo)
- Mesa Técnica chair: CTO (Nicolás Oslo)
- Inputs: `_framing.md`, `christensen-disruption__devtool-companies.md`, `_recommendation.md`, `pm.md` (role)
- Date: 2026-06-15
