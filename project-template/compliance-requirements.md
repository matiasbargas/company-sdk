# Compliance Requirements -- [PROJECT NAME]
**Domain owners:** CLO (legal/regulatory) + CISO (security/threat model)
**Last updated:** [YYYY-MM-DD HH:MM]
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
| SOC 2 (enterprise or B2B customers) | YES / NO | Soft | Type I before launch, Type II after 12 months |
| PCI-DSS (card payments) | YES / NO | YES if applicable | Required before any card data is touched |
| HIPAA (health data, US) | YES / NO | YES if applicable | BAAs required with all vendors touching PHI |
| Other: [framework] | YES / NO | — | — |

---

## Legal & Regulatory (CLO)

### Pending
- [ ] Regulatory map — what laws, jurisdictions, and frameworks apply to this product
- [ ] Data handling obligations — user data, PII, consent requirements
- [ ] Contract requirements — third-party agreements needed before launch

### In Progress

### Done

### Blocked

---

## Security & Threat Model (CISO)

### Non-Negotiables (required before first user — no exceptions)

These items cannot be deferred to Sprint 3. If they are not done, the release does not ship.

#### Identity and Access
- [ ] MFA enforced for all users — no exception path | Owner: [Role] | Evidence: [how verified]
- [ ] Short-lived tokens: 15-min access token, 24-hour refresh max | Owner: [Role] | Evidence: [config ref]
- [ ] Least-privilege API keys and service accounts — no shared credentials | Owner: [Role] | Evidence: [audit log]
- [ ] Zero-trust internal services — every service authenticates to every other | Owner: [Role] | Evidence: [architecture ref]

#### Data Protection
- [ ] Encryption at rest: AES-256, managed keys via KMS | Owner: [Role] | Evidence: [config ref]
- [ ] Encryption in transit: TLS 1.3 minimum, no HTTP anywhere | Owner: [Role] | Evidence: [scan result]
- [ ] PII isolated in encrypted, access-controlled storage | Owner: [Role] | Evidence: [data model ref]
- [ ] Data residency enforced per user jurisdiction (see Jurisdictions section above) | Owner: [Role] | Evidence: [config ref]

#### Secrets Management
- [ ] No secrets in code, ever — Secrets Manager for all credentials | Owner: [Role] | Evidence: [repo scan]
- [ ] Dependency scanning in CI/CD — every PR checked before merge | Owner: [Role] | Evidence: [CI config ref]
- [ ] No direct production database access from developer machines | Owner: [Role] | Evidence: [access policy]

#### KYC / AML (complete only if financial product)
- [ ] KYC verification before any financial action | Owner: [Role] | Evidence: [flow ref]
- [ ] OFAC / sanctions screening on every transaction | Owner: [Role] | Evidence: [integration ref]
- [ ] AML screening on all new users and beneficial owners | Owner: [Role] | Evidence: [policy ref]

### Threat Model

> Complete when CISO is activated. The non-negotiables above are independent of CISO activation.

#### Pending
- [ ] Threat model written — adversaries, high-value assets, attack vectors, mitigations | Owner: CISO

#### In Progress

#### Done

#### Blocked

### Compliance Roadmap

#### Pending
- [ ] Applicable frameworks identified (from Jurisdictions section above) | Owner: CISO
- [ ] SOC 2 Type I path defined (if applicable) | Owner: CISO
- [ ] GDPR DPAs with all data processors confirmed (if EU users) | Owner: CISO + CLO
- [ ] Evidence collection approach documented for each required framework | Owner: CISO

#### In Progress

#### Done

#### Blocked

### Incident Response

#### Pending
- [ ] P0 response chain documented (CEO + CLO notified within 1 hour — see protocol.md Section 2) | Owner: CISO
- [ ] Incident severity matrix defined (P0–P3 with response times) | Owner: CISO
- [ ] Customer notification protocol documented | Owner: CISO + CLO
- [ ] GDPR 72-hour breach notification process confirmed | Owner: CLO + CISO

#### In Progress

#### Done

#### Blocked

### Vendor Security Tiers

| Vendor | Tier | Data access | DPA signed | CISO sign-off | Status |
|---|---|---|---|---|---|
| [Vendor name] | 1 / 2 / 3 | [What data] | YES / NO / N/A | YES / NO / N/A | Pending |

**Tier definitions:**
- **Tier 1** — access to production user PII or financial data. Requires: security questionnaire + DPA + CISO sign-off before any data is shared.
- **Tier 2** — access to non-production or anonymized data. Requires: DPA.
- **Tier 3** — no data access. Requires: standard contract review (CLO).

---

## Explicit Non-Goals

> What this project is NOT doing. Each item must be as specific as the goals.
> If you can't name what you're choosing not to do, you haven't scoped the work.
> Minimum 2 items required to pass gate. `sdk-gate-check` enforces this.

- [What adjacent problem we are deliberately ignoring and why]
- [What capability we are choosing not to build in this cycle and why]

---

## Gate Status

| Domain | Owner | Status | Ready to ungate CTO? |
|---|---|---|---|
| Legal | CLO | Pending | No |
| Security | CISO | Pending | No |

*Both must be "Done" before CTO activates. Coordinator tracks this.*

---

*compliance-requirements.md — owned jointly by CLO (legal/regulatory sections) and CISO (security/threat model sections). Present in every project from bootstrap. Non-negotiables apply regardless of whether CISO has been formally activated. Mark items Done only when implemented AND evidenced.*
