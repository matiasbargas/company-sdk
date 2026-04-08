# Security Requirements -- [PROJECT NAME]
**Owner:** CISO (Sebastián Seoul)
**Last updated:** [DATE]
**Release:** [RELEASE]

> This file exists in every bootstrapped project — not just projects where CISO has been activated.
> The non-negotiables below are the minimum that must be true before any user touches the product.
> "Done" here means implemented AND evidenced. A control documented but not verifiable in an audit is not done.
>
> See `DISCLAIMER.md` — CISO outputs are AI-generated security analysis. They are not a certified security audit.

---

## Non-Negotiables (required before first user — no exceptions)

These items cannot be deferred to Sprint 3. If they are not done, the release does not ship.

### Identity and Access
- [ ] MFA enforced for all users — no exception path | Owner: [Role] | Evidence: [how verified]
- [ ] Short-lived tokens: 15-min access token, 24-hour refresh max | Owner: [Role] | Evidence: [config ref]
- [ ] Least-privilege API keys and service accounts — no shared credentials | Owner: [Role] | Evidence: [audit log]
- [ ] Zero-trust internal services — every service authenticates to every other | Owner: [Role] | Evidence: [architecture ref]

### Data Protection
- [ ] Encryption at rest: AES-256, managed keys via KMS | Owner: [Role] | Evidence: [config ref]
- [ ] Encryption in transit: TLS 1.3 minimum, no HTTP anywhere | Owner: [Role] | Evidence: [scan result]
- [ ] PII isolated in encrypted, access-controlled storage | Owner: [Role] | Evidence: [data model ref]
- [ ] Data residency enforced per user jurisdiction (see `discovery-requirements.md`) | Owner: [Role] | Evidence: [config ref]

### Secrets Management
- [ ] No secrets in code, ever — Secrets Manager for all credentials | Owner: [Role] | Evidence: [repo scan]
- [ ] Dependency scanning in CI/CD — every PR checked before merge | Owner: [Role] | Evidence: [CI config ref]
- [ ] No direct production database access from developer machines | Owner: [Role] | Evidence: [access policy]

### KYC / AML (complete only if financial product)
- [ ] KYC verification before any financial action | Owner: [Role] | Evidence: [flow ref]
- [ ] OFAC / sanctions screening on every transaction | Owner: [Role] | Evidence: [integration ref]
- [ ] AML screening on all new users and beneficial owners | Owner: [Role] | Evidence: [policy ref]

---

## Threat Model

> Complete when CISO is activated. The non-negotiables above are independent of CISO activation.

### Pending
- [ ] Threat model written — adversaries, high-value assets, attack vectors, mitigations | Owner: CISO

### In Progress

### Done

### Blocked

---

## Compliance Roadmap

### Pending
- [ ] Applicable frameworks identified (from `discovery-requirements.md`) | Owner: CISO
- [ ] SOC 2 Type I path defined (if applicable) | Owner: CISO
- [ ] GDPR DPAs with all data processors confirmed (if EU users) | Owner: CISO + CLO
- [ ] Evidence collection approach documented for each required framework | Owner: CISO

### In Progress

### Done

### Blocked

---

## Incident Response

### Pending
- [ ] P0 response chain documented (CEO + CLO notified within 1 hour — see protocol.md Section 2) | Owner: CISO
- [ ] Incident severity matrix defined (P0–P3 with response times) | Owner: CISO
- [ ] Customer notification protocol documented | Owner: CISO + CLO
- [ ] GDPR 72-hour breach notification process confirmed | Owner: CLO + CISO

### In Progress

### Done

### Blocked

---

## Vendor Security Tiers

| Vendor | Tier | Data access | DPA signed | CISO sign-off | Status |
|---|---|---|---|---|---|
| [Vendor name] | 1 / 2 / 3 | [What data] | YES / NO / N/A | YES / NO / N/A | Pending |

**Tier definitions:**
- **Tier 1** — access to production user PII or financial data. Requires: security questionnaire + DPA + CISO sign-off before any data is shared.
- **Tier 2** — access to non-production or anonymized data. Requires: DPA.
- **Tier 3** — no data access. Requires: standard contract review (CLO).

---

*security-requirements.md — owned by CISO. Present in every project from bootstrap. Non-negotiables apply regardless of whether CISO has been formally activated. Mark items Done only when implemented AND evidenced.*
