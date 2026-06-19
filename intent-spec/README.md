# Layer C — Task Context

> Engineer-supplied intent. Per-task. Always documented. Always archived.

## What this layer is

Layer C is what a human (or an AI agent acting as a human's proxy) contributes at the time of working on a specific idea. It is the artifact that captures **intent** — the why behind the change, what was deliberately excluded, what constraints shaped the design. It is the antidote to "every task starts from zero."

Adopted from the **Layered Context Architecture** brain structure (Sidharta Rezende, Diego Mattos — Nu-Global). Mapped onto team-sdk substrate.

## Folder shape per idea

```
intent-spec/
├── README.md                          # this file
├── _INDEX.md                          # append-only ledger of every idea executed
├── _archive/                          # ideas whose Layer B claims have been merged
└── <slug>/                            # one folder per idea
    ├── sdd.md                         # v1 SDD draft (PM, raw idea → shaping)
    ├── sdd-v2.md                      # revised after Critique-Revise loop
    ├── _foundation-snapshot.md        # the Layer A distillation this idea was shaped against
    ├── _revision-notes.md             # what the Critique-Revise loop changed and why
    ├── _red-team.md                   # the one killing assumption + cheapest test
    ├── shaped-brief.md                # final shaped brief (PROCEED / DE-RISK / REVISE / KILL)
    ├── _summary.md                    # one-line summary
    └── diagrams/                      # optional, engineer-supplied
```

## How a Layer C folder is born

Today, the v0.1 `idea-execution` workflow creates the folder automatically when invoked with a slug. There is no manual template to fill — the workflow's PM agent drafts `sdd.md` from the raw idea, and downstream phases populate the rest.

When a human wants to seed an idea by hand (bypassing the workflow), the minimum content is just `sdd.md` with these sections:

- **Problem** — the condition in the world that makes this worth building now
- **Target user**
- **Appetite** — S / M / L
- **Solution sketch** — the minimum-value increment, not the full vision
- **Non-Negotiables**
- **Out-of-Bounds** — what we are explicitly NOT doing
- **Open questions**
- **Success looks like**

Everything else is optional. Friction is the enemy of adoption.

## Archival

When `shaped-brief.md` has `Decision: PROCEED` and the resulting Layer B claims have been reviewed and merged, the Layer C folder moves to `_archive/<slug>/`. It is queryable forever — it is the historical record of why each Layer B claim exists.

For `Decision: KILL` outcomes, the folder still moves to `_archive/` with the kill reason intact. We do not delete. The kill log is part of the corpus we learn from.

## Cross-references

- Layer A foundation → `../foundation/README.md`
- Layer B specifications → `../generated-spec/README.md`
- Workflow that produces Layer C → `../workflows/README.md`
