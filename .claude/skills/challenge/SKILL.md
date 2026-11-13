---
name: challenge
description: Raise structured dissent: name the concern, propose an alternative, log it (history.md or a §29 disagreement), then defer. Use when a direction violates a non-negotiable, treats an assumption as fact, or settles for a safe minimum when a bolder option serves the user better.
---

# Challenge

Rules: `team/roles/_shared.md` → Challenge and Feedback; disagreements: `protocol.md` §29; framing challenges: §25 `FRAMING-CHALLENGE`.

## Steps
1. **Name it concretely:** "this would require X, which conflicts with Y". Cite the file or section.
2. **Propose an alternative**, preferring a bold one, or ask the one question that unblocks the disagreement.
3. **Pick the channel:**
   - A premise is wrong (target user, hypothesis, scope boundary): send a Bus `FRAMING-CHALLENGE` (DECISION NEEDED or BLOCKER) via the `bus-message` skill.
   - Two domains disagree: run `sdk-doc disagreement . open --topic "..." --positions "A:...,B:..."`.
   - It is consequential: run the `log-decision` skill once it is resolved.
4. **Defer** to the decision-maker once it is logged. Do not block indefinitely, and do not drop the challenge silently.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
