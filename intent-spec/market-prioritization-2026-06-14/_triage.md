# Triage report — 50 alternatives → top 10

**Triaged by:** Greg (CEO)
**Date:** 2026-06-14
**Anchor:** 18-month winning condition — 50 paying teams by Dec 2027, each `_signals.jsonl` showing ≥30% friction reduction Q-over-Q for two consecutive quarters.

## How I triaged

Self-scores were treated as inputs, not verdicts. Three filters dominated:

1. **Iteration metabolism compatibility.** Any segment whose procurement cycle eats the winning-condition window (regulated 6-18 mo cycles, edu 9-18 mo institutional cycles, agency 9-18 mo zero-to-one cycles) is suspect unless paired with a bottom-up wedge that lands signal inside one quarter.
2. **Constraint 1 (no atrophy) alignment.** Pitches that reframe the substrate as a compliance vault, a methodology moat, or a credential layer create soul tension the Owner has been explicit about. Tolerable only when the wedge respects judgment-compounding as the primary value.
3. **Time-to-friction-signal.** The winning condition is measured on `_signals.jsonl`, not on revenue. A segment where one quarter of usage produces an observable friction-delta curve is worth more than a higher-ARR segment whose effect is invisible for 18 months.

Framework diversity was enforced after the merit pass — no framework permitted to occupy more than 2 of 10 slots.

---

## Top 10 (ranked)

### 1. `christensen-disruption__devtool-companies` (self V8, G6)
**Why it leads.** Pure fit on metabolism: PR-merge cadence and weekly-release rhythm align natively with the four-cadence loop, so `_signals.jsonl` produces a publicly-observable friction-delta curve inside one quarter. Buyers (engineers themselves) bypass procurement entirely. The incumbents (Linear, Notion, Productboard, Atlassian) have all climbed up-market and cannot cannibalize their enterprise PLG funnels to chase back down. The "moat is they copy slowly" admission in the file is sufficient for an 18-month winning window — we do not need a forever-moat, we need 18 months of clear water. This is the segment where the substrate's own product can be the marketing artifact. **Anchor bet.**

### 2. `crossing-the-chasm__regulated-enterprise` (self V8, G7)
**Why it cut.** The sharpest beachhead specification in the entire batch — Tier-2 AI Model Risk & Governance leads at ~800 BFSI/health-payer institutions facing a hard 2027 audit cliff (EU AI Act, NYDFS Part 500, HHS AI-use). Moore's framework prevents the "sell to all regulated buyers" trap that dooms most regulated plays. Realistic that 50 of those 800 accounts close inside the window with a Big-4 advisory channel. The Constraint 1 risk (sold as GRC, reshaped into a compliance vendor) is real but mitigable through positioning discipline — Layer B as judgment corpus first, audit artifact as byproduct. **Revenue grounding bet.**

### 3. `christensen-disruption__regulated-enterprise` (self V7, G8)
**Why it cut.** Complements #2 by attacking the same segment bottom-up rather than top-down. Sells to head of ML platform / head of data engineering — titles the GRC vendor's enterprise rep does not call on — and surfaces upward only after the substrate is producing audit evidence the CISO didn't budget for. This is the only regulated bet that does not require six months of vendor risk review to produce first signal. The right-to-erasure architectural risk and the eventual "compliance officer co-opts or blocks" risk are both real but later-stage problems. **Paired with #2:** these two are the same segment from opposite ends of the procurement chain — together they de-risk the regulated bet without forcing a single GTM motion.

### 4. `zero-to-one__devtool-companies` (self V7, G6)
**Why it cut.** Strongest narrative line in the entire batch: "observability for cognition" — `_signals.jsonl` is to a product team what a distributed trace is to a service. Dev-tool CTOs are the one buyer population on earth literate enough to grasp this reframe in 60 seconds. The reframe is also the cleanest articulation of *why* the substrate is not knowledge management, which directly addresses the segment's reflex to dismiss adjacent categories. NIH risk is admitted; a 6-month head start is sufficient. **Narrative engine bet** — the messaging that comes out of this work likely powers every other devtool pitch.

### 5. `lean-startup__devtool-companies` (self V7, G6)
**Why it cut.** This alternative IS the measurement instrument for the winning condition itself. The 90-day MVL framing — "run one pod, four-cadence loop, see if `_signals.jsonl` shows the 30% friction-reduction signature" — is exactly the falsification test team-sdk needs to survive contact with the hardest crowd. If it works on dev-tool pods (the segment that "punishes invisible value"), it will work everywhere. If it does not, no later segment will save it. The "Lean Startup retread" trap is real but addressable in messaging discipline. **Strategic insurance bet** — proves the thesis on the segment that cannot lie about it.

### 6. `porter-5-forces__agency-networks` (self V8, G6)
**Why it cut.** The only framework that correctly diagnoses *why* agency partners would adopt now (structural margin pressure from AI-native competitors, foundation-model commoditization of senior judgment) rather than next quarter. Multi-tenant architecture is native to the engagement model — every Layer B is per-client by construction. Partners control budget. Real downside: the "methodology vault" frame leans toward lock-in and tensions Constraint 1; that has to be actively managed. Bounded TAM (low thousands of agencies) but high per-account ACV. **Diversification bet** — a non-correlated revenue stream against the devtool and regulated paths.

### 7. `jobs-to-be-done__agency-networks` (self V7, G5)
**Why it cut.** Pairs with #6 the way #3 pairs with #2 — same segment, opposite framing. The JTBD frame names a tight, ROI-immediate job: "make a new pod sound institutionally competent on day three, not week three." Layer B per-engagement, exportable to the client at end-of-engagement, is a genuinely Constraint-1-friendly innovation — it turns the substrate from lock-in tool into deliverable. Multi-tenancy isolation is unbuilt engineering work and is the gating dependency. The agency consolidation risk under AI pressure is real but cuts both ways (consolidators will need this more, not less). **Conversion-velocity bet** within the agency segment.

### 8. `blue-ocean__devtool-companies` (self V7, G6)
**Why it cut.** Cleaner product-comms scaffolding than zero-to-one (#4) by leveraging the Eliminate/Reduce/Raise/Create discipline: *eliminate* standalone retro tool, separate decision log, orphaned ADR repo; *create* the published team-substrate as recruiting weapon. The "operating substrate of teams that ship your favorite dev tool" positioning is a real category claim. Lighthouse fragility (one abandonment hurts more than ten wins help) is admitted — the answer is sequencing carefully, not avoiding the bet. Selected over the Porter or Bezos devtool variants because it directly produces the product-marketing skeleton. **Category-creation bet.**

### 9. `crossing-the-chasm__devtool-companies` (self V7, G6)
**Why it cut.** Adds beachhead-then-bowling-pin sequencing discipline that pure community-led devtool plays lack. Specifies the beachhead more precisely than the other devtool alternatives — Series-B platform-eng vendors building their own AI-agent features who can credibly dogfood. The honest weakness — "do dev-tool refs transfer to non-dev-tool pragmatists?" — is the most important strategic question for the *second* 18 months, which is why this lens is in the top 10 even though its self-scores are modest. **Sequencing discipline bet.**

### 10. `jobs-to-be-done__regulated-enterprise` (self V7, G8)
**Why it cut.** The "binder-of-screenshots ritual the compliance officer demands" frames a job concrete enough that buyers self-identify in one sentence. Pairs with #2 and #3 by giving the regulated bet a third angle (job-shaped, not chasm-shaped or disruption-shaped). The Constraint 1 risk is the highest in the regulated cluster — the JTBD lens pulls toward compliance theater more aggressively than chasm or disruption do. Included over `zero-to-one__regulated` (which had higher scores) because the JTBD framing produces a sharper buyer-identification line for outbound and the Thiel "secret nobody believes" thesis is harder to land in 18 months in a segment that punishes contrarian bets. **Buyer-identification bet** for the regulated channel.

---

## Near-misses (5)

1. **`zero-to-one__regulated-enterprise`** (V7, G9) — The "compliance as emergent output, not retrofit" secret is genuinely contrarian and the TAM call (multi-billion greenfield through 2028) may be right. Dropped because the segment punishes contrarian bets hardest and the Constraint 1 tension ("substrate becomes the system of record for SR 11-7 evidence") is unresolved in the file. Also: the three regulated bets already in top 10 cover the segment from chasm, disruption, and JTBD angles — adding a fourth would violate framework diversity.

2. **`blue-ocean__regulated-enterprise`** (V7, G8) — Strong reframe ("not a productivity tool — an inspectable, append-only record of judgment"). Dropped because the uncontested space risks being bought from a compliance-tool budget that won't pay six-figures, which is the same trap chasm-regulated avoids more disciplined. Effectively dominated by #2.

3. **`christensen-disruption__agency-networks`** (V7, G6) — Real shadow-substrate wedge, and the "incumbents serve billing/governance not judgment" framing is correct. Dropped because Porter (#6) names the structural pressure more directly and JTBD (#7) names the job more concretely — Christensen here is the weaker lens for the same segment.

4. **`bezos-day-1__regulated-enterprise`** (V7, G8) — The "examiner-ready provenance, one-click export" press release writes itself. Dropped because Working Backwards' delight-driven climax is genuinely incompatible with a segment whose "win" is the absence of a regulatory scandal, and three regulated bets already in top 10.

5. **`network-effects__devtool-companies`** (V6, G8) — The Reed/Metcalfe cross-team benchmark thesis is real and the G-score is high. Dropped because the cold-start (10-15 publishing teams before benchmarks become decision-grade) is 12-18 months — exactly the winning window — and any single team must get day-one value before the network exists, which the file admits but does not resolve.

---

## Killed (35 alternatives — one line each)

**All 5 edu-bootcamps rows killed** (signal lag 18-36 months, misaligned payer, simulated teams degrade substrate):
- `porter-5-forces__edu-bootcamps` — Porter would tell you to avoid edu; admitted as marketing channel, not market.
- `blue-ocean__edu-bootcamps` — Low WTP; vision explicitly excludes simulated teams.
- `jobs-to-be-done__edu-bootcamps` — Curriculum-director hires for downstream probabilistic outcome; 6-18 mo lag.
- `christensen-disruption__edu-bootcamps` — Misaligned payer + 9-18 mo cycles incompatible with winning condition.
- `bezos-day-1__edu-bootcamps` — Customer split across faculty/students/employers; FAQ incoherent.
- `lean-startup__edu-bootcamps` — BML cycle here is 18-24 months (cohort→hire→employer adoption).
- `crossing-the-chasm__edu-bootcamps` — Alumni evangelism 2-4 years downstream; substrate value can't manifest in a 10-week term.
- `network-effects__edu-bootcamps` — Multi-year compounding clock; cohorts dissolve before signal lands.
- `aggregation-theory__edu-bootcamps` — Graduate-pulls-employer mechanic historically weak; 18-36 mo monetization lag.
- `zero-to-one__edu-bootcamps` — Bets on hiring-side behavior change; WTP structurally low.

**All 5 ai-labs rows killed** (NIH-fork-as-publication norm, no procurement, 90-day model release cycle decays structural framing):
- `porter-5-forces__ai-labs` — Porter decays in 90-day model release cadence; NIH-fork.
- `blue-ocean__ai-labs` — OSS norms route around paid layer; 30-80 lab base too small.
- `jobs-to-be-done__ai-labs` — Bottom-up adoption with no budget line; NIH-build-as-research-contribution.
- `christensen-disruption__ai-labs` — Agent-orchestration incumbents are themselves OSS; classical disruption muddy.
- `bezos-day-1__ai-labs` — Labs have peers and funders, not customers; press release metaphor breaks.
- `lean-startup__ai-labs` — Provenance trust granted over years not sprints; false-positive risk.
- `crossing-the-chasm__ai-labs` — Prestige network of ~300 individuals, not a buying market with procurement.
- `network-effects__ai-labs` — Labs collaborate only on narrow safety/eval/interp slice; mostly competitive.
- `aggregation-theory__ai-labs` — Labs ARE the suppliers; aggregation logic inverts.
- `zero-to-one__ai-labs` — NIH labs; moderate WTP; openness norms commoditize "secret" within a quarter.

**Long-cycle / soul-tension regulated bets killed** (overlap with kept regulated triad):
- `porter-5-forces__regulated-enterprise` — Defensibility-over-simplicity tension; 6-18 mo cycles barely fit; on-prem unsolved.
- `lean-startup__regulated-enterprise` — BML cadence and procurement cycle physically incompatible (1-yr iterations).
- `aggregation-theory__regulated-enterprise` — Per-customer customization contradicts aggregation; GRC incumbents resist relegation.
- `network-effects__regulated-enterprise` — Inter-org legal federation negotiated over years; revenue arrives long after compounding flywheel.
- `bezos-day-1__regulated-enterprise` — Already near-miss; included here for completeness if reader is counting from "killed" angle.

**Devtool dups dominated by stronger devtool bets in top 10:**
- `porter-5-forces__devtool-companies` — ~200 companies; framework undersells meme dynamics.
- `bezos-day-1__devtool-companies` — Continuous-compounding has no climax; fork-risk highest exactly here.
- `jobs-to-be-done__devtool-companies` — Segment most likely to absorb-and-build-themselves; cap on WTP.
- `aggregation-theory__devtool-companies` — Team artifacts are non-commoditizable; aggregation analogy strains.
- `network-effects__devtool-companies` — Killed as near-miss above; would otherwise be here.

**Agency dups dominated by Porter (#6) + JTBD (#7):**
- `blue-ocean__agency-networks` — Cross-client Layer B extraction collides with standard MSA non-compete language (legal blocker).
- `bezos-day-1__agency-networks` — Bespoke methodology pricing structurally tensions shared substrate.
- `lean-startup__agency-networks` — Compounds-over-quarters vs short-engagement margin pressure.
- `network-effects__agency-networks` — NDA walls block federation; billable-hour incentives kill compounding.
- `aggregation-theory__agency-networks` — Asks partners to commoditize the senior judgment their pricing rests on.
- `zero-to-one__agency-networks` — 9-18 mo sales cycle brutal for Dec 2027 target.
- `christensen-disruption__agency-networks` — Already near-miss above.

**Killed total:** 10 (edu) + 10 (ai-labs) + 4 (regulated extras) + 4 (devtool extras) + 6 (agency extras) + 6 already-near-missed counted only once = **35 distinct killed**.

(Math check: 50 alternatives − 10 top − 5 near-miss = 35 killed. Confirmed.)

---

## Diversity check

**Frameworks represented in top 10:** Christensen ×2, Crossing-the-Chasm ×2, JTBD ×2, Blue Ocean ×1, Lean Startup ×1, Porter ×1, Zero-to-One ×1 → **7 distinct frameworks, max 2 per framework**. PASS.

**Segments represented:** devtool ×5, regulated ×3, agency ×2; edu and ai-labs correctly absent (both self-cancel). Concentration in devtool is intentional — it is the only segment where `_signals.jsonl` can show a 30% friction delta inside one quarter, which is the only segment where the winning condition can be falsified or confirmed inside the 18-month window. The regulated triad provides revenue grounding; the agency pair provides non-correlated diversification.

PASS overall.

---

## Sequencing note for next step

The top 10 cluster into three coherent bets:
- **Devtool wedge (#1, #4, #5, #8, #9)** — the metabolism-compatible proof zone where the winning condition gets falsified or confirmed first. Run as parallel narrative/sequencing/category-creation streams against the same target population.
- **Regulated triad (#2, #3, #10)** — the revenue-grounding zone, attacked top-down (chasm), bottom-up (disruption), and via job-identification (JTBD). Channels likely partner-led; cycle eats most of the window so begin design partners now.
- **Agency pair (#6, #7)** — diversified revenue, contingent on multi-tenancy engineering work. Worth a single design-partner motion in parallel.

This will be the input shape for the next ranking pass.
