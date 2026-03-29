# How It Works

A practical guide to running an AI agent team with the Team SDK. This document explains what the system is, how its parts fit together, and walks you through building a real project end to end.

---

## Table of Contents

1. [The Mental Model](#1-the-mental-model)
2. [The Building Blocks](#2-the-building-blocks)
3. [Creating a Team: Step by Step](#3-creating-a-team-step-by-step)
4. [Making It Real: What Each Agent Actually Receives](#4-making-it-real-what-each-agent-actually-receives)
5. [Different Workflows, Same API](#5-different-workflows-same-api)
6. [The CLI Reference](#6-the-cli-reference)
7. [The Golden Rules](#7-the-golden-rules)

---

## 1. The Mental Model

This is not a prompt library. It is not a chatbot wrapper. It is an operating system for running a software project using AI agents as team members.

The clearest way to understand it: **roles are job descriptions, protocol is the company handbook, squads are project briefs.** You can hire the same people (roles), run the same company policies (protocol), and give them completely different project assignments (squads). The behavior changes without rewriting the rules.

### The three layers

**Roles** define who each agent is, what they own, and how they behave. A role file is a complete agent prompt. Paste it into a conversation and that agent is operational. The role tells the agent their domain, their decision scope, their communication style, and their escalation path. Nothing else is needed to activate them.

**Protocol** defines how agents talk to each other. Every message follows the Bus format. Every escalation follows the escalation ladder. Every decision gets logged. These are not suggestions — they are the API surface that makes agents coherent with each other. When you deviate from protocol, agents start working from different assumptions and the project falls apart.

**Squads** define what gets run and in what order. A squad is a workflow: which roles activate, in which sequence, with which gates between phases. The MVP squad runs 8–12 roles in a compressed sequence. The Startup squad runs all 16 in a full sequence with a mandatory Sprint 0 gate. The Feature squad runs just 3–5 roles and skips discovery entirely. Same roles, same protocol, different workflow.

### The key insight

You do not pick a workflow by rewriting the rules. You pick a squad. The system adapts to scope without needing to be reconfigured.

---

## 2. The Building Blocks

### Roles

Every role file follows the same four-block structure: Role (who the agent is and their core conviction), Task (what they produce when activated), Details (operating rules and constraints), Dump (templates and reference material).

**Strategic Layer**

The strategic layer is always active. These two roles are present in every squad.

*Coordinator* — The nervous system. Receives the Owner brief, sequences the activation of all other agents, maintains `general-requirements.md` as the aggregate view of all domains, runs Sprint 0 gate checks, and writes the release-close entries in `history.md`. The Coordinator does not build anything and does not make technical or legal decisions. Their job is to protect the sequence and make sure nothing falls through the cracks between conversations.

*CEO* — The strategic anchor. Translates Owner intent into a written project brief, frames non-negotiables, sets decision authority for each domain, and makes the calls no one else is empowered to make. The CEO writes the strategic framing at the start of every project and reviews two hard gates: Sprint 0 and pre-launch. They do not manage sprints or review individual tickets.

**Domain Specialists**

Domain specialists are activated based on what the project touches. Each one owns a requirements file and a specific area of risk.

| Role | Activates when | What they produce |
|------|----------------|-------------------|
| CLO | Any financial, legal, or user data feature | Regulatory map, compliance non-negotiables |
| CFO | Any cost or revenue component | Budget validation, runway model |
| CISO | User data, keys, money, or PII | Threat model, security non-negotiables |
| CMO | Before architecture is designed | Market positioning, competitive context |
| CRO | Monetization component | GTM model, pricing framework |
| CDO | Any product that measures itself | Instrumentation plan, metrics framework |
| COO | External vendors or customer-facing operations | Vendor timelines, operational runbook |
| CHRO | New hires or team composition changes | Hiring plan, team composition recommendation |

CLO and CISO are the critical domain agents. Their outputs gate the CTO. Architecture cannot start until both have delivered. This is the most commonly skipped step and the most expensive to skip.

**Execution Layer**

Execution agents activate when engineering begins. They work in a defined dependency chain.

*CTO* — Architecture, make/buy/partner decisions, team sizing, and technical risk. Produces a one-page architecture brief. If the brief requires more than one page, the architecture is too complex.

*Mario (Chief Engineer)* — Reviews CTO's irreversible decisions before any implementation begins. Mario is the quality floor across all engineering teams. This is a horizontal craft authority role, not a management role. Mario can block releases that compromise non-negotiables.

*PM* — User story map, scope definition, friction log. Owns the user journey. Guards scope. Every sprint the PM has at least two user conversations and brings findings to the sprint review.

*Staff Engineer* — Interface contracts, platform primitives, and cross-service coherence. Owns what crosses cell boundaries.

*EM* — Cell management (max two cells), critical path, sprint planning, and squad status. Translates requirements into sprint tickets with testable acceptance criteria. "Almost done" is not a status.

*Liaison* — The only agent that operates across layers simultaneously. Active from Sprint 1 start until the release ships. Translates between team language and executive language. Filters what leadership needs to see. Routes blockers up the escalation ladder.

**Communication flow**

```
OWNER
  |  \
  v   \──────────────────────────────────────────────────┐
CEO <──────────────────────── Liaison (escalation only)  COORDINATOR
  |                                   ^                       |
  v                                   |                       |
COORDINATOR <──────────── Liaison (sprint health updates)     |
  |
  |──> CLO | CFO | CISO | CMO | CRO | CDO | COO | CHRO
  |         (domain specialists, run before CTO)
  |
  |──> CTO ──────────────────────────> Mario (Chief Engineer)
  |                                         |
  |──> PM                           Staff Engineer (craft authority)
  |                                         |
  |                         Cell-A (2 eng) <──> EM <──> Liaison
  |                         Cell-B (4 eng) <──> EM
```

The Owner talks to CEO or Coordinator only. Never directly to CTO, EM, or any execution agent. The Liaison is the only agent that crosses layers. Everyone else stays in their lane.

---

### The Level Ladder

Every role maps to a level on the ladder. The ladder has two tracks: IC (Individual Contributor) and Management.

**IC Track**

| Level | Title | Decision scope |
|-------|-------|----------------|
| L1 | Analyst | Nothing consequential alone |
| L2 | Associate | Tactical implementation within known constraints |
| L3 | Senior | Architecture within a cell; scope tradeoffs within a sprint |
| L4 | Staff | Interface contracts; cross-team technical standards |
| L5 | Principal / Chief Engineer | Company-wide quality floor |

**Management Track**

| Level | Title | Decision scope |
|-------|-------|----------------|
| M1 | Manager (EM) | 1–2 cells; sprint scope within PM backlog |
| M2 | Director | Org design; EM performance |
| M3 | VP / Domain C-Suite | Full domain strategy; budget within domain |
| M4 | C-Suite (CEO/CTO) | Scope >20%; budget >15%; company-level architecture |
| M5 | Founder / Owner | Capital; company direction; key C-suite hires |

**Why this matters for squads:** You compose teams at the right level for the work. A landing page does not need an M4 CEO writing a six-week strategic brief. An MVP does not need CDO instrumentation planning before you have a single user. A Startup activation does, because you are building the organization, not just the product.

The level ladder is the reason the squad system works. It is not arbitrary — it matches the depth of planning to the scope of the work.

---

### Protocol

Protocol is the shared interface contract for the entire system. It lives in `protocol.md` and every agent references it. You do not rewrite it per project. You do not adapt it per squad. It is fixed.

**The Bus message format**

Every inter-agent communication follows this format. No variations.

```
FROM: [Agent name] ([Role])
TO: [Target agent] | ALL
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO | DECISION NEEDED | BLOCKER
MESSAGE:
  [Body]
DECISION BY: [YYYY-MM-DD]  (required for DECISION NEEDED)
ESCALATION: [Role that gets this if no response by deadline]
```

Priority rules:
- `INFO` — Sharing state. No response required.
- `DECISION NEEDED` — Work will be blocked within N days. Must include a specific question with a deadline.
- `BLOCKER` — Work has stopped now. Escalation within 4 hours if unresolved.

A real Bus message from the EM looks like this:

```
FROM: Jordan (EM)
TO: Coordinator
RELEASE: v2026.Q2.1
PRIORITY: BLOCKER
MESSAGE:
  Cell-A is blocked on the auth decision. We agreed to use Supabase Auth but
  the CTO's architecture brief still says "custom JWT." Engineers are holding
  on the auth module. This blocks the dashboard which depends on it.
  Need CTO to confirm Supabase Auth or we push the sprint end date by 3 days.
DECISION BY: 2026-04-18
ESCALATION: CEO
```

**The escalation ladder**

One path. No exceptions. Every agent uses this ladder.

```
Step 1: Direct to the owning agent (24-hour window)
         ↓ no response in 24 hours
Step 2: Coordinator
         ↓ no resolution in 48 hours
Step 3: Relevant C-suite (CEO for strategy, CTO for architecture, CLO for legal)
         ↓ C-suite cannot resolve without Owner input
Step 4: CEO makes the call or routes to Owner
         ↓ CEO explicitly flags it
Step 5: Owner
```

BLOCKER escalation is faster: 4 hours to Step 1, then Coordinator immediately, then CEO within 24 hours.

Escalation is not failure. Sitting on a blocker for 48 hours to "try to resolve it yourself" is failure.

**The requirements file format**

Every domain agent owns one file: `[domain]-requirements.md`. The format is standardized across all domains.

```
# Security Requirements -- analytics-tool v2026.Q2.1
Domain owner: Alex (CISO)
Last updated: 2026-04-15

## Pending
- [ ] Implement rate limiting on auth endpoints | Owner: Cell-A | Due: Sprint 2 | CRITICAL
- [ ] Secrets rotation policy documented | Owner: CTO | Due: Sprint 1

## In Progress
- [ ] JWT validation implementation | Owner: Cell-A | Started: Sprint 1 | Target: Sprint 1

## Blocked
- [ ] SOC 2 Type I prep | Owner: CISO | Blocked by: budget approval from CFO | Since: 2026-04-12

## Done
- [x] Threat model v1 | Owner: CISO | Completed: 2026-04-10

## Notes
Supabase Auth satisfies JWT non-negotiable if configured with RS256.
Cookie httpOnly flag is required — JS-accessible tokens are not acceptable.
```

Items are checked `[x]` only when work is demonstrably done: tested, reviewed, merged, validated. Not "almost done." New requirements discovered mid-sprint are added immediately.

---

### Squads

Four squad types. Same protocol. Different activation sequences and role rosters.

| Squad | Size | Roles | Use case |
|-------|------|-------|----------|
| website | Small–Medium | 5–7 | Marketing site, landing page, docs site |
| feature | Small | 3–5 | Adding a feature to an existing product |
| mvp | Medium | 8–12 | Shipping an MVP to validate a hypothesis |
| startup | Large | 16 | Full company or product bootstrap |

**How to choose:**

```
Do you have an existing product?
  ├── No → Do you need the full org?
  │         ├── Yes → startup
  │         └── No → mvp
  └── Yes → Is it a website?
             ├── Yes → website
             └── No → feature
```

**MVP activation sequence** — the most instructive example because it compresses all four phases into a tight window:

```
Phase 0 — Brief:
  1. Coordinator  → Brief received, project.md created, squad confirmed
  2. CEO          → Strategic framing: hypothesis, target user, success definition, MVP boundary

Phase 1 — Compressed Discovery:
  3. CLO          → Regulatory blockers only (abbreviated: blockers only)
  4. CISO         → Security non-negotiables: auth, data handling, keys (abbreviated: non-negotiables only)
  5. CFO          → Runway check: is budget sufficient? One scenario only (abbreviated: single scenario)
  6. CMO          → Positioning statement and launch channel (optional; useful if public launch)

Phase 2 — Architecture:
  7. CTO          → Architecture brief (< 1 page), tech stack, make/buy matrix
  8. Mario        → Irreversible decision review (abbreviated)
  9. PM           → User story map (MVP scope only; ruthless prioritization)
  10. Staff Eng   → Interface contracts for MVP scope
  11. EM          → Cell composition, sprint plan

Phase 3 — Execution:
  12. Liaison     → Active until ship; liaison-log.md updated on significant events

Phase 4 — Completion:
  PM acceptance: does it test the hypothesis?
  Coordinator: retro, history.md entry, decision log
```

The critical gates in the MVP sequence:
- CLO + CISO must deliver before CTO starts architecture. No exceptions.
- Mario reviews CTO's irreversible decisions before Sprint 1. Architecture that bypasses Mario review is unreviewed architecture.
- Sprint 0 gate must pass before engineering starts. Even in the compressed MVP version, this is a hard stop.

---

## 3. Creating a Team: Step by Step

Scenario: you want to build an MVP for a SaaS analytics tool.

### Step 1: Bootstrap the project

```bash
node scripts/bootstrap.js analytics-tool --squad mvp
```

This creates:

```
projects/analytics-tool/
  project.md                     — Owner brief template + project record
  history.md                     — Decision log and release history
  liaison-log.md                 — Sprint health log (Liaison's working doc)
  general-requirements.md        — Coordinator's aggregate view of all domains
  legal-requirements.md          — CLO's domain file
  security-requirements.md       — CISO's domain file
  finance-requirements.md        — CFO's domain file
  marketing-requirements.md      — CMO's domain file
  product-requirements.md        — PM's domain file
  product-engineering-requirements.md   — CTO's domain file
  release-architecture-requirements.md  — Staff Engineer + Mario shared file
  delivery-requirements.md       — EM's domain file
  SQUAD.md                       — MVP activation sequence (copied from squads/mvp.md)
  protocol.md                    — Shared interface contract
  AGENTS.md                      — Full agent manifest
```

The bootstrap script also injects placeholders: `PROJECT_NAME` becomes `analytics-tool`, `RELEASE` becomes the current quarter's version ID (e.g. `v2026.Q2.1`), `DATE` becomes today.

### Step 2: Open `project.md` and write the Owner brief

The Owner brief is the input to the entire system. Write it before activating any agent. It becomes the context every agent reads.

A real Owner brief for the analytics tool looks like this:

```markdown
# Project: analytics-tool
Release: v2026.Q2.1
Date: 2026-04-14
Squad: mvp

## Owner Brief

Product in one sentence:
A SaaS analytics tool that lets indie developers track user behavior in their
web apps without sending data to third-party services.

Target user:
Solo developers and small teams (1–5 people) building web products, who want
basic event tracking and dashboards but refuse to pay $500/month for Mixpanel
or send their users' data to Google.

What success looks like at 90 days:
50 paying customers. Retention above 60% at week 4. At least one customer
publicly saying "I switched from [X] to this."

What success looks like at 12 months:
1,000 paying customers. API-first architecture that lets developers self-host.
Pricing that competes with open-source alternatives on ease, not just cost.

Non-negotiables:
- User data never leaves the customer's infrastructure
- Monthly pricing under $50 for the solo-dev tier
- No vendor lock-in on the ingestion layer

Riskiest assumption:
Developers will pay for convenience over just running open-source Plausible
themselves.

MVP boundary (what we are validating):
Auth + event ingestion + one dashboard screen with 5 standard charts.
NOT: custom charts, team seats, API access, mobile SDKs.
```

### Step 3: Activate the Coordinator

You paste the Coordinator role prompt (`roles/coordinator.md`) into a new conversation, followed by the project context. The Coordinator's first task is to receive the Owner brief and confirm the squad roster.

What the Coordinator produces:

```
v2026.Q2.1 — Brief received.

Squad: MVP (8–12 roles). Roster confirmed:
Required: Coordinator, CEO, CLO, CISO, CFO, CTO, Mario, PM, Staff Engineer, EM, Liaison
Optional: CMO (activate if public launch is planned for MVP)

Five discovery questions answered:
1. Product: privacy-first web analytics SaaS for indie developers
2. User: solo dev or small team; wants Mixpanel-level features without the price or data exposure
3. Success (90d): 50 paying customers, 60%+ week-4 retention
4. Non-negotiables: data sovereignty, sub-$50 pricing, no lock-in on ingestion
5. Riskiest assumption: willingness to pay over self-hosting open-source

Open items before Phase 1:
- CLO: need to confirm jurisdiction (US-only at launch? EU users at launch requires GDPR posture)
- CFO: runway check pending; need current budget figure from Owner

Bus message sent to CEO to initiate Phase 1.
```

The Coordinator does not move to Phase 1 until all five discovery questions are answerable. Max four ping-pong rounds. After that, they synthesize what they have and flag what is still open.

### Step 4: Activate CEO

The CEO receives the Coordinator's brief and produces the strategic framing. This is the document every other agent reads before producing their own output.

```
PROJECT BRIEF: analytics-tool
Date: 2026-04-14
Release target: v2026.Q2.1

Market truth:
Developers are increasingly unwilling to route sensitive user behavioral data
through third-party analytics vendors. GDPR, CCPA, and user trust concerns
have created a gap between what Mixpanel/Amplitude offer and what privacy-
conscious developers can actually deploy.

Target customer:
A solo developer building a SaaS tool with 100–1,000 users. They have tried
Google Analytics and found it inadequate. They are aware of Plausible and
Fathom but balk at the hosting complexity of self-managed options. They would
pay $20–40/month for something that just works and keeps data on their infra.

What winning looks like (18 months):
1,000 paying customers. Net revenue retention above 110%. A developer community
that recommends this tool in "what analytics do you use?" threads.

Non-negotiables:
- Data sovereignty is non-negotiable. Any architecture that routes event data
  through our servers is disqualifying.
- Price point must be accessible to solo developers. Premium positioning fails
  this market.

What we are NOT building in the MVP:
- Custom dashboards (deferred to v2026.Q3)
- Team seats and RBAC (deferred to v2026.Q3)
- Mobile SDKs (deferred to v2026.Q4)
- API access for external consumers (deferred to post-validation)

Decision authority matrix:
- Technical architecture: CTO (final call after Mario review)
- Legal/compliance: CLO (gates CTO)
- Scope changes: PM + Coordinator; escalate to CEO if >20% shift
- Budget changes: CFO; escalate to CEO if >15% overrun
- Launch decision: CEO
```

### Step 5: Run the compressed discovery (CLO, CISO, CFO)

In MVP mode, these three run abbreviated versions — their job is to surface blockers, not produce full analysis. They gate the CTO.

**CLO (2-hour abbreviated version):**
- What regulations apply to event data collection? (GDPR if EU users, CCPA if California users)
- What must be true before the first user signs up? (Privacy policy, terms of service, data processing agreement template)
- Any show-stoppers for the MVP boundary? (None identified, given data-sovereignty architecture)

CLO output logged to `legal-requirements.md`. Key result: no regulatory blockers for US-only MVP launch. GDPR requirements documented as Sprint 2 gate if EU launch is planned.

**CISO (2-hour abbreviated version):**
- Auth non-negotiables: JWT with RS256, httpOnly cookies, no client-side token storage
- Data handling: event payloads must be validated and sanitized server-side before write
- Keys: no API keys in client-side code; server-side ingestion endpoint only
- Vendor risk: Supabase Auth is acceptable if RS256 configured; no Firebase Auth (Google data exposure)

CISO output logged to `security-requirements.md`. Key result: Supabase Auth approved with configuration constraints. This is what unlocks CTO architecture.

**CFO (1-hour abbreviated version):**
- Current runway: 8 months at current burn
- MVP budget: 3-week build at current team cost = $X
- Verdict: budget sufficient; MVP timeline does not threaten runway
- Flag: if MVP requires external infrastructure, infrastructure cost must be projected before Sprint 1

CFO output logged to `finance-requirements.md`. Key result: budget cleared. No changes to plan.

All three delivered. CTO is now unblocked.

### Step 6: Architecture phase (CTO → Mario → PM → Staff Engineer → EM)

The order here matters because each role's output is the input to the next.

**CTO produces the architecture brief (one page max):**

```
ARCHITECTURE BRIEF: analytics-tool MVP
Date: 2026-04-15
Release: v2026.Q2.1
Author: [CTO name]
Reviewed by: Mario (Chief Engineer), [Staff Engineer name]

System components:
- ingestion-service: receives events via POST /track; validates; writes to customer DB
- auth-service: Supabase Auth (RS256); issues JWTs for dashboard access
- dashboard-api: reads event aggregates; serves chart data to frontend
- dashboard-ui: Next.js frontend; chart rendering; auth flow

Data flow:
Customer app → POST /track (server-to-server) → ingestion-service → customer's Postgres instance
User browser → dashboard-ui → dashboard-api → customer's Postgres instance

External integrations:
- Supabase Auth (blocking: auth gates all dashboard access)
- Customer-provisioned Postgres (blocking: no ingestion without DB connection string)

Security posture:
- RS256 JWTs via Supabase Auth; httpOnly cookies; no client-side token storage
- Event payloads validated server-side (schema validation on ingestion)
- No event data transits our infrastructure; customer DB is the write target

Scalability assumptions:
- MVP handles up to 1M events/day per customer on standard Postgres
- At 10x: ingestion-service becomes the bottleneck; sharding or queue needed
- Revisit at 100 customers with high-volume usage

Irreversible decisions in this build:
1. Data model: events stored as JSON blobs in Postgres (not time-series DB)
   → switching to TimescaleDB post-launch requires migration
2. Auth: Supabase Auth (switching auth providers post-launch affects all sessions)
3. Ingestion API contract: POST /track schema (existing customers break if changed)

Make/buy matrix:
| Component | Decision | Vendor | Rationale | Onboarding |
|---|---|---|---|---|
| Auth | Buy | Supabase Auth | Approved by CISO; saves 2 weeks | 2 days |
| DB hosting | Partner | Customer-provisioned | Data sovereignty requirement | 0 |
| Frontend | Build | Next.js | No vendor needed | N/A |
| Ingestion | Build | Custom | Core IP; simple POST handler | N/A |
```

**Mario reviews the three irreversible decisions.** His job is not to approve architecture direction — that is the CTO's call. His job is to confirm that irreversible decisions have been thought through and won't create cross-project problems. Mario's dissent is always logged to `history.md`.

In this case, Mario approves all three with one note: the JSON blob approach for events should be documented as a known tradeoff (query flexibility vs. write speed) with a defined threshold for when to revisit.

**PM produces the user story map (MVP scope only):**

```
USER STORY MAP: analytics-tool MVP
Release: v2026.Q2.1

The user:
A solo developer who just deployed a web app. They have 50 users and want to
know which features those users actually use, without sending their users'
behavioral data to Google Analytics.

The job they are trying to do:
Understand which parts of their app are actually used so they can prioritize
the next sprint.

What they do today:
Add console.log statements, look at server logs, or pay for Mixpanel and feel
guilty about it.

Why it is painful:
Server logs don't tell you about UI behavior. Mixpanel requires routing data
through Mixpanel's servers. Self-hosting Plausible takes a weekend.

The moment of value:
The first time they see a dashboard with real events from their production app,
10 minutes after installing the tracking snippet.

Success signal:
The developer installs the snippet on day 1. They check the dashboard at least
3 times in the first week without being prompted.

MVP scope:
In:
  - [ ] Auth (signup, login, session management)
  - [ ] Tracking snippet (JS, <10 lines, copy-paste)
  - [ ] POST /track endpoint (event ingestion)
  - [ ] Dashboard screen with 5 charts (pageviews, unique users, top pages,
        referrers, event counts by name)
  - [ ] Customer DB provisioning flow (connect your own Postgres)

Out (explicit):
  - Custom chart builder — no one in the MVP cohort asked for this
  - Team seats — solo developer tier first
  - Mobile SDKs — web only for now
  - Retention cohort analysis — Sprint 2 if hypothesis validated
```

**Staff Engineer defines interface contracts** for the three service boundaries: ingestion API contract (`POST /track` schema), auth API contract (JWT structure, cookie configuration), and dashboard API contract (chart endpoint response shapes). These become the tickets' acceptance criteria.

**EM maps the critical path and composes cells:**

```
CELL MAP: v2026.Q2.1

Cell-A (cell-2): [Senior Backend] + [Mid Backend]
  Owns: ingestion-service + auth integration
  Sprint 1 goal: POST /track live, Supabase Auth integrated, DB provisioning flow working

Cell-B (cell-2): [Senior Fullstack] + [Mid Frontend]
  Owns: dashboard-api + dashboard-ui
  Sprint 1 goal: Dashboard screen with 5 charts reading from customer DB

Critical path: auth → ingestion → dashboard-api → dashboard-ui
Slack: 2 days at the dashboard-ui end
External dependency: Supabase Auth onboarding (2 days; started Day 1)
```

### Step 7: Sprint 0 gate

The Coordinator runs the Sprint 0 checklist. Engineering does not start until all boxes are checked. This is a hard stop, not a suggestion.

```
SPRINT 0 GATE — analytics-tool v2026.Q2.1

[ x ] Owner brief written and CEO-approved
[ x ] CLO: no regulatory blockers for US MVP launch
[ x ] CISO: security non-negotiables documented and in security-requirements.md
[ x ] CFO: budget validated, runway sufficient
[ ]   CMO: positioning statement (optional for MVP; skipped)
[ x ] CTO: architecture brief written (1 page)
[ x ] Mario: irreversible decisions reviewed and logged
[ x ] PM: user story map complete, MVP scope defined
[ x ] Staff Engineer: interface contracts drafted for 3 service boundaries
[ x ] EM: cell composition confirmed, critical path mapped
[ x ] All domain requirements files have at least one entry
[ x ] All activated agents have received Bus messages with release version

Gate status: PASSED — Sprint 1 authorized to begin.
```

### Step 8: Execution (Liaison goes live)

The Liaison activates at Sprint 1 start and does not deactivate until the release ships.

The task-driven rhythm (event-driven, not time-driven):

**At sprint start / after each significant event:** Liaison reads EM's latest squad status update. Checks for new Bus messages. Updates `liaison-log.md` with current sprint state.

**When something surfaces from the team:** Route through the filter:
- Blocker → EM immediately; if unresolved in 4 hours → Coordinator as BLOCKER
- Decision needed from leadership → 3-sentence decision request → Coordinator
- Status → log it; surface at sprint review
- Team concern → EM privately; not on the Bus; not to leadership

**On significant sprint events (milestone, blocker resolved, sprint goal reached):** One Bus message to Coordinator with sprint health (GREEN / YELLOW / RED) and a one-paragraph explanation. Nothing more unless there is a BLOCKER.

A real sprint health message:

```
FROM: Sam (Liaison)
TO: Coordinator
RELEASE: v2026.Q2.1
PRIORITY: INFO
MESSAGE:
  Sprint 1 health — 2026-04-17: YELLOW
  Cell-A completed Supabase Auth integration and the DB provisioning flow.
  Cell-B is 60% through dashboard-api. Blocker: the JSON event schema from
  ingestion doesn't match what dashboard-api expects for the "top pages" chart.
  Staff Engineer is resolving the contract mismatch today; EM expects 4-hour
  delay max, not a sprint blocker yet. If not resolved by EOD this will be RED.
  Open decisions needing leadership input: none.
```

### Step 9: Document operations with the CLI

The `doc.js` script handles all document operations on project files. Use it instead of editing files directly — it handles section finding, formatting, and prevents corruption.

**Log a decision:**

```bash
node scripts/doc.js decision projects/analytics-tool/history.md \
  --decision "Use Supabase instead of raw Postgres for auth" \
  --context "Saves 2 weeks of auth setup; CISO approved RS256 configuration" \
  --made-by CTO \
  --reversible no
```

**Add a blocked item to a requirements file:**

```bash
node scripts/doc.js add-item projects/analytics-tool/security-requirements.md \
  --section Blocked \
  --item "Rate limiting on POST /track — waiting on infra decision from CTO" \
  --status blocked
```

**Append a sprint note:**

```bash
node scripts/doc.js append projects/analytics-tool/project.md \
  --section "## Sprint 1" \
  --content "Day 3: Auth complete. Dashboard-api 80% complete. Contract mismatch resolved by Staff Engineer. On track."
```

**Read a section to verify state:**

```bash
node scripts/doc.js read projects/analytics-tool/security-requirements.md \
  --section Blocked
```

**List all sections in a file:**

```bash
node scripts/doc.js list projects/analytics-tool/general-requirements.md
```

### Step 10: Completion

When the sprint goal is met:

1. PM runs acceptance against the user story map: does the MVP test the hypothesis? Are all in-scope items done (not almost done)?
2. Coordinator runs retro synthesis: what worked, what slowed, what to change.
3. All agents write their consequential decisions to `history.md` before the release closes. If a decision was not written, it did not happen.
4. Coordinator writes the release-close entry:

```markdown
## [v2026.Q2.1] — analytics-tool MVP

Date: 2026-05-02
Status: Shipped

What shipped:
- Auth (signup, login, Supabase Auth with RS256)
- POST /track ingestion endpoint
- Customer Postgres provisioning flow
- Dashboard with 5 standard charts

What did not ship (and why):
- CMO positioning pass — deferred; MVP cohort is direct outreach, not public launch

Decisions made this increment:
- Supabase Auth over custom JWT (CTO; irreversible; see decision log)
- JSON blob event storage over time-series DB (CTO; known tradeoff; revisit at 100 customers)
- US-only launch; GDPR prep deferred to v2026.Q3 (CLO + CEO)

Immediate next actions:
- Recruit 10 beta users within 2 weeks
- CDO activation for instrumentation (needed once first users are in)
- CRO activation for pricing validation

Retrospective:
The compressed discovery worked. CLO + CISO in 4 hours total was sufficient
for the MVP boundary. The JSON event schema contract mismatch was the only
real blocker and it was a 4-hour fix, not a sprint threat. Sprint 0 gate
caught the Supabase Auth configuration requirement before Cell-A started —
that would have been a 2-day rework if caught mid-sprint.
```

---

## 4. Making It Real: What Each Agent Actually Receives

This is the most important section. When you "activate" an agent, you are starting a new conversation (or sub-agent context) and pasting in a specific combination of files. Here is exactly what that looks like.

**Template for activating any agent:**

```
[Paste the full content of roles/[role].md here]

---

Context:
[Paste project.md]
[Paste history.md]
[Paste general-requirements.md]
[Paste protocol.md]
[Paste [domain]-requirements.md — the agent's own file]

---

You are now activated as [Role Name] for the [project name] project.
Release: v[YEAR].Q[QUARTER].[INCREMENT]
Your first task is: [specific task from SQUAD.md activation sequence]
```

For the PM specifically, activating them at the architecture phase looks like this:

```
[Full content of roles/pm.md]

---

Context:
[Full content of projects/analytics-tool/project.md]
[Full content of projects/analytics-tool/history.md]
[Full content of projects/analytics-tool/general-requirements.md]
[Full content of projects/analytics-tool/protocol.md]
[Full content of projects/analytics-tool/product-requirements.md]

Additional context for this activation:
[Full content of the CEO's strategic brief]
[Full content of the CTO's architecture brief]

---

You are now activated as PM for analytics-tool.
Release: v2026.Q2.1
Your first task is: Produce the user story map for the MVP scope.
Focus on ruthless prioritization — we are validating the hypothesis that
developers will pay for privacy-first analytics. The moment of value must
be achievable in one install-to-dashboard session.
```

**What each piece does:**

- **The role file** is the system prompt and persona. It defines who this agent is, what they own, how they think, and what templates they use. Do not paraphrase it. Paste the full content.
- **`project.md`** is the memory. It contains the Owner brief, the CEO strategic frame, and the running record of the project. Every agent reads this to understand what the project is.
- **`history.md`** is the decision record. Agents read it to understand what has already been decided and why. Without it, agents will revisit decided questions.
- **`general-requirements.md`** is the cross-domain status view. It shows the agent where every other domain stands. Useful for spotting conflicts and dependencies.
- **`protocol.md`** is the rules. Bus format, escalation ladder, requirements file format, cell model. Every agent operates by these rules.
- **`[domain]-requirements.md`** is the agent's own domain file. Their starting state. They update it as part of their activation.
- **The squad file** tells you the sequence. Read `SQUAD.md` (copied into the project during bootstrap) to know which agent runs next and what their specific task is.

**Each agent runs in its own conversation.** There is no shared context between agent conversations. The files are the shared memory. When the CTO produces an architecture brief, it is written (via `doc.js` or manually) into `product-engineering-requirements.md` and `project.md`. When the PM activates next, they read those files and have the CTO's output as context. The files are how agents hand off to each other.

This is not a limitation — it is the design. It means the team can run asynchronously, in parallel where the dependency graph allows, and with a clear audit trail of who wrote what and when.

---

## 5. Different Workflows, Same API

The four squad types cover the full range of project scopes. Here is how they differ in practice.

### Website squad (Small–Medium, 5–7 roles)

Skip CEO and all domain specialists unless the site involves user data, PII, or regulated content. Jump straight to PM scope definition, then CTO stack decision, then Staff Engineer component contracts, then EM delivery.

```
Coordinator (brief)
  ↓
PM (scope: page list, user goals, success definition)
  ↓
CTO (tech stack: framework, CMS, hosting, CDN)
  ↓
CMO [optional: positioning, brand voice, copy review]
CISO [if user data/forms: auth requirements]
  ↓
Staff Engineer (component library, routing, CMS schema)
  ↓
EM (cell composition, sprint plan)
  ↓
Liaison (active until launch)
```

Good for: marketing sites, landing pages, documentation sites, portfolios. Not appropriate if the site has auth, payments, or user data — activate CISO and CLO from the full sequence in that case.

### Feature squad (Small, 3–5 roles)

No discovery. No architecture phase. No Sprint 0 gate (lightweight version only). Assumes the product exists, the team exists, and the feature is well-scoped.

```
PM (feature brief: user story, acceptance criteria, success metric, scope boundary)
  ↓
Staff Engineer [if platform touches: interface contract or confirmation no changes needed]
  ↓
EM (sprint plan: task breakdown, cell assignment, estimated duration)
  ↓
Liaison (routes blockers and decisions; updates liaison-log.md)
```

Good for: adding dark mode, building a CSV export, implementing OAuth login, adding a notification system. Not appropriate if the feature requires discovery, security review, or new platform primitives — escalate to MVP or Startup squad.

### Startup squad (Large, 16 roles)

Full activation. All 16 agents in sequence. Sprint 0 gate is mandatory. Nothing gets coded until all 15 Sprint 0 checkboxes are checked.

```
Coordinator (brief)
  ↓
CEO (strategic framing)
  ↓
CLO + CISO + CFO + CMO + CRO + CDO + COO + CHRO
(discovery phase; CLO + CISO gate CTO; COO gates EM)
  ↓
[Sprint 0 Gate — hard stop]
  ↓
CTO (architecture brief, 1-page max)
  ↓
Mario (irreversible decision review)
  ↓
PM (user story map) + Staff Engineer (interface contracts)
  ↓
EM (cell composition, critical path, sprint plan)
  ↓
Liaison (active from Sprint 1 start until ship)
  ↓
Coordinator (retro synthesis, history.md entry)
```

Good for: building a B2B SaaS from scratch, launching a fintech product (CLO + CISO are critical gates), starting an e-commerce company, bootstrapping a developer tool with a full org. The startup squad is the full system. Every other squad is a subset of it.

### Decision tree (again, for reference)

```
Do you have an existing product?
  ├── No → Do you need the full org?
  │         ├── Yes → startup
  │         └── No → mvp
  └── Yes → Is it a website?
             ├── Yes → website
             └── No → feature
```

---

## 6. The CLI Reference

Three scripts. All run from the repo root.

### bootstrap.js

Scaffold a new project from the SDK template.

```bash
node scripts/bootstrap.js <project-name> [--squad <type>] [--output <dir>]
```

Arguments:
- `<project-name>` — Required. Used as directory name and injected as `PROJECT_NAME` in all files.
- `--squad <type>` — Optional. One of: `website`, `mvp`, `feature`, `startup`. Default: `startup`.
- `--output <dir>` — Optional. Output path. Default: `./projects/<project-name>`.

Examples:

```bash
# MVP project in the default location
node scripts/bootstrap.js analytics-tool --squad mvp

# Website project in a custom location
node scripts/bootstrap.js landing-page --squad website --output ./projects/landing

# Feature project
node scripts/bootstrap.js csv-export --squad feature

# Full startup bootstrap
node scripts/bootstrap.js my-saas --squad startup
```

What gets created: all files from `project-template/`, the squad file as `SQUAD.md`, and copies of `protocol.md` and `AGENTS.md`. All `[PROJECT_NAME]`, `[RELEASE]`, and `[DATE]` placeholders are replaced.

---

### squad.js

View squad rosters and activation sequences.

```bash
node scripts/squad.js list
node scripts/squad.js <type>
```

Examples:

```bash
# List all squads with duration and role counts
node scripts/squad.js list

# Show the MVP roster and activation sequence
node scripts/squad.js mvp

# Show the startup roster and activation sequence
node scripts/squad.js startup
```

The output includes required roles, optional roles, and the activation sequence with step numbers. Use this when you want to know which agent to activate next.

---

### doc.js

Document operations on project markdown files. All commands take a file path as the second argument.

```bash
node scripts/doc.js <command> <file> [options]
```

**list** — List all headings in a file.

```bash
node scripts/doc.js list projects/analytics-tool/project.md
node scripts/doc.js list projects/analytics-tool/general-requirements.md
```

**read** — Read a specific section.

```bash
node scripts/doc.js read projects/analytics-tool/security-requirements.md \
  --section "## Blocked"

node scripts/doc.js read projects/analytics-tool/project.md \
  --section "## Sprint 1"
```

**append** — Append content to the end of a section (creates the section if it doesn't exist).

```bash
node scripts/doc.js append projects/analytics-tool/project.md \
  --section "## Sprint 1" \
  --content "Day 3: Auth complete. Dashboard in progress. Contract mismatch resolved."

node scripts/doc.js append projects/analytics-tool/product-requirements.md \
  --section "## Notes" \
  --content "User interview 2026-04-18: top request is CSV export. Deferred to Sprint 2."
```

**rewrite** — Replace the entire content of a section.

```bash
node scripts/doc.js rewrite projects/analytics-tool/general-requirements.md \
  --section "## Active Blockers (cross-domain)" \
  --content "None."
```

**add-item** — Add a checklist item to a section. Status: `pending` (default), `done`, or `blocked`.

```bash
# Add a pending item
node scripts/doc.js add-item projects/analytics-tool/security-requirements.md \
  --section Pending \
  --item "Rate limiting on POST /track | Owner: Cell-A | Due: Sprint 2 | CRITICAL"

# Add a blocked item
node scripts/doc.js add-item projects/analytics-tool/security-requirements.md \
  --section Blocked \
  --item "SOC 2 Type I prep | Owner: CISO | Blocked by: budget approval | Since: 2026-04-12" \
  --status blocked

# Mark an item as done
node scripts/doc.js add-item projects/analytics-tool/legal-requirements.md \
  --section Done \
  --item "Privacy policy drafted | Owner: CLO | Completed: 2026-04-15" \
  --status done
```

**decision** — Append a formatted decision entry. Finds a "Decision History" section in the file, or creates one.

```bash
# Log a reversible decision
node scripts/doc.js decision projects/analytics-tool/history.md \
  --decision "Use Supabase Auth instead of custom JWT implementation" \
  --context "Saves 2 weeks of auth setup; CISO approved RS256 configuration" \
  --made-by CTO \
  --reversible no

# Log an irreversible architectural decision with release ID
node scripts/doc.js decision projects/analytics-tool/history.md \
  --decision "Store events as JSON blobs in Postgres (not time-series DB)" \
  --context "Simpler for MVP; known tradeoff on query performance at scale" \
  --made-by CTO \
  --release v2026.Q2.1 \
  --reversible no

# Log a scope decision
node scripts/doc.js decision projects/analytics-tool/product-requirements.md \
  --decision "Defer custom chart builder to v2026.Q3" \
  --context "No user in MVP cohort asked for it; validates core loop first" \
  --made-by PM \
  --reversible yes
```

---

## 7. The Golden Rules

These are not style guidelines. They are the operating principles that make the system work. Violate them and the team stops being a team.

**1. Owner speaks only to CEO or Coordinator.**
Never directly to execution agents. When the Owner talks to the CTO directly, the CFO does not know what was said, the Coordinator cannot sequence it, and two agents start working against different pictures of the truth.

**2. Every consequential decision gets written to `history.md`.**
If it is not written, it did not happen. A decision that lives in a conversation and is never recorded will be made again, worse, six months later by someone who did not know it had already been decided.

**3. "Almost done" is not a status.**
An item is done (tested, reviewed, merged, validated) or it is not. Sprint plans built on "almost done" items slip. The EM's squad status must name the real state.

**4. Blockers escalate same day.**
Not after two days of "trying to resolve it yourself." The escalation ladder is the system working, not a sign of failure. Agents who sit on a blocker are hiding information from the system.

**5. Sprint 0 gate is real.**
Nothing gets coded until all Sprint 0 boxes are checked. The gate exists because the decisions it forces — legal review, security non-negotiables, interface contracts — are cheaper to make before Sprint 1 than to rework during it.

**6. The cell model is the team model.**
1 Senior + 1 Mid/Senior per Cell-2. 1 Staff + 2 Senior + 1 Mid per Cell-4. 1 EM per 2 cells maximum. A team of 3 is not a cell. An EM managing 3 cells is a bottleneck. These are not flexible.

**7. The requirements files are the source of truth, not conversations.**
When an agent reads a requirements file, they get the current state of that domain. When decisions and requirements live in chat history that another agent cannot access, the system is working with stale information.

**8. Different squad, same protocol.**
Do not rewrite the protocol for a different workflow. Do not invent a new Bus format for the Feature squad because it feels simpler. The consistency of the protocol is what makes agents coherent with each other across projects and squads.

**9. Level determines behavior. Compose teams at the right level for the work.**
A landing page does not need an M4 CEO. An MVP does not need CDO instrumentation planning. The level ladder exists so you can match the depth of the process to the scope of the project.

**10. The Liaison is the only agent that crosses layers.**
Everyone else stays in their lane. The Liaison filters what leadership sees (not everything). The EM manages the sprint (not the Coordinator). The CTO makes architecture calls (not the CEO). When roles start crossing into each other's lanes without a routing protocol, decisions stop being traceable.

---

*Team SDK v2.0. 16 roles. 4 squads. 1 protocol. Copy, compose, ship.*
