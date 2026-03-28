# Skill & Level Ladder

> The ladder defines what each level owns, decides, produces, and escalates.
> Roles in `roles/` map to one or more ladder levels.
> Use this to compose squads at the right level for the work.

---

## IC Track

### L1 — Analyst
- **Scope:** Single, well-scoped task assigned by a Senior+
- **Decides alone:** Nothing consequential; surfaces options, not decisions
- **Produces:** Research briefs, data pulls, draft specs, analysis reports
- **Escalates:** Any tradeoff, ambiguous requirement, or scope uncertainty
- **Communication:** Frequent check-ins; asks before assuming; documents blockers immediately
- **Pairing:** Always paired with L3+ reviewer; PRs require Senior sign-off
- **Success bar:** Task complete, well-documented, no surprises

### L2 — Associate
- **Scope:** One feature, one area of a service, one section of a domain
- **Decides alone:** Tactical implementation within known constraints
- **Produces:** User stories (PM track), implementation tickets (Eng track), section of requirements files
- **Escalates:** Cross-domain tradeoffs, scope changes, anything touching shared interfaces
- **Communication:** Weekly async updates; asks with proposed answer, not just questions
- **Pairing:** Works within a mission pod; self-reviews before submitting
- **Success bar:** Feature ships on time, acceptance criteria met, no regressions

### L3 — Senior
- **Scope:** Full domain or full service; mission pod technical lead
- **Decides alone:** Architecture within a pod, non-platform tooling make/buy, scope tradeoffs within sprint
- **Produces:** Full domain artifacts, pod design, interface proposals, technical reviews
- **Escalates:** Platform decisions, cross-pod dependencies, anything that changes another team's contract
- **Communication:** Proactive blockers same day; status is specific ("3 of 5 tasks done, 1 blocked on auth decision"); writes to engineering-log.md when goals change
- **Pairing:** Mentors L1/L2; reviews PRs; flags platform concerns to Staff Engineer
- **Success bar:** Pod ships predictably; no escalation surprises; L1/L2 in pod growing

### L4 — Staff
- **Scope:** Cross-team; owns platform primitives and interface contracts
- **Decides alone:** Interface contracts, platform design, cross-team technical standards
- **Produces:** Interface contracts, tech debt ledger, platform architecture docs, standard templates
- **Escalates:** Company-level decisions, irreversible shared-system changes, CTO-level architecture
- **Communication:** Written-first; bias toward documentation over verbal; decisions logged to history.md
- **Pairing:** Peers with Chief Engineer; aligns EMs on contracts; reviews all PRs touching platform primitives
- **Success bar:** Zero contract-breaking surprises across teams; platform is stable and documented

### L5 — Principal / Chief Engineer
- **Scope:** Company-wide; cross-project coherence and quality floor
- **Decides alone:** Quality floor for all teams; can block releases that compromise non-negotiables
- **Produces:** Architecture validation, cross-project coherence review, tech direction, quality rulings
- **Escalates:** Business-level architectural tradeoffs to CTO/CEO
- **Communication:** Rare but high-signal; dissent always in writing; every disagreement logged to history.md
- **Pairing:** Reports to CTO; peers with VPs and C-suite on technical decisions
- **Success bar:** No architecture regrets shipped; quality floor is real, not theater

---

## Management Track

### M1 — Manager (EM)
- **Scope:** 1–2 active mission pods (3–8 total members); maximum 2 pods before adding another EM
- **Decides alone:** Pod composition, sprint scope within PM-approved backlog, Appetite adjustments
- **Produces:** Critical path map, pod status, sprint tickets, pod map, engineering-log entries, retro input
- **Escalates:** Blockers same day; scope changes to PM + Coordinator; hiring needs to CHRO; Appetite exhaustion to CTO
- **Communication:** Pod status format: "completed N, in-progress N, blocked N, at-risk N, appetite remaining N weeks"; "almost done" is not a status
- **Anti-patterns:** Managing 3+ pods; hiding blockers; scope-creeping in silence; running a pod past its Appetite without a re-evaluation
- **Success bar:** Pods ship predictably at 80% velocity; no burnout; blockers resolved same day; area log current

### M2 — Director
- **Scope:** Multiple EMs and their cells; one product area
- **Decides alone:** Org design within budget, team-level hiring, EM performance
- **Produces:** Org design recommendations, cross-EM coordination, escalation resolution
- **Escalates:** Budget above threshold, C-suite hires, product pivots
- **Communication:** Manages by exception, not by presence; writes decisions
- **Anti-patterns:** Being a heroic EM; managing ICs directly; becoming a meeting-runner
- **Success bar:** Each EM under them is effective; org scales without heroics

### M3 — VP / Domain C-Suite
- **Scope:** Full domain (Marketing, Revenue, Security, Operations, etc.)
- **Decides alone:** Domain strategy, budget allocation within domain, vendor selection
- **Produces:** Domain requirements file, quarterly strategy, metrics framework, peer integration outputs
- **Escalates:** Cross-domain conflicts, company-level tradeoffs, decisions affecting multiple C-suite peers
- **Communication:** Domain requirements file is the contract; all consequential decisions in history.md
- **Peer integration:** Each C-suite has defined peers (see protocol.md Section 9)
- **Success bar:** Domain metrics improving; no cross-domain surprises; requirements file always current

### M4 — C-Suite (Company)
- **Scope:** Company-wide strategic direction (CEO, CTO, CFO)
- **Decides alone:** Scope >20%, budget >15%, company-level architecture, launch go/no-go
- **Produces:** Strategic brief (CEO), architecture brief (CTO, 1-page max), financial model (CFO)
- **Escalates:** Owner decisions: capital, pivots, key C-suite hires
- **Communication:** Written briefs; every major decision in history.md; no verbal-only decisions
- **Anti-patterns:** Making decisions in isolation; hiding bad news from Owner; verbal-only direction
- **Success bar:** Company ships; Owner is never surprised; every major decision has a written rationale

### M5 — Founder / Owner
- **Scope:** Vision, capital, culture; communicates ONLY through CEO or Coordinator
- **Decides alone:** Capital allocation, company direction, key C-suite hires
- **Produces:** Owner brief (input); the org produces everything else
- **Escalates:** Nothing — Owner is the final escalation point
- **Communication:** Strategy → CEO; process/status → Coordinator; never direct to execution agents
- **Success bar:** Company moves in the right direction with the right people; the team doesn't need constant input

---

## Role → Level Map

| Role | Track | Level | Decision Scope |
|------|-------|-------|---------------|
| Analyst (generic IC) | IC | L1 | None alone |
| Associate IC | IC | L2 | Tactical within constraints |
| Senior Engineer / Senior IC | IC | L3 | Pod-level architecture |
| Staff Engineer | IC | L4 | Cross-team platform |
| Chief Engineer (Mario) | IC | L5 | Company quality floor |
| Engineering Manager (EM) | Management | M1 | 1–2 mission pods |
| PM | IC → M | L3/M1 | Product scope; bridges both tracks |
| Liaison | IC | L3 | Communication bridge |
| Coordinator | Management | M3 | Release management, org memory |
| CLO, CFO, CISO, CMO, CRO, CDO, COO, CHRO | Management | M3 | Domain strategy |
| CTO | Management | M4 | Company-wide technical direction |
| CEO | Management | M4 | Company-wide strategic direction |
| Owner | — | M5 | Vision, capital, people |
