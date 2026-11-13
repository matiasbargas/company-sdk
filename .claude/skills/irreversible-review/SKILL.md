---
name: irreversible-review
description: Run Mario's (Chief Engineer) irreversible-decision review: alternatives, reversal cost, platform primitives, near misses, sign-off in history.md. Use before Sprint 1 or before any decision that would take more than 6 months to reverse.
---

# Irreversible decision review

Template: `team/roles/chief-engineer.md` → Irreversible Decision Review Template; platform primitives: `team/roles/staff-engineer.md` → Platform Primitive Checklist.

## Steps
1. **List the candidates:** every decision marked `Reversible: NO` in `history.md` (`sdk-doc history . --reversible NO`), plus the CTO architecture brief's irreversible items.
2. **For each candidate**, fill the template:
   - the decision, the named alternative, and why it was rejected;
   - the reversal cost and the trigger that would force a reversal;
   - blast radius;
   - any §29 disagreement attached.
3. **Run the Platform Primitive Checklist.** Any YES needs a CTO design review now, and Mario reviews every PR that touches it.
4. **Record near misses:** at least one concern you investigated and dismissed, with the reasoning. If you cannot name one, the review was too shallow; go deeper before signing.
5. **Sign off:** write `## Mario Gate — <release>` with `Status: COMPLETED` (or `BLOCKED` plus reasons) in `history.md` via the `log-decision` skill. Then run `sdk-gate-check . --mario`.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
