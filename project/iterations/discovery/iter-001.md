---
loop: "discovery"
cycle: 1
guardian: "Discovery Guardian"
status: "rework"
created: "2026-11-14"
graduated: ""
---

## Input

Portfolio Orchestrator, Discovery cycle 1 (2026-11-13).
- Brief: `project/context/intent/portfolio-orchestrator/brief.md`
- Synthesis + §36 draft: `project/context/intent/portfolio-orchestrator/discovery-synthesis.md`
- Problem model: `project/context/spec/portfolio-orchestrator/variables.yaml`
- Capabilities (15 planned, acceptance criteria): `project/context/spec/portfolio-orchestrator/claims.yaml`
- Owner decisions + accepted risk: `project/history.md` → "Portfolio Orchestrator — Discovery decisions"
- Domain inputs: CFO (§36), CTO (machinery), CISO (threat model), CLO (legal shape), Red-Team (self-certified proof = critical)

## Guardian Review

Reviewer: Discovery Guardian · Release v2026.Q2.3 · 2026-11-13. Read: brief.md, discovery-synthesis.md, variables.yaml, claims.yaml, history.md → "Portfolio Orchestrator — Discovery decisions".

| Criterion | PASS/FAIL | Evidence (file:section) | Required change |
|---|---|---|---|
| Problem statement is falsifiable | PASS | brief.md: "Smallest proof" (two instances, ledger shows burn beside verified output, one lesson crosses) is pass/fail; "Winning at 18 months" names 5+ companies, one-heartbeat propagation | None to pass. Note: "no Owner is surprised" has no measure; add one before Architecture |
| Target user is specific enough to exclude someone | PASS | brief.md: Step 1 "Customer" (builder running several ventures, first the Owner); history.md decision 4 (v0 = Owner's own ventures only). Excludes single-venture builders, teams, outside Owners in v0 | None |
| Regulatory constraints mapped with confidence levels | FAIL | discovery-synthesis.md: "v0 gates" and "First company owned by someone else" list CLO items (fuel not stored value/crypto, provider auth mode for parallel headless runs, output assignment, DPA, consent) with no HIGH/MED/LOW anywhere; "counsel confirms what fuel is legally" is open | CLO tags every item HIGH/MED/LOW with source. The v0-blocking one is provider ToS for parallel headless runs on per-company API keys: state confidence and the source |
| At least one core assumption tested, not just stated | FAIL | All five inputs were read-only consultations (synthesis header). Runner-as-only-meter assumes stream-json carries per-run usage incl. cache tokens; variables.yaml Limits asserts "rate-limit contention is the real local bottleneck". Neither has a test cited | Run the cheapest probe: two parallel headless `claude -p --output-format stream-json` sessions on two keys; record usage fields per run and rate-limit behaviour. Cite the result |
| Non-goals explicit and reasoned | FAIL | brief.md: "NOT building (v0)" lists six items with no rationale; "cloud runners" is a deferral ("Runtime: local first, cloud later"). Full sandbox and outside verifier are also deferrals (history.md "Alternatives considered") | Give each exclusion its reason. Move deferrals (cloud runner, full sandbox, outside verifier, adoption ledger, signed commits) to a separate "Deferred, with trigger" list |
| Brief survives a FRAMING-CHALLENGE | FAIL | (a) synthesis "§36 draft" steps 2, 5, 6 still say proof "verified outside the company" and VOF counts only outside-verified proof, contradicting history.md decision 3 and variables.yaml Proof.verifier_v0. §36 Limits omits envelopePerCycle and concurrency. (b) brief.md Step 1 names "the verification layer" as the hedge, but with own-gates proof plus infinite fuel v0 has neither scarcity nor independent check. (c) Revisit trigger, clause 2 ("VOF diverges from the Owner's judgment for 2 cycles", cap-po-proof-002) is not falsifiable: divergence and the judgment column have no definition, and in v0 the holding Owner and the company Owner are one person. Clause 1 (second Owner registered) is falsifiable | Amend §36 to the Owner decisions. Define the judgment column (scale, who fills it, when) and a numeric divergence rule, plus a capability for the column. State in the brief what v0 proves (machinery, metering, commons) and what it does not (fuel follows verified output) |

Cross-domain gaps (fold into the next cycle):
- Isolation vs capabilities: cap-po-isolation-001 ("access is denied" to B's path) and cap-po-runner-002 ("outside the company sandbox root") promise enforcement that light v0 defers (variables.yaml isolation_v0.deferred_until_second_owner: OS user/container). Name the v0 mechanism (for example runner-owned permission deny rules plus the Claude Code sandbox) or weaken the acceptance text so it does not overpromise.
- Infinite fuel vs tranches: cap-po-runner-001 skips the open-tranche check "unless fuel is infinite", while cap-po-grant-001 and cap-po-fuel-002 keep tranches and kill conditions. Decide whether tranche gating applies under infinite fuel.
- v0 gates with no capability: no skip-permissions; CHARTER ratified per company; no personal data; the gate "blocked until" for a second Owner (registry should refuse a company with a different Owner until the full isolation and CLO items are done); grant ratification by the holding Owner; reclaim/return of unspent fuel; clawback on reverted proof (proofRevertCommits); smallBetReserve/overrunReserve; concurrency semaphore and per-company lock; commons quarantine, an outside verifier plus the CISO on commons surfaces (cap-po-commons-001 says only "verified §34 surface"), revocation entries.
- Red-Team also flagged that the commons spreads gaming. The Owner's self-verification acceptance covers fuel release. State whether it also covers commons admission. The synthesis says it does not, and the capability text is ambiguous.
- Accepted risk: it is recorded with an owner, a date, alternatives and a revisit trigger (history.md decision 3). Clause 1 is sound. Clause 2 needs the measurable definition above. This review does not challenge the decision itself.

## Exit Criteria

- [ ] Problem statement is falsifiable (can be proven wrong with evidence)
- [ ] Target user is specific enough to exclude someone
- [ ] Regulatory constraints are mapped with confidence levels (HIGH/MED/LOW)
- [ ] At least one core assumption has been tested, not just stated
- [ ] Non-goals are explicit and reasoned (not deferred — excluded with rationale)
- [ ] The brief could survive a FRAMING-CHALLENGE without collapsing

## Verdict

ITERATE — 4 of 6 criteria FAIL. (1) CLO: tag every legal item HIGH/MED/LOW with source, v0-blocking first (provider ToS for parallel headless runs on per-company keys). (2) Test one core assumption: two parallel headless stream-json runs on two keys, capturing per-run usage incl. cache tokens and rate-limit behaviour. (3) Non-goals: give each exclusion a reason; move deferrals (cloud runner, full sandbox, outside verifier) to a 'Deferred, with trigger' list. (4) Framing: amend synthesis §36 to the Owner decisions (own-gates proof, envelopePerCycle/infinite, concurrency); define the Owner-judgment column and a numeric divergence rule so revisit-trigger clause 2 is falsifiable; state what v0 proves and what it does not. Also: reconcile isolation capabilities with light v0, decide tranche gating under infinite fuel, add capabilities for uncovered v0 gates (see Guardian Review).

## Feedback

- 4 of 6 criteria FAIL. (1) CLO: tag every legal item HIGH/MED/LOW with source, v0-blocking first (provider ToS for parallel headless runs on per-company keys). (2) Test one core assumption: two parallel headless stream-json runs on two keys, capturing per-run usage incl. cache tokens and rate-limit behaviour. (3) Non-goals: give each exclusion a reason; move deferrals (cloud runner, full sandbox, outside verifier) to a 'Deferred, with trigger' list. (4) Framing: amend synthesis §36 to the Owner decisions (own-gates proof, envelopePerCycle/infinite, concurrency); define the Owner-judgment column and a numeric divergence rule so revisit-trigger clause 2 is falsifiable; state what v0 proves and what it does not. Also: reconcile isolation capabilities with light v0, decide tranche gating under infinite fuel, add capabilities for uncovered v0 gates (see Guardian Review).

