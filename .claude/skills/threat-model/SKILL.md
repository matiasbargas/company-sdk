---
name: threat-model
description: Produce a CISO threat model for a product or feature (assets, actors, STRIDE-style threats, mitigations, non-negotiables). Use before architecture is finalized or when a feature touches auth, PII, secrets, or money.
---

# Threat Model

The template lives in the role file, so it is never copied here: `team/roles/ciso.md` → the section whose heading contains "Threat Model". Read only that section, then the role's Capability block for scope.

## Steps
1. **Load context** per `protocol.md` §7 for the CISO role. Read the queryMap topic and the destination section below.
2. **Fill the template completely.** Mark unknowns as explicit assumptions with a confidence level. Do not leave blanks.
3. **Write the result to** compliance-requirements.md → `## Security & Threat Model (CISO)` with `sdk-doc append` or `sdk-doc add-item`, using scoped `## Section > Status` headings.
4. **Close** with the `domain-close` skill. Log consequential calls with `log-decision`.

When run as a consultation (no project), return the filled template in the reply instead of writing files.
