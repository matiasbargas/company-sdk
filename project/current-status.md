# Current Status
**Last updated:** 2026-11-16
**Updated by:** Greg (CEO): session close (harness review → portfolio orchestrator → company brain)
**Release:** v2026.Q2.3 · **Protocol:** v4.9 (§30 enforcement-claims rule, work-based staleness; §16.1 limits, §2 timing; §31 restored; §32 + §34 + §35 sealed; §33 reserved for SDLC state machine, draft)

> This is the first file you read when resuming work. It tells you exactly where the team is right now and what the next action is. If this file is out of date, the team is flying blind.
>
> The show must go on. Every session ends with this file updated.

---

## Phase

**Between builds. Everything is on `main` (`8eb0471`) and every suite is green.** The tests pin 224 of 234 behaviours (96%); the holding package has 1302 assertions and memory has 246. Nothing is running. The next moves are Owner acts (below).

| Area | State | Where |
|---|---|---|
| **Company brain** (memory, Layer B quality, calibration, inbox) | B1–B4 **built**. B5, the identity and storage model, is **blocked**: CISO no-go, four independent verifications, signature sheet v2 ready for the Owner | `context/intent/company-brain/`, `surfaces/SURFACE-20261115-brain-identity-storage-001.md` |
| **Portfolio orchestrator** (`packages/holding`, `sdk-holding`) | v0 single company **GRADUATED**. v0.2 is built: first-run hardening, the commons, and the second-company design. **No real run yet** | `context/intent/portfolio-orchestrator/`, `packages/holding/README.md` |
| **Harness** (Greg style, hooks, skills, generated agents, protocol split) | All 6 batches shipped | `history.md` → "Harness review" |
| **CHARTER v0.2** (Precedence, Autonomy Limits, review every 10 iterations) | **DRAFT**: not binding until the Owner signs | `CHARTER.md` |
| **Tier 1 @team-sdk extraction** | Done | Active Missions |

**Standing rules now in force:**
- *Specs outlive implementations* (§30): built capabilities are pinned by `@covers` tests, and a refactor is a triggered discussion (`context/spec/_refactor-watch.json`).
- Staleness counts commits and iterations, not days.
- Limits live in `.sdkrc`: no cap by default, but a stop condition is mandatory.
- Memory is per company (`<project>/.team-sdk/memory`). Cross-company knowledge goes only through the commons.

---

## Open Decisions (Owner)

1. **B5 brain identity and storage: sign or reject signature sheet v2.** It is in `context/intent/company-brain/decision-options.md` §4. Sign it as a signed commit (`git commit -S`), not a checkbox. Recommended: (c) hybrid, with the formats signed now and the human write path built only when a named non-Owner human needs it. Dissent: CISO no-go; CFO, Mario and CLO concerns.
2. **Ratify or revise `CHARTER.md` v0.2.** Then decide two amendments:
   - a legal-compulsion exception to Autonomy Limit 5 (CLO, from B5);
   - holding-Owner vs company-Owner (`portfolio-orchestrator/second-company/charter-amendment-proposal.md`).
3. **GitHub plan check:** do signed-commit rulesets and Actions minutes cost money on this repo? Any spend is a Limit 2 approval.
4. **First real orchestrator run.** Before it:
   - review the sandbox script and run it with sudo;
   - pass `sdk-holding sandbox doctor`;
   - keep the company clone outside `$HOME`;
   - set the key, price table, model pin and floor;
   - approve a budget and set a provider spend limit;
   - check where spend caps live (`second-company/provider-caps.md`).

   The first run should be multi-turn with a Task subagent, to verify C1–C4.

Resolved (pre-discovery, Owner 2026-04-17):
- ~~Monorepo~~ → **Confirmed.** npm workspaces, single repo.
- ~~doc.js decomposition~~ → **Audit first.**
- ~~Consultation Mode channel~~ → **Extend agentic environments.** It is not a standalone binary.

---

## Next Agent To Activate

**The Owner, on Open Decision 1 or 2.** No reversible work is waiting on either.

Reversible follow-throughs (none blocking):
1. **Per-company sandbox isolation:** the step that unlocks a second company. It also closes CISO NN2. The CFO ranks it ahead of any human write path. *Needs an Owner go-ahead*, because it changes orchestrator capability.
2. **Wire §35 into generated projects.** `sdk-init` should install the document-first gate. Today it is enforced in the SDK repo only (§35.4).
3. **Run the office day on a clock** (`workflows/office-day-v0.1.js`).
4. **Build `company-loop-v0.1`**, so surfaces advance past `under-verification` without a manual act.
5. **Add a `pre-tag` cadence** to `retrospective.js`.
6. **`context/intent/idea-execution-v0.2/_audit-log.md`:** the baseline entry is still owed.
7. **Refactor watch:** `scripts/ops.js` and `scripts/health.js` are deferred, with their behaviour pinned. Split them by check family when next touched.

---

## Active Missions

No mission is in active execution.

### Tier 1 — The Extractable Core (@team-sdk/core)

| # | Mission | Status | Owner | Depends on |
|---|---|---|---|---|
| 1 | **Protocol Schema** — @team-sdk/protocol | DONE | CTO | — |
| 2 | **Knowledge Graph** — @team-sdk/context | DONE | CTO + PM | Mission 1 |
| 3 | **Consultation Extension** — @team-sdk/cli | DONE | PM + CTO | Missions 1 + 2 |

### Tier 2 — Network Effects

| # | Mission | Status | Note |
|---|---|---|---|
| 4 | **Cross-Project Memory** | SUPERSEDED | The company-brain design replaces it: memory is per company, and cross-company knowledge goes through the holding commons (consented and verified by another company). |
| 5 | **Pluggable LLM Runtime** | BLOCKED (Owner direction) | — |
| 6 | **Squad Marketplace** | BLOCKED (Owner direction) | — |

---

## Completed (Previous Cycle — v2026.Q2.1)

- Iterations 1–5: foundation hardening, Owner CLI, GitHub integration, doc enforcement, sdk-health.
- SDK-CHANGE: Halloway Ratchet Doctrine (protocol v4.1 → v4.2).
- SaaS cancelled: iterations 6–11 archived.

---

## Session Notes

2026-04-08 — Iterations 1-5 shipped in one session without pause.

2026-04-14 — Halloway Ratchet Doctrine (protocol v4.1).

2026-04-15 — SaaS initiative cancelled by the Owner. LOOP.md marked CLOSED.

2026-04-17 — Discovery: extract team-sdk's core into reusable packages. Tier 1 built in one session: protocol (399 tests), context (180), cli (152).

2026-04-18 — Governance closure. Bus made mandatory everywhere (dogfood fully).

2026-06-14/16 — §32 generative loops + continuous-improvement substrate sealed (v4.4).

2026-06-19 / 06-24 — Two Greg audits closed map drift: work was uncommitted and missing from history.md.

2026-06-20/22 — §34 Collaboration Surfaces + CHARTER draft; the office daily rituals.

2026-06-30 — §35 Document-First Gate sealed (v4.6). It is the standing fix for map drift.

2026-07-02 — Repo consolidated into two zones: the SDK machinery and the project (`project/context/{foundation,intent,spec}`, `project/record/`).

2026-11-13/16 — One long session, in order:
- **Harness review:** 6 batches; protocol v4.7 → v4.9.
- **Chapter 6:** work-based time, CHARTER v0.2 draft, the first verified surface.
- **Portfolio orchestrator:** Discovery graduated, then v0 graduated at cycle 3, then v0.2 built by a multi-agent pipeline.
- **Metering spike 2 exceeded the Owner's $0.05 limit** ($0.085 recorded, plus an unknown amount). The model was overridden by the environment. Fixed with a clean runner env and a model-mismatch abort.
- **Company brain:** design, then B1–B4 built, then B5 prepared and independently re-verified (sheet v2).
- **Cleanup:** `inbox.js` split into `scripts/lib/inbox/`; claim citations 17 → 0.

All pushed to `main`. Detail is in `history.md`.

---

*This file is owned by the Coordinator at session close.*
