# Squad: Website

> **Use this squad when:** You need to design, build, and ship a public-facing website.
> **Duration:** 3–10 days
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

### Phase 0 — Brief (Day 1)
| # | Role | Output | Notes |
|---|------|--------|-------|
| 1 | Coordinator | Brief received, `project.md` created, squad roster confirmed | Owner → Coordinator only |
| 2 | PM | Scope document: pages, content sections, user goals, success definition | Gates CTO |

### Phase 1 — Architecture (Day 1–2)
| # | Role | Output | Duration |
|---|------|--------|---------|
| 3 | CTO | Tech stack decision (framework, CMS, hosting, CDN), make/buy/partner matrix | 1 day |
| 4 | CMO _(optional)_ | Positioning statement, brand voice, key messages per page | 1 day |
| 5 | CISO _(if user data/forms)_ | Auth requirements, data handling non-negotiables | 0.5 day |

### Phase 2 — Plan (Day 2–3)
| # | Role | Output | Duration |
|---|------|--------|---------|
| 6 | Staff Engineer | Interface contracts: component library, routing, CMS schema, API contracts if any | 1 day |
| 7 | EM | Cell composition, sprint plan, critical path | 0.5 day |

### Phase 3 — Execution (Days 3–N)
| # | Role | Output | Duration |
|---|------|--------|---------|
| 8 | Liaison | Daily communication bridge between cell and Coordinator | Active until ship |
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
| Liaison | L3 | ✅ | Daily communication, `liaison-log.md` |
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
