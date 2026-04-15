# Continuum Auto-Improvement Loop
**Owner:** CEO + Coordinator
**Loop opened:** 2026-04-08
**Stop condition:** 11 iterations complete
**Output:** Investor-pitch-ready product + SaaS Pro tier designed and scaffolded

> One iteration = one sprint session. Same cadence. Same pod model. Same protocol.
> The loop runs until the counter hits 11, then the Coordinator calls it and the team produces the pitch package.
>
> The loop does not wait for human direction between iterations. Current-status.md is the baton.

---

## Loop Counter

| Iteration | Sprint | Focus | Release | Status |
|---|---|---|---|---|
| 1 | Sprint 2 | Foundation hardening — validate-script + onboarding polish | v3.2.1 | **DONE** |
| 2 | Sprint 3 | Owner CLI completeness — sdk-status, sdk-next, sdk-version, sdk-retro | v3.3.0 | **DONE** |
| 3 | Sprint 4 | GitHub integration MVP — link, sync-issues, release | v3.4.0 | **DONE** |
| 4 | Sprint 5 | Documentation enforcement — blocking at sdk-ship, advisory during sprint | v3.5.0 | **DONE** |
| 5 | Sprint 6 | The Last Picture — session continuity, health checks, auto-manifest | v3.6.0 | **DONE** |
| 6 | Sprint 7 | SaaS scaffold — cloud sync, auth model, API layer | v4.0.0-alpha | **IN PROGRESS** |
| 7 | Sprint 8 | Pro: Team dashboard web app MVP | v4.0.0 | Pending |
| 8 | Sprint 9 | Pro: GitHub automation + compliance audit trail export | v4.1.0 | Pending |
| 9 | Sprint 10 | Pro: Multi-project org view + billing scaffolding | v4.2.0 | Pending |
| 10 | Sprint 11 | Investor pitch assets — demo flow, deck content, traction metrics | PITCH-READY | Pending |
| 11 | Sprint 12 | Launch prep — Product Hunt, Show HN, case study #1 | LAUNCH-READY | Pending |

---

## What Each Iteration Produces

### Iteration 1 — Foundation Hardening
**Missions:**
- validate-script: VS-01 (skeleton + advisory mode) + VS-02 (placeholder detection + error messages)
- onboarding-polish: HIGH-severity CLI findings F1–F9 from self-test triage
- next-activation-handoff: structured handoff block format

**Acceptance:** `sdk-validate .` runs on any project and gives actionable warnings. Day 0 user gets clear next-step guidance from every CLI command.

**Release:** v3.2.1 (patch — hardening only)

---

### Iteration 2 — Owner CLI Completeness
**Missions:**
- sdk-status: human-readable project status from current-status.md
- sdk-next: "what should I do right now?" — highest-priority next action + exact command
- sdk-version: bump/set/print with git tag option
- sdk-retro: prompted retrospective → strategy-log.md

**Acceptance:** Maya (non-engineer founder) opens terminal Monday morning, runs `sdk-status`, and knows exactly where her project is — in plain English, no markdown noise.

**Release:** v3.3.0

---

### Iteration 3 — GitHub Integration MVP
**Missions:**
- sdk-github link: store repo ref in .sdkrc
- sdk-github sync-issues: create GitHub issues from pending requirements items
- sdk-github release: create GitHub release from history.md latest entry
- Auth model: TEAM_SDK_GITHUB_TOKEN (already decided, history.md 2026-04-06)

**Acceptance:** `sdk-github sync-issues` creates labeled, milestoned issues from product-requirements.md. `sdk-github release` creates a release matching history.md.

**Release:** v3.4.0

---

### Iteration 4 — Documentation Enforcement
**Missions:**
- sdk-validate blocking mode: sdk-ship blocks if history.md / current-status.md / project-map.md Section 11 have unfilled placeholders
- Advisory mode refinement: warnings name the specific gap + exact fix command
- Minimum viable documentation threshold spec per file

**Acceptance:** `sdk-ship` with an undocumented release fails with a precise, actionable error. `sdk-validate .` runs clean on a properly documented project.

**Release:** v3.5.0

---

### Iteration 5 — The Last Picture
**Missions:**
- sdk-doc health: warns if current-status.md stale (not updated in last N hours)
- Session resume UX: sdk-status output ends with "To resume, say: [activation phrase]"
- Auto-manifest refresh: sdk-status regenerates context-manifest.json on every call
- Onboarding path: sdk-status + history.md sufficient to onboard a new contributor without Slack

**Acceptance:** Any contributor can open the project directory having never seen it and reach a correct mental model in under 5 minutes using only SDK commands.

**Release:** v3.6.0

---

### Iteration 6 — SaaS Scaffold
**Missions:**
- sdk-cloud link/push/pull: sync local files to cloud (history.md, current-status.md, requirements)
- API layer scaffold: Node.js API, auth (Clerk), PostgreSQL (Supabase)
- .sdkrc cloud config: projectId, orgId, tier
- Free tier gate: CLI fully functional offline — cloud additive only

**Acceptance:** `sdk-cloud push` uploads project files to cloud. `sdk-cloud pull` syncs latest to local. Auth works. API returns project state JSON.

**Release:** v4.0.0-alpha

---

### Iteration 7 — Pro: Team Dashboard
**Missions:**
- Next.js web app: project list, mission kanban, decision timeline, gate status, agent activity feed
- Real-time sync via SDK cloud API
- Pro tier gate: dashboard requires paid subscription
- Design system: minimal, functional, no decoration

**Acceptance:** A team member opens the dashboard URL and sees live project status including active missions, open decisions, and last gate check result.

**Release:** v4.0.0

---

### Iteration 8 — Pro: GitHub Automation + Compliance Export
**Missions:**
- Webhook receiver: GitHub push/PR/release → SDK cloud events
- Auto-sync: PR merged → ticket moved to Done in requirements file
- Compliance export: PDF audit trail (decisions + history.md entries), signed, timestamped
- Export format: PDF + JSON, downloadable from dashboard

**Acceptance:** Opening a PR with a ticket ID in the title automatically updates the SDK ticket status. Compliance PDF exports a readable, timestamped decision log.

**Release:** v4.1.0

---

### Iteration 9 — Pro: Org View + Billing
**Missions:**
- Org umbrella view: all projects in one org visible from one dashboard
- Billing: Stripe integration, Pro ($49/team/mo) + Business ($149/team/mo) tiers
- Seat management: add/remove team members, role assignment
- Usage metering: projects, syncs, exports per billing period

**Acceptance:** An org admin can create a team, invite members, see all projects, and manage subscription — without leaving the dashboard.

**Release:** v4.2.0

---

### Iteration 10 — Investor Pitch Assets
**Missions:**
- Demo project: fully documented, all gates passed, 1 complete Discovery→Execution cycle
- Pitch deck content: problem/solution/traction/market/team/ask — sourced from real data
- Traction metrics: npm downloads, GitHub stars, case study count, design partner count
- One-pager: 1 page, printable, for warm intros

**Acceptance:** Greg (CEO) reviews demo project and confirms it tells the story investors need to see. Pitch deck draft reviewed by CFO for unit economics accuracy.

**Release:** PITCH-READY (no code tag — this is a milestone, not a release)

---

### Iteration 11 — Launch Prep
**Missions:**
- Product Hunt launch brief: title, tagline, gallery assets, maker comment
- Show HN draft: authentic, builder-voice, describes real problems solved
- Case study #1: 1 real team, "this is how we work now" format
- npm publish v4.2.0 with updated README pointing to cloud dashboard

**Acceptance:** Launch assets reviewed. Case study #1 published or committed to. npm v4.2.0 live.

**Release:** LAUNCH-READY → loop complete

---

## Product Maturity Dimensions

Track these across iterations to see the shape of the product evolving:

| Dimension | Iter 1 | Iter 3 | Iter 5 | Iter 7 | Iter 9 | Iter 11 |
|---|---|---|---|---|---|---|
| CLI completeness | 60% | 80% | 95% | 95% | 95% | 100% |
| Owner accessibility (non-eng) | 30% | 50% | 80% | 90% | 95% | 100% |
| GitHub integration | 0% | 70% | 70% | 90% | 100% | 100% |
| Documentation enforcement | 40% | 40% | 90% | 90% | 90% | 100% |
| SaaS layer | 0% | 0% | 0% | 60% | 90% | 100% |
| Investor traction proof | 5% | 15% | 30% | 50% | 80% | 100% |

---

## Sprint Closure Ritual

Every iteration closes with this sequence, in order. No release is marked complete until all steps are done.

1. **sdk-validate** — advisory doc health check. Fix any blockers before tagging.
2. **sdk-health** — staleness + validate + manifest + .sdkrc + ratchet pattern scan. The ratchet scan output (protocol.md Section 24) is appended to `engineering-log.md` under this sprint's entry. RATCHET-CANDIDATE items go to Mario for registry review.
3. **EM retrospective input** — what slowed the team, what process change would help, what tech debt was introduced this sprint.
4. **Coordinator session close** — `current-status.md` canonical block written. Next activation phrase confirmed.
5. **Release tag** — `sdk-ship <project-dir> <release-id>` only after steps 1–4 are complete.

`sdk-health` is not optional and cannot be skipped. A sprint that did not run `sdk-health` did not close. The iteration counter does not increment.

---

## Loop Rules

1. **Iteration counter increments on release.** No release = iteration not complete.
2. **Same cadence.** Each iteration is one sprint session. S/M/L appetite model unchanged.
3. **Coordinator owns session close.** Current-status.md is the baton — it passes the next activation phrase.
4. **Investor track runs parallel from Iteration 6.** CFO and CMO shape pitch assets while engineering continues.
5. **SaaS layer does not break the CLI.** Every change is backward compatible. Cloud is additive.
6. **Stop at 11.** No scope creep into a 12th iteration. If something didn't ship by Iteration 11, it's v5.
7. **sdk-health runs after every sprint.** Non-negotiable. See Sprint Closure Ritual above.

---

*Loop opened by: CEO + Coordinator | 2026-04-08*
