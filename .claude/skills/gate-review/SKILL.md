---
name: gate-review
description: Run and interpret a team-sdk hard gate: the CLO + CISO discovery gate before the CTO activates, or the Mario irreversibility gate before Sprint 1. Use before activating the CTO, before Sprint 1, or when asked whether a gate is clear.
---

# Gate review

Gates: `AGENTS.md` → critical gates; checks: `scripts/gate-check.js`; CLO and CISO sections in `compliance-requirements.md`.

## Steps
1. **Run the gate:**
   - discovery gate: `sdk-gate-check <dir>`;
   - Mario gate: `sdk-gate-check <dir> --mario`.
2. **For each blocking item**, name the owner and the exact fix:
   - Jurisdictions table still has `[...]` placeholders → CLO answers every row (N/A allowed).
   - Gate Status row not `Done` → the owning role finishes its section and evidences it.
   - Fewer than 2 Explicit Non-Goals → CEO or PM adds them, each with a reason.
   - Mario gate not COMPLETED → run the `irreversible-review` skill.
3. **Warnings** (pending items in a CLO or CISO section): ask the owner to confirm each item is deliberately deferred, and record the reason.
4. **Never mark a gate Done on someone else's behalf.** Route fixes with the `bus-message` skill (BLOCKER when the gate blocks activation).
5. **Re-run the gate** until it is clear. Then report it clear, and name the next gate.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
