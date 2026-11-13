---
surface:
  id: SURFACE-YYYYMMDD-<slug>-<seq>
  kind: decision            # decision | flow | roadmap
  title: <one line>
  author_roles: [<role>]    # who may author the body
  verifier_roster: [<role>] # who must verify before `verified`; dynamic + fixed minimum for irreversible (§34.4)
  depends_on: []            # surface-ids or file paths
  produces: <what this surface yields when verified>
  state: draft              # draft | authored | under-verification | reconciling | verified | blocked | superseded | archived (last two terminal)
  irreversible: false
  evidence: []              # paths or claim-ids
  release: v[YEAR].Q[QUARTER].[INCREMENT]
---

# <title>

> Collaboration Surface per `protocol.md` §34. The company is the product; every block below is a provenance-stamped commit to the company body by a named role.

## Author block — <author role> (<YYYY-MM-DD>)

<the substance: the decision/flow/roadmap being proposed, with reasoning>

LOOP-PROVENANCE: SURFACE-YYYYMMDD-<slug>-<seq> + SHA256(<canonicalized block body>)

## Verification — <verifier role> (<YYYY-MM-DD>)

**Verdict:** pass | concern | no-go
**Reasoning:** <why — specific, not a vibe. A no-go names the failure path. Silence is never a pass.>

LOOP-PROVENANCE: SURFACE-YYYYMMDD-<slug>-<seq> + SHA256(<canonicalized block body>)

<!-- one Verification block per roster member; add a Reconciliation block only if a no-go fired -->

## Reconciliation (only if a no-go fired)

**Resolution:** author-revised | verifier-withdrew | escalated-to-§29 | escalated-to-§32-loop
**What changed:** <one or two sentences>

LOOP-PROVENANCE: SURFACE-YYYYMMDD-<slug>-<seq> + SHA256(<canonicalized block body>)

## improvement_signal (emitted on verified | blocked)

```yaml
improvement_signal:
  friction: "<one sentence>"
  suggested_target: loop-pattern | layer-A | workflow | protocol | none
  evidence_link: "<optional path>"
```
