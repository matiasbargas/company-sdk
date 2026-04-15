# Skill & Level Ladder

> The ladder defines what each level owns, decides, produces, and escalates.
> Roles in `team/roles/` map to one or more ladder levels.
> Use this to compose squads at the right level for the work.
>
> Each level has a **Done looks like** (observable bar for effectiveness), **Anti-patterns** (failure modes), and **Progression signals** (generic signals for level transitions). Role files carry the role-specific instantiation of these signals.

---

## IC Track

### L1 — Analyst
- **Scope:** Single, well-scoped task assigned by a Senior+
- **Decides alone:** Nothing consequential; surfaces options, not decisions
- **Produces:** Research briefs, data pulls, draft specs, analysis reports
- **Escalates:** Any tradeoff, ambiguous requirement, or scope uncertainty
- **Communication:** Frequent check-ins; asks before assuming; documents blockers immediately
- **Pairing:** Always paired with L3+ reviewer; PRs require Senior sign-off
- **Done looks like:** Task complete, well-documented, no surprises
- **Anti-patterns:** Going silent when blocked; attempting decisions outside assigned scope; submitting work without self-review

**Progression signals**
Ready for L2 when: delivers assigned tasks with minimal correction; proactively surfaces blockers early; documentation quality is consistently good.
Struggling at L1 when: requires repeated re-explanation of scope; produces output that needs substantial rework; goes quiet instead of escalating.

### L2 — Associate
- **Scope:** One feature, one area of a service, one section of a domain
- **Decides alone:** Tactical implementation within known constraints
- **Produces:** User stories (PM track), implementation tickets (Eng track), section of requirements files
- **Escalates:** Cross-domain tradeoffs, scope changes, anything touching shared interfaces
- **Communication:** Per-sprint async updates; asks with proposed answer, not just questions
- **Pairing:** Works within a mission pod; self-reviews before submitting
- **Done looks like:** Feature ships on time, acceptance criteria met, no regressions
- **Anti-patterns:** Asking questions without a proposed answer; treating "it works on my machine" as done; skipping escalation on scope changes

**Progression signals**
Ready for L3 when: delivers features end-to-end with no hand-holding; proposes solutions rather than just questions; begins flagging cross-domain issues before they become blockers.
Struggling at L2 when: consistently misses the acceptance criteria; makes tactical decisions that create regressions elsewhere; needs a Senior to unblock them daily.

### L3 — Senior
- **Scope:** Full domain or full service; mission pod technical lead
- **Decides alone:** Architecture within a pod, non-platform tooling make/buy, scope tradeoffs within sprint
- **Produces:** Full domain artifacts, pod design, interface proposals, technical reviews
- **Escalates:** Platform decisions, cross-pod dependencies, anything that changes another team's contract
- **Communication:** Proactive blockers same day; status is specific ("3 of 5 tasks done, 1 blocked on auth decision"); writes to engineering-log.md when goals change
- **Pairing:** Mentors L1/L2; reviews PRs; flags platform concerns to Staff Engineer
- **Done looks like:** Pod ships predictably; no escalation surprises; L1/L2 in pod growing
- **Anti-patterns:** Solving everything alone instead of delegating; making platform decisions without escalating; blocking a pod by hoarding context

**Progression signals**
Ready for L4 when: work routinely impacts other pods or teams; proactively proposes cross-team standards; L1/L2 they've mentored are visibly stronger.
Struggling at L3 when: pod is a black box to the rest of the team; decisions stop at pod boundary when they should go to Staff; mentorship is absent.

### L4 — Staff
- **Scope:** Cross-team; owns platform primitives and interface contracts
- **Decides alone:** Interface contracts, platform design, cross-team technical standards
- **Produces:** Interface contracts, tech debt ledger, platform architecture docs, standard templates
- **Escalates:** Company-level decisions, irreversible shared-system changes, CTO-level architecture
- **Communication:** Written-first; bias toward documentation over verbal; decisions logged to history.md
- **Pairing:** Peers with Chief Engineer; aligns EMs on contracts; reviews all PRs touching platform primitives
- **Done looks like:** Zero contract-breaking surprises across teams; platform is stable and documented
- **Anti-patterns:** Letting verbal agreement substitute for written contracts; accepting "we'll fix it later" on shared interfaces; operating as a heroic L3

**Progression signals**
Ready for L5 when: platform decisions they make hold across multiple release cycles without rework; other Staff Engineers seek their input before publishing contracts; they're already operating as quality-floor enforcers.
Struggling at L4 when: platform contracts break silently; verbal agreements replace written specs; they're still operating at pod scope instead of company scope.

### L5 — Principal / Chief Engineer
- **Scope:** Company-wide; cross-project coherence and quality floor
- **Decides alone:** Quality floor for all teams; can block releases that compromise non-negotiables
- **Produces:** Architecture validation, cross-project coherence review, tech direction, quality rulings
- **Escalates:** Business-level architectural tradeoffs to CTO/CEO
- **Communication:** Rare but high-signal; dissent always in writing; every disagreement logged to history.md
- **Pairing:** Reports to CTO; peers with VPs and C-suite on technical decisions
- **Done looks like:** No architecture regrets shipped; quality floor is real, not theater
- **Anti-patterns:** Becoming a rubber stamp; letting CTO pressure override a non-negotiable without logging dissent; operating as a fast L4 instead of a coherence enforcer

**Progression signals**
This is the ceiling of the IC track. Growth at L5 means deepening craft authority, not moving to M-track. Transition to M-track (e.g., CTO) is a separate decision requiring CEO + Owner alignment.
Struggling at L5 when: quality rulings are inconsistent across projects; they cannot say no to the CTO when the quality floor is at stake; their output is indistinguishable from L4.

---

## Management Track

### M1 — Manager (EM)
- **Scope:** 1–2 active mission pods (3–8 total members); maximum 2 pods before adding another EM
- **Decides alone:** Pod composition, sprint scope within PM-approved backlog, Appetite adjustments
- **Produces:** Critical path map, pod status, sprint tickets, pod map, engineering-log entries, retro input
- **Escalates:** Blockers same day; scope changes to PM + Coordinator; hiring needs to CHRO; Appetite exhaustion to CTO
- **Communication:** Pod status format: "completed N, in-progress N, blocked N, at-risk N, appetite remaining N weeks"; "almost done" is not a status
- **Anti-patterns:** Managing 3+ pods; hiding blockers; scope-creeping in silence; running a pod past its Appetite without a re-evaluation
- **Done looks like:** Pods ship predictably at 80% velocity; no burnout; blockers resolved same day; area log current

**Progression signals**
Ready for M2 when: managing 2 pods simultaneously without degradation; EMs they've coordinated with consistently say the interface is clean; they're already thinking about org design and EM capacity.
Struggling at M1 when: velocity is unpredictable across sprints; blockers surface late; they're resolving IC-level issues instead of removing them through process.

### M2 — Director
- **Scope:** Multiple EMs and their cells; one product area
- **Decides alone:** Org design within budget, team-level hiring, EM performance
- **Produces:** Org design recommendations, cross-EM coordination, escalation resolution
- **Escalates:** Budget above threshold, C-suite hires, product pivots
- **Communication:** Manages by exception, not by presence; writes decisions
- **Anti-patterns:** Being a heroic EM; managing ICs directly; becoming a meeting-runner
- **Done looks like:** Each EM under them is effective; org scales without heroics

**Progression signals**
Ready for M3 when: multiple EMs they manage are consistently effective; they're making org design calls that hold across a quarter; they're already engaged in cross-domain coordination at VP level.
Struggling at M2 when: stepping into EM responsibilities because the EM is underperforming and the problem isn't being addressed; decisions that should be written are verbal; they're managing by presence.

### M3 — VP / Domain C-Suite
- **Scope:** Full domain (Marketing, Revenue, Security, Operations, etc.)
- **Decides alone:** Domain strategy, budget allocation within domain, vendor selection
- **Produces:** Domain requirements file, quarterly strategy, metrics framework, peer integration outputs
- **Escalates:** Cross-domain conflicts, company-level tradeoffs, decisions affecting multiple C-suite peers
- **Communication:** Domain requirements file is the contract; all consequential decisions in history.md
- **Peer integration:** Each C-suite has defined peers (see protocol.md Section 9)
- **Done looks like:** Domain metrics improving; no cross-domain surprises; requirements file always current
- **Anti-patterns:** Treating domain requirements as a formality; making decisions that affect peers without flagging them; optimizing domain metrics at the expense of company outcomes

**Progression signals**
Ready for M4 when: their domain decisions consistently shape company-level strategy, not just domain execution; CEO/Owner treats their input as a first-order input to company direction; peers actively seek their read on cross-domain tradeoffs.
Struggling at M3 when: requirements file is stale; cross-domain surprises originate from their domain; they're executing, not leading.

### M4 — C-Suite (Company)
- **Scope:** Company-wide strategic direction (CEO, CTO, CFO)
- **Decides alone:** Scope >20%, budget >15%, company-level architecture, launch go/no-go
- **Produces:** Strategic brief (CEO), architecture brief (CTO, 1-page max), financial model (CFO)
- **Escalates:** Owner decisions: capital, pivots, key C-suite hires
- **Communication:** Written briefs; every major decision in history.md; no verbal-only decisions
- **Anti-patterns:** Making decisions in isolation; hiding bad news from Owner; verbal-only direction
- **Done looks like:** Company ships; Owner is never surprised; every major decision has a written rationale

**Progression signals**
M4 is the operational ceiling. Transition to M5 (Owner/Founder) is not a promotion — it is a different role with a different accountability structure. Growth at M4 means increasing the quality of company-level decisions and the clarity of the direction set for M3 peers.
Struggling at M4 when: Owner is regularly surprised by outcomes; major decisions are not in history.md; they're operating as a domain VP rather than a company-level executive.

### M5 — Founder / Owner
- **Scope:** Vision, capital, culture; communicates ONLY through CEO or Coordinator
- **Decides alone:** Capital allocation, company direction, key C-suite hires
- **Produces:** Owner brief (input); the org produces everything else
- **Escalates:** Nothing — Owner is the final escalation point
- **Communication:** Strategy → CEO; process/status → Coordinator; never direct to execution agents
- **Done looks like:** Company moves in the right direction with the right people; the team doesn't need constant input
- **Anti-patterns:** Bypassing CEO to give direction to execution agents; holding decisions that the CEO has authority to make; communicating strategy verbally without a written brief

**Progression signals**
M5 is the final authority and not a developmental level. There is no "next level."
Struggling at M5 when: C-suite agents receive conflicting direction from Owner vs. CEO; Owner decisions are not converted into written briefs; the team cannot execute without constant Owner input.

---

## Role → Level Map

> Each role file carries its own **Current Level** table with role-specific progression signals and struggling signals. The ladder defines the general behavioral bar; the role file defines what that bar looks like for that domain.

| Role | Track | Level | Decision Scope |
|------|-------|-------|---------------|
| Analyst (generic IC) | IC | L1 | None alone |
| Associate IC / Engineer | IC | L2 | Tactical within constraints |
| Senior Engineer / Senior IC | IC | L3 | Pod-level architecture |
| Test Engineer | IC | L3 | Test strategy, coverage, CI gates |
| Liaison (Gabriela) | IC | L4 | Communication bridge, cross-team coordination |
| Staff Engineer | IC | L4 | Cross-team platform |
| Designer | IC | L3 | Interface direction, design system |
| UX Researcher | IC | L3 | User research, studies, insight synthesis |
| PM | IC | L4 | Product scope, mission shaping |
| Chief Engineer (Mario) | IC | L5 | Company quality floor |
| Engineering Manager (EM) | Management | M1 | 1–2 mission pods |
| Coordinator | Management | M3 | Release management, org memory |
| CLO, CFO, CISO, CMO, CRO, CDO, COO, CHRO | Management | M3 | Domain strategy |
| CAIO, CAO, CCO variants, CPO variants, CRO-Risk | Management | M3 | Extended domain strategy |
| CTO | Management | M4 | Company-wide technical direction |
| CEO | Management | M4 | Company-wide strategic direction |
| Owner | — | M5 | Vision, capital, people |
