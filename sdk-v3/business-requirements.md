# Business Requirements -- sdk-v3
**Owners:** CFO · CMO · CRO · CDO · COO · CHRO
**Last updated:** 2026-04-06
**Release:** v2026.Q2.1

> Cross-domain business requirements. Each section is owned by the named role. The Coordinator aggregates status in general-requirements.md.

---

## Finance (CFO)

### Pending
- [ ] Confirm zero-cash-cost model: SDK is MIT open source. Only costs are owner's time and npm registry (free for open source). Validate no hidden costs in GitHub API, npm provenance, or CI/CD.
- [ ] Define "investment thesis" for bootstrapped build: what is the owner's time budget per sprint? How many sprints before v3 ships?

### In Progress

### Done
- [x] Budget constraint confirmed: bootstrapped, no external spend. Any external spend requires CEO sign-off. (history.md 2026-04-06)
- [x] Revenue model: none in v3. Open source MIT. Distribution via npm. Monetization not in scope this cycle.

### Blocked

---

## Marketing (CMO)

### Pending
- [ ] Competitive landscape: who else is in "AI team operating system" space? (Linear, Notion, GitHub Projects, Cursor, Devin, Codex CLI) — what is our positioning relative to each?
- [ ] Category definition: are we a "developer tool," a "team OS," or something new? The category determines where people look for us and what they compare us to.
- [ ] Launch channel strategy: GitHub (stars, README), npm page, developer Twitter/X, Hacker News Show HN, Substack/blog, developer communities (Indie Hackers, Buildspace alumni)
- [ ] The case study play: 10 "this is how we work now" stories is the 18-month win condition. What does the MVP version of this story look like? Who tells it? Where?
- [ ] Messaging test: "company-sdk gives you a company" (current README tagline) — validate this lands with Maya (3-8 person technical team) vs. sounds like enterprise marketing

### In Progress

### Done
- [x] 18-month win condition defined: 10 public "this is how we work now" stories with shipped increments. (strategy-log.md 2026-04-06)
- [x] Anti-positioning confirmed: NOT a SaaS, NOT replacing GitHub/Linear, NOT an enterprise product. (history.md 2026-04-06)

### Blocked

---

## Revenue (CRO)

### Pending
- [ ] Post-v3 monetization options to evaluate (not in scope now, but should not be architecturally foreclosed): hosted version, enterprise support, premium squads, SDK-as-a-service. Log for v4 Betting Table.

### In Progress

### Done
- [x] Revenue model for v3: none. Open source. Distribution compounds through community adoption, not sales. (history.md 2026-04-06)

### Blocked

---

## Data & Instrumentation (CDO)

### Pending
- [ ] GitHub stars / npm downloads as leading indicator: define baseline and growth target at 3/6/12 months
- [ ] "This is how we work now" story count: define how to track (GitHub discussions? blog mentions? direct outreach?)
- [ ] `sdk-status` usage as proxy for catalysis: if owners are running sdk-status, they're engaging with the system. Define how to measure without telemetry (opt-in GitHub Discussions ping? Survey?)
- [ ] No telemetry decision: confirm SDK ships with zero data collection. If we ever add optional telemetry, it must be explicit opt-in with a clear privacy statement.

### In Progress

### Done
- [x] No PII confirmed. No remote data collection. SDK operates entirely on local filesystem + GitHub API (user-authenticated, user-controlled). (discovery-requirements.md 2026-04-06)

### Blocked

---

## Operations (COO)

### Pending
- [ ] npm publish workflow: automated via GitHub Actions + npm provenance attestation. Define the publish trigger (git tag? manual workflow dispatch?)
- [ ] Issue triage model: GitHub Issues is the support channel. Define response SLA for bug reports vs. feature requests.
- [ ] `sdk-update` v3 compatibility: existing projects on v2 must be upgradeable. Define migration path for settings.json schema changes.
- [ ] CHANGELOG.md: automated from history.md? Or manually maintained? Decide before first public release.

### In Progress

### Done
- [x] Distribution channel confirmed: npm (`npm install -g company-sdk`). Package name: `company-sdk`. (package.json)
- [x] Repository: GitHub (matiasbargas/company-sdk). Issues, PRs, and releases managed there.

### Blocked

---

## People (CHRO)

### Pending
- [ ] Contribution model: when does the SDK accept external contributions? What is the PR review process? Is there a contributor guide?
- [ ] Maintainer definition: who has merge rights? Who responds to issues? Define this before the first external contributor opens a PR.

### In Progress

### Done
- [x] Team composition for v3: owner + AI agents. No human hiring this cycle. Agents operate as Coordinator, PM, CTO, CLO, CISO within the project. (history.md 2026-04-06)

### Blocked
