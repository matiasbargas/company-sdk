# Horizons — team-sdk

> Living document. Updated each retrospective. One row promoted from a horizon to the next per sprint, max.

The principle is the discipline of horizons: **one sprint ships, one is queued with explicit scope, one is sketched only, one is vision-only.** When everything is "next sprint," nothing is shippable. The horizons enforce sequencing.

---

## Now (in flight)

| Workflow / Artifact | Status | Expected ship |
|---|---|---|
| *(empty — no workflow in flight; substrate paused on Owner sign-off of G-001 / G-002 / G-003)* | — | — |

**Owner override 2026-06-14:** Two rows in Now simultaneously earlier (the second was `fix-schema-enforcement-gap-v0.1`). Justification: scopes were independent (one consumed the substrate, the other improved it) and the Owner explicitly chose parallel execution. Logged here so future-Owner remembers this was a conscious break of the discipline, not a drift.

**Owner edit 2026-06-16:** The "How this composes with the queue discipline" subsection below was sharpened by the Owner directly — the formulation *"the rule applies to transition decisions, not to bet-count"* is the load-bearing distinction the SDLC workflow had not crystallized. Captured as Layer A delta candidate for the next quarterly retro.

---

## Bets in flight (SDLC-state view)

Per the SDLC state machine adopted 2026-06-16 (see `intent-spec/sdlc-state-machine/_state-machine-spec.md`), bets occupy explicit lifecycle states rather than a single queue position. Multiple bets can be in different states simultaneously without breaking the one-at-a-time discipline — the constraint becomes **one transition decision per Owner session**, not one bet total.

| Bet | Current state | Next state gate | Owner action required |
|---|---|---|---|
| christensen × devtool (ANCHOR) | proposal | committed (sign G-001, G-002, G-003) | Owner signs portfolio commit doc |
| chasm × regulated (design-partner) | proposal | committed (subordinate to anchor) | none — gated on anchor advancing |
| lean × devtool (insurance) | proposal | committed (subordinate to anchor day-60 signal) | none — gated on canary_1 day-60 |
| idea-execution-v0.2 (substrate-internal) | proposal (HOLDS calibration) | committed (Owner approves build of v0.2 script) | Owner decides whether to ship v0.2 build now |
| §32 generative loops | ga (sealed v4.4) | critical_mass (when used by ~50 loops) | none — accumulating |
| continuous-improvement-substrate | ga (shipped) | critical_mass (when signal-to-action rate measurable) | none — accumulating |

### How this composes with the queue discipline

Bets in different SDLC states do not violate the one-at-a-time rule, because the rule applies to **transition decisions**, not to bet-count. Each forward transition still requires the Owner (or the named role-of-record) to commit once, deliberately, in a single session — multiple transitions in one session would re-introduce the parallel-decision failure mode the discipline exists to prevent. The "Now (in flight)" queue above continues to track active workflow runs — substrate-internal work measured in minutes-to-hours — while the SDLC-state view tracks bets, measured in days-to-quarters. The two views are orthogonal: a workflow run can ship today while every bet stays in `proposal`, and a bet can advance from `proposal` to `committed` without any workflow being in flight.

---

## Shipped today (2026-06-14, append-only log)

| Time | Workflow | Output highlights |
|---|---|---|
| ~00:30 | `idea-execution-v0.1` first run on `protocol-32-generative-loops` | DE-RISK shaped brief; 7 claims |
| ~00:50 | De-risk test (3 Agent calls, not a workflow) | HOLDS verdict; 9 claims (claim-006 INVALIDATED, claim-008/009 ADDED); shaped-brief Decision updated to DE-RISK→HOLDS→PROCEED |
| ~01:50 | `loop-deepen-and-retro` | 3 loop pattern files (496–500w each), `retrospective-v0.1.js`, `idea-execution-v0.2-sketch.md`, `team/roles/loops/README.md` |
| ~02:20 | `continuous-improvement-substrate-v0.1` | `_IMPROVEMENT_SIGNAL.md`, `metrics/` (1 README + 6 defs — budget overrun flagged), OKR proposals (2 docs), `retrospective.js` with 4 cadences, `_HORIZONS.md` Vision section, `_HORIZONS_MAINTENANCE.md` |
| ~02:50 | `protocol-32-seal-v0.1` | §32 sealed into `protocol.md` as v4.4; `team/roles/loop-coordinator.md` shipped; worked example at `loops/2026-06-14-critique-revise-001/`; 3 cross-domain review verdicts (UXR + Designer + CLO) baked in via `_seal-fix-list.md`; 3 new seal-evidence claims (010, 011, 012) appended |
| ~03:30 | `fix-schema-enforcement-gap-v0.1` | `workflows/_SCHEMA_PATTERNS.md` (discipline doc for future workflow scripts); 6 metric files compressed under hard `maxLength` enforcement (each now ≤220 words, down from 272–413); `metrics/_signals.jsonl` first row appended — the first detected→fixed cycle the substrate performed on itself |
| ~04:00 | `idea-execution-v0.1` on seed `idea-execution-v0.2` (dogfood) | DE-RISK shaped brief; Red Team caught: CISO 5-dim rubric is the load-bearing assumption, fail-closed with no override is brittle if rubric has variance or bias; calibration test spec'd inline |
| ~04:20 | `v02-calibration-test-v0.1` | **Verdict HOLDS** with honest caveat: 20/20 agreement + 20/20 separation, BUT 17/20 lines synthetic-constructed-to-fit, so the load-bearing evidence is the 3 real lines (consistent with §32 baseline 1/15 vs 15/15). v0.2 SDD shape unchanged, cycle-3 re-test must use fresh real-line corpus. |
| ~05:00 | `market-prioritization-v0.1` (50 alternatives, 93 agents, ~23 min) | Vision crystallized; 50 (framework × segment) alternatives generated; triage to top-10 with diversity check; team panel scored top-10 across 4 roles (CEO/CMO/CFO/CRO, 40 scoring passes); synthesis killed top-self-scorer (`jtbd × regulated`) for compound indemnification + positioning calcification + Gartner mis-indexing risks; recommended 3-bet portfolio (`christensen × devtool` anchor + `chasm × regulated` design-partner + `lean × devtool` insurance); cross-cutting insight: substrate is single coupled portfolio (devtool = CAC engine funding regulated/agency), `_signals.jsonl` is positioning + marketing + sales + falsification collapsed; recruiting moat with $100-400K/year/lighthouse margin lever |
| ~06:00 (2026-06-15) | `pre-commit-guardrails-v0.1` | Mesa Técnica (CTO chair) + Mesa Legal (Christensen-disruption lens) — 13 agents — converged independently on `_signals.jsonl` envelope v1.0 as load-bearing public API. 12 guardrails consolidated (9 PRE-COMMIT REQUIRED + 2 ONGOING DISCIPLINE + 1 acknowledged-not-signed pair). Greg adjudicated Mario↔PM↔Legal v1.0-scope tension via envelope/payload split (envelope frozen+minimal, payloads evolve per segment under Halloway Ratchet). 4 risks explicitly accepted as unguarded. **Owner sign-off block live in `_pre-commit-guardrails.md`** — bet is paused on Owner decision. |

---

## Next (queued — exact scope, immediate after current ships)

*Queue is empty — one row at a time. Next promotion will happen after §32 seal completes (or fails review and revises). Candidates currently in Later: v0.2 idea-execution dogfood, and a new candidate added 2026-06-14 below (fix-schema-enforcement-gap).*

---

## Earlier "Next" — `continuous-improvement-substrate-v0.1` workflow (SHIPPED 2026-06-14, preserved for context)

**Why this is next, not later.** Three layers are missing simultaneously and they are coupled: metrics (observable signal on whether the substrate is improving), OKRs (strategic direction the bets must move), and **continuous-improvement-as-substrate** (Owner directive 2026-06-14: improvement is continuous through loops AND rituals, not an event triggered after a sprint). Shipping any one of the three without the others produces a partial answer that locks in the wrong shape. They go together or they go in next-next.

**Scope (minimum viable):**

1. **Improvement signal as a first-class loop output.**

   Every loop emission (Critique-Revise turn, Red-Team finding, Dialectic synthesis) carries — alongside its main artifact — a one-line `improvement_signal:` field. Format:

   ```yaml
   improvement_signal:
     friction: "<one sentence — what was hard, what guardrail would have helped, what part of the constitution was unclear>"
     suggested_target: "loop-pattern | layer-A | workflow | protocol | none"
   ```

   The schema rejects empty signals the same way it rejects missing `would-have-wrongly-killed:`. Signal accumulates in `metrics/_signals.jsonl` (append-only, one line per emission).

2. **Ritual cadences — one workflow, four cadence args.**

   The retrospective workflow becomes `retrospective.js` (no v0.1 suffix — versioning via cadence not release). One entry point, `args.cadence` ∈ `{ "loop" | "daily" | "sprint" | "quarterly" }`:

   - **`loop`** — runs after a single loop closes. Reads `improvement_signal:` from emitted artifacts. Cheapest. Auto-triggered by Loop Coordinator.
   - **`daily`** — runs once per day if any signals accumulated. Digests `_signals.jsonl` since last daily. ~5 min wall-clock budget.
   - **`sprint`** — what `retrospective-v0.1.js` does today. Per shipped idea / major sprint. Keeps the artifact shape we just shipped — that becomes the cadence-`sprint` body.
   - **`quarterly`** — runs at OKR cycle close. Reviews KR movement attribution, surfaces Layer A foundation deltas earned by evidence, audits whether `_HORIZONS.md` rows moved.

   Each cadence reads everything below it. Quarterly reads sprint reads daily reads loop signals.

3. **Metrics — observable signals emitted by every workflow run.**

   - `metrics/` directory with definitions: which signal, computed how, surfaced where.
   - Initial metric set (all derivable from existing files + the new signal stream, no new instrumentation):
     - `would-have-wrongly-killed` line quality score (CISO 5-dimension audit, sampled per release)
     - Decision distribution (PROCEED / DE-RISK / REVISE / KILL ratios per release)
     - Claim count per shipped slug + claim invalidation rate
     - Time-from-seed-to-shaped-brief (workflow start → Coordinator synthesis)
     - Retro completion rate per cadence (shipped slugs with `_retrospective.md` / shipped total)
     - **NEW — Signal-to-action rate:** `improvement_signal` entries that became Layer A deltas or protocol-change proposals / total signals. Below 5% suggests the substrate hears itself but does not act; above 30% suggests it is over-reacting.

4. **OKR adoption in the Betting Table.**

   - Extension to `STRATEGY.md` (not new file) — add an OKR section: quarterly Objectives (3 max) + 3 Key Results each.
   - New rule in protocol §11 (Strategy Alignment Protocol): every Betting Table candidate is scored against active KRs before selection. A bet that does not move any KR needs explicit Owner override to be selected.
   - **NEW — KR movement attribution.** Quarterly cadence retrospective produces per-KR "what bet moved this, by how much, with what evidence." Bets that claim KR movement without evidence get flagged. This is what makes OKRs honest in this team — most OKR processes fail at attribution, not at goal-setting.
   - The OKRs themselves are NOT defined in this workflow — defining them is a separate CEO + Owner conversation. This workflow defines the *adoption mechanism*, not the content.

5. **`_HORIZONS.md` becomes auto-maintained.**

   - The `sprint` and `quarterly` cadences promote rows automatically (per the maintenance rules at the bottom of this file).
   - Add a "Vision" section (separate from Longer term) — the 12-month picture, the thing every quarterly OKR ladders to.

**Cost estimate:** 8–10 agents, ~10–15 min. One workflow run.

**Trigger to start:** when `wqpgsoypo` returns and the Owner confirms the loop pattern files read at the right depth.

### Why these four ship together (cross-coupling)

- Improvement signal without metrics = noise.
- Metrics without OKRs = scoreboard with no game.
- OKRs without rituals = wall art.
- Rituals without continuous loop signal = ceremonies that did not earn their attention.

Shipping any one alone produces the failure mode of that layer in isolation. Shipping all four together is the minimum coherent unit. This is the *only* exception to "one thing at a time" — when the unit is genuinely irreducible, splitting it is not minimum value, it is half-value twice.

---

## Later (sketched, not yet scoped)

### v0.2 idea-execution (loops-as-primitive + retro inline + Dialectic + CISO audit)

Sketch at `workflows/idea-execution-v0.2-sketch.md`. Dogfooding play: design v0.2 by running v0.1 on the idea "design v0.2 per sketch." §32 seal landed 2026-06-14 as protocol v4.4 — this entry becomes Next after one sprint-cadence retrospective on the seal slug completes (per workflows/README.md trigger checklist, 24h window).

## Longer term (vision-only, scope deliberately undefined)

### Self-aware substrate

The substrate is self-aware when:
- Every artifact carries enough provenance to be replayed
- Every loop pattern can be measured for whether it's earning its keep
- The retrospective workflow's findings drive Layer A foundation deltas without human prompting (proposing, not deciding — Owner still approves)
- OKRs measurably move because of bets the substrate helped shape, not in spite of them
- **Improvement is continuous** — not "we do retros." The retro at sprint cadence is one ritual among many; the substrate emits improvement signal on every loop close, digests it daily, synthesizes weekly, attributes quarterly. Improvement is the *default state*, not a recurring event on a calendar.

### Specific v0.3+ technical horizons

- **v0.3:** tag-filter retrieval over `generated-spec/*/claims.yaml`, MODIFY/INVALIDATE operations triggered by idea revisions, semantic conflict detection between concurrent workflow runs
- **v0.4:** Tree of Thoughts pattern for high-stakes ideation (single pattern, deeply guardrailed — only earns its keep when decision irreversibility × token cost ratio justifies it per deep-research SOTA)
- **v0.5+:** embedding retrieval, Tier 2 LLM-judge verification for the regeneration invariant on Layer B updates

These are vision because the gap between "we could build this" and "we know we should build this" is exactly one or two complete OKR cycles of evidence we do not yet have.

---

## Vision (12 months)

In 12 months, team-sdk is the **simplest faithful representation of what a product team needs to ship coherent work** — and that simplicity is *earned*, not asserted. Every artifact in the substrate has earned its place by demonstrably reducing friction in a documented context; every artifact that has not earned its place has been removed. The team's contexts — the business domains, the protocol surfaces, the loop patterns, the role behaviors — are **self-aware**: each context knows what it is, what it depends on, what it produces, and what evidence justifies its continued existence. New context is added only when the evidence for it accumulates in `_signals.jsonl`; old context is retired the same way.

Improvement is the **default substrate**, not a quarterly event. The loop emits signal, the day digests it, the sprint acts on it, the quarter re-justifies the whole shape. Every quarterly OKR cycle ladders to one question: *is the team representing itself more simply and more truthfully than it did 90 days ago?* If yes, the substrate is working. If no, the substrate itself is the next bet.

**Flows are guided by product vision + core principles + lifecycle awareness + well-known market strategies.** Workflows are not invented per-mission. They route from vision through principles through lifecycle through known patterns. (Owner directive 2026-06-14. First incarnation: `market-prioritization-2026-06-14` — 50 alternatives × 7 strategy frameworks × 5 segments, triaged against the 18-month winning condition, panel-scored across four C-suite roles, synthesized into a 3-bet portfolio recommendation. The workflow itself is the proof that flows route through known patterns instead of being invented in the moment.)

This vision is the anchor every quarterly OKR must trace back to. Bets that do not move this picture are wall art.

---

## How this doc is maintained

| Trigger | Action |
|---|---|
| `retrospective.js --cadence=sprint` runs | Check whether the `Now` row completed. If yes: mark complete in `Now`, promote one `Next` row to `Now`. If the retro surfaced a Layer A delta candidate matching a `Later` or `Longer term` row, promote that row one notch. |
| `retrospective.js --cadence=quarterly` runs | Review the whole doc. Re-justify or drop rows that haven't moved. Audit whether `Vision (12 months)` still holds; if it has drifted, flag for Owner. Confirm the queue still reflects evidence, not aspiration. |
| Owner directive adds a new ask | Manually added to `Next` only if it displaces an existing `Next` row (one Next at a time). Otherwise: `Later`. Auto-maintenance never silently overrides Owner intent — when sprint/quarterly cadences encounter an Owner-placed row, they log the conflict and defer. |
| Two cadences run close in time | Later cadence wins. See `_HORIZONS_MAINTENANCE.md`. |

The discipline is enforced by file shape, not by hope: if `Next` ever has two rows, the queue is broken and we have to choose explicitly. Auto-maintenance respects this — it will not promote a second `Next` row.

Detailed maintenance rules, conflict resolution, and Owner-override logging: see `_HORIZONS_MAINTENANCE.md`.

## Provenance

- Initial draft: 2026-06-14, prompted by Owner adding "metrics + OKRs + next iterations + longer term" to the current sprint scope
- Source principle: Owner directive "self-improving is as important as executing the task, should be appended after every major sprint" combined with "the simplest we can represent the needs of a team the best we will perform"
- This doc is not a planning artifact — it is the *queue*. There is one queue.
- 2026-06-14 — auto-maintenance + vision section added by `continuous-improvement-substrate-v0.1` workflow.
- 2026-06-16 — SDLC state machine adopted per Owner directive (path #3 of pre-commit-guardrails decision); horizons doc now shows bets by state, in parallel to the workflow Now queue.
