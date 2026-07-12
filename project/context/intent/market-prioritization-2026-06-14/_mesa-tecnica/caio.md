# CAIO Pablo — Mesa Técnica panel input

**Release:** v2026.Q2.1
**Chair:** CTO Nicolás Oslo
**Focus assigned:** AI strategy lock-in + evaluation framework + agent topology exit risk

---

## Your one-line guardrail

**No AI commitment ships to lighthouse #1 — model provider, agent topology, prompt format, tool-use schema, evaluation harness — that cannot pass a "swap-in-one-sprint" replay test against a second provider on a frozen, public eval set, run in CI before every release tag.**

## Why this guardrail (your domain prior)

The exit cost the GTM team cannot see is **agent topology**, not the model. Everyone in the room thinks lock-in means "we hardcoded Claude" — that's a six-week port. The real 18-month liability is the *shape* of the agent graph: how roles spawn, how the Bus carries tool calls, what the prompt-and-context-loading contract assumes about a single provider's tool-use semantics, JSON-mode behavior, system-prompt caching, and context window. When a devtool buyer benchmarks us publicly — and they will, because the corpus is open — they will reproduce our pipeline on their preferred provider in a weekend. If our topology silently depends on Anthropic-specific tool-call schemas or OpenAI-specific structured outputs, the benchmark fails in their stack, and the disruption thesis ("substrate that lives inside *your* dev environment") collapses in a Hacker News thread. The Finnish prior: the hard path now — provider-agnostic abstraction, written eval contract, replay harness — is the only path that compounds trust. The easy path is a beautiful demo that becomes a re-platform in month 14.

## The specific cost of NOT having this guardrail

**8-14 engineer-months of substrate rewrite, one breaking Bus schema migration the lighthouse cohort will refuse to sign, and the loss of the regulated bet's audit posture.** Concretely: rebuilding agent topology to be provider-portable after Bus messages, `_signals.jsonl` lines, and 50+ stored prompts have hardened around one provider's tool-use semantics is a 4-6 engineer-quarter project. Add the regulated lighthouse (bet #2) reading the same corpus six months later: every prompt, tool-call trace, and eval artifact must be reproducible for the auditor — if the eval framework is provider-coupled, the audit packet becomes non-portable evidence, and BFSI counsel kills the deal. Opportunity cost: the recruiting-moat narrative ("we make your engineering culture legible") evaporates the day a senior candidate runs `team-sdk` on their preferred model and it doesn't work. Reversibility: low — the corpus is append-only by design, so coupled artifacts cannot be retroactively cleansed.

## How to verify the guardrail holds (the test)

A CI job named `eval-portability` that runs on every PR touching agent code, prompts, or Bus schema. It executes a frozen public eval set (≥30 scenarios spanning the 4-cadence loop, dissent protocol, Mario gate, Critique-Revise) against **two model providers simultaneously** behind a single `LLMProvider` interface, asserts behavioral equivalence within a documented tolerance band on a published rubric, and emits the diff to `_signals.jsonl`. Green CI = guardrail holds. The artifact the lighthouse signs against is the **public eval-set commit hash + the two-provider CI run** — not our word. Owner of this job: named in the AI System Registry before lighthouse contract #1.

## What you would refuse to sign without this guardrail

I refuse to sign lighthouse contract #1 if any agent in the topology, any prompt in the standard library, or any field in the Bus/`_signals.jsonl` schema depends on a single provider's tool-use, structured-output, or caching semantics without a passing two-provider portability CI run on the release tag the lighthouse will install.
