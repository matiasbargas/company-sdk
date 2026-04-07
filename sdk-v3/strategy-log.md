# Strategy Log -- [Project Name]
**Area:** Strategy / CPTO / CEO
**Who writes here:** CEO, Coordinator, CPTO — all levels. Strategy-level decisions, Betting Table outcomes, direction changes, and cross-area announcements.
**Update trigger:** When a strategic decision is made, a direction changes, or a Betting Table cycle closes. Not on a schedule.

> This is the single narrative for strategy-layer activity. Every level in this area writes here. Read this log first when you need to understand why the team is doing what it's doing.

---

## Entry Format
```
[YYYY-MM-DD] [ROLE] [LEVEL]
Goal/Change: [What is being announced or decided]
Expected outcome: [What changes as a result — measurable if possible]
Themes served: [Theme 1 / Theme 2 / Theme 3 / Theme 4 — see STRATEGY.md]
Requirements discovered: [List any new requirements; add to relevant requirements file immediately]
Delegates to: [Which roles/areas are taking action from this entry]
Status: ACTIVE | COMPLETED | BLOCKED | CANCELLED
```

---

## 2026-04-06 Greg (CEO) M4
Goal/Change: sdk-v3 Discovery opened. Strategic direction set: evolve team-sdk from a framework (genesis) to an operating system (catalysis). Three pillars: mandatory documentation with machine enforcement, GitHub-native integration, owner-facing CLI modeled on YC/a16z onboarding.
Expected outcome: Teams that adopt sdk-v3 complete at least one full Discovery → Execution cycle with all documentation gates satisfied. 10 public "this is how we work now" stories at 18 months. Owners run sdk-status and sdk-ship without engineering help.
Themes served: Faster Delivery of the Right Things / Higher Quality and Better Customer Experience / Financial and Operational Efficiency
Requirements discovered:
- Documentation enforcement must be advisory during sprint, blocking only at release-close gate
- GitHub integration is first-class, not a plugin — issues ↔ missions, PRs ↔ tickets, releases ↔ history.md
- Versioning becomes a CLI command (sdk-release, sdk-version), not a convention
- Owner CLI surface (sdk-status, sdk-ship) is a separate UX concern from the agent-facing CLI
Delegates to: Coordinator (Phase 1 sequencing), CLO (compliance map), CISO (security review), CFO (budget model), CMO (market framing), CTO (after CLO+CISO gate)
Status: ACTIVE

---

## Betting Table Log
```
BETTING TABLE CYCLE: [YYYY-MM-DD]
Run by: [CPTO/Head of Product name]
Release: v2026.Q[QUARTER].[INCREMENT]

Missions selected:
- [Mission name] | Appetite: [N weeks] | Pod: [members TBD]

Missions deferred:
- [Mission name] | Reason: [why not this cycle]

Missions dropped:
- [Mission name] | Reason: [why abandoned]

Next Betting Table: [trigger: when current missions complete, not a fixed date]
```

---

*Strategy log is persistent. Entries do not expire. The Coordinator reviews it at every release close. The CEO validates completeness before the project map is sealed.*
