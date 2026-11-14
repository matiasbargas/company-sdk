# Discovery synthesis — Portfolio Orchestrator (cycle 2)

**Author:** Greg (CEO) · **Cycle 1:** 2026-11-13 (Discovery Guardian: ITERATE, 4/6 failed) · **Cycle 2:** 2026-11-14
**Inputs:** CFO (§36), CTO (machinery), CISO (threat model), CLO (legal shape), Red-Team (self-certified proof = critical), and the **metering spike** (`record/experiments/2026-11-13-metering-spike/`).
**Owner decisions:** `history.md` → "Portfolio Orchestrator — Discovery decisions" (+ the 2026-11-14 addendum on commons admission).

## What v0 proves, and what it does not
- **Proves:** that the machinery works. Two companies run in parallel. Metering comes from the runner. A hash-chained ledger records burn next to proof. Grants, tranches and the kill switch behave as specified. One commons item crosses through an outside-verified surface.
- **Does not prove:** that fuel follows *value*. Proof in v0 is each company's own gates, an accepted risk, and both companies belong to one Owner. Value allocation is tested only once the revisit trigger fires (see the judgment column below), or a second Owner joins.

## The shape everyone converged on
- **The holding is a team-sdk instance** with `holding/`: `portfolio.json`, `fuel/ledger.jsonl`, `commons/`, `runs/`. *(CTO)*
- **One git repository (clone) per company.** Worktrees are never shared between companies, because they share `.git`. *(CTO + CISO)*
- **The runner is the only metering authority.** It meters from stream-json `result.modelUsage`, keyed by model, and never from top-level `usage`, which the spike showed is all zeros. Instances never report their own burn. Hooks provide a landing mode and are never a kill. *(CTO + CISO + spike)*
- **The ledger is event-sourced, append-only, hash-chained, and records raw tokens by type and model.** Fuel Units and USD are derived views, and USD is a list-price estimate (`costBasis: list`). Only the holding Owner can write `fund`. *(CFO + CTO)*
- **Fuel is never a tradable token.** *(CLO)*
- **The commons works like a package manager:** copy plus lockfile, content-hashed, pull-only, adopted per Owner approval. It never carries settings, hooks, CHARTER or scripts. New items go through quarantine. **Admission needs an outside verifier** (another company's roster plus the CISO), by Owner decision on 2026-11-14. *(CTO + CISO + Owner)*

## §36 Fuel Allocation Protocol — draft v0.2 (amended to the Owner's decisions)
1. **Units.** Raw tokens (in, out, cache-write, cache-read) per model, from `modelUsage`, per instance, role, mission and loop. FU = raw × `fuel.priceTable`. A session with no usage record is `unmetered`, never zero. **Per-session floor:** each session's fixed overhead (about 16.7k cache-creation tokens on Opus, per the spike) counts against the grant.
2. **Lifecycle.** request (mission, appetite FU, tranches, named proof per tranche, kill condition) → Portfolio Betting Table (holding Greg + CFO) → **holding Owner ratifies** → draw (runner-metered, stopping at a turn boundary) → **proof by the company's own gates** (v0, accepted risk) → automatic release of the next tranche → close / return / reclaim.
3. **Ledger.** `holding/fuel/ledger.jsonl`. Events: `fund | grant | release | draw | proof | overrun | reclaim | return | close`. Invariants: no negative balance (unless fuel is infinite); every draw names a live grant and mission; idempotent; hash-chained; only the Owner funds; one proof unlocks at most one tranche.
4. **Budget ceilings.** `--max-budget-usd` is checked **after** a turn (the spike overshot $0.05 to $0.084), so it is a soft ceiling. The hard ceiling is the provider-side cap on each company's key. Overshoot is written as `overrun` and paid from `fuel.overrunReserve`.
5. **Infinite fuel.** `limits.fuel.envelopePerCycle: null` removes the **pool** limit only. Every draw is still metered, and **tranche gating and kill conditions still apply**: under §16.1, `null` removes a count, never a stop condition.
6. **Limits** (`.sdkrc` → `limits.fuel.*`): `envelopePerCycle` null (infinite) or a number; `trancheSize` and `tranchesPerGrant` null (declared per grant); `reclaimCyclesWithoutProof` 1; `smallBetReserve` 0.2; `overrunReserve` 0.05; `proofRevertCommits` 10; `concurrency` 2 (semaphore, plus one lock per company). Grants never live in `.sdkrc`.
7. **Guardrails.** No draw without a grant. All fuel counts in the denominator. Returned fuel earns credit. Proof is pass/fail and named in advance. Proof reverted within `proofRevertCommits` is clawed back. Weights change only at the Table. The small-bet reserve protects new and small companies.
8. **Metric and the judgment column.** VOF = Σ weight(proof, not reverted) ÷ FU drawn, fully loaded, compared only within a bet class. Each cycle, the company Owner also rates each funded bet **advanced / flat / regressed**. That rating is the *judgment column*. **Divergence:** within a bet class of at least 3 funded bets, ≥ 50% of the bets above that class's VOF median are rated flat or regressed by their Owner. An unrated bet counts as divergent, so the trigger cannot be silenced by not rating. **Revisit trigger (accepted risk):** divergence in 2 consecutive cycles, or a second human Owner is registered. Then `sdk-health` reports that the outside-verifier decision for fuel is due.

## Regulatory map (CLO), with confidence
| Item | Applies when | Confidence | Source |
|---|---|---|---|
| Auth for parallel headless runs must be allowed by provider terms; prefer API keys over a consumer subscription | v0 | MED on structure, **LOW on exact clauses** (live terms not read) | CLO; provider commercial/consumer terms |
| No personal data in v0 ventures, or a commons scrubbed and checked by tooling | v0 | HIGH | CLO; GDPR principles |
| One-page internal fuel memo (+ intercompany note if separate entities) | v0 | MED | CLO (tax treatment) |
| CHARTER ratified, plus a holding-Owner vs company-Owner amendment | v0 (ratify); before 2nd Owner (amend) | HIGH | CLO; CHARTER Precedence #3, Autonomy Limit 2 |
| Fuel is non-transferable and non-redeemable, never a token | always | HIGH | CLO (MiCA / stored-value risk) |
| Fuel's legal category (grant, service, investment, credit) chosen deliberately | before 2nd Owner | **LOW, needs counsel** | CLO (milestone tranches may look like financing) |
| Outputs assigned or licensed in writing to the company | before 2nd Owner | MED | CLO (API outputs go to the account holder) |
| DPA if a company handles personal data | before 2nd Owner | HIGH that it's needed; MED on form | CLO; GDPR Art. 28 |
| Competition: info barrier + competitively-sensitive flag | before 2 competing Owners | MED | CLO; Sherman §1 / TFEU 101 |

## v0 gates (each now has a capability in `context/spec/portfolio-orchestrator/claims.yaml`)
Separate clones · a key per company with a provider cap (unless fuel is infinite) · runner-owned settings and hooks · no skip-permissions · a ledger as above · a kill switch · the commons controls above · no personal data · each company's CHARTER ratified · the registry refuses a second Owner until the full gates hold.
**Honest limit:** in light v0, isolation between companies comes from **permission rules plus separate clones under one OS user**. It is not enforced by the OS. A Bash command can still reach a sibling. OS-user or container isolation is a gate before any other Owner joins.

## Non-goals (excluded, with reasons)
- **Billing or payments between companies.** Fuel is an internal allocation. Billing would turn it into a service or credit and pull in tax and resale terms (CLO) with no v0 benefit.
- **Raw context shared across companies.** Opt-in published context covers the learning goal without trade-secret or antitrust exposure (CLO).
- **Holding authority over a company's operations.** Each company has its own Owner. The holding steering their work would make it a control channel, contradicting Constraint 1.
- **Autonomous spend outside the ledger.** It breaks Autonomy Limit 2 and defeats metering.
- **A marketplace.** There are no outside companies to trade with in v0. It adds no proof value and needs the legal category decided first.

## Deferred, with trigger
| Deferred | Trigger to revisit |
|---|---|
| Cloud runner | The two-instance proof passes, **or** the Owner needs runs while the laptop is off |
| OS-user or container isolation per instance | Before any company owned by someone else is registered (registry refuses otherwise) |
| Outside-verifier rule for **fuel** proof | The revisit trigger in §36.8 fires |
| Adoption ledger + automated commons recall | The third company joins the commons |
| Signed commons commits (PKI) | A second Owner publishes to the commons |

## Build list for the smallest proof (CTO, ~8–10 engineer-days, test-first)
Write conformance tests from the planned capabilities **first**, then build: portfolio.json + validator · ledger lib · meter (stream-json `modelUsage` + transcript backfill) · LocalRunner (spawn, semaphore, per-company lock, graceful stop) · fuel gate (pre-flight + landing mode + `--settings`) · `sdk-commons publish|pull` + lockfile · `sdk-holding` CLI · office-day parametrized by `project_dir` · tests.

## Irreversible decisions for Mario (before build)
Ledger data model · trust boundary (the runner is the only meter, reading `modelUsage`) · one repository per company · runner contract (4 methods + the Agent SDK usage shape) · commons identity (hash + surface id, copy + lockfile) · account topology (a key per company, by Owner decision).
**Recommended first:** a §32 Red-Team loop on runner-only metering (Guardian cycle 1). The spike has now tested part of that assumption.
