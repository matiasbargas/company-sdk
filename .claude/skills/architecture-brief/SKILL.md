---
name: architecture-brief
description: Produce a CTO architecture brief and make/buy/partner matrix. Use after the CLO + CISO gate when the team needs a technical approach.
---

# Architecture Brief

The template lives in the role file, so it is never copied here: `team/roles/cto.md` → the section whose heading contains "Architecture Brief". Read only that section, then the role's Capability block for scope.

## Steps
1. **Load context** per `protocol.md` §7 for the CTO role. Read the queryMap topic and the destination section below.
2. **Fill the template completely.** Mark unknowns as explicit assumptions with a confidence level. Do not leave blanks.
3. **Write the result to** engineering-requirements.md → `## Architecture (CTO)` with `sdk-doc append` or `sdk-doc add-item`, using scoped `## Section > Status` headings.
4. **Close** with the `domain-close` skill. Log consequential calls with `log-decision`.

When run as a consultation (no project), return the filled template in the reply instead of writing files.
