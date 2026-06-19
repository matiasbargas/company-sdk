# §32 Generative Loops — Designer Shape Review

**Reviewer:** Daniela (Designer)
**Date:** 2026-06-14
**Scope:** v0.1 protocol text + Critique-Revise + Red-Team, from the Designer vantage
**Verdict (summary):** Both patterns ship — neither is broken — but both have one missing NON_TRIGGER_SHAPE line that, if absent, will produce predictable bad design outcomes on real artifacts. Substantive but should_be_addressed, not blocks_seal. Fix is two one-line additions to the pattern files, not a reopen of protocol.md.

---

## Q1 — Critique-Revise on an Interface Direction Brief

**Verdict: maps_with_caveat.**

What carries through cleanly. Constraint 1 (capability over dependency) is genuinely load-bearing in design — dark patterns, engagement-maximization, and dependency-by-design get cut by a constitutional critic with real teeth. Soul principles around honesty and dissent map well onto AI confidence display, trust-signal placement, and conversation honesty. The `would-have-wrongly-killed:` line is, frankly, a discipline design critique has needed for years — reviewers routinely flatten bold interaction patterns into standard forms, and forcing the critic to name what they would have killed is one of the better mechanical anti-timidity levers I've seen written down.

What collapses. Design critique has a craft layer that does not live in Layer A:

- **Perceived affordance** — whether a user can tell what they can do — is not a Soul principle. A critic citing only Constraints + Soul has no clause to point at when affordance is broken.
- **Form-follows-function** — whether the interaction model fits the underlying task — same story. No constitutional clause. Either the critic invents one (constitution-as-decoration failure, already named in the pattern doc) or stays silent.
- **Accessibility** — WCAG conformance, contrast, focus order, screen-reader semantics. This is the biggest gap. A constitutional critic will systematically miss accessibility failures because they are craft standards, not constitutional principles. The first Designer told to "run Critique-Revise on your IDB before SDD Step 2" will produce a constitutionally-clean IDB that an engineer builds, and the accessibility failure surfaces at the UX review gate when it is expensive to fix.
- **Emotional register** — does the interface match the moment, the user state, the cultural context — is craft.

The deeper issue beneath Q1: the §32 SDD never treats the Layer A constitution itself as a design artifact. **The constitution is an interface** — it is the surface critics consult to do their job. A critic-facing interface that omits craft principles will produce critics that systematically blind-spot those areas. The §32 authors did not ask whether Constraints + Soul are sufficient as a critic-facing artifact for design work. They are not. This is the silent-exclusion the SDD says it is paying down.

**Fix:** add to `team/roles/loops/critique-revise.md` under NON_TRIGGER_SHAPE:
> *Design or research craft review — accessibility, perceived affordance, form-follows-function, and methodological soundness are craft standards, not Layer A clauses. Constitutional Critique-Revise will silently miss them. Use a craft-review pass instead, or in addition.*

This is one line. It does not change v0.1 protocol.md text. It tightens the pattern file so the first Designer who runs it knows where the pattern's edge is.

---

## Q2 — Red-Team's singleton-killing-assumption on a design artifact

**Verdict: fits_with_caveat.**

Strategies and architectures have a failure topology where one load-bearing assumption can break the whole thing — wrong market assumption kills the strategy, wrong scaling assumption rebuilds the architecture. The singleton framing fits.

Designs typically have a different failure topology: multiple parallel critical assumptions, none of which alone "breaks" the design but the absence of any one of which degrades it. On an IDB I might have:

- Users will recognize this affordance (perception)
- Users will trust the AI's confidence display (emotional)
- Users will land here in this context, not elsewhere (mental model)
- The layout will hold at smaller breakpoints (technical)

If perception fails, trust may recover the flow. If trust fails, perception may carry. The failure is cumulative degradation, not catastrophic break. Forcing a Red-Teamer to pick one produces one of three outcomes: (a) they pick the most catastrophic-sounding one — usually technical — and the other three go un-stressed; (b) they invent a "killing" frame around an assumption that is actually degradational, producing overcorrection; or (c) they say "I cannot name one" and the loop fails closed as a false negative.

But — pushing back on my own initial read — Red-Team's existing NON_TRIGGER_SHAPE already covers most of this: "Decision is cheap, reversible, low-blast-radius — overhead exceeds value." Most design decisions ARE cheaply reversible. The hard-to-reverse subset — navigation model, design token system, conversation architecture — are the ones the Designer role file already flags for `history.md`. And those DO have singleton-killing assumptions, because their cost-to-reverse is high precisely because they thread through everything. A navigation model that assumes wrong about how users segment the product fails catastrophically, not degradationally.

So Red-Team on a full IDB distorts. Red-Team on the hard-to-reverse subset fits cleanly. The pattern works where the role file already says "this is irreversible."

**Fix:** add to `team/roles/loops/red-team.md` under NON_TRIGGER_SHAPE:
> *Composite design artifacts (full IDBs, design systems in aggregate) where failure is degradational rather than catastrophic. Use on the hard-to-reverse subset only — navigation model, token system, conversation architecture, AI tone model — where one wrong assumption does break the whole thing.*

Again, one line. Does not change protocol.md.

---

## Substantive concern: yes — but narrow and cheap

Both caveats land on the same structural issue: the §32 patterns were shaped against engineering-flavored artifacts (proposals, plans, SDDs, architectures), and the NON_TRIGGER_SHAPE blocks reflect that. Design artifacts have different failure topologies (cumulative degradation vs. catastrophic break) and a craft layer that lives outside Layer A. Without the two NON_TRIGGER_SHAPE additions, a Designer running these patterns as-shipped will produce worse design outcomes than running them with the tweaks — specifically:

- A constitutionally-clean IDB that is accessibility-broken, reaching engineering before anyone catches it.
- A Red-Team pass on a full IDB that hardens one assumption and leaves three unstressed, with the design failing in the cumulative pattern nobody saw coming.

Both are real, both are predictable, both are cheap to prevent.

**Concern severity: should_be_addressed.** Not blocks_seal — the patterns produce real signal on the failure modes they are designed for, and the constitution-line audit Non-Negotiable already catches the worst class of bad outputs. But the two NON_TRIGGER_SHAPE additions are the difference between "Designers know where the pattern's edge is" and "Designers learn it from the first bad outcome." Worth one revision of the pattern files before seal.

**Suggested fix (single line):** Add the two NON_TRIGGER_SHAPE clauses above to `critique-revise.md` and `red-team.md` respectively before v0.1 seals. Protocol.md text unchanged.

---

## Pushback on the §32 framing itself

The SDD says shape conflict reopens v0.1 for one revision. The two fixes above do not require that — they tighten pattern files, not protocol text. But the SDD's own success criterion ("if all four return clean we did not actually ask them anything") implies the bar is "did you find something we'd actually change." Yes. Two NON_TRIGGER_SHAPE lines. Both are silent-exclusion repairs in the spirit of Soul Principle 4 — design's craft layer was not present at the shaping table, and that absence shaped the pattern edges. Adding the lines acknowledges the absence without pretending it has been fixed. The real fix — a craft constitution available to critics reviewing design artifacts — is v0.2 or v0.3 work, and that is a fine place for it.
