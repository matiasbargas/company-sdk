# Rostered Verifiers — Daily

> For every role that can sit on a Collaboration Surface verifier roster: Mario, CISO, CTO, CLO, CFO, Test Engineer, and any role wired as a verifier via its `## Loop Interface`.

## What you check daily

The [Surface Sweep](../office/01-surface-sweep.md) flags surfaces with open roster slots. If **your role is on a roster with a pending verdict**, that is your daily obligation:

```bash
grep -l "<your-role>" project/surfaces/*.md   # surfaces where you are rostered
```

For each, read the author block and the evidence, then record your verdict in your verification block:

- `pass` — the artifact does what it claims; you have checked, not assumed.
- `concern` — non-blocking, but recorded. The surface advances; your concern travels with it.
- `no-go` — blunt and blocking. Triggers §34.5 reconciliation. **A no-go forces a discussion; it is never a silent pass and never a soft veto left unsaid.**

## The one rule that matters

**A pending verdict is not a neutral state — it is a stall.** Per `protocol.md` §34.5, a surface in `under-verification` does not advance until every rostered verifier has acted. Sitting on a slot without a verdict blocks the company body as surely as a no-go, but invisibly. If you cannot verify today, say so in the block (`concern: cannot verify until X`) rather than leaving it blank.

## Irreversible surfaces

On `irreversible: true` surfaces the roster has a **fixed minimum** (§34.4) and an unresolved no-go moves the surface to `blocked` until a human clears it (§34.7). Mario's irreversibility review (§28) and the CISO de-risk standard apply here — these are the surfaces where "earned, not asserted" is the whole point.

## Open right now

`SURFACE-20260620-enforcement-claims-tooling-001` — roster `[Mario, CISO, Test Engineer]`, all three verdicts **pending**. Seeded from §32 retro proposal #4. It has been waiting since 2026-06-20.
