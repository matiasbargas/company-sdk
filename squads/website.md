# Squad: Website

> **Use this squad when:** You need to design, build, and ship a public-facing website.
> **Size:** Small–Medium (5–7 roles, lean delivery)
> **Roles:** 5–7 activated
> **Protocol:** Same `protocol.md` — same Bus format, same escalation ladder, same requirements files.

---

## Purpose

A lean squad for shipping a website — from landing page to full marketing site to documentation site. Skips the full company activation sequence and jumps straight to scoping, architecture, and delivery. Domain specialists (CLO, CFO, etc.) are optional and only activated if the website involves regulated content, e-commerce, or user data.

## When to Use

- ✅ Marketing site, landing page, documentation site, portfolio
- ✅ Website as a standalone deliverable (not a full product)
- ✅ Speed matters more than organizational depth
- ❌ Website is the front-end of a full SaaS product with auth/data → use MVP or Startup squad instead
- ❌ Website involves PII or financial transactions → activate CISO and CLO from full sequence

---

## Activation Sequence

### Phase 0 — Brief
| # | Role | Output | Notes |
|---|------|--------|-------|
| 1 | Coordinator | Brief received, `project.md` created, squad roster confirmed | Owner → Coordinator only |
| 2 | PM | Scope document: pages, content sections, user goals, success definition | Gates CTO |

### Phase 1 — Architecture
| # | Role | Output |
|---|------|--------|
| 3 | CTO | Tech stack decision (framework, CMS, hosting, CDN), make/buy/partner matrix |
| 4 | CMO _(optional)_ | Positioning statement, brand voice, key messages per page |
| 5 | CISO _(if user data/forms)_ | Auth requirements, data handling non-negotiables |

### Phase 2 — Plan
| # | Role | Output |
|---|------|--------|
| 6 | Staff Engineer | Interface contracts: component library, routing, CMS schema, API contracts if any |
| 7 | EM | Cell composition, sprint plan, critical path |

### Phase 3 — Execution
| # | Role | Output | Notes |
|---|------|--------|-------|
| 8 | Liaison | Communication bridge between cell and Coordinator | Active until ship |
| 9 | EM + Cell | Page implementations, content integration, performance passes | Sprint-based |

### Phase 4 — Completion
| # | Role | Output | Notes |
|---|------|--------|-------|
| 10 | PM | Acceptance review against scope document | Signs off before launch |
| 11 | CMO _(if activated)_ | Brand/messaging review | Signs off on copy |
| 12 | Coordinator | Retro synthesis, history.md entry | Closes release |

---

## Role Roster

| Role | Level | Required | Owns |
|------|-------|----------|------|
| Coordinator | M3 | ✅ | Release management, `project.md`, `history.md` |
| PM | L3/M1 | ✅ | Scope document, page map, acceptance criteria |
| CTO | M4 | ✅ | Tech stack, `product-engineering-requirements.md` |
| Staff Engineer | L4 | ✅ | Interface contracts, component standards |
| EM | M1 | ✅ | Sprint delivery, cell management, `delivery-requirements.md` |
| Liaison | L3 | ✅ | Communication bridge, `liaison-log.md` |
| CMO | M3 | ⚡ optional | Positioning, brand voice, copy review |
| CISO | M3 | ⚡ if user data | Auth requirements, data handling |
| CLO | M3 | ⚡ if regulated content | Legal review |

---

## Dependency Graph

```
Owner → Coordinator
           ↓
          PM → CTO → Staff Engineer → EM
                            ↓           ↓
                       CMO (opt)     Liaison
                       CISO (opt)       ↑
                                      Cell
```

---

## Success Criteria

- [ ] All pages in scope document are shipped
- [ ] Lighthouse performance score ≥ 90
- [ ] All content reviewed and approved by PM (and CMO if activated)
- [ ] No broken links or missing assets
- [ ] Hosting, CDN, and domain configured
- [ ] `history.md` entry written for this release

---

## Gate: Ready to Start

- [ ] Owner brief received by Coordinator
- [ ] PM scope document written (page list, success definition)
- [ ] CTO tech stack decision logged to `product-engineering-requirements.md`
- [ ] Cell composition confirmed by EM

---

## Example Projects

- Marketing site for a SaaS product launch
- Documentation site for a developer tool
- Portfolio site for a design agency
- Landing page for a waitlist or product announcement
