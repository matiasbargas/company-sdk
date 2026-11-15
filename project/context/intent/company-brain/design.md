# Company brain + human collaboration — design (Discovery input)

**Author:** Greg (CEO), synthesizing CTO, CDO, Designer and CISO (read-only consultations, 2026-11-15) · **Status:** proposal, not built. The storage and identity model is an **irreversible** decision: it needs a §34 surface (`irreversible: true`; roster CFO, CISO, Mario, CLO) and Owner sign-off.

## 1. The brain: git files are the truth; everything else is derived

Each company's brain lives in **its own git repository**, in five layers:

| Layer | Holds | Written by | Read by agents |
|---|---|---|---|
| L0 Law | CHARTER, protocol, `_shared.md`, role files | Humans (Owner ratifies) | Always, in full |
| L1 Spec (Layer B) | `context/spec/<slug>/{variables,claims}.yaml`: atomic facts and capabilities | Agents and humans, per merged idea | Only the slice for the task |
| L2 Intent (Layer C) | `context/intent/<slug>/`: what we are trying to do and why | Whoever works the idea | In full, for that task |
| L3 Live map | `current-status.md`, `history.md` (decisions), requirements, `bus-log.md`, `surfaces/` | Through `sdk-doc` and surface blocks (§35 enforces) | Through cockpit + queryMap (§7) |
| L4 Exhaust | `record/`: loops, signals, experiments, runs | Runner and loops, append-only | Audit only |

**Derived and disposable:** `context-index.json`, the manifest, cockpit output, search indexes, the event feed. They are rebuilt from git and never edited by hand.
**Portfolio level:** the holding **ledger** (fuel, proofs, commons events, hash-chained) and the **commons** (content-hashed, consented, verified by another company). The commons is the **only** bridge between company brains.

## 2. Memory model: one envelope, four types (CDO)

Every memory record carries the same envelope: `id` (content hash) · `type` · `statement/payload` · `sources[]` · `author {kind: human|agent, id, role}` · `commit_sha` · `confidence` · `status` · `superseded_by` · `observed_at_work` / `last_confirmed_at_work`.

| Type | What | Decays? |
|---|---|---|
| Episodic | Runs, loop turns, Bus, ledger events: *what happened* | Never (immutable evidence) |
| Semantic | Claims, capabilities, decisions: *what is true* | Yes. Measured in work: N commits touching the cited source without re-confirmation lowers confidence one step; below `low`, the claim is quarantined, never deleted |
| Procedural | Skills, rituals, role files, loop patterns: *how we work* | Freshness by use (invocations, kill/ITERATE rate) |
| Judgment | Kills, disagreements, VOF, Owner ratings: *how we weigh things* | Never; it must cite a ledger event or a signed Owner entry |

**Never enters memory:** secrets and keys, personal data beyond a role or handle, raw Owner conversation. The scan runs at ingestion, not only at publish. The CLO owns this list.
**Quality metrics:** staleness rate, contradiction rate, citation coverage (sources resolve at HEAD), and later the retrieval hit rate. **Anti-metric:** raw claim count.

## 3. Knowledge weight is not command authority (CDO × CISO, resolved)

- **As knowledge:** a human-authored claim enters at high confidence. Agents may not overwrite it; they contest it through a §29 disagreement, which the human sees.
- **As instruction:** human content carries **no authority** (CHARTER Precedence #8). It is untrusted input to agents. It is delimited in context, it never triggers a tool call, and it never lets anyone cross an Autonomy Limit. Only the Owner, in conversation, directs.

## 4. Humans join as named principals on existing primitives (CTO × Designer)

- A `principal` record (in `team.md`): `kind: human|agent`, `id`, `roles[]`, `can_ratify`. Rosters may name `human:<handle>`. Silence is never a pass.
- **Verbs over existing primitives (no parallel system):**
  - `surfaces/{id}`: create, author-block, verify (pass/concern/no-go), reconcile;
  - `intent/{slug}`: open, amend;
  - `decisions`: propose, ratify, dissent;
  - `bus`: post, ack;
  - `asks`: a *query* over open roster slots and DECISION NEEDED messages addressed to the person.

  The holding (fund, ratify grants, freeze, judge, pull) stays **Owner-only through the CLI**, never through this API.
- **Event feed:** derived from the git log (`surface.state_changed`, `verdict.recorded`, `decision.logged`, `ask.opened`, `commons.admitted`).

## 5. Interfaces, in build order (Designer, transport by CTO)

1. **`sdk-doc inbox`:** decision cards built by the daily rituals. Each card shows dissent first, then the boundary it hits, the options, what proceeds meanwhile, the cost of delay and a deadline. At most 5 per person per day.
2. **GitHub PR/issue per human decision:** approve or comment becomes a verification block. It reuses auth, audit and notifications. A reason is required on every pass.
3. **A local MCP server per clone:** humans work from their own Claude or IDE on the same files the agents use. Every write is a signed commit.
4. **Slack:** one daily digest, push only. The single interrupt is a blocked irreversible item on the critical path.
5. **HTTP gateway:** only when a non-git human must join. It is stateless and turns requests into signed commits.

**Not built:** a database or "brain service" as the truth, a vector store before a measured retrieval miss, a separate task tracker or chat, an API path to the ledger or keys, machine-global memory, real-time co-editing, approvals without a signed commit.

## 6. Making the collaboration actually good (Designer)

- **Rhythm:** a 10-minute daily inbox; a 45-minute weekly session (judgment ratings, one deep surface read with one verification block, human-behaviour signals); a charter review every 10 iterations.
- **Against rubber-stamping:** dissent shown first, a reason on every pass, a blind lean before the reveal on 1 card in 5, a signal for passes under 30 seconds.
- **Against fatigue and over-asking:** a cap on cards, a single interrupt class, every ask must cite its boundary, an ask budget per role.
- **Against humans becoming bottlenecks:** every card names what proceeds meanwhile; reversible work never waits; overdue items go to the CEO with the cost of delay.
- **Constraint 1:** swap roles so humans *author* surfaces that agents verify; cards teach (why it matters, what evidence would flip it); private calibration feedback on judgment ratings.

## 7. Trust non-negotiables before any external human (CISO)

1. Per-person strong authentication (OIDC/SSO with MFA, short-lived tokens, revocation). For internal humans in v0, signed git commits.
2. Per-company authorization at the server, with OS or tenant isolation between brains.
3. Append-only writes with server-verified signed provenance; no edit or delete endpoints.
4. Human content tagged and delimited as untrusted, plus a passed prompt-injection red-team loop (§32).
5. Secret/PII scanning at ingestion that fails closed, a tamper-evident access log, and an incident plan (mass token revocation, the GDPR 72-hour clock).

## 8. Gaps found in today's code (verified)

1. **`packages/memory` is a machine-global store at `~/.team-sdk/memory`:** shared across companies, outside git, no consent. It breaks company isolation. Retire it: memory becomes a derived index per company, and cross-company memory goes through the commons.
2. **The memory ingest corrupts data:** Bus entries are dated on the ingest day, so ids change on every ingest and entries duplicate; challenges with no status default to "overridden". IDs should hash `{source_file, commit_sha, anchor}`.
3. **The Layer B README promises fields** (confidence, provenance, invalidation) the claims don't have. There are no freshness or citation checks, and no `supersedes`/`retired_by`.
4. **Judgment is stranded:** VOF, Owner ratings, kills and disagreements are never joined, so there is no calibration signal.
5. **Humans have no identity** in rosters, bus or surfaces. Surfaces are barely used (one file).
