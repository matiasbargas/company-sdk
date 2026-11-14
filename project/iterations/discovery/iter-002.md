---
loop: "discovery"
cycle: 2
guardian: "Discovery Guardian"
status: "graduated"
created: "2026-11-14"
graduated: "2026-11-14"
---

## Input

Portfolio Orchestrator, Discovery cycle 2 (2026-11-14). It answers every cycle-1 required change in `iter-001.md`.
- Synthesis v2 (§36 v0.2, CLO confidence table, what v0 proves and does not, non-goals with reasons, deferred with trigger): `project/context/intent/portfolio-orchestrator/discovery-synthesis.md`
- Metering spike (criterion 4 evidence): `project/record/experiments/2026-11-13-metering-spike/README.md` + raw streams
- Problem model updated: `project/context/spec/portfolio-orchestrator/variables.yaml` (modelUsage metering, session floor, budget ceiling, infinite-fuel meaning, judgment column, honest isolation limit, commons verifier)
- Capabilities: 25 planned (10 new; isolation and runner acceptance weakened to the real v0 mechanism): `.../claims.yaml`
- Owner decisions: `project/history.md` → "Portfolio Orchestrator — Discovery decisions" + 2026-11-14 addendum (commons needs an outside verifier)

## Guardian Review

Reviewer: Discovery Guardian · Release v2026.Q2.3 · 2026-11-14. Read: iter-001.md, discovery-synthesis.md (cycle 2), brief.md, variables.yaml, claims.yaml (25 capabilities), history.md → "Portfolio Orchestrator — Discovery decisions" + 2026-11-14 addendum, metering-spike README.md plus both raw streams (run-a, run-b).

| Criterion | PASS/FAIL | Evidence (file:section) | Required change |
|---|---|---|---|
| Problem statement is falsifiable | PASS | brief.md: "Smallest proof" is pass/fail. discovery-synthesis.md: "What v0 proves, and what it does not" now narrows the claim to machinery and says value allocation is not proved | None. The cycle-1 note still stands: "no Owner is surprised" (brief.md, "Winning at 18 months") has no measure. Carried forward, not blocking |
| Target user is specific enough to exclude someone | PASS | brief.md: Step 1 "Customer". history.md decision 4 (own ventures only). claims.yaml cap-po-registry-002 now enforces the exclusion: a company with a different Owner is refused until the gates hold | None |
| Regulatory constraints mapped with confidence levels | PASS | discovery-synthesis.md: "Regulatory map (CLO), with confidence". 9 items, each with applies-when, HIGH/MED/LOW and source. The v0-blocking item (provider terms for parallel headless runs) comes first: MED on structure, LOW on exact clauses because the live terms were not read | None to pass. The one v0 item at LOW should be raised by reading the live provider terms before the first two-instance run. This is a precondition to carry into Architecture, not a Discovery gap |
| At least one core assumption tested, not just stated | PASS | record/experiments/2026-11-13-metering-spike/README.md plus raw streams. I checked them: in both `type:"result"` lines, `usage` is all zeros and `modelUsage.claude-opus-5-5` has in 2, out 4, cacheCreation 16706, `costUSD` 0.083618, `subtype` error_max_budget_usd. The test changed the design: cap-po-fuel-001, cap-po-budget-001, and the session floor in §36.1 | None. Limits: both runs show `apiKeySource: apiKeyHelper`, so keys per company were not tested, and rate limits at scale are untested (README says so). variables.yaml Limits.concurrency still asserts "rate-limit contention is the real local bottleneck" as fact. Mark it open |
| Non-goals explicit and reasoned | PASS | discovery-synthesis.md: "Non-goals (excluded, with reasons)" has 5 exclusions, each with a reason (CLO, Constraint 1, Autonomy Limit 2). "Deferred, with trigger" holds the 5 deferrals, each with an observable trigger. brief.md "NOT building (v0)" points to both | None |
| Brief survives a FRAMING-CHALLENGE | PASS | (a) §36 v0.2 steps 2, 5, 6 and 8 match history.md decision 3 and the addendum (own gates for fuel, outside verifier for commons, infinite fuel = pool limit only, concurrency). (b) The verification-hedge challenge is answered: the "Does not prove" line keeps the brief from claiming what v0 cannot show. (c) The accepted risk is recorded with owner, date, alternatives and a falsifiable trigger (history.md addendum; cap-po-proof-002; cap-po-judgment-001: scale, who rates, when, ≥ 50% rule) | None to pass. The trigger has two precision defects. Fix both before the conformance tests for cap-po-judgment-001 and cap-po-proof-002 are written (see Feedback) |

**Cycle-1 items**
- [x] CLO confidence tagging, v0-blocking item first: closed (synthesis "Regulatory map")
- [x] Test one core assumption: closed (metering spike). Keys per company and rate limits at scale remain open
- [x] Non-goals with reasons, deferrals split out with triggers: closed
- [x] §36 amended to the Owner decisions (own gates, envelopePerCycle, concurrency): closed (§36 v0.2)
- [x] Judgment column defined, numeric divergence rule, capability added: closed (cap-po-judgment-001)
- [~] State what v0 proves and does not: closed in the synthesis. brief.md does not link to it, and its "Smallest proof" still says "verified output" where v0 proof is the company's own gates. Wording only
- [x] Isolation capabilities reconciled with light v0: closed (cap-po-isolation-001, cap-po-runner-002, variables.yaml honest_limit)
- [x] Tranche gating under infinite fuel decided: closed (§36.5, cap-po-fuel-002, cap-po-runner-001)
- [x] Uncovered v0 gates given capabilities: closed (runner-003, registry-002, data-001, grant-002, grant-003, proof-003, reserve-001, commons-001, commons-003)
- [x] Whether self-verification covers commons admission: closed (Owner addendum 2026-11-14; cap-po-commons-001 third acceptance)
- [x] Accepted-risk clause 2 made falsifiable: closed. Two precision defects are carried forward
- [ ] Measure for "no Owner is surprised": open (a note from cycle 1, not blocking)

## Exit Criteria

- [x] Problem statement is falsifiable (can be proven wrong with evidence)
- [x] Target user is specific enough to exclude someone
- [x] Regulatory constraints are mapped with confidence levels (HIGH/MED/LOW)
- [x] At least one core assumption has been tested, not just stated
- [x] Non-goals are explicit and reasoned (not deferred — excluded with rationale)
- [x] The brief could survive a FRAMING-CHALLENGE without collapsing

## Verdict

GRADUATE — All exit criteria passed. Output ready for canonical docs.

## Feedback

These items are carried forward. They do not block graduation, and the Coordinator routes them with the graduated content (§31.4):
- PM/CFO: the divergence rule takes the median across the whole portfolio, but VOF is "compared only within a bet class" (synthesis §36.8, variables.yaml metric.rule). Pick one denominator, preferably the median within each bet class, and set a minimum bet count below which divergence is not computed.
- PM/CFO: if the company Owner does not rate a bet, divergence cannot be measured, so in v0 the trigger never fires. Count a missing rating as a divergence signal, or have sdk-health flag the column as unfilled. Add this as an acceptance case on cap-po-judgment-001.
- Mario / §32 Red-Team (CTO): cap-po-runner-002 rests on permission rules, and the Bash limit documented in cap-po-isolation-001 also applies to holding/fuel/ledger.jsonl. Without a key, the hash chain cannot detect a forged line appended by Bash. The trust-boundary decision should name how the ledger stays out of reach of company sessions.
- CLO: read the live provider terms for parallel headless runs (v0 item, LOW) before the first two-instance run.
- CTO: keys per company and rate limits at scale are still untested. variables.yaml Limits.concurrency should mark its comment as an assumption.
- Greg: brief.md "Smallest proof" should say proof means the company's own gates in v0 and link to "What v0 proves". "No Owner is surprised" still needs a measure.
