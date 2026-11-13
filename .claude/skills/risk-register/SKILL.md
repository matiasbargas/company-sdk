---
name: risk-register
description: Produce an enterprise risk register and scenario analysis (operational, financial, model, concentration, third-party risk). Use when real money, credit, or operational complexity is involved.
---

# Risk Register

The template lives in the role file, so it is never copied here: `team/roles/cro-risk.md` → the section whose heading contains "Risk Register". Read only that section, then the role's Capability block for scope.

## Steps
1. **Load context** per `protocol.md` §7 for the CRO Risk role. Read the queryMap topic and the destination section below.
2. **Fill the template completely.** Mark unknowns as explicit assumptions with a confidence level. Do not leave blanks.
3. **Write the result to** business-requirements.md → `## Risk (CRO Risk)` with `sdk-doc append` or `sdk-doc add-item`, using scoped `## Section > Status` headings.
4. **Close** with the `domain-close` skill. Log consequential calls with `log-decision`.

When run as a consultation (no project), return the filled template in the reply instead of writing files.
