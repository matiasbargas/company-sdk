# @team-sdk/memory — per-company decision corpus

A **derived index** of a company's decisions, kills and challenges, read from its own
`history.md` and `bus-log.md`. The sources are the truth; the store can be deleted and
rebuilt with `ingest` at any time.

## Where the store lives

| Scope | Location | How you get it |
|---|---|---|
| **company** (default) | `<projectDir>/.team-sdk/memory` | `createMemoryStore({ projectDir })` |
| explicit | any directory you name | `createMemoryStore({ storeDir })` (tests, tools) |
| global (**opt-in only**) | `~/.team-sdk/memory` | `createMemoryStore({ global: true })` or `TEAM_SDK_MEMORY_GLOBAL=1` |

- The company store is **gitignored**: on creation it writes `<projectDir>/.team-sdk/.gitignore`
  containing `*`, so the derived index is never committed.
- `createMemoryStore()` with no configuration is **refused** (`MEMORY_STORE_UNCONFIGURED`).
  There is no implicit machine-wide default.
- A company store refuses to ingest another company's directory (`CROSS_COMPANY_INGEST`).

## The global store is a cross-company leak risk

`~/.team-sdk/memory` puts every company on the machine into one corpus, outside git, without
any company's consent. One company's decisions, kills and dissent then show up in another
company's queries. It is therefore **opt-in only** and refused otherwise, even when its path is
passed as `storeDir` (`MEMORY_GLOBAL_NOT_OPTED_IN`). A global store reports
`getScope().leakRisk === true`.

**Cross-company memory goes through the commons**, which publishes deliberately chosen,
scanned, attributed lessons. It never goes through a shared machine-global store.

## Integrity guarantees (schema v2)

- **Deterministic ids**: the hash of `{project, source_file, content hash of the entry's block, anchor}`.
  The anchor is the heading text or Bus header plus an occurrence ordinal, never a line number.
  Re-ingesting unchanged sources adds zero entries, and so does adding entries above existing ones.
  An entry with no cited source hashes `{project, type, date, summary}`.
- **Dates come from the source**: the history `**Date:**` or the Bus `[YYYY-MM-DD HH:MM]` header.
  A missing date stays `null`. It is never the ingest day.
- **Challenges** with no recorded outcome are `unresolved`, never `overridden`.
- **Envelope** on every entry:
  - `author {kind: human|agent|unknown, id, role}`: human only for the Owner, agent only for a recognised role, otherwise unknown.
  - `sources[] {file, anchor, content_hash, lines}`.
  - `commit_sha`: HEAD when the source file is tracked and clean, else `null`.
  - `confidence`: `high`, `medium` or `low`, by provenance gaps.
- **Old stores** (pre-v2) load with `author.kind: unknown`, `provenance: 'unknown'`,
  `legacy: true` and `confidence: 'low'`. `stats().legacyEntries` counts them. Re-ingesting their
  source upgrades them in place when the v1 id matches.
