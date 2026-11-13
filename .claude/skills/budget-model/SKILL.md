---
name: budget-model
description: Produce a CFO budget validation and cost/runway model with base case and scenarios. Use before committing scope, team size, or vendors.
---

# Budget Model

The template lives in the role file, so it is never copied here: `team/roles/cfo.md` → the section whose heading contains "Budget". Read only that section, then the role's Capability block for scope.

## Steps
1. **Load context** per `protocol.md` §7 for the CFO role. Read the queryMap topic and the destination section below.
2. **Fill the template completely.** Mark unknowns as explicit assumptions with a confidence level. Do not leave blanks.
3. **Write the result to** business-requirements.md → `## Finance (CFO)` with `sdk-doc append` or `sdk-doc add-item`, using scoped `## Section > Status` headings.
4. **Close** with the `domain-close` skill. Log consequential calls with `log-decision`.

When run as a consultation (no project), return the filled template in the reply instead of writing files.
