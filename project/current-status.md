# Current Status
**Last updated:** 2026-11-13
**Updated by:** Greg (CEO) — harness review complete (batches 1–6)
**Release:** v2026.Q2.3 · **Protocol:** v4.8 (§16.1 limits, §2 timing; §31 restored; §32 + §34 + §35 sealed; §33 reserved for SDLC state machine, draft)

> This is the first file you read when resuming work. It tells you exactly where the team is right now and what the next action is. If this file is out of date, the team is flying blind.
>
> The show must go on. Every session ends with this file updated.

---

## Phase

**Harness review complete (2026-11-13), all 6 batches shipped on `feat/harness-hardening`.** Batch 6: protocol generated per section (`protocol/NN-*.md` + INDEX, loaded by number per §7), and a single state reader (`scripts/lib/project-state.js`) behind status/gate-check/version/pre-tag, which fixes the positional mission-column bug. Rituals now carry frontmatter. Batches 4–5: Greg output style (main thread only), SessionStart brief + file-protection hooks, 25 composable skills in `.claude/skills/` (incl. `/ask`), 36 generated subagents in `.claude/agents/` (read-only consultation peers, fresh-context critic/judge/red-teamer), `sdk-doc bus` enforces §1, docs consistency test in `npm test`. Batch 3: `_shared.md` / `_guardian.md` modules (~30k tokens of duplication removed from role files), personas on `{{city}}`/`{{cultural_profile}}` placeholders, loader fills them. Batch 2: `.sdkrc` limits (no cap by default; stop conditions mandatory), event-based timing with overdue surfacing, one home for each disputed rule (SOLUTION_CLASS, load order, activation order, Bus format, platform primitives), loop contracts sharpened, squads read from their .md files. Batch 1: A four-agent review of every role, coordination, office, and template file found that several mechanisms the docs claimed were not running. Batch 1 repaired them: §31 Iteration Loops and `sdk-doc iteration` are restored (protocol v4.7), gate-check now sees the real template headings and placeholder jurisdictions, section lookup is level-aware and scoped (`## Finance (CFO) > Pending`), protocol-core/reference are generated and test-pinned, the stale project-template/SDK.md is gone, the §35 Stop reminder is visible, and `sdk-health` flags stalled surfaces. The first thing that check flagged is `SURFACE-20260620-enforcement-claims-tooling-001`, under-verification for 132 days. **Next batches:** (2) configurable limits in `.sdkrc` (default no cap; loops keep a mandatory stop condition) + single-source rules; (3) `_shared.md`/`_guardian.md` extraction + `{{name}}` placeholder sweep; (4) Greg output style + SessionStart hook + docs consistency test; (5) Tier-1 skills + generated `.claude/agents/`; (6) protocol split + frontmatter state. See `history.md` → "Harness review, batch 1".

**Document-First Gate sealed (§35, 2026-06-30; protocol v4.5 → v4.6).** "The map never lags the work" is now load-bearing, not norm: a material change must touch the map (`current-status.md`/`history.md`) in the same commit or carry `[map-exempt: <reason>]`. Three real layers — a hard-blocking git `commit-msg` hook (`scripts/hooks/` + `sdk-install-hooks`), a non-blocking Claude Code `Stop` reminder (`.claude/settings.json`), and an `sdk-health` drift backstop. Authoritative material/exempt list lives in code (`scripts/lib/map-gate-lib.js`), pinned by `npm test`. Built under the `SURFACE-20260620-enforcement-claims-tooling-001` discipline: every mechanism the text names was built and verified first. Gate verified end-to-end (6 commit scenarios + Stop hook + health). **Honest open gap:** auto-installing the gate in *generated* projects is a follow-up (they carry no `scripts/hooks`); today §35 is enforced in the SDK's own repo. This is the standing fix for the drift that forced the 2026-06-19 and 2026-06-24 backfills.

**Self-describing team-organism, Phase 1 shipped + mapped (2026-06-20/22).** Protocol §34 sealed (v4.4 → v4.5): **Collaboration Surfaces** — a self-describing shared artifact where multiple roles author and verify one decision/flow/roadmap (front-matter schema, author/verification/reconciliation blocks, state machine, dynamic-plus-fixed-minimum verifier roster, blunt no-go → forced discussion, provenance + `improvement_signal` reuse, human boundary at §34.7). Ships `project-template/surface-template.md` and the first worked surface (`SURFACE-20260620-enforcement-claims-tooling-001`, awaiting its verifier roster). **CHARTER.md** drafted as Layer A ("The Company Is The Product") — **DRAFT, awaiting Owner ratification; not load-bearing until signed.** **The Office** (`team/office/rituals/` + `workflows/office-day-v0.1.js`) adds a legible daily operating rhythm of five rituals that reconcile the company body to truth on a fixed clock.

**Governance status:** §34 + CHARTER were committed (`b9823b3`) but never entered in `history.md`; the office layer (Jun 22) sat uncommitted. The 2026-06-24 Greg audit closed the map: `history.md` backfilled with two SDK-CHANGE entries, this file reconciled, office layer committed. See `history.md` → "§34 Collaboration Surfaces + CHARTER" and "The Office: Daily Operating Rituals."

**Prior phases (still true):** §32 generative-loops layer + continuous-improvement substrate sealed (v4.4, 2026-06-14/16) — the overdue sprint retro on `protocol-32-generative-loops` is now **delivered** (`42888b8`; `_RETRO-INDEX.md` + `_cadence-runs.jsonl` exist). Tier 1 of @team-sdk extraction complete — Protocol Schema, Knowledge Graph, Consultation Extension, 848 tests / 0 failures. Tier 2 (cross-project memory, pluggable runtime, squad marketplace) remains BLOCKED awaiting owner direction.

---

## Active Missions

No mission is in active execution. The team is between initiatives: §32, §34, and Tier 1 are sealed; Tier 2 is blocked on owner direction. The standing operational work is the **office daily rhythm** (run `office-day-v0.1.js`) plus the open follow-throughs listed under Next Agent.

### Tier 1 — The Extractable Core (@team-sdk/core)

| # | Mission | Status | Owner | Depends on |
|---|---|---|---|---|
| 1 | **Protocol Schema** — @team-sdk/protocol. Bus JSON Schema, parser, validator, role mapping, action registry. | DONE | CTO | — |
| 2 | **Knowledge Graph** — @team-sdk/context. Index/manifest generators, CATALOG schema, query API, path guard. | DONE | CTO + PM | Mission 1 |
| 3 | **Consultation Extension** — @team-sdk/cli. createConsultant() API, role loader, context loader. | DONE | PM + CTO | Missions 1 + 2 |

### Tier 2 — Network Effects (blocked on Tier 1)

| # | Mission | Status | Depends on |
|---|---|---|---|
| 4 | **Cross-Project Memory** — company-level decision corpus. Auto-ingest on project close. | BLOCKED | Missions 1 + 2 |
| 5 | **Pluggable LLM Runtime** — adapter interface for non-Claude providers. | BLOCKED | Mission 1 |
| 6 | **Squad Marketplace** — community-contributed squads via npm. | BLOCKED | Missions 1 + 5 |

**Package architecture (CTO recommendation):** Monorepo with npm workspaces.
- `@team-sdk/protocol` — Bus schema, message parser/validator, SOLUTION_CLASS enum, escalation rules
- `@team-sdk/context` — manifest/index generation, staleness, context loading, knowledge graph
- `@team-sdk/cli` — current scripts/ rewritten to consume the above two

**Build order:** Protocol Schema → Knowledge Graph → Consultation Standalone.

---

## Waiting On

Nothing. Tier 1 complete. Tier 2 blocked until owner decides to start.

---

## Completed (Previous Cycle — v2026.Q2.1)

- **Iteration 1** — Foundation hardening: validate-script VS-01–VS-03 + sdk-ship pre-flight
- **Iteration 2** — Owner CLI: sdk-status, sdk-version, sdk-retro
- **Iteration 3** — GitHub integration MVP: sdk-github link/sync-issues/release/status
- **Iteration 4** — Doc enforcement: sdk-ship pre-flight strict blocking
- **Iteration 5** — The Last Picture: sdk-health staleness + validate + manifest
- **SDK-CHANGE** — Halloway Ratchet Doctrine (protocol v4.1 → v4.2)
- **SaaS cancelled** — iterations 6-11 archived

---

## Open Decisions

**OPEN — Owner action owed: ratify `CHARTER.md`.** Layer A is DRAFT and carries no authority until the Owner signs the ratification line. Until then, "The Company Is The Product" is a stated intent, not a binding constitution.

Resolved (pre-discovery, Owner 2026-04-17):
- ~~Monorepo~~ → **Confirmed.** npm workspaces, single repo.
- ~~doc.js decomposition~~ → **Audit first.** Before committing timeline.
- ~~Consultation Mode channel~~ → **Extend agentic environments.** Not a standalone binary. The SDK extends whatever runtime the user is already in (Claude Code, other engines). Slash commands, skills, MCP servers — not a separate tool.

---

## Next Agent To Activate

**Owner decision: ratify or revise `CHARTER.md`.** Everything in §34 and the office layer leans on the "company is the product" thesis; it should be made binding (or amended) before more is built on it.

Then, open follow-throughs (none blocking, all owed):
1. **Wire §35 into generated projects.** `sdk-init` should install a document-first gate that points at the SDK's `map-gate.js` by absolute path (generated projects carry no `scripts/hooks`). Today the gate is enforced in the SDK's own repo only — the honest gap named in §35.4.
2. **Run the office day on a clock.** `Workflow({ scriptPath: "workflows/office-day-v0.1.js", args: { date: "YYYY-MM-DD" } })` — its Status Reconcile ritual is the daily backstop complementing §35's per-commit gate. Wire it to a real cadence.
3. **Build `company-loop-v0.1`** (the meta-loop §34/AGENTS.md reference) so a surface can advance past `under-verification` without a manual act — and roster the first worked surface (incl. `SURFACE-20260620-enforcement-claims-tooling-001`).
4. **Substrate cleanup ticket:** add a `pre-tag` cadence to `retrospective.js` (the hardcoded date was removed in harness batch 1).
5. **`intent-spec/idea-execution-v0.2/_audit-log.md`** baseline entry still owed (carried from the v0.2 calibration verdict).

Background: Tier 2 of @team-sdk extraction still awaits owner direction (unchanged).

---

## Session Notes

2026-04-08 — Iterations 1-5 shipped in one session without pause.

2026-04-14 — SDK-CHANGE applied: Halloway Ratchet Doctrine (protocol v4.1). Protocol bumped v3.7 → v4.1.

2026-04-15 — SaaS initiative cancelled by owner. Iterations 6-11 archived. LOOP.md marked CLOSED.

2026-04-17 — New discovery cycle initiated by owner. Vision: extract team-sdk's core infrastructure into reusable packages. 6 problems identified in two tiers. CTO feasibility assessment, CLO + CISO gate, Mario gate, PM mission shaping all completed. All 3 Tier 1 missions built and shipped in one session: @team-sdk/protocol (399 tests), @team-sdk/context (180 tests), @team-sdk/cli (152 tests). doc.js reduced by ~400 lines. Zero regressions on existing 117 tests.

2026-04-18 — Governance closure. Greg audit found: project-map unfilled, operations-log empty, Bus unused during Tier 1. Owner decided Bus is mandatory everywhere (dogfood fully). Project-map filled, operations-log backfilled, area logs updated. Bus policy logged to history.md.

2026-06-14/16 — Generative-loops layer + continuous-improvement substrate built and sealed across a ~6h session plus a 2026-06-16 SDLC state-machine follow-on. §32 → protocol v4.4. All work landed in the working tree but was not committed or mapped at the time.

2026-06-19 — Greg audit: the entire June 14/16 initiative was uncommitted, absent from history.md, and current-status.md still read "2026-04-18, Tier 1 complete." Closed the map: history.md backfilled with three decision entries, this file updated, work committed. Next action is the overdue sprint-cadence retro on the §32 slug.

2026-06-20 — Two commits landed: §34 Collaboration Surfaces + CHARTER.md draft (`b9823b3`, protocol v4.4 → v4.5) and the sprint-cadence retro output for `protocol-32-generative-loops` (`42888b8`). Both committed; neither was entered in history.md at the time.

2026-06-22 — The office daily-rituals layer built: `team/office/rituals/` (5 rituals + by-role obligations) and `workflows/office-day-v0.1.js`. Landed in the working tree, uncommitted.

2026-06-24 — Greg audit (same drift, one cycle later): §34 + CHARTER committed but missing from history.md; office layer uncommitted; this file still read "v4.4, §32 sealed." Closed the map: history.md backfilled with two SDK-CHANGE entries, this file reconciled to v4.5 + office layer, office work committed. Open: CHARTER ratification (Owner), and wiring the office day to a real cadence so reconciliation stops being manual.

2026-06-30 — Owner directive: make document-first a root-level *enforced* concept (the drift that forced both June audits must stop by construction, not good intentions). Sealed **§35 Document-First Gate** (protocol v4.5 → v4.6): commit-msg hard gate + Stop-hook reminder + sdk-health drift backstop, off one code-authoritative classifier pinned by `npm test`. Built and verified under the enforcement-claims surface's discipline (every named mechanism exists in code first); caught and corrected one over-claim (sdk-init auto-install) before it shipped. This commit passes its own gate.

---

2026-07-02 — Owner directive: consolidate the repo's sprawl and index it so models load accurately. Divided the repo into two zones: **the SDK machinery** (packages/scripts/team/workflows/project-template + the root law docs — untouched, all 22 bins/workspaces/hooks intact) and **the project** (its building + history under `project/`). Folded the scattered layers in: `intent-spec/→project/context/intent` (C), `generated-spec/→project/context/spec` (B), `foundation/→project/context/foundation` (A), `loops|metrics|specs→project/record/*` (run exhaust). Updated the §35 classifier (one `context/**` material rule + `record/**` exempt) and its pinned test; added `workflows/_paths.js` + inline mirrors in the 3 live workflows; extended the `context-index.json` generator with a tree-scanned `layers` block and regenerated (un-staled it — was 2026-04-18). Added orientation READMEs at `project/context/` and `project/record/`. Then swept the shared machinery: `team/office/rituals/*`, `team/roles/loop-coordinator.md`, `AGENTS.md`, `CHARTER.md`, `office-day-v0.1.js`, and live-workflow prose — resolved the path-form question in favor of **generic project-relative** paths (`context/…`, `record/…`, right for generated projects) plus one authoritative convention note in the rituals README (in team-sdk, project root = `project/`). Fixed live pointers in `protocol.md` (§33 draft path) and the active §34 surface's evidence paths. `npm test` green; `sdk-health` clean; all four live workflows parse. Only sealed historical records (`history.md` prior entries, the ~8 one-shot seal scripts, `_archive`) retain old paths by design. Not yet committed — Owner reviewing.

---

*This file is owned by the Coordinator at session close.*
