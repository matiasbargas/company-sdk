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

### What syncs
- `history.md` — decision record (always synced)
- `current-status.md` — session state (synced on push)
- `*.requirements.md` files — requirements state (synced on push)
- `context-manifest.json` — project snapshot (auto-generated on push)

### What stays local only
- `.claude/` directory — agent configs, settings
- Source code — never sent to the SDK cloud
- `.sdkrc` secrets (GitHub token, etc.)

### Commands
```bash
sdk-cloud link <project-dir>           # link to cloud, creates project in org
sdk-cloud push <project-dir>           # upload local state to cloud
sdk-cloud pull <project-dir>           # download latest from cloud to local
sdk-cloud status <project-dir>         # show sync state (ahead/behind/diverged)
```

### Conflict resolution
- **Last-write-wins** for current-status.md (session continuity file, high churn)
- **Append-only** for history.md (decisions are never overwritten)
- **Manual merge prompt** for requirements files if diverged (rare — these evolve slowly)

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

**Stack:** Node.js (Express or Hono), deployed on Railway or Render.
**Rationale:** Stays on Node.js, same runtime as CLI. Hono preferred for lightweight, typed handlers.

### Auth
**Recommendation: Clerk**
- Fastest to ship (pre-built UI, team/org model built-in)
- Handles invites, SSO (Enterprise tier), SCIM
- Node.js SDK mature and actively maintained
- Cost: free up to 10K MAU, then $25/mo — negligible at early scale

### Endpoints

```
POST   /api/v1/auth/token                    # exchange CLI token for session
GET    /api/v1/orgs/:orgId/projects          # list all projects in org
POST   /api/v1/projects                      # create project (sdk-cloud link)
GET    /api/v1/projects/:id                  # project state
PUT    /api/v1/projects/:id/sync             # push: upload file batch
GET    /api/v1/projects/:id/sync             # pull: download latest file batch
GET    /api/v1/projects/:id/history          # history.md entries as structured JSON
GET    /api/v1/projects/:id/status           # current-status.md as structured JSON
GET    /api/v1/projects/:id/gates            # latest gate check results
POST   /api/v1/projects/:id/export/compliance # generate compliance PDF
POST   /api/v1/webhooks/github               # GitHub webhook receiver
GET    /api/v1/orgs/:orgId/dashboard         # aggregate org view
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

1. **Project Overview** — Active missions table, gate status lights (CLO/CISO/Mario), open decisions, next activation phrase. Replaces `sdk-status` in the browser.

2. **Decision Timeline** — Chronological log of all decisions from history.md, filterable by role and reversibility. The compliance audit view.

3. **Mission Kanban** — Requirements files as a visual board: Pending → In Progress → Done. Synced from local push. Read-only in v4.0 (write via CLI); editable in v4.1.

4. **Team View** — Who's in the org, what projects they're on, last activity. Invite flow that sends CLI setup instructions.

5. **Org Dashboard** (Business tier) — All projects in the org: release health, gate status, last sync. For agency owners and multi-product founders.

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
Registered via `sdk-github link` using GitHub's Webhooks API. HMAC-validated on every request.

**Events handled:**

| GitHub event | SDK action |
|---|---|
| `pull_request.closed` (merged) | Move ticket from In Progress → Done in requirements file (if PR title includes ticket ID) |
| `release.published` | Append to history.md if release matches SDK release ID format |
| `issues.labeled` (sdk-mission) | Create pending item in product-requirements.md |
| `push` to main | Trigger `sdk-validate` check; post result as commit status |

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
| API | Railway (Node.js) | $5/mo (hobby) |
| Database | Supabase (Postgres) | $0 (free tier) |
| Dashboard | Vercel (Next.js) | $0 (hobby) |
| Auth | Clerk | $0 (free tier < 10K MAU) |
| File storage | Supabase Storage | $0 (1GB free) |
| Email | Resend | $0 (free tier) |

**Total infra cost at launch: ~$5/mo**

**At 100 paying teams (~$5K MRR):**
- Supabase Pro: $25/mo
- Railway Pro: $20/mo
- Clerk Growth: $25/mo
- Total: ~$70/mo (1.4% of MRR)

**At 1,000 paying teams (~$50K MRR):**
- Move to dedicated Postgres: ~$100/mo
- Railway: ~$50/mo
- Total: ~$300/mo (0.6% of MRR)

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

## Open Questions (for CTO + CISO review)

- [ ] Token storage for `TEAM_SDK_GITHUB_TOKEN`: `.sdkrc` is git-tracked. Should we enforce `.sdkrc` in `.gitignore` for projects, or use OS keychain? CISO should decide.
- [ ] `sdk-cloud push` authentication: CLI needs a way to authenticate to the API. Options: API key in `.sdkrc`, OAuth device flow, or JWT from Clerk. Recommend: API key per project (simple, auditable).
- [ ] Webhook secret storage: GitHub webhook HMAC secret must not live in the cloud DB in plaintext. Encrypt at rest with app-level key (Supabase Vault or similar).
- [ ] Multi-region: Supabase is single-region in free/pro tier. For regulated EU customers (GDPR), EU region required. Defer to Enterprise tier.

---

*Architecture is locked at Iteration 6 kickoff. All open questions above must be resolved before scaffold work starts. CTO signs off; Mario reviews irreversible decisions.*
