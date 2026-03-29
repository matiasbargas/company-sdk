# Squad Workflows

> Different workflows, same protocol. Same Bus format, same escalation ladder, same requirements files — just different activation sequences and role rosters.

---

## Available Squads

| Squad | Size | Roles | Use When |
|-------|------|-------|---------|
| [website](squads/website.md) | Small–Medium | 5–7 | Building a marketing site, landing page, or docs site |
| [feature](squads/feature.md) | Small | 3–5 | Adding a well-scoped feature to an existing product |
| [mvp](squads/mvp.md) | Medium | 8–12 | Shipping an MVP to validate a hypothesis |
| [startup](squads/startup.md) | Large | 16 | Full company or product bootstrap |

---

## How Squads Work

All squads share the same foundation:

- **Same protocol** — `protocol.md` governs all communication (Bus messages, escalation ladder, decision logs)
- **Same requirements format** — Each domain has a requirements file with Pending / In Progress / Blocked / Done
- **Same role definitions** — Roles in `roles/` are the same across squads; squads just activate different subsets
- **Same levels** — `levels/ladder.md` defines how behavior scales across seniority

The difference is **activation sequence** and **role roster** — which agents run, in what order, and how abbreviated the phases are.

---

## Choosing a Squad

```
Do you have an existing product?
  ├── No → Do you need the full org?
  │         ├── Yes → startup
  │         └── No → mvp
  └── Yes → Is it a website?
             ├── Yes → website
             └── No → feature
```

---

## CLI

```bash
# View squad roster
node scripts/squad.js website
node scripts/squad.js list

# Bootstrap a new project
node scripts/bootstrap.js my-project --squad mvp
node scripts/bootstrap.js landing-page --squad website --output ./projects/landing

# Document operations
node scripts/doc.js list project.md
node scripts/doc.js append project.md --section "## Sprint 1" --content "First sprint checkpoint complete"
node scripts/doc.js add-item security-requirements.md --section Pending --item "Rate limiting"
node scripts/doc.js decision history.md --decision "Use Postgres" --context "ACID needed" --made-by CTO
```

---

## Level Ladder

See [`levels/ladder.md`](levels/ladder.md) for the full IC + Management ladder.

All roles in `roles/` include a `## Skill Behaviors by Level` section that shows how that role's specific behaviors scale across seniority levels — so you can compose squads at the right level for the work.

---

## Creating a New Squad

Copy [`squads/_template.md`](squads/_template.md) and fill in:
1. Purpose and when-to-use criteria
2. Activation sequence (phases, roles, outputs, durations)
3. Role roster (required vs. optional)
4. Success criteria and gates

Then add it to the table above.
