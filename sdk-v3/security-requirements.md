# Security Requirements -- sdk-v3
**Owner:** CISO (Sebastián Seoul)
**Last updated:** 2026-04-06
**Release:** v2026.Q2.1

> This file exists in every bootstrapped project — not just projects where CISO has been activated.
> The non-negotiables below are the minimum that must be true before any user touches the product.
> "Done" here means implemented AND evidenced. A control documented but not verifiable in an audit is not done.
>
> See `DISCLAIMER.md` — CISO outputs are AI-generated security analysis. They are not a certified security audit.

---

## Non-Negotiables (required before first user — no exceptions)

*SDK-specific interpretation: "first user" = first npm install by someone other than the owner. These controls apply to the SDK's own security posture, not to downstream projects built with it.*

### Secrets & Token Handling (highest priority for this project)
- [ ] GitHub token never stored in repo files or committed to git | Owner: CTO | Evidence: .gitignore confirms, repo scan clean
- [ ] GitHub token stored in user-controlled location only (.env excluded from git, OR system keychain) | Owner: CTO | Evidence: README documents storage method clearly
- [ ] Token permission scope minimized — read:repo + write:issues + write:releases only (no admin, no delete) | Owner: CTO | Evidence: GitHub App or PAT scope documented
- [ ] GitHub App preferred over PAT for org-level use — PAT acceptable for personal projects | Owner: CISO decision pending | Evidence: auth model decision logged to history.md

### Dependency Supply Chain
- [ ] Dependency audit before any new package added to package.json | Owner: CTO + CISO | Evidence: npm audit clean, no high/critical CVEs
- [ ] GitHub Actions workflow uses pinned action versions (SHA pins, not tags) | Owner: CTO | Evidence: workflow files reviewed
- [ ] npm provenance attestation enabled on publish | Owner: COO | Evidence: npm publish workflow config

### SDK Distribution Security
- [ ] npm package published only via automated GitHub Actions (no manual `npm publish`) | Owner: COO | Evidence: workflow config
- [ ] Package contents verified before publish: `npm pack --dry-run` output reviewed | Owner: CTO | Evidence: CI step
- [ ] No credentials, tokens, or .env files included in npm package (check .npmignore / files field in package.json) | Owner: CTO | Evidence: package.json `files` field + npm pack output

### Identity and Access (N/A for local CLI tool)
- [x] No user authentication managed by SDK — users authenticate to GitHub directly. SDK does not manage user identities. | Status: Done by design

### Data Protection (N/A — no data collected)
- [x] No user PII collected or processed by SDK | Status: Done by design
- [x] No remote data storage | Status: Done by design
- [x] All file operations are local to user's machine | Status: Done by design

### KYC / AML
- [x] Not applicable — no financial product | Status: N/A confirmed

---

## Threat Model

### Pending
- [ ] Token exfiltration — adversary reads GitHub token from user's filesystem or environment. Mitigation: document secure storage, warn if .env is not in .gitignore
- [ ] Repo write abuse — compromised SDK version creates/modifies issues or releases without user intent. Mitigation: GitHub App with minimal scopes; explicit user confirmation before write operations
- [ ] Release tag spoofing — malicious PR introduces code that runs on `sdk-ship`. Mitigation: npm provenance attestation + pinned GitHub Actions
- [ ] Dependency confusion — a malicious package with the same name as a private dep. Mitigation: all deps are public npm packages; npm audit in CI

### In Progress

### Done

### Blocked

---

## Compliance Roadmap

### Done
- [x] No GDPR, HIPAA, PCI-DSS, SOC 2 obligations — confirmed in discovery-requirements.md. SDK is a local developer tool with no user data.
- [x] GitHub API ToS compliance — required. Review pending (CLO).
- [x] MIT license — confirmed in package.json and LICENSE.

---

## Incident Response

### Pending
- [ ] Compromised npm package response plan: if the SDK package is compromised, what is the owner's response? (yank package version, publish patch, notify GitHub Security Advisory, post to npm)
- [ ] Compromised GitHub token response plan: document for SDK users — if their GitHub token is exposed, what steps? (revoke token, audit GitHub audit log, rotate)

### Done
- [x] No user data breach scenario — N/A. No user data stored.

---

## Vendor Security Tiers

| Vendor | Tier | Data access | DPA signed | CISO sign-off | Status |
|---|---|---|---|---|---|
| GitHub API | Tier 3 | No user PII — reads/writes repo metadata, issues, releases on user's authenticated account | N/A | Pending | Auth model decision pending |
| npm registry | Tier 3 | No data access — package distribution only | N/A | N/A | Standard contract |
| GitHub Actions | Tier 3 | Accesses npm token + GitHub token during CI publish only | N/A | Pending | Token handling in workflow pending review |

**Tier definitions:**
- **Tier 1** — access to production user PII or financial data. Requires: security questionnaire + DPA + CISO sign-off before any data is shared.
- **Tier 2** — access to non-production or anonymized data. Requires: DPA.
- **Tier 3** — no data access. Requires: standard contract review (CLO).

---

*security-requirements.md — owned by CISO. Present in every project from bootstrap. Non-negotiables apply regardless of whether CISO has been formally activated. Mark items Done only when implemented AND evidenced.*
