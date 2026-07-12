## 33. Bet Lifecycle State Machine

team-sdk agents already commit, build, ship, and retrospect — but the *current state of any committed bet* is not load-bearing. Today, when an agent asks "where is the disruption-devtool bet right now," there is no canonical answer the corpus can return. The Owner has signed a portfolio commit, the CTO has frozen an envelope, code is being written somewhere, and nobody can point at one file that says which stage this bet is in. The `_pre-commit-guardrails.md` artifact treats every guardrail as a single sign-now moment, which collapses an inherently staged process into one unfalsifiable upfront gate. §33 is the constraint that makes the lifecycle mechanical — declared states, declared transition rules, declared promotion criteria — without turning the SDLC into a waterfall. §33 sits beside §15 (Ideation / Shipping cycles), §15a (self-improvement), §24 (Halloway Ratchet), §31 (Iteration Guardians), and §32 (Generative Loops). It does not replace them. §15 names the two macro cycles; §33 names the explicit states each shipped bet passes through inside the Shipping Cycle and back into the Ideation Cycle on rollback. §33 is NOT a project-management tool, NOT a substitute for the Halloway Ratchet, NOT a new ceremony, and NOT a CLI-invoked workflow apart from the existing `retrospective.js --cadence=sprint` updater. Every transition is gated by named artifacts on disk plus a metric reading plus the specific guardrails active at that altitude.

### 33.1 The states (canonical ordered list)

| State | Entry criteria | Exit criteria | Required artifacts | Owner | Metric gate | Rollback trigger |
|---|---|---|---|---|---|---|
| **proposal** | shaped-brief exists with `PROCEED` or `DE-RISK→HOLDS→PROCEED` decision logged | Portfolio-level Owner approval logged in `history.md` + STRATEGY.md alignment confirmed | `shaped-brief.md`, `claims.yaml` | CEO | n/a — judgment call by Owner | n/a (proposals do not roll back; they get `KILLED` in shaping) |
| **committed** | proposal state cleared + Owner sign-off on portfolio guardrails (G-001, G-002, G-003 from `_pre-commit-guardrails.md`) | All WIP-gate guardrails signed (G-004, G-005, G-007) | Owner-signed portfolio commit doc | CEO | n/a | Owner withdraws commit → state regresses to `proposal` |
| **WIP** | committed + WIP-gate guardrails signed (G-004 envelope freeze, G-005 Halloway entries, G-007 lineage invariant) | All artifacts for state's gate materialize on disk + CI green | code/spec files + envelope schemas + slice doc | EM (KNOWN-class scope) or CTO (EXPLORATORY-class scope) | `time-to-shaped-brief` trends down at sprint cadence | Mario blocks irreversibility violation → regress to `committed` |
| **internal_test** | WIP cleared + envelope SHA pinned + lineage invariant CI green | Test Engineer green light + contract tests pass + Bus replay job 100% | test artifacts + CI configs + replay fixtures | Test Engineer + CTO | `claim-count-and-invalidation-rate` below threshold | red CI build or replay drift → regress to `WIP` |
| **staging** | internal_test cleared + eval-portability CI live (G-008 day-30 seam) | Substrate-internal staging deploys without incident for N consecutive runs | staging config + smoke tests + portability diff in `_signals.jsonl` | EM | `retro-completion-rate` baseline established for the bet | staging incident → regress to `internal_test` |
| **preprod_metrics** | staging cleared + `_signals.jsonl` baseline established | Observable metrics in `_signals.jsonl` match staging baseline within tolerance | metric dashboards + baseline doc | CDO | `signal-to-action-rate` measurable for this bet | metric divergence > tolerance → regress to `staging` |
| **lighthouse_canary_1** | preprod_metrics cleared + Legal MSA gate signed (G-009 Carve-Out + G-010 Claim Altitude + G-011 Control Plane + G-006 lighthouse slice + kill-list) | First lighthouse customer signs MSA + integrates + emits first 30 days of `_signals.jsonl` lines | signed MSA + customer integration record + 30-day jsonl segment | CRO + CLO | `decision-distribution` baseline established for customer | customer-side rollback request → regress to `preprod_metrics` |
| **lighthouse_canary_2** | canary_1 cleared + day-60 signal-gate from G-003 passed | Second lighthouse signs against same envelope SHA | day-60 signal-gate evidence + second MSA | CRO + CMO | minimum-viable-delta confirmed in `_signals.jsonl` | day-60 gate fails → regress to `canary_1` OR `KILL` per G-003 |
| **cohort_rollout** | canary_2 cleared + Editorial Publication classification live (G-012 for any public dissent corpus) | Cohort metrics stable across multiple customers | rollout plan + cohort observability + Editorial classification policy on `_signals.jsonl` writes | CRO + CMO | `retro-completion-rate` > 80% across cohort | cohort regression metric → regress to `canary_2` |
| **ga** | cohort_rollout cleared + GA criteria from STRATEGY.md met | Substrate operates at scale with predictable metric drift only | GA announcement + public docs | CMO | all 6 metrics in healthy range | GA-blocking incident → regress to `cohort_rollout` |
| **critical_mass** | ga + substrate hits ~50 paying teams trigger | Antitrust Interoperability Commitment registered with board (G-013) | board resolution + open Bus spec published + portability endpoint + non-discrimination policy | CLO + CTO | n/a — trigger event | Commitment withdrawal → no rollback (irreversible by G-013 design) |
| **sunset** | (manual entry from any state by Owner directive or CEO + Coordinator joint motion) | Bet wound down with documented learnings + corpus archived | sunset retrospective + corpus archival to `intent-spec/_archive/` | EM + Coordinator | n/a | n/a (sunset is terminal) |

The eleven non-terminal states form an ordered chain. `sunset` is the only state reachable from anywhere by Owner directive. `critical_mass` is the only state whose entry trigger is a count, not an artifact set. Every other state is gated by the conjunction of exit-criteria + required-artifacts + metric-gate + state-specific guardrails.

A few naming choices in the table are load-bearing and worth calling out explicitly:

- **`proposal` and `committed` are distinct states**, not one with two sub-stages. A bet in `proposal` has not yet earned Owner portfolio sign-off and consumes only shaping effort. A bet in `committed` has consumed portfolio capital — calendar, attention, headcount commitment — and rolling it back to `proposal` is itself a §6 decision with a `Reversible: YES` flag and a logged reason. The distinction matters because the Betting Table per §15a treats the two states differently when ranking the active portfolio.
- **`WIP` is the longest-running state for most bets**, and that is fine by design. The state's metric gate (`time-to-shaped-brief` trending down) is a *trend* check, not a deadline. A bet that spends six weeks in `WIP` because the envelope took two passes to freeze is healthy substrate behavior; a bet that spends six weeks bouncing between `WIP` and `internal_test` is a §15a friction signal.
- **`lighthouse_canary_1` and `lighthouse_canary_2` are two states, not one parameterized state**, because the day-60 signal-gate from G-003 is a hard `canary_1 → canary_2` promotion check with `KILL` as a valid outcome. Collapsing the two would hide the kill option.
- **`critical_mass` is not a victory lap**. It is a state with G-013 as its non-negotiable entry condition. A substrate that crosses ~50 paying teams without registering the Interoperability Commitment is in violation of the state machine, and `sdk-health` flags this as a hard error rather than a warning.

### 33.2 State transition rules

The rules below are non-negotiable for v0.1 and may not be relaxed without a §15a protocol change.

- **Forward transitions** require ALL of: exit criteria met + required artifacts on disk + metric gate green + state-specific guardrails signed. A forward transition without one of those four is a protocol violation. The transition is logged as a `state_change` event in `metrics/_signals.jsonl` with the proof artifact SHAs inline, so a sampled audit can replay the transition decision.
- **Backward transitions (rollback)** require: rollback trigger fired + EM-or-higher logs the regression with reason in `history.md` per §6 with `Made by: <role>` and `Reversible: YES`. Rollback is **one state at a time** — a bet in `lighthouse_canary_2` that fails the day-60 signal-gate regresses to `canary_1`, not all the way back to `WIP`, unless the failure surfaced a deeper invariant break (in which case the CTO escalates and the regression hops are logged as a chain, each with its own `history.md` entry).
- **Skip-forward is forbidden.** A bet cannot transition `committed → staging` without passing through `WIP` and `internal_test`. The Owner does not sign the lighthouse MSA before the lighthouse slice exists, and the lighthouse slice does not exist before the envelope SHA is pinned. This is the agile-but-disciplined property: discovery and shipping are interleaved at the state granularity, but no state is skipped at the bet granularity.
- **State is single-valued per bet.** A bet is in exactly one state at any moment. Multiple bets can be in different states simultaneously — this is the SDLC analog of the `_HORIZONS.md` "one row in Next at a time" rule: one bet per transition decision, not one bet total across the substrate.
- **The state file is the single source of truth.** Dashboards, manifests, and the Bus all read the state file. No agent writes the state to two places. A second source of truth is itself a §24 ratchet candidate.
- **Metric gates are computed against `metrics/_signals.jsonl`, not against agent assertions.** A transition that requires `signal-to-action-rate measurable for this bet` is satisfied by a query against the signals stream returning a non-null value with a defensible denominator — not by an agent saying "yes the metric is fine." Underspecified metric gates surface as §15a friction signals per §33.4.
- **Required artifacts are checked by SHA, not by filename.** A transition log entry that names `envelope-schema.yaml` without a content SHA is rejected by the `retrospective.js` updater. This prevents a renamed-but-empty file from satisfying a gate.

Worked transition. Consider a bet at `internal_test` whose CI is green, replay job is at 100%, and Test Engineer has signed off. The forward transition to `staging` requires: (a) exit criteria met (yes — green CI, replay 100%, sign-off), (b) required artifacts present (yes — test artifacts, CI configs, replay fixtures, all SHA-pinned), (c) metric gate green (`claim-count-and-invalidation-rate` below threshold for the prior sprint), (d) no new guardrail signature needed at this transition per the mapping doc. The retrospective updater proposes the promotion; EM (Owner column for `staging`) countersigns. The transition is logged on the Bus with `TAG: STATE-CHANGE`, the `_state.md` Transition history grows by one entry, and `_signals.jsonl` gains a `state_change` event with the four proof SHAs inline. No other action is required. A retro that fails any one of the four conditions does not propose the promotion; the bet stays in `internal_test` and the failed condition surfaces in the next sprint's friction list.

Worked rollback. Same bet, now at `staging`, hits an incident two weeks in. EM logs the regression in `history.md` per §6 with `Made by: EM`, `Reversible: YES`, and a one-paragraph cause description. The `_state.md` Current state field flips to `internal_test`; the Transition history grows by a regression entry; the Active guardrails set is restored to the `internal_test` set. The bet does not pass back through `WIP` — rollback is one state, not many. If the incident root cause turns out to be an envelope flaw rather than a test gap, the CTO opens a separate regression `internal_test → WIP` in the same retro, logged as its own §6 entry, and the chain of two regressions is preserved.

### 33.3 State file location

Each bet maintains a state file at `intent-spec/<bet-slug>/_state.md` with the following required headings, in order:

```markdown
## Current state
<one of the twelve states>

## Owner of record
<role per the state's Owner column>

## Last promoted on
<ISO date + commit SHA of the promotion>

## Transition history
<chronological list of state changes; each entry includes from-state, to-state, timestamp, proof artifact SHAs, and the metric reading that gated the transition>

## Active guardrails
<the guardrails currently in force for this state, by ID from _pre-commit-guardrails.md>
```

The file is auto-updated by `retrospective.js --cadence=sprint`. The retrospective pass reads the bet's artifact set, the latest `_signals.jsonl` window, and the signed-guardrails log; if all four forward-transition conditions are satisfied, it proposes a promotion in the sprint retro. The proposal becomes a transition only when the state's Owner column countersigns. Manual edits to `_state.md` outside the sprint retro require a §6 decision log entry with `Made by: <role>` and reason.

`sdk-health` reads every `intent-spec/*/_state.md` file and flags: (a) any state file that has not been updated for >14 days while the bet has open work in its area log, (b) any state file whose `Current state` does not match the most recent transition entry in `Transition history`, and (c) any state file whose `Active guardrails` set does not match the canonical guardrail set for the named state.

`sdk-status` aggregates `_state.md` files across the substrate and renders a one-screen view: bet slug, current state, owner of record, days in state, last transition. This replaces the implicit "where is everything right now" question that previously required reading every project's `current-status.md` and inferring. The aggregation is read-only; no edit path runs through `sdk-status`.

`sdk-pre-tag` enforces that every bet referenced in the release's `project-map.md` has a state file, that every state file is internally consistent, and that no bet is mid-rollback at tag time. A release that ships with a bet in mid-rollback would be sealing an incoherent substrate.

### 33.4 Composition with §15, §15a, §24, §31, §32

§33 composes with the existing protocol surfaces. It does not modify them.

- **§15 (Ideation and Shipping Cycles)** — the **Ideation Cycle** produces `proposal` state artifacts (shaped-brief + claims); the **Shipping Cycle** starts at `committed` and runs through `ga`. The state machine is the explicit substrate the cycles operate over. A bet in `proposal` is owned by the Ideation Cycle; a bet from `committed` onward is owned by the Shipping Cycle; a bet on the rollback path from `WIP → committed → proposal` re-enters the Ideation Cycle and the Betting Table reconsiders it under §15a fresh.
- **§15a (Self-improvement loop)** — state transition failures (rollbacks, gates that fire repeatedly, artifacts that never materialize) become protocol change proposals via `_signals.jsonl` `friction:` entries with `suggested_target: protocol`. A bet that rolls back from `staging` to `internal_test` more than twice in one release cycle is automatically promoted to a §15a proposal trigger — the state machine is detecting a missing artifact or a misnamed exit criterion, and the protocol learns.
- **§24 (Halloway Ratchet)** — state transitions are LEVEL 3 decisions (deterministic based on artifacts + metrics, not judgment). A forward transition without the named artifact present is a ratchet violation and Mario blocks it automatically per §28's irreversibility review surface. The ratchet is the enforcement layer for the rules in §33.2. Conversely, a transition that requires a Level 1 judgment call (e.g., "is this metric reading good enough") means the state's metric gate is underspecified and a §15a proposal must follow.
- **§31 (Iteration Guardians)** — the Discovery guardian validates quality at `proposal`, the Architecture guardian at `WIP` and `internal_test`, the Implementation guardian at `staging` through `lighthouse_canary_*`. Guardians do not own states; they audit them at transition. A Guardian's GRADUATE verdict is necessary but not sufficient for a forward transition — the artifact + metric + guardrail conditions of §33.2 also apply.
- **§32 (Generative Loops)** — can be invoked at any state to deepen judgment before a transition. A Red-Team loop at `preprod_metrics` is the canonical pattern for catching what the baseline did not. A Critique-Revise loop at `WIP` against the envelope-freeze constitution is the canonical pattern for catching architectural drift before `internal_test`. Loops do not advance states; they shape the judgment that gates the advancement.

The composition is multiplicative rather than additive: a bet inside the Shipping Cycle (§15), at `WIP` state (§33), with a Red-Team loop open against the envelope (§32), under Architecture Guardian review (§31), with a pending Halloway Ratchet entry (§24) — that is a normal substrate configuration, not a corner case. The protocol surfaces are designed to compose without contradiction because each operates on a different axis: §15 is the macro-cycle axis, §33 is the lifecycle axis, §32 is the dissent axis, §31 is the iteration axis, §24 is the doctrine axis. A change in one axis does not silently shift another.

The composition also has a falsifiable property: if a bet is at state X in §33 but the Guardian for state X has not run, the bet is in an inconsistent configuration and `sdk-health` flags it. The reverse is also enforced: a Guardian GRADUATE verdict that does not match a state forward-transition is itself a friction signal — it means the Guardian's scope and the state's scope have drifted. The §15a self-improvement loop catches both directions.

### 33.5 Guardrail mapping principle

Guardrails gate **state transitions**, not single sign-everything moments. This is the central design principle of §33.

The `_pre-commit-guardrails.md` artifact lists thirteen guardrails (G-001 through G-013). Pre-§33, the Owner was asked to sign all twelve in force at commit time — which collapsed the lifecycle into one impossible decision: signing artifacts that did not yet exist (e.g., G-009 Carve-Out Rider before any MSA template was drafted, G-012 Editorial classification before any public publication was even queued). The mapping doc at `intent-spec/sdlc-state-machine/_guardrail-to-state-mapping.md` distributes the same thirteen guardrails across the state machine:

- **portfolio level (G-001, G-002, G-003)** — signed at `proposal → committed`. These are decisions about whether the bet exists at all.
- **technical envelope level (G-004, G-005, G-006, G-007)** — signed at `committed → WIP`. The envelope is frozen, ratchet entries are logged, the lighthouse slice is scoped, the lineage invariant is declared. No customer pressure yet.
- **customer-facing legal surface (G-009, G-010, G-011)** — signed at `preprod_metrics → lighthouse_canary_1`. The MSA template is drafted, the Claim Altitude Register is published, the Control Matrix v0 is countersigned. The legal surface activates exactly when it is load-bearing.
- **publication gate (G-012)** — signed at `canary_2 → cohort_rollout`. Editorial classification only matters when the first public dissent corpus is queued for publication.
- **antitrust posture (G-013)** — signed at `ga → critical_mass`. The Interoperability Commitment registers when the substrate is a market.
- **ongoing discipline (G-008)** — does not gate a single transition. It is a continuous CI requirement that must be green from `committed → WIP` (the LLMProvider seam is part of the envelope) onward, and that blocks `lighthouse_canary_2` if red at day-30 of `lighthouse_canary_1`.

This redistribution has three falsifiable properties that make the mapping checkable rather than a matter of taste. First, the sum of distributed guardrails equals the original set (G-001 through G-013, no additions, no drops). Second, every guardrail lands at the state where its load-bearing artifact first comes into existence — G-009 (Carve-Out) lands at the MSA-template transition because the rider is a clause inside the template, and pre-template signing is signing against air. Third, the `_pre-commit-guardrails.md` artifact itself remains the source of truth for guardrail wording; the state machine references guardrails by ID, not by re-stating them. A future protocol change that adds or rewords a guardrail does not require a §33 amendment, only a mapping-doc update.

The principle generalizes beyond the current thirteen guardrails. Any future guardrail introduced by a §15a protocol change must declare its load-bearing artifact at proposal time, and the mapping doc must place the new guardrail at the state where that artifact first comes into existence. A guardrail that cannot name a load-bearing artifact is itself underspecified and the §15a proposal returns to shaping. This is the closure rule that prevents guardrail accretion: every guardrail in the substrate is anchored to a state, an artifact, and an owner. A guardrail with none of those is not a guardrail, it is a wish.

The Owner signs the same thirteen guardrails as before, but at the moment each one is actually load-bearing. The artifact-on-disk requirement at every transition prevents skip-ahead. The three early signatures (G-001, G-002, G-003) are portfolio commitment level, not technical lock-in — the Owner can still kill the bet before WIP without having frozen any envelope, written any code, or talked to any customer. See `_guardrail-to-state-mapping.md` for the full table.

### 33.6 Authority for state transitions

Authority follows the state's Owner column in §33.1. Specifically:

- **Promote (forward transition):** the Owner column for the *destination* state. So promoting `committed → WIP` requires EM (KNOWN-class) or CTO (EXPLORATORY-class) countersign — not CEO. Promoting `preprod_metrics → lighthouse_canary_1` requires CRO + CLO joint countersign. Promotion authority is intentionally cross-domain at the lighthouse states because those transitions activate legal surfaces no single domain can ratify.
- **Regress (backward transition):** the Owner column for the *origin* state, OR EM, OR Mario, OR CEO. Rollback authority is intentionally broader than promotion authority — anyone with eyes on a failing state can pull the brake. The asymmetry is by design: forward needs a quorum, backward needs a witness.
- **Mario can block any forward transition** that violates a Halloway Ratchet entry, an irreversibility constraint, or a load-bearing invariant on the bet's envelope. Mario's block is unconditional; it cannot be overridden by the promotion quorum. The block is logged per §28 as an irreversibility review surface.
- **CEO override.** The CEO can override any state transition decision — promotion, regression, or block — by logging the override in `history.md` with `Made by: CEO`, `Reversible: NO`, and a one-sentence rationale. The override is a §6 decision and survives in the permanent record. CEO overrides are visible in `sdk-status` and counted as friction signals if they exceed two per release cycle.
- **Owner directive.** The Owner can move any bet to `sunset` from any state by directive, without a quorum. This is the only authority that does not require a countersign. The Owner can also override any CEO decision per the standing constitutional surface in `team/roles/ceo.md`.
- **Loop Coordinator (§32) has no state transition authority.** Loops shape judgment; they do not advance the state machine.

The asymmetry between promotion authority (narrow, quorum-based) and regression authority (broad, single-witness) is intentional. Forward motion through the lifecycle commits portfolio capital and external surface area; backward motion reclaims them. The substrate biases toward conserving optionality, so the heavier signature load is placed on transitions that reduce optionality. This is the same logic §28 applies to irreversible decisions and the same logic §32.4 applies to loop extensions: the side that loses optionality pays the higher countersign cost.

Worked conflict. CRO and CLO are ready to promote a bet from `preprod_metrics` to `lighthouse_canary_1` — first MSA is drafted, the Carve-Out Rider (G-009), Claim Altitude Register (G-010), and Control Matrix v0 (G-011) are all countersigned, the kill-list is published, and the customer is integration-ready. Mario blocks the transition because the lighthouse slice references an envelope field that drifted from the SHA pinned at `committed → WIP` without a logged ratchet entry. The promotion quorum cannot override; Mario's block is unconditional per §33.6. Three resolution paths exist: (a) the CTO logs the ratchet entry retroactively per §24 with proper provenance, Mario lifts the block, and the promotion proceeds; (b) the CTO determines the drift was unintended, restores the original envelope SHA, and the promotion proceeds against the rebuilt slice; (c) the CEO overrides per §33.6 with `Made by: CEO`, `Reversible: NO`, and a one-sentence rationale, accepting the drift as a one-time exception. Path (a) is the default; path (b) is the technically correct response if drift was a mistake; path (c) exists for cases where the override is genuinely the right call and the team accepts the permanent record of it.

### 33.7 Substrate-internal bets vs customer-facing bets

The SDLC applies to **both** customer-facing bets (e.g., christensen-disruption × devtool with paying lighthouses) and substrate-internal bets (e.g., idea-execution v0.x, §32 itself, `retrospective.js`, the `intent-spec/` schema, this very state machine). The states are the same; the customer for substrate-internal bets is the team itself.

Concretely, for substrate-internal bets:

- `proposal` and `committed` carry their usual semantics. The shaped-brief still exists; the Owner still signs the portfolio commit. STRATEGY.md alignment is checked against the four success themes regardless of whether the bet has external customers.
- `WIP` and `internal_test` are indistinguishable from the customer-facing case. Code is written, contracts are tested, the Bus replay job runs.
- `staging` for a substrate-internal bet means: dogfooded on team-sdk's own project (`project/`), exercising the change in the same conditions a real project would see it. The N consecutive incident-free runs are measured against actual team-sdk sessions.
- `preprod_metrics` reads the same `metrics/_signals.jsonl` lines, but the baseline is established against substrate-internal usage. The signal-to-action-rate metric is the gate.
- `lighthouse_canary_1` and `lighthouse_canary_2` are interpreted as: the first two *external* team-sdk users on this substrate change. For substrate features used only by the team itself (e.g., a new CLI command, a protocol section), `canary_1` and `canary_2` collapse into a single substrate-internal canary measured over equivalent time windows. The state file declares which interpretation applies on the `committed → WIP` transition.
- `cohort_rollout` and `ga` are interpreted as: the substrate change is in use across the team's active projects and meets the §15a publish-broadly criteria.
- `critical_mass` for substrate-internal bets is reached when the change is depended on by other substrate features (e.g., §33 reaches `critical_mass` when ≥3 substrate features list it in their composition section). G-013 does not apply to substrate-internal bets; the trigger is the dependency count.

The substrate-internal application is non-trivially important: §32, §33, and the `intent-spec/` schema are themselves bets, and the team owes them the same lifecycle discipline. A protocol section that never transitions past `internal_test` is a §15a friction signal in its own right.

Worked example. §33 itself, at the moment this draft is written, is in `proposal` state. Its shaped-brief is the spec at `intent-spec/sdlc-state-machine/_state-machine-spec.md`. Its `claims.yaml` equivalent is the guardrail-to-state mapping. The forward transition to `committed` requires CEO portfolio approval logged in `history.md`, which is exactly the Coordinator-review + CEO-approval gate §15a already names for protocol changes. Once committed, the WIP-gate guardrails for a substrate-internal protocol bet collapse to: the protocol.md insertion is drafted, a `retrospective.js` patch updates the state file format, and a `sdk-health` extension checks the new file. The bet stays in `WIP` until the patches land. `internal_test` is the dogfood pass — the next sprint retro auto-updates an existing bet's `_state.md` using the new format and confirms no regression in `sdk-status`. `staging` is the first multi-sprint window where §33 is in continuous use on at least one customer-facing bet without manual intervention. By the time §33 reaches `ga`, it is reading and writing state files for every active bet in the substrate. The state machine eats its own dogfood.

### 33.8 Cross-references

§33 composes with adjacent protocol surfaces. It does not modify them.

- **§1 (Bus Message Format)** — state transitions are announced on the Bus with `TAG: STATE-CHANGE` and the state file's transition entry inline. SOLUTION_CLASS is `Level 3` for the transition itself (deterministic on artifacts + metrics + guardrails); any Level 1 reasoning in the transition decision indicates an underspecified gate per §33.4.
- **§6 (Decision Log)** — every rollback, every CEO override, and every Owner-directed `sunset` is logged per §6 with `Made by:` and `Reversible:` populated. Forward transitions that follow §33.2's conditions do not require a separate §6 entry because the `_signals.jsonl` `state_change` event is sufficient provenance.
- **§15 (Ideation and Shipping Cycles)** — see §33.4.
- **§15a (Self-improvement loop)** — see §33.4. Pattern of state regressions is a §15a trigger.
- **§22 (Bus Log)** — the Bus Log records `TAG: STATE-CHANGE` events as `doc.log` entries in the bet's area log. The state file is the long-running record; the Bus Log is the transition stream.
- **§24 (Halloway Ratchet)** — see §33.4. Transitions are Level 3; underspecified gates are themselves ratchet candidates.
- **§25 (TAG field)** — new tag introduced by §33: `STATE-CHANGE`. Adding any further §33 tag requires a protocol version bump per §25.
- **§28 (Pre-Mortem Gate)** — Mario's irreversibility review surface is the enforcement layer for the rule that a forward transition without the named artifact is forbidden. A Pre-Mortem at `preprod_metrics → lighthouse_canary_1` is the canonical preparation for the first MSA signing.
- **§29 (Structured Disagreement Log)** — if a promotion quorum and a Mario block reach an irreconcilable position on the same transition, the disagreement is logged per §29 and the CEO override surface in §33.6 resolves it.
- **§30 (Design Principles)** — §33 is a constraint mechanism, not a new agent type. There is no "SDLC Coordinator" agent because §30 warns that adding an agent for a constraint creates the illusion that someone else is watching. The constraint (declared states, declared transitions, named owners, named guardrails) is carried by every agent who owns a state.
- **§31 (Iteration Guardians)** — see §33.4.
- **§32 (Generative Loops)** — see §33.4. Loops shape judgment at any state; loops do not transition states.

Two pre-§33 surfaces are explicitly left unchanged. The `_HORIZONS.md` "one row in Next at a time" rule still governs ideation throughput; the state machine adds bet-level granularity but does not relax the horizon rule. The `current-status.md` narrative in each project still functions as the human-readable session-resume surface; §33 adds machine-readable state files alongside, it does not deprecate the narrative.

One pre-§33 ambiguity is resolved. Before §33, a bet could be referred to as "in progress" with three different meanings: portfolio-committed, code-being-written, or customer-deployed. After §33, "in progress" is not a state — agents reference the canonical state name (`committed`, `WIP`, `lighthouse_canary_1`) and the ambiguity disappears from the corpus. Agents who use "in progress" in a Bus message after §33 ratifies receive a Coordinator nudge to use the canonical state.

---

*Draft for §33. Authored by Coordinator + CTO, 2026-06-16, on Owner directive (path #3 of the pre-commit-guardrails decision). Sources: `intent-spec/sdlc-state-machine/_state-machine-spec.md`, `intent-spec/sdlc-state-machine/_guardrail-to-state-mapping.md`, `intent-spec/market-prioritization-2026-06-14/_pre-commit-guardrails.md`. Pending Coordinator review + CEO approval per §15a before insertion into `protocol.md`.*
