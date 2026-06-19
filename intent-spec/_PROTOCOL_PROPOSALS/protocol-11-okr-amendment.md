# Proposal: Amend protocol.md §11 — OKR Scoring and Attribution

**Status:** Draft proposal — not yet applied to `protocol.md`
**Proposed by:** intent-spec working session
**Date:** 2026-06-14
**Target file:** `protocol.md` §11 (Strategy Alignment Protocol)

---

## Proposal in one sentence

Amend `protocol.md` §11 so that every Betting Table candidate is scored against active quarterly Key Results before selection, and every quarterly retrospective produces per-KR movement attribution with named bets and evidence.

## Exact text to add to §11

Insert as a new sub-block at the end of §11, immediately before the closing horizontal rule:

```markdown
### OKR scoring and attribution

The 4 Success Themes are direction. The quarterly OKRs (see `STRATEGY.md > Quarterly OKRs`) are the scoring surface. This sub-section makes OKRs operational at the Betting Table and at the retrospective.

**Betting Table KR scoring (selection-time rule):**

Every mission proposed at the Betting Table is scored against the active quarterly Key Results before selection. The PM submitting the brief includes a **KR Impact line**:

```
KR Impact: KR-[id] — expected movement: [magnitude + direction + confidence]
          KR-[id] — expected movement: [magnitude + direction + confidence]
          (or "NONE — requires Owner override")
```

A mission that does not credibly move any active KR cannot be selected without an explicit Owner override logged in `history.md`. "Strategic optionality," "team morale," and "we always do this" are not overrides — they are reasons the OKRs may be wrong, which is its own conversation. The override is a deliberate exception, not a routine path.

**Quarterly retrospective KR attribution (close-time rule):**

At the close of each quarter, the Coordinator produces a **KR Attribution Scorecard** in `strategy-log.md`. For each active KR:

```
KR-[id]: [target] → [actual] — [HIT | MISS]
Bets that moved this KR:
  - [Mission name]: moved KR by [magnitude] — evidence: [link or data]
  - [Mission name]: moved KR by [magnitude] — evidence: [link or data]
Unattributed claimed movement: [list, or "none"]
```

Claimed KR movement without a named bet and named evidence is **flagged as unattributed** and reviewed in the retrospective. Unattributed wins are not credit — they are a measurement gap.

**Why this is structured this way:** Most OKR processes fail at attribution, not at goal-setting. Teams pick reasonable Objectives, then six months later cannot tell which bets actually moved them. The Betting Table rule forces ex-ante attribution (you claim a KR before you start); the retrospective rule forces ex-post attribution (you prove it after). The combination is what makes OKRs a real decision tool rather than a quarterly slide.
```

## The rule (summary)

**Selection time:** every Betting Table candidate is scored against active KRs. A bet that does not move any KR needs an explicit Owner override logged in `history.md` to be selected.

**Close time:** quarterly retro produces per-KR attribution — name the bet, name the magnitude moved, name the evidence. Unattributed claimed movement is flagged.

## Why attribution is the load-bearing piece

Goal-setting is the visible part of OKRs — and the part most teams get adequately right. Attribution is the invisible part — and the part where almost every OKR adoption fails. Without attribution:

- Wins get claimed by whoever is loudest, not whoever caused them
- Losses get blamed on "the market," not on bets that did not deliver
- The Betting Table cannot learn — next quarter's bets are picked on the same Owner-feel the OKRs were supposed to replace
- The 4 Success Themes drift, because no one can show which themes the quarter's bets actually served

Forcing per-KR attribution at both ends — selection and close — converts OKRs from a reporting artifact into a decision loop. That is the only version of OKRs worth adopting.

## Approval path per §15a

- **Change type:** `protocol.md` change (§11)
- **Reviewer:** Coordinator
- **Approver:** CEO
- **Version bump:** minor (4.3 → 4.4) — this adds a sub-section and a new selection rule but does not break existing message formats
- **On approval:** the patch above is applied verbatim; Coordinator updates the protocol header version; Coordinator broadcasts an INFO Bus message to ALL: "Protocol updated — §11 OKR scoring and attribution — re-read before next Betting Table"; entry written to `history.md` under the current release tagged `SDK-CHANGE`.
- **Dependency:** this amendment assumes `STRATEGY.md > Quarterly OKRs` has landed (see companion proposal `okr-strategy-extension.md`). If the strategy extension is rejected, this protocol amendment has no scoring surface and should be rejected as well.
