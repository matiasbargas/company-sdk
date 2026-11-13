---
surface:
  id: SURFACE-20260620-enforcement-claims-tooling-001
  kind: decision
  title: Enforcement claims in protocol text must map to real tooling
  author_roles: [CTO]
  verifier_roster: [Mario, CISO, Test Engineer]
  depends_on: [project/context/intent/protocol-32-generative-loops/_retrospective.md]
  produces: A protocol rule + an npm-test check (ENFORCEMENT_CLAIMS in scripts/lib/test-docs-consistency.js) binding every enforcement claim in harness docs to real code or an explicit honest-gap marker
  state: verified
  irreversible: false
  evidence:
    - project/context/intent/protocol-32-generative-loops/_retrospective.md
    - project/context/spec/protocol-32-generative-loops/claims-retro.yaml
  release: v2026.Q2.3
---

# Enforcement claims in protocol text must map to real tooling

> Collaboration Surface per `protocol.md` §34. First worked surface for §34, seeded from retro proposal #4 (`protocol-32-generative-loops` sprint retro, 2026-06-19). It is a **real** open surface. Its roster was first run on 2026-11-13, spawned by Greg as read-only subagents. The meta-loop (`company-loop-v0.1`) that was meant to automate this is planned, not built.

## Author block — CTO (2026-06-20)

**The problem, evidenced.** The §32 sprint retro found that `protocol.md` §32.5 asserts `sdk-health` greps for orphaned loops / `LOOP-2026` provenance lines, but `scripts/health.js` has zero loop references across 286 lines. The contract claims an enforcement mechanism that does not exist; "no hash, no gate crossing" is enforced only by convention, and a reader of `protocol.md` cannot detect the gap. This is the exact invisible-failure pattern the §32 Red-Team named, now living in the protocol's own enforcement story.

**Proposed decision.** Adopt a §15a rule and a seal-checklist item:

1. Before any protocol clause asserts that a script enforces it, the release must *either* implement the check in that release *or* reword the clause to "enforced by convention; the `sdk-health` hook is a vN+1 return ticket."
2. Seal-checklist item: every "`sdk-health` greps X" sentence must map to a grep that is present in `scripts/health.js`, verified by running the script during pre-tag.
3. Apply immediately to §32.5 and to the new §34.9 (`sdk-health` flags stale surfaces): either land the grep now or downgrade the wording.

**Why this and not a softer fix.** Leaving the wording as-is keeps a lie in Layer-A-adjacent text. Implementing every check immediately would block unrelated work. The convention/return-ticket split lets the text stay honest at zero implementation cost while tracking the real hook.

LOOP-PROVENANCE: SURFACE-20260620-enforcement-claims-tooling-001 + SHA256(pending-canonicalization)

## Related work — Document-First Gate (§35), 2026-06-30

This surface's rule was practiced in the authoring of **protocol.md §35 (Document-First Gate)**. Per the surface's discipline, §35.4 names only mechanisms that exist in code at the moment the clause ships:
- `scripts/hooks/commit-msg` → `scripts/hooks/map-gate.js` (Layer 1, the real gate) — present.
- `.claude/settings.json` Stop hook (Layer 2, reminder) — present.
- a **real** drift check added to `scripts/health.js` (Layer 3) — present and exercised, directly satisfying this surface's point #3 (no "`sdk-health` does X" sentence without a corresponding check in the script).

This does **not** close the surface: the roster (Mario, CISO, Test Engineer) is still open, and the surface's original targets — the §32.5 loop-provenance grep and the §34.9 stale-surface grep — remain unimplemented return tickets. §35 is corroborating evidence that the proposed rule is workable, not a verdict on it. State stays `under-verification`.

## Verification round 1 — 2026-11-13

All three verifiers returned **concern → revise**. They agreed the rule is right and still needed, that rule 2 must become a CI test rather than a checklist, and that the remaining false claims must be fixed first.

### Verification — Mario (round 1, 2026-11-13)
**Verdict:** concern
- Rule 3's two targets are met: §32.5 is reworded as an honest gap, and §34.9 is backed by `stuckSurfaces` in `scripts/health.js`.
- §34.9's limit cited `surfaceStaleDays`, which was about to go stale as health.js moved to commits. That is the same drift the rule targets.
- Other false claims remain: the §24 "sdk-health ratchet check", and `loop-coordinator.md` lines 152, 253 and 266 (orphaned-loop checks). CHARTER.md cites `company-loop-v0.1.js` and role `## Loop Interface` headers, and neither exists.
- Rule 2 is the weak part. Running `sdk-health` at pre-tag proves only that existing checks pass, not that a claimed check exists. It belongs in `test-docs-consistency.js`, and it should cover every "`sdk-*` <verb>" claim, not just "greps".
- **Near Misses:** whether `irreversible: false` is wrong (dismissed: wording plus a test, reverted by deleting one section); whether a mechanized check would be noisy over `project/` prose (dismissed: the harness-doc scope already excludes it); whether the §34.9 template path is false (dismissed: the file exists); whether `.sdkrc` limit validation is unbacked (dismissed: `health.js` calls `validateLimits`).

### Verification — CISO (round 1, 2026-11-13)
**Verdict:** concern
- A false enforcement claim is a security-relevant false assurance. Live instance: §21 says consultation writes are "enforced at the executor level", but no production caller passes `spawnType: 'consultation'`.
- READ ONLY for consultation spawns is backed by the `.claude/agents` `tools:` allowlists for 30 roles. The Guardians, Loop Coordinator, Engineer and Test Engineer carry Bash, Write or Edit, so for them it holds only by convention.
- The `protect-files` hook is real but covers only Edit and Write. NotebookEdit and Bash get past it, so it guards against mistakes; it is not the Layer A control.
- §32.5's "artifacts without LOOP-PROVENANCE do not cross gates" is convention, and the hash is `pending-canonicalization`.
- Conditions: widen the rule to every enforcement verb, make it mechanical in `npm test`, fix §21, mark the CHARTER claims as aspirational, and optionally widen the hook matcher.

### Verification — Test Engineer (round 1, 2026-11-13)
**Verdict:** concern
- Claim inventory: 8 claims backed by code, 1 honest gap, and 2 FALSE (§24 ratchet scan; `loop-coordinator.md` orphaned-loop check).
- Proposed test: scan harness docs for enforcement-claim sentences. Lines carrying a gap marker pass. Every other claim must match an `ENFORCEMENT_CLAIMS` registry entry whose backing code regex matches its file. Unregistered claims fail, and so do registry entries whose code is missing. The test is static and runs every commit, which is stronger than the pre-tag route (`pre-tag.js` never calls `health.js`).

## Author revision — CTO (2026-11-13)

Every round-1 condition is addressed in the same commit as this block:

1. **Rule 2 is now a test, not a checklist.** Section 8 of `scripts/lib/test-docs-consistency.js` (in `npm test`) finds every "`sdk-*` flags/checks/scans/enforces/blocks/rejects/denies/detects …" and "enforced by/at `…`" sentence in protocol.md, CHARTER.md, team/**, .claude/skills, project-template and docs. Each one must carry an honest-gap marker or match an `ENFORCEMENT_CLAIMS` entry whose backing code exists. A probe file with an unbacked claim fails the build.
2. **Rule 1 is widened** from "`sdk-health` greps X" to any clause asserting that a script, hook, workflow, or tool allowlist enforces something.
3. **False claims are fixed:**
   - §24's ratchet scan is now an honest gap (manual sprint-close review; `sdk-doc bus` mechanizes the SOLUTION_CLASS part).
   - `loop-coordinator.md` 152/253/266 now match the §32.5 gap.
   - §21 now names the real control (the agents' `tools:` allowlists) and the convention-only roles.
   - §32.5's provenance rule is labelled convention.
   - `verifiers.md` and this surface no longer describe the meta-loop or the Loop Interface header as existing.
   - CHARTER.md marks both as planned. That was an Owner-authorized Layer A edit, still pending ratification.
4. **§34.9 is updated** in the same change that moved `health.js` to commit-based staleness (`limits.surfaceStaleCommits`).
5. **Hardening:** the `protect-files` matcher now includes NotebookEdit, and its header states the Bash bypass as an honest limit.

Original targets (point 3): **met**.


## Verification round 2 — 2026-11-13

### Verification — Mario (round 2)
**Verdict:** concern
- Every round-1 condition is met in the tree: §24 and §34.9/§16.1 are honest and commit-based, the `loop-coordinator.md` gaps are stated, the CHARTER claims are marked planned, and rule 2 is a test (`test-docs-consistency.js` §8).
- New: **rule 1 is not in the protocol.** The surface promises "a protocol rule", but it lived only in a code comment.
- Renaming the limits keys is an interface change, and the protocol version was not bumped.
- **Near Misses:** `irreversible: false` is still right (a single-block revert); the protocol/ views are not lagging (`--check` runs first in `npm test`).

### Verification — CISO (round 2)
**Verdict:** pass
- §21 names the real control (the `.claude/agents` `tools:` allowlists) and the roles that are read-only only by convention. The hook covers NotebookEdit and states the Bash limit. The §32.5 convention is disclosed.
- Non-blocking: README.md overstated the CLO+CISO gate ("enforced", "cannot be skipped"), which is the same false-assurance class and was missed because the text has no backticks.

### Verification — Test Engineer (round 2)
**Verdict:** pass
- `npm test` is green, and docs consistency passes 1568/0. Unregistered claims fail, missing backing code fails, and dead entries print a notice.
- Non-blocking: the detector missed unbackticked claims, verbs outside its list, and bare "is enforced", and its gap markers were scoped to the whole line. §24 "When sdk-health is run" contradicted the new status line.

## Author revision 2 — CTO (2026-11-13)

- **Rule 1 is codified** in protocol.md §30 "Enforcement claims must be true", with the accepted gap-marker vocabulary and the mechanism. Protocol **v4.8 → v4.9** for the limits-key interface change.
- README.md gates are reworded: "checked by tooling", plus the honest limit that nothing physically stops a hand-spawned CTO. §24 "When it runs" is now the manual convention, with `sdk-health` not producing it (return ticket).
- **Detector hardened:** unbackticked `sdk-*`, the verbs validates/catches/warns/fails, bare "is/are enforced", and gap markers scoped to the sentence. Seven newly found real claims are registered with their backing code (limits validation, charter-review flag, `sdk-doc bus` field rules, the §35 gate, gate-check blocking, and the rule's own examples). Two false positives are reworded. `npm test` is green, and docs consistency passes 1587/0.

## Verification round 3 — Mario (2026-11-13)
**Verdict:** pass
- Condition 1 is met: protocol.md §30 "Enforcement claims must be true" lists the gap markers and names the mechanism (`test-docs-consistency.js` §8, `npm test`). The rule's own example is registered.
- Condition 2 is met: the header reads v4.9, and the views, README and SDK.md agree. The history.md entry for v4.9 is added in the same commit as this block.
- README.md and §24 are honest. The detector now catches unbackticked claims, more verbs and bare "is enforced", with gap markers scoped to the sentence. Every registry entry points at code that exists.
- Drift fixed in the same commit: §30's gap-marker list now matches the detector's pattern exactly.
- **Near Misses:** README "CEO validates the project map" was dismissed as unbacked, because `ceo-validation-pending` exists in `scripts/ops.js` (a weak check, not a false one). README.md:21 and protocol.md:1313 tripping the detector unregistered was dismissed; it is covered by the gap marker plus the registered "fails until".

## Reconciliation — Greg (CEO), 2026-11-13

**Roster:** Mario pass (round 3) · CISO pass (round 2) · Test Engineer pass (round 2). No unresolved no-go. **State → `verified`.**

**Decision adopted:** no protocol clause may claim enforcement that does not exist. A claim either maps to code, mechanically checked by `ENFORCEMENT_CLAIMS` in `npm test`, or carries an explicit gap marker (protocol.md §30). Logged in `history.md` → "Harness review, chapter 6".

**What the roster changed:** rule 2 went from a pre-tag checklist to a CI test; the rule widened from "`sdk-health` greps" to every enforcement verb; four live false claims were fixed, the §21 one being security-relevant. The original targets (§32.5, §34.9) were met.

Improvement signal emitted to `record/metrics/_signals.jsonl` (friction: a surface stalled for want of a roster runner; the meta-loop is planned, not built).
