# Layer B — Specifications

> AI-maintained corpus of atomic claims. Append-only. Source-attributed. Per-idea organized.

## What this layer is

Layer B is a structured corpus of **behavioral facts** about what the team-sdk does (and what each shipped idea adds to that capability). Every claim is atomic, citable, taggable, auditable, and traceable to a specific source in Layer C or in code.

Adopted from the **Layered Context Architecture** brain structure (Sidharta Rezende, Diego Mattos — Nu-Global). Mapped onto team-sdk substrate.

**Layer B is for AI consumption, not human reading.** Humans interact with B in two situations: when reviewing the workflow-produced claims patch, and when auditing. Engineers doing daily work do not read B directly; they receive its relevant slice as part of the context their AI tools assemble.

## Folder shape

```
project/context/spec/
├── README.md                          # this file
├── _refactor-watch.json               # acknowledged file sizes for the §30 refactor-review check
└── <slug>/                            # one folder per idea or subsystem (mirrors context/intent/<slug>/)
    ├── claims.yaml                    # claims and capabilities (any claims*.yaml is read, e.g. claims-retro.yaml)
    └── variables.yaml                 # optional: named variables the claims refer to (not a claims file)
```

The folder was `generated-spec/` and Layer C was `intent-spec/`; both were renamed (`spec/`, `intent/`). Old
citations that still use the old names are reported by `claims-citation` with the current path as a hint.

## Claim schema

A claims file is either a `claims:` key holding a list, or a top-level list. Each entry starts with `- id:`.
Two kinds share the schema: behavioural **claims** (`kind` omitted or `claim`) and **capabilities**
(`kind: capability`, the implementation-independent promises of §30, pinned by `@covers <id>` tests).

### Fields in use

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique across the whole `spec/` corpus: `claim-<slug>-<NNN>` or `cap-<area>-<name>-<NNN>`. |
| `statement` | yes | One declarative, present-tense fact or promise. |
| `status` | yes | Claims: `valid` \| `invalidated`. Capabilities: `built` \| `unpinned` \| `planned` \| `defect` \| `retired`. |
| `sources` | yes for new claims | What the statement is drawn from (see below). Legacy capabilities without sources are counted as *uncited*, not failed. |
| `kind` | capabilities | `capability`; omitted for plain claims. |
| `conformance` | capabilities | Test ids; `status: built` ⇒ each appears as `@covers <id>` in a test run by `npm test`. |
| `acceptance` | capabilities | given/when/then list against the public interface. |
| `epic` | claims (legacy) | The idea slug the claim belongs to. |
| `tags` / `tag` | optional | `bu:`, `area:`, `behavior:` tags for retrieval. |
| `added_in_workflow_run` | optional | `<date>-<slug>-<run-seq>` of the run that added it. |
| `provenance_hash_input` | optional | `{pattern, spawning_agent, input_idea, date}` the provenance hash was computed over. |
| `invalidated_at`, `invalidation_reason` | on INVALIDATE | When and why a claim stopped being valid. |
| `fixed_note`, `unpinned_note`, `defect_note` | optional | Capability status notes. |

### Optional fields (new; never required, legacy claims without them stay healthy)

| Field | Shape | Meaning |
|---|---|---|
| `author` | `{kind: human \| agent, id, role}` | Who asserted the claim. A human-authored claim is not overwritten by agents; it is contested through a §29 disagreement. |
| `confidence` | `high \| medium \| low` | How sure the author is. |
| `superseded_by` | id or `[id, ...]` | The claim(s) that replace this one. Usually paired with `status: invalidated`. |
| `retired_by` | id or `[id, ...]` | The claim(s) or capability that made this one obsolete without replacing its statement. |

### Sources

```yaml
sources:                                  # block style
  - file: intent/<slug>/shaped-brief.md   # relative to project/context/, the project dir, or the repo root
    lines: 12-28                          # optional: N, N-M, or a list "15,130-131"
  - file: scripts/health.js
sources: [{file: scripts/doc.js, lines: '14-66'}, {file: history.md, section: "Heading text"}]   # flow style
sources:
  - intent/<slug>/_retrospective.md       # bare path
```

`section:` names a heading (not checked). A `*` in the last path segment is a glob and resolves when at
least one file matches.

### Example

```yaml
- id: claim-<slug>-<NNN>
  epic: <slug>
  statement: "<one-sentence behavioral fact, present tense, declarative>"
  sources:
    - file: intent/<slug>/shaped-brief.md
      lines: 12-28
  tags: [bu:team-sdk, area:<derive>, behavior:<derive>]
  author: {kind: agent, id: <name>, role: <role>}
  confidence: high
  added_in_workflow_run: <date>-<slug>-<run-seq>
  status: valid
  # on INVALIDATE: invalidated_at, invalidation_reason, superseded_by: [claim-id] or retired_by: [claim-id]
```

## Quality checks (`sdk-health`, `scripts/lib/claims-quality.js`)

`sdk-health` prints one summary line (claims, files, citations resolved/checked, uncited, stale,
supersede links) and lists every problem as an issue. Claims with `status: invalidated` or `retired` are
kept for audit and skipped by the citation and staleness checks.

| Check | Rule | Capability |
|---|---|---|
| `claims-citation` | Every `sources[].file` resolves (context/, project dir, or repo root) and every `lines:` range is inside the file. | `cap-sdk-claims-citation-001` |
| `claims-stale` | Work-based (§2 timing): more than `limits.claimStaleCommits` (default 20, `.sdkrc` → `limits`) commits touched a claim's cited source files since its claims file last changed ⇒ re-confirm the claim. Committing the claims file is the re-confirmation. | `cap-sdk-claims-stale-001` |
| `claims-supersede` | Every `superseded_by` / `retired_by` id exists somewhere in `spec/`, and the links never form a cycle. | `cap-sdk-claims-supersede-001` |

## The three operations

Per the brain-structure doc, all updates to Layer B are claim-level operations:

1. **ADD** — a new claim joins the corpus. v0.1 only emits ADDs (the corpus starts empty).
2. **MODIFY** — an existing claim's statement is rewritten or sources added. Statement is replaced wholesale (a single string cannot meaningfully be merged); sources are additive by default.
3. **INVALIDATE** — a claim is marked as no-longer-valid but **never deleted from storage**. It remains in `claims.yaml` with `status: invalidated`, `invalidated_at`, `invalidation_reason`, and (when applicable) `superseded_by`. Retrieval filters by `status: valid`.

The corpus only grows. Provenance is transparent. Audit and rollback remain possible. Supersession is explicit.

## The hallucination defense stack

Following the brain-structure doc Section 5.3, every claim in this corpus is constrained by five day-one defenses:

1. **Source attribution** — no source, no claim. The keystone.
2. **Structured atomic claims** — not free-form prose. Makes attribution and audit feasible.
3. **Scoped updates** — workflow phases only touch the claims tied to their idea slug.
4. **Symmetric equivalence** (deferred to v0.2+, when we have a verification phase) — checks for both omission and invention.
5. **Adversarial review pass** — the Red-Team phase is the v0.1 stand-in.

Hallucination cannot be eliminated. It can be made **costly to produce, cheap to detect, easy to roll back**. That is the contract this layer offers.

## Retrieval

v0.1 has no retrieval layer — `claims.yaml` is read whole by downstream workflows. As the corpus grows (>~50 claims), we add tag-filter retrieval; once tag-filter saturates, we add embedding-based semantic retrieval. The tags written from day one are what makes that progression possible.

## Cross-references

- Layer A foundation → `../foundation/README.md`
- Layer C task context → `../intent/README.md`
- The workflow that produces claims → `../../../workflows/README.md`
