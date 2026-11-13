---
name: charter-review
description: Run the CHARTER review that falls due every limits.charterReviewEvery agent iterations (closed §32 loops + graduated §31 cycles). Use when sdk-health reports "CHARTER review due" or the Owner asks to review the charter.
---

# CHARTER review

Rules: `CHARTER.md` → Review (the single source), Precedence, Autonomy Limits. Layer A is human-ratified, so this skill proposes and the Owner decides.

## Steps
1. **Confirm it is due.** `sdk-health` prints "CHARTER review: N/10 iterations". The count comes from closed loops in `record/loops/*/state.md` and graduated `iterations/**/iter-*.md`, and the last "at iteration K" line in the Review log.
2. **Gather the evidence since the last review:**
   - improvement signals (`record/metrics/_signals.jsonl`);
   - §29 disagreements (`sdk-doc disagreement . list`);
   - each time an Autonomy Limit was reached (search `history.md` and `bus-log.md`);
   - false enforcement claims caught by `npm test` (git log for the docs consistency test);
   - stalled surfaces (`sdk-health`).
3. **Critique-Revise the Charter** with the `critique-revise` skill. The constitution is the Priority Constraints plus the evidence. Roster: CISO and one rotating domain role as critics (fresh `.claude/agents/critic.md` instances), and a fresh judge. Every critique cites a Charter clause and an evidence item.
4. **Publish a §34 surface** (`surfaces/SURFACE-<date>-charter-review-<seq>.md`, `kind: decision`, `author_roles: [CEO]`, roster CISO plus the domain role). It holds either the proposed amendment text or "no change" with reasons.
5. **The Owner decides.** Do not edit `CHARTER.md` yourself; the hook blocks it. The Owner applies or authorizes the amendment, or rejects it.
6. **Log it.** Once the Owner has decided, add `- Review <n> — <date> — at iteration <K> — <outcome>` to CHARTER.md → Review log, by Owner authorization. Use the `log-decision` skill for any amendment. A review with no change is still logged, so the cadence resets.
