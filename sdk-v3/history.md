# History -- sdk-v3

> Every release ships with a history entry. Every significant mid-release decision gets an entry. Format: protocol.md Section 10.

---

## [Project Start] — sdk-v3 Discovery Initiated
**Date:** 2026-04-06
**Made by:** Greg (CEO)
**Status:** Active

**What happened:**
Owner briefed Greg on sdk-v3. The core thesis: team-sdk reaches genesis (people install it) but not catalysis (it doesn't change how teams work). v3 addresses this by making documentation mandatory and machine-enforced, integrating GitHub as a first-class citizen, elevating versioning from a convention to a CLI feature, and building owner-facing tooling modeled on YC/a16z onboarding playbooks. Discovery activated with startup squad.

**Capital / constraints:**
- Budget: bootstrapped, no external spend
- Team: small — owner + AI agents
- Hard constraints: Node.js >=18, CLI + file system only (no SaaS), GitHub only (no other VCS in v3), no AI inference in scripts

**Key decisions:**
- Decision: Ship to CLI + file system, not SaaS. Rationale: the SDK's power is that it lives in the repo. SaaS would break that. Reversible: yes, but not in this cycle.
- Decision: GitHub-only VCS integration in v3. GitLab/Bitbucket deferred. Rationale: scope control — doing one integration well beats three done poorly.
- Decision: Documentation gates must feel like guardrails, not gatekeepers. The enforcement model is advisory-first, blocking only at release close (not mid-sprint). This is the critical UX distinction from v2.

---

[Future release entries go here. Use the format from protocol.md Section 10.]
