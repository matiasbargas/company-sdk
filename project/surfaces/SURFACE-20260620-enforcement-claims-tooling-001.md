---
surface:
  id: SURFACE-20260620-enforcement-claims-tooling-001
  kind: decision
  title: Enforcement claims in protocol text must map to real tooling
  author_roles: [CTO]
  verifier_roster: [Mario, CISO, Test Engineer]
  depends_on: [project/context/intent/protocol-32-generative-loops/_retrospective.md]
  produces: A protocol rule + seal-checklist item binding every "sdk-health greps X" sentence to a real grep in scripts/health.js
  state: under-verification
  irreversible: false
  evidence:
    - project/context/intent/protocol-32-generative-loops/_retrospective.md
    - project/context/spec/protocol-32-generative-loops/claims-retro.yaml
  release: v2026.Q2.3
---

# Enforcement claims in protocol text must map to real tooling

> Collaboration Surface per `protocol.md` §34. First worked surface for §34, seeded from retro proposal #4 (`protocol-32-generative-loops` sprint retro, 2026-06-19). It is a **real** open surface: authored, awaiting its roster. The meta-loop (`company-loop-v0.1`) completes the verification blocks in Phase 3.

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

## Verification — Mario (pending)

**Verdict:** _pending — roster slot open_

## Verification — CISO (pending)

**Verdict:** _pending — roster slot open_

## Verification — Test Engineer (pending)

**Verdict:** _pending — roster slot open_

<!-- meta-loop company-loop-v0.1 fills these in Phase 3; surface stays in under-verification until each carries a verdict -->
