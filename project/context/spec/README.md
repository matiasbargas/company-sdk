# Layer B — Specifications

> AI-maintained corpus of atomic claims. Append-only. Source-attributed. Per-idea organized.

## What this layer is

Layer B is a structured corpus of **behavioral facts** about what the team-sdk does (and what each shipped idea adds to that capability). Every claim is atomic, citable, taggable, auditable, and traceable to a specific source in Layer C or in code.

Adopted from the **Layered Context Architecture** brain structure (Sidharta Rezende, Diego Mattos — Nu-Global). Mapped onto team-sdk substrate.

**Layer B is for AI consumption, not human reading.** Humans interact with B in two situations: when reviewing the workflow-produced claims patch, and when auditing. Engineers doing daily work do not read B directly; they receive its relevant slice as part of the context their AI tools assemble.

## Folder shape

```
generated-spec/
├── README.md                          # this file
└── <slug>/                            # one folder per idea (mirrors intent-spec/)
    └── claims.yaml                    # the claims emitted by the workflow synthesis phase
```

## Claim schema

Every claim follows this schema (subset of the brain-structure schema, adapted for team-sdk):

```yaml
- id: claim-<slug>-<NNN>
  epic: <slug>                          # the idea this claim belongs to
  statement: "<one-sentence behavioral fact, present tense, declarative>"
  sources:                              # KEYSTONE DEFENSE — every claim MUST cite at least one
    - file: intent-spec/<slug>/shaped-brief.md
      lines: 12-28
    - file: intent-spec/<slug>/sdd-v2.md
      lines: 30-44
  tags:
    - bu:team-sdk
    - area:<derive>                     # e.g. area:ideation, area:protocol, area:loops
    - behavior:<derive>                 # e.g. behavior:critique, behavior:scoping
  confidence: high | medium | low
  added_in_workflow_run: <date>-<slug>-<run-seq>
  provenance_hash_input:                # Mario's primitive — what the hash was computed over
    pattern: idea-execution-v0.1
    spawning_agent: coordinator
    input_idea: "<first 200 chars of the original idea>"
    date: <YYYY-MM-DD>
  status: valid                         # valid | invalidated
  # optional, populated on MODIFY / INVALIDATE:
  # modified_in_runs: [...]
  # invalidated_at: <date>
  # invalidation_reason: "..."
  # superseded_by: [claim-id, ...]
```

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
