# SaaS Architecture — company-sdk Pro
**Owner:** CTO (Tariq Bishkek)
**Status:** Design — Iteration 6 target for scaffold, Iteration 7 for dashboard MVP
**Last updated:** 2026-04-08

> Core constraint: The free CLI must work 100% offline. Cloud is additive. No feature of the free product is locked behind cloud. The SaaS layer adds team collaboration, sync, and compliance tools — it does not gate what solo users already have.

---

## Principles

1. **CLI-first.** Every Pro feature has a CLI equivalent or a CLI trigger. The dashboard is a view, not the source of truth.
2. **Files are the source of truth.** history.md, current-status.md, and requirements files are canonical. The cloud stores synced copies, not the authoritative versions.
3. **No new runtime deps in the CLI.** Cloud features live in `sdk-cloud` commands. The base CLI stays dependency-free.
4. **Backward compatible.** A project with no `.sdkrc` cloud config works identically to today.

---

## Tier Model

| Tier | Price | Team size | Key features |
|---|---|---|---|
| **Free** | $0 | 1 | Full CLI, local files, all squads |
| **Pro** | $49/team/mo | Up to 5 | Dashboard, cloud sync, GitHub automation, compliance export |
| **Business** | $149/team/mo | Unlimited | Everything in Pro + org view, analytics, priority support |
| **Enterprise** | Custom | Unlimited | SSO/SCIM, private deployment, custom agents, SLA, audit API |

---

## Cloud Sync Model

### Sync unit: whole project snapshot
Not individual files — the whole consistent project state at a logical checkpoint (after a gate clears, after a release seals, after `sdk-doc decision` writes to `history.md`). This avoids partial-sync corruption and maps cleanly to the existing lifecycle events.

`sdk-cloud push` reads `.sdkrc` for the project identity, computes a content hash of all tracked files, bundles them as a JSON payload, and POSTs to `/api/v1/projects/:projectId/snapshots`. The server stores the snapshot with a `snapshot_id` and `created_at`. No binary files. No `team/` role files — those are SDK source, not project data.

`sdk-cloud pull` fetches `/api/v1/projects/:projectId/snapshots/latest`, and writes only files the local directory is missing or where the server version is newer. Conflict resolution is last-write-wins with a local `.sdk-conflicts/` backup of anything overwritten — no merge logic, no CRDT. The CLI outputs a diff summary for inspection.

### What syncs
- `idea.md`, `history.md`, `current-status.md`, `project-map.md`
- All `*-requirements.md` files
- All `*-log.md` files
- `context-manifest.json`, `team.md`, `project.md`

### What stays local only
- `team/` roles — SDK source, not per-project state
- `.claude/` directory — agent configs, settings, machine-specific
- `.sdkrc` — SDK path is machine-specific; token is secret
- Source code — never sent to the SDK cloud

### Commands
```bash
sdk-cloud login                        # device-code auth → ~/.sdk-credentials
sdk-cloud logout                       # revoke token
sdk-cloud link <project-dir> --org     # associate project with org
sdk-cloud push <project-dir>           # snapshot current state → cloud
sdk-cloud pull <project-dir>           # fetch latest snapshot → local
sdk-cloud status <project-dir>         # show local vs cloud diff (no write)
sdk-cloud projects list                # list all projects in org
```

### .sdkrc cloud config fields
```json
{
  "sdkPath": "../",
  "type": "product",
  "cloud": {
    "projectId": "proj_abc123",
    "orgId": "org_xyz789",
    "tier": "pro",
    "lastPush": "2026-04-08T10:00:00Z"
  }
}
```

---

## API Layer

**Stack:** Next.js API Routes on Vercel — same deployment as dashboard. No separate API server.
**Rationale:** Vercel handles Next.js app + API routes + GitHub webhook receiver in one deployment. Zero extra infra. Node.js throughout, no context switch.

### Auth
**Recommendation: Clerk**
- Next.js SDK is 3 lines to add protected routes and session middleware
- Org/team model maps directly to our multi-team structure (one org = one paying team)
- Handles invites, SSO (Enterprise tier), SCIM
- Device-code flow for CLI: `sdk-cloud login` opens browser → user approves → CLI polls for JWT → stores at `~/.sdk-credentials` (chmod 600). No new runtime deps — `https` is built-in Node.
- Cost: free <10K MAU, ~$25/mo at scale

### Endpoints

```
POST   /api/v1/auth/device-status            # poll for CLI device-code approval
GET    /api/v1/orgs/:orgId/projects          # project list view
POST   /api/v1/projects                      # create project (sdk-cloud link)
GET    /api/v1/projects/:id/snapshots        # snapshot history (diffable)
GET    /api/v1/projects/:id/snapshots/latest # latest snapshot for pull
POST   /api/v1/projects/:id/snapshots        # push snapshot
GET    /api/v1/projects/:id/history          # decisions parsed from history.md
GET    /api/v1/projects/:id/gates            # gate status parsed from discovery-requirements.md
GET    /api/v1/projects/:id/status           # current-status.md parsed fields
GET    /api/v1/orgs/:orgId/members           # team member list
POST   /api/v1/projects/:id/export/compliance # generate compliance PDF
POST   /api/v1/webhooks/github               # GitHub event receiver (HMAC-validated)
GET    /api/v1/orgs/:orgId/dashboard         # aggregate org view (Business tier)
```

### Database: PostgreSQL via Supabase
**Rationale:** Supabase gives Postgres + realtime + auth + storage in one, bootstrapper-friendly pricing, direct SQL access when needed, Row Level Security for multi-tenant data isolation.

**Core schema:**

```sql
-- Orgs and teams
orgs        (id, name, tier, stripe_customer_id, created_at)
members     (id, org_id, user_id, role, created_at)

-- Projects
projects    (id, org_id, name, type, last_sync_at, created_at)

-- Synced files (blob storage with metadata)
project_files (id, project_id, path, content, synced_at, version)

-- Structured history entries (parsed from history.md on push)
decisions   (id, project_id, decision, context, made_by, reversible, created_at)
history_entries (id, project_id, release_id, what_shipped, retrospective, created_at)

-- Gate results
gate_checks  (id, project_id, gate, status, cleared_by, checked_at)

-- GitHub integration
github_repos (id, project_id, repo_full_name, webhook_secret, linked_at)
github_events (id, project_id, event_type, payload, processed_at)
```

---

## Dashboard (Pro Web App)

**Stack:** Next.js (App Router), deployed on Vercel.
**Rationale:** Fastest to ship, SDK-native (Clerk integrates trivially), Vercel deploy is zero-config.

### 5 views that justify the subscription

1. **Project Timeline** — All snapshots for a project plotted chronologically, diffable. Click any snapshot to see which files changed. The free CLI has no history visibility across sessions; this is the primary hook.

2. **Decision Log** — All entries from `history.md` across every project in the org, filterable by role, date range, reversibility, and gate. The compliance audit view. Solves the "what did we decide and why" problem that kills institutional memory.

3. **Gate Dashboard** — Live CLO/CISO/Mario gate status across all active projects. Red/yellow/green. Links to the raw markdown section blocking each gate. Engineering managers pay for this view alone.

4. **Team Activity Feed** — Which agent roles produced output, on which projects, in what sequence. Surfaces bottlenecks: "PM has been waiting 4 days for CTO input on project X." Cross-project visibility the CLI cannot provide.

5. **GitHub Integration Panel** — Which PRs link to which SDK decisions, which commits closed which gate. The bridge between the AI team OS and the actual code repository. (Business tier + GitHub integration required.)

### Design system
- Minimal, functional, no decoration
- Monospace for all project data (matches CLI aesthetic)
- Color: green/red/yellow for gate states only
- Mobile: read-only views are responsive; write flows are desktop-first

---

## GitHub Integration Automation

### Auth
`TEAM_SDK_GITHUB_TOKEN` — Personal Access Token, already decided (history.md 2026-04-06). Stored in `.sdkrc` (local, never synced to cloud). Classic PAT with `repo` scope required.

### Webhook receiver (`POST /api/v1/webhooks/github`)
Registered via `sdk-github link` using GitHub's Webhooks API. `X-Hub-Signature-256` validated using `crypto.createHmac` (Node built-in, no dep). Raw payload stored to `github_events` immediately, processed asynchronously via Vercel background function. No queue service required at MVP.

**Offline-first guarantee:** No event ever auto-writes to local project files. Integration is read/link-only at MVP — dashboard reflects GitHub state, but `sdk-cloud pull` never overwrites local files based on GitHub events.

**Events handled:**

| GitHub event | Trigger condition | SDK action |
|---|---|---|
| `pull_request.opened` | PR title contains `[sdk:decision-id]` | Link PR to decision record in dashboard |
| `pull_request.merged` | PR linked to gate decision | Update `gate_status` record, surface in Gate Dashboard |
| `push` to main | Commit message contains `closes gate:mario` | Flag for Mario gate re-check in Gate Dashboard |
| `issues.opened` | Issue labeled `sdk-blocker` | Create blocker entry in Team Activity Feed |
| `check_run.completed` | CI failure on SDK-linked PR | Surface in dashboard alongside linked decision |

### CLI commands
```bash
sdk-github link <project-dir>              # link to GitHub repo, register webhook
sdk-github sync-issues <project-dir>       # create issues from pending requirements
sdk-github release <project-dir>           # create GitHub release from history.md
sdk-github status <project-dir>            # show sync state between SDK and GitHub
```

---

## Compliance Export (Pro)

**Format:** PDF (primary) + JSON (for API consumers)

**Content:**
1. Project metadata (name, type, squad, release history)
2. Full decision log (all entries from history.md, structured)
3. Gate check history (CLO/CISO/Mario gates: who cleared, when)
4. Agent activity log (which agents were activated, in what order)
5. Signature block (owner name, date range, SDK version)

**Generation:** Server-side PDF via `pdfkit` (Node.js, no new browser dep). Triggered via API or dashboard button. Stored in Supabase Storage, linked via time-limited signed URL.

**Why this is the killer Pro feature for regulated industries:**
- SOC2 auditors ask "show me your decision log" — one click
- GDPR regulators ask "when did you review data handling?" — history.md has the answer
- Legal discovery asks "who approved this architecture?" — Mario gate log has the name

---

## Infrastructure

**Target stack for MVP (Iteration 6-7):**

| Component | Service | Monthly cost at launch |
|---|---|---|
| App + API + webhooks | Vercel (Next.js, all routes) | $0 (hobby) → $20 (pro) |
| Database | Supabase (Postgres + RLS) | $0 (free tier) |
| Auth | Clerk | $0 (free < 10K MAU) |
| File storage | Supabase Storage | $0 (1GB free) |
| Email | Resend | $0 (free tier) |

**Total infra cost at launch: ~$0-20/mo**

No separate Railway API server. Vercel handles Next.js app + API routes + GitHub webhook receiver in one deployment. No Redis, no queue service, no container orchestration.

**At 100 paying teams (~$5-10K MRR):**
- Vercel Pro: $20/mo
- Supabase Pro: $25/mo
- Clerk Pro: ~$25/mo
- Total: ~$70/mo — **98.6% gross margin**

**At 1,000 paying teams (~$50-100K MRR):**
- Supabase scales to $599/mo (compute + storage)
- Vercel: ~$100-200/mo (function invocations)
- Clerk: ~$100-150/mo
- Total: ~$900-950/mo — **still above 98% gross margin**

When to re-examine: at 5,000+ teams. Architecture does not change — only the Supabase plan tier.

---

## Build Sequence (Iterations 6-9)

**Iteration 6 — SaaS Scaffold:**
- Clerk + Supabase setup
- `sdk-cloud link/push/pull` CLI commands
- API: auth + project CRUD + file sync
- `.sdkrc` cloud config schema

**Iteration 7 — Dashboard MVP:**
- Next.js app + Clerk auth
- Project Overview + Decision Timeline views
- `sdk-cloud push` → dashboard reflects new state

**Iteration 8 — GitHub + Compliance:**
- GitHub webhook receiver
- `sdk-github link/sync-issues/release`
- Compliance PDF export

**Iteration 9 — Org View + Billing:**
- Org Dashboard view
- Stripe billing integration (Pro + Business tiers)
- Seat management + invite flow

---

## CTO Dissent — Logged

**Pricing floor:** The $49-199 band is wide. The dashboard views described here are worth $149/team/month to an engineering manager running 5+ concurrent SDK projects. Starting at $49 risks anchoring the product as a "cheap tool" to buyers who would pay $149 without hesitation. Recommend CRO evaluate a **$99 floor** before launch. The architecture supports any price point — but the positioning decision should be deliberate, not defaulted.

This is a revenue call, not a technical one. Logged here so it does not get lost before Iteration 9 (billing scaffold).

---

## Open Questions (for CTO + CISO review)

- [ ] Token storage for `TEAM_SDK_GITHUB_TOKEN`: `.sdkrc` is git-tracked. Should we enforce `.sdkrc` in `.gitignore` for projects, or use OS keychain? CISO should decide.
- [ ] `sdk-cloud push` authentication: CLI needs a way to authenticate to the API. Options: API key in `.sdkrc`, OAuth device flow, or JWT from Clerk. Recommend: API key per project (simple, auditable).
- [ ] Webhook secret storage: GitHub webhook HMAC secret must not live in the cloud DB in plaintext. Encrypt at rest with app-level key (Supabase Vault or similar).
- [ ] Multi-region: Supabase is single-region in free/pro tier. For regulated EU customers (GDPR), EU region required. Defer to Enterprise tier.

---

*Architecture is locked at Iteration 6 kickoff. All open questions above must be resolved before scaffold work starts. CTO signs off; Mario reviews irreversible decisions.*
