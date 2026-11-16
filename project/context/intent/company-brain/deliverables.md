# Company brain + human collaboration — pipeline deliverables

**Owner direction (2026-11-15):** "That was the pipeline I referred to": build the company brain and human-collaboration work from `design.md`.
**Rule:** reversible work is built; the irreversible storage and identity model is **prepared for the Owner's decision**, never decided by agents.
**For every code deliverable:**
- test-first, with `@covers` tags on public interfaces;
- spend no tokens, no sudo, no network, no commits;
- builders do not edit `claims.yaml`, `history.md` or `current-status.md`.

**Done when** `npm test` is green and an independent verifier marks every acceptance item **met** with evidence.

---

## B1 — Memory integrity (gap 2 + the isolation half of gap 1)
**Scope:** `packages/memory/src/*`, `packages/memory/tests/*`.

| # | Acceptance |
|---|---|
| B1.1 | Entry ids are deterministic from `{source_file, commit_sha or content hash, anchor}`. Re-ingesting the same project twice yields **zero** new entries (test). |
| B1.2 | Dates come from the source (the history entry date, the Bus timestamp), never the ingest day. A missing date stays `null`, never "today". |
| B1.3 | A challenge with no recorded outcome is `unresolved`, never `overridden`. |
| B1.4 | Every entry carries the envelope: `author {kind: human|agent|unknown, id, role}`, `sources[]`, `commit_sha` (when in git), `confidence`. Old stores load with `unknown` provenance, flagged. |
| B1.5 | The default store is **per company**: `<projectDir>/.team-sdk/memory`, gitignored and derived. The machine-global `~/.team-sdk/memory` is **no longer a default**: it is opt-in only, refused unless explicitly configured, and documented as a cross-company leak risk. Cross-company memory goes through the commons (documented). |

## B2 — Layer B quality checks (gap 3)
**Scope:** new `scripts/lib/claims-quality.js`, its test, wiring in `scripts/health.js` (one block), `project/context/spec/README.md`.

| # | Acceptance |
|---|---|
| B2.1 | `claims-citation`: every claim's `sources[].file` resolves (relative to `project/context/` or the repo), with line ranges in bounds. Unresolved sources are reported. |
| B2.2 | `claims-stale`: work-based. More than `limits.claimStaleCommits` (default 20) commits have touched a claim's cited source files since the claims file last changed, so the claim is reported for re-confirmation. Uses `scripts/lib/activity.js`. |
| B2.3 | `claims-supersede`: `superseded_by` / `retired_by` ids exist, with no cycles. Schema documented. |
| B2.4 | The README matches reality: folder `spec/` (not `generated-spec/`), the real field list, the new optional fields (`author`, `confidence`, `superseded_by`, `retired_by`). |
| B2.5 | `sdk-health` shows the counts and lists issues. It does not fail on legacy claims missing optional fields. |

## B3 — Judgment join / calibration (gap 4)
**Scope:** new `packages/holding/src/calibration.js`, `src/cli/views.js` (add a `calibration` subcommand only), tests.

| # | Acceptance |
|---|---|
| B3.1 | `sdk-holding calibration [--json]` joins, per bet: VOF, the Owner rating, kills (from history via `packages/memory` parse, or ledger close/kill events), and §29 disagreements linked to the grant or mission. |
| B3.2 | It reports where **agent-confident bets were rated flat or regressed**, i.e. high VOF with a low rating, by bet class, alongside the existing divergence rule. Unrated bets are shown as unrated, never defaulted. |
| B3.3 | It is read-only: it never writes the ledger. Tests run on synthetic ledgers. |

## B4 — `sdk-doc inbox` (first human interface)
**Scope:** new `scripts/commands/inbox.js`, registration in `scripts/doc.js`, `scripts/lib/test-cap-inbox.js`, a spec entry in a new `project/context/spec/sdk-inbox/claims.yaml`.

| # | Acceptance |
|---|---|
| B4.1 | `sdk-doc inbox <project-dir> [--for <principal>] [--json]` builds **decision cards** from existing primitives only: open DECISION NEEDED/BLOCKER Bus messages addressed to the principal or the Owner, surfaces in `under-verification`/`reconciling` with an unfilled roster slot, the unratified CHARTER, overdue `DECISION BY` items, and holding-health items when a holding exists. No new store. |
| B4.2 | Each card has the question, the boundary it hits (§34.7 bullet or Autonomy Limit), **dissent first**, the options, what proceeds meanwhile, the cost of delay, the deadline and the source path. A card with no boundary is rejected by the linter (**over-asking guard**). |
| B4.3 | At most 5 cards per principal (`limits.inboxMaxCards`); the overflow is counted and named, never hidden. They are ordered by blocking status, then deadline. |
| B4.4 | `sdk-doc inbox <dir> answer <card-id> --decision <...> --reason "<required>"` records the answer as a provenance-stamped block on the source (a verification block, a history decision, or a Bus reply). An empty reason is refused (**rubber-stamp guard**). |

## B5 — Irreversible decision package: brain storage and identity model (**prepared, not decided**)
**Scope:** new `project/surfaces/SURFACE-20261115-brain-identity-storage-001.md` (`irreversible: true`), plus `project/context/intent/company-brain/decision-options.md`. **No code.**

| # | Acceptance |
|---|---|
| B5.1 | The surface is authored (CTO) per §34 with options: (a) humans as signed-git-commit principals in `team.md` plus a local MCP server; (b) server-side identity (OIDC) with an HTTP gateway writing signed commits; (c) a hybrid: (a) for internal humans, (b) later for external ones. Each option has its reversal cost and how it meets the 5 CISO non-negotiables. |
| B5.2 | Verification blocks from the fixed minimum roster (CFO, CISO, Mario, CLO), each with a verdict and findings. A no-go is shown bluntly (§34.5). |
| B5.3 | It ends in state `reconciling` or `blocked`, **never `verified`**, with a "Decision for the Owner" section: the recommended option, the dissent, and exactly what the Owner signs. |
