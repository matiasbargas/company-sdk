# Discovery Requirements -- [PROJECT NAME]
**Owners:** Camila (CLO) · CISO
**Last updated:** [DATE]
**Release:** [RELEASE]

> Gate file. CTO cannot start architecture until both CLO and CISO sections reach "Done" **and** jurisdictions are declared. Run `node scripts/gate-check.js <project-dir>` to verify. This is the most expensive step to skip.
>
> See `DISCLAIMER.md` — agent outputs in this file are AI-generated analysis prompts, not legal or security certifications. Outside counsel must validate legal findings for your jurisdiction.

---

## Jurisdictions

**Required before this gate can be cleared.** Answer each question. Each "yes" answer triggers specific frameworks to evaluate in the sections below.

| Question | Answer |
|---|---|
| Where is the company incorporated? | [Country / State] |
| Where are employees located? | [Countries] |
| Where are users or customers located? | [Countries / Regions] |
| Where is data processed or stored? | [Countries / Providers] |
| Where is money handled (payments, lending, investment)? | [Countries / N/A] |

**Frameworks triggered by the above (CLO completes):**

| Framework | Applicable? | Hard blocker? | Notes |
|---|---|---|---|
| GDPR (EU users or data) | YES / NO | YES if applicable | DPAs required with all data processors |
| CCPA (California users) | YES / NO | Soft | Privacy policy + opt-out required |
| EU AI Act (employment, credit, infra AI) | YES / NO | YES if applicable | High-risk deployer obligations may apply — see DISCLAIMER.md Section 4 |
| SOC 2 (B2B SaaS, enterprise customers) | YES / NO | Soft | Type I before launch, Type II after 12 months |
| PCI-DSS (card payments) | YES / NO | YES if applicable | Required before any card data is touched |
| HIPAA (health data, US) | YES / NO | YES if applicable | BAAs required with all vendors touching PHI |
| Other: [framework] | YES / NO | — | — |

---

## Legal (CLO)

### Pending
- [ ] Regulatory map — what laws, jurisdictions, and frameworks apply to this product
- [ ] Data handling obligations — user data, PII, consent requirements
- [ ] Contract requirements — third-party agreements needed before launch

### In Progress

### Done

### Blocked

---

## Security (CISO)

### Pending
- [ ] Threat model — attack surface, trust boundaries, adversary profile
- [ ] Security non-negotiables — what must be true before any code ships
- [ ] Compliance requirements — SOC 2, GDPR, HIPAA, or similar gate

### In Progress

### Done

### Blocked

---

## Gate Status

| Domain | Owner | Status | Ready to ungate CTO? |
|---|---|---|---|
| Legal | CLO | Pending | No |
| Security | CISO | Pending | No |

*Both must be "Done" before CTO activates. Coordinator tracks this.*
