# Proposal: Extend STRATEGY.md with an OKR Section

**Status:** Draft proposal — not yet applied to `STRATEGY.md`
**Proposed by:** intent-spec working session
**Date:** 2026-06-14
**Target file:** `STRATEGY.md`

---

## Proposal in one sentence

Add an OKR section to `STRATEGY.md` that defines the shape of quarterly Objectives and Key Results, so the Betting Table can select missions against measurable strategic outcomes rather than Owner-feel.

## Why now

The Owner has directed the team to adopt OKRs to guide bets. Today, the Betting Table runs on Owner judgment alone — missions are Appetized, reviewed, and selected without a measurable strategic anchor. The 4 Success Themes give every agent direction, but no agent can answer: *what specifically are we trying to move this quarter, by how much, by when?* Without that anchor, bets cannot be attributed to strategic outcomes, and retros cannot tell us whether the bets we made were the right ones. OKRs give the Betting Table a scoring surface.

## Exact text to add to STRATEGY.md

Insert as a new section between **The Betting Table** and the closing footer:

```markdown
---

## Quarterly OKRs

The 4 Success Themes set the direction. OKRs set the destination for the quarter.

**Objectives** are qualitative statements of what the company is trying to achieve this quarter. They are written in plain language and connect back to one or more of the 4 Success Themes. **Maximum 3 Objectives per quarter.** More than 3 is not focus — it is a list.

**Key Results** are the measurable outcomes that prove the Objective was achieved. Each Objective has **exactly 3 Key Results.** Each KR must be:
- **Measurable** — stated as a number, ratio, or binary fact
- **Time-bounded** — has a quarter-end deadline
- **Binary at end of quarter** — at the close of the quarter, either it was hit or it was not. No "partially achieved" — score it 0 or 1 and explain in the retro.

OKRs are set at the start of each quarter by the CEO and Owner. They are published in `strategy-log.md` and referenced by every Betting Table cycle for the quarter. Missions are selected against the active OKRs (see `protocol.md` §11). At the end of the quarter, the Coordinator produces an OKR scorecard for the retrospective: per-KR result + attribution to the bets that moved it (see `protocol.md` §11).

OKRs are not promises to customers. They are decision tools for the team. A KR that turns out to be the wrong thing to chase gets retired with explanation — not silently dropped.
```

## The OKR shape (summary)

- Quarterly cadence
- Max 3 Objectives, each with exactly 3 Key Results (so at most 9 KRs total)
- KRs are measurable, time-bounded, and scored binary at quarter end
- Owners: CEO sets, Coordinator tracks, every agent reads

## What is NOT in this proposal

This proposal defines **the shape and the placement** of OKRs in the strategic surface. It does **not** define the actual Objectives and Key Results for any quarter. Choosing the Os and KRs themselves is a separate Owner + CEO conversation, scheduled after this structural change lands.

Also out of scope: any change to the Betting Table mechanics itself. That belongs to `protocol.md` §11 and is covered by the companion proposal `protocol-11-okr-amendment.md`.

## Approval path per §15a

`STRATEGY.md` is a strategic document owned by the CEO/CPTO. Following §15a:

- **Change type:** strategy document change (analogous to a `protocol.md` change in authority weight)
- **Reviewer:** Coordinator
- **Approver:** CEO + Owner (Owner is the source of the directive; CEO ratifies framing)
- **On approval:** the patch above is applied verbatim; the Coordinator broadcasts the change via INFO Bus message to ALL with re-read instructions; an entry is written to `history.md` under the current release tagged `SDK-CHANGE`.
