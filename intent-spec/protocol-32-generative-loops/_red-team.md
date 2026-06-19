# Red Team: protocol-32-generative-loops (SDD v2)

**Date:** 2026-06-14
**Reviewer:** Red Team (single pass, Pablo pattern)
**Target:** `sdd-v2.md`

## The killing assumption

**The constitutional guardrail lines (`would-have-wrongly-killed:` on Critique-Revise, `assumption-not-attacked:` on Red-Team) will be filled with substantive content rather than plausible-sounding boilerplate that satisfies the format check.**

The SDD treats these two lines as the load-bearing anti-sycophancy mechanism. "Fails closed if absent" is the enforcement. But absence is the *only* failure mode the protocol detects. Presence is assumed to equal quality. If critics — under time pressure, under named-role identification, under the very social-default pull the SDD names as the problem — learn to write lines that *look* like a preserved property or an un-attacked assumption but are actually generic, restate-the-obvious, or strategically chosen to avoid friction, the mechanism passes its own check while delivering none of its claimed value.

## Why it kills

Trace the chain:

1. The SDD's stated purpose is to make the *quality* of dissent load-bearing — not the existence of dissent. Today's failure mode is named as "sycophantic collapse: the critic concedes to a confident author within 1–2 turns."
2. The mechanical lever against this is the two constitutional lines. Everything else (asymmetric termination, provenance hash, Bus-transitions-only, Loop Coordinator as state machine) is *infrastructure around* the critique — none of it forces the critique itself to be sharp.
3. The enforcement is binary presence/absence. There is no quality gate on the content of the line. There cannot be a cheap one — judging "is this `would-have-wrongly-killed:` line substantive or boilerplate" is exactly the kind of Level 1 judgment the SDD removes from the Loop Coordinator and does not assign elsewhere.
4. Named-role critics under social pressure are precisely the population most likely to optimize for "satisfy the format with minimum confrontation." Writing "the draft's structural clarity" or "the problem framing" as a would-not-attack property is plausible, defensible, and adds nothing. It looks like the worked example would look. The detector cannot tell them apart.
5. If this happens, the loop runs, the artifact emits a `LOOP-PROVENANCE:` hash, sdk-health stays green, the Bus shows clean transitions, the worked example is referenced — and the dissent quality is unchanged from today. The SDD ships, the mechanism is declared working, and the next sycophantic collapse is invisible because the protocol consumed the signal that would have surfaced it.
6. Worse: the SDD now occupies the protocol slot where a real anti-sycophancy mechanism would have gone. The Dialectic + anonymization v0.2 return ticket gets deprioritized because "we already shipped the anti-sycophancy work." The wedge that was supposed to attack the problem becomes the load-bearing reason the problem persists.

This is the failure mode where the SDD is most dangerous: not when it fails loudly, but when it *succeeds at its own checks* while failing at its actual mission.

## Cheapest test

**Before sealing v0.1, run Critique-Revise on this very SDD a second time — but have the critic agent operate under explicit instruction to satisfy `would-have-wrongly-killed:` with the minimum-friction line they can defend. Then have a third agent (CISO or CTO, cross-domain) score whether the produced line names a *specific, falsifiable* preserved property or a generic gesture.**

Concretely:
- The SDD already commits to one Critique-Revise loop as the worked example (`loops/2026-06-14-critique-revise-001/`).
- Add a second loop, same target, same critic role, instruction-shifted toward "minimum confrontation."
- Compare the two `would-have-wrongly-killed:` lines side by side.
- If the adversarial-minimum line is *visibly indistinguishable* from a good-faith line to a cross-domain reader, the guardrail is theater.
- If the cross-domain reader can reliably flag the minimum-friction version, the guardrail has signal and the question becomes "how do we operationalize that reader" — which is a v0.1 scope question, not a v0.1 kill question.

Total surface: one extra loop run plus one reviewer pass. Same target document, same infrastructure. No new code.

## If the test holds (line quality is distinguishable)

Proceed with v0.1 mostly unchanged, but add **one** thing to Non-Negotiables: a periodic cross-domain audit of constitutional lines from completed loops. Cadence: every release cycle, the gate-check tier samples two loops at random, reads the constitutional lines, and flags any that read as boilerplate. This becomes a known operational cost of running §32, sized at <1 hour per cycle. The SDD's claim "we are *actually* attacking sycophancy" survives because there is a real human-readable feedback loop on line quality, not just presence/absence.

Minor tweak, not a rewrite. The SDD's structural choices (asymmetric termination, provenance hash, three insertion points, deferred Dialectic) all stand.

## If the test breaks (line quality is not distinguishable)

The v0.1 mission as written does not ship. The mechanism is theater and shipping it consumes the protocol slot. Two pivot options, in order of preference:

1. **Pivot to v0.1-minimal**: ship §32 *without* the anti-sycophancy claim. Frame it as a deliberation-termination protocol only — asymmetric termination, provenance hash, Bus transitions only, three insertion points. Drop the constitutional lines from Non-Negotiables. Move the anti-sycophancy work to v0.2 where it joins Dialectic + anonymization as one coherent mechanism with a fighting chance. This is honest scope and preserves the v0.2 wedge.
2. **Pivot to v0.1-paired-critic**: replace the constitutional lines with mandatory cross-domain pairing on every Critique-Revise loop (CISO ↔ CTO, CLO ↔ PM). The anti-sycophancy lever becomes structural separation, not a guardrail line. More expensive per loop, but the mechanism actually attacks the problem. Appetite extends to L (~2 weeks).

Do not ship v0.1 as currently written if the test breaks. The mission "make quality of dissent load-bearing" is too specific to survive a failed mechanism.

## Test cost estimate

**~3 engineer-hours.** One Critique-Revise loop run on the existing SDD with shifted critic instruction (~1 hour including state.md and artifact). One cross-domain reviewer comparison pass (~1 hour). Half an hour to write up the comparison and half an hour of slack. The test runs on infrastructure the SDD already commits to building inside its 1-week Appetite, so the marginal cost is the second loop instance, not the full setup.
