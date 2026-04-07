# Discovery Requirements -- sdk-v3
**Owners:** Camila (CLO) · CISO
**Last updated:** 2026-04-06
**Release:** v2026.Q2.1

> Gate file. CTO cannot start architecture until both CLO and CISO sections reach "Done" **and** jurisdictions are declared. Run `node scripts/gate-check.js <project-dir>` to verify. This is the most expensive step to skip.
>
> See `DISCLAIMER.md` — agent outputs in this file are AI-generated analysis prompts, not legal or security certifications. Outside counsel must validate legal findings for your jurisdiction.

---

## Jurisdictions

| Question | Answer |
|---|---|
| Where is the company incorporated? | N/A — open source project, no legal entity yet |
| Where are employees located? | Owner: Argentina. No other employees. |
| Where are users or customers located? | Global — developer tool distributed via npm |
| Where is data processed or stored? | Local filesystem only. No remote data processing. No cloud storage. |
| Where is money handled? | None — MIT open source, no payments, no subscriptions |

**Frameworks triggered:**

| Framework | Applicable? | Hard blocker? | Notes |
|---|---|---|---|
| GDPR | NO | No | No user data collected or processed. SDK reads/writes files on user's local machine only. |
| CCPA | NO | No | No user data. No data sale. |
| EU AI Act | SOFT | No | SDK is a developer tool that facilitates AI agent orchestration. Not deploying AI to end users. Deployer obligations fall on teams using the SDK, not the SDK itself. Document this clearly in DISCLAIMER.md. |
| SOC 2 | NO | No | Not a SaaS. No hosted infrastructure. |
| PCI-DSS | NO | No | No payment processing. |
| HIPAA | NO | No | No health data. |
| GitHub API ToS | YES | YES | Integration must comply with GitHub's Acceptable Use Policy and API ToS. Rate limits, authentication, and data handling rules apply. |
| npm publishing terms | YES | Soft | Package name, license declarations, and provenance requirements. MIT already declared in package.json. |

---

## Legal (CLO)

### Pending
- [ ] EU AI Act deployer language — confirm SDK DISCLAIMER.md adequately clarifies that deployer obligations fall on teams using the SDK, not the SDK maintainer
- [ ] GitHub API ToS review — confirm planned integrations (issue creation, PR linking, release tagging) are within permitted use
- [ ] Contributor agreement — if SDK goes public and accepts PRs, do we need a CLA or is MIT + DCO sufficient?
- [ ] npm package name ownership — confirm `company-sdk` name is uncontested; assess if rename needed before broad distribution

### In Progress

### Done
- [x] License declared — MIT in package.json and LICENSE file
- [x] DISCLAIMER.md authored — AI agent liability notice + EU AI Act human-in-the-loop language present

### Blocked

---

## Security (CISO)

### Pending
- [ ] GitHub authentication model — decision: Personal Access Token (PAT) vs GitHub App. GitHub App preferred (scoped permissions, org-level, no personal token exposure). Must be decided before GitHub integration architecture is written.
- [ ] Token storage model — how does sdk-github store credentials? Options: `.env` file (user-managed), system keychain, `~/.config/team-sdk/`. Must NOT be stored in repo files or committed to git.
- [ ] Dependency supply chain audit — `@octokit/rest` (proposed GitHub API client) and any new deps must be scanned before adding to package.json
- [ ] npm publish security — automated CI publish only (GitHub Actions + npm provenance). No manual `npm publish` from developer machines.
- [ ] Threat model for GitHub integration — adversaries: token exfiltration, repo write abuse, release tag spoofing

### In Progress

### Done
- [x] No user PII — confirmed. SDK processes local files only. No telemetry, no analytics, no remote calls except GitHub API (opt-in).
- [x] No financial data — confirmed. No payment flows.

### Blocked

---

## Gate Status

| Domain | Owner | Status | Ready to ungate CTO? |
|---|---|---|---|
| Legal | CLO | In Progress — 4 pending items, 2 done | Conditionally yes — pending items are soft; no hard blockers found |
| Security | CISO | Pending — GitHub auth model must be decided first | No — GitHub auth model is a hard prerequisite for architecture |

*CTO can draft architecture in parallel but cannot finalize GitHub integration design until CISO delivers token storage model decision.*
