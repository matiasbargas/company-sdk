---
name: regulatory-map
description: Produce a CLO regulatory map (jurisdictions, applicable frameworks with confidence, obligations, blockers). Use before CTO activation or when a product enters a new market or data category.
---

# Regulatory Map

The template lives in the role file, so it is never copied here: `team/roles/clo.md` → the section whose heading contains "Regulatory Map". Read only that section, then the role's Capability block for scope.

## Steps
1. **Load context** per `protocol.md` §7 for the CLO role. Read the queryMap topic and the destination section below.
2. **Fill the template completely.** Mark unknowns as explicit assumptions with a confidence level. Do not leave blanks.
3. **Write the result to** compliance-requirements.md → Jurisdictions + `## Legal & Regulatory (CLO)` with `sdk-doc append` or `sdk-doc add-item`, using scoped `## Section > Status` headings.
4. **Close** with the `domain-close` skill. Log consequential calls with `log-decision`.

When run as a consultation (no project), return the filled template in the reply instead of writing files.
