# Project Map -- sdk-v3 / The Extractable Core
**Release:** v2026.Q2.2
**CEO Validation:** [ ] PENDING
**Sealed by:** —

> The Project Map is the complete artifact produced by this project. It is validated by the CEO before the release is considered closed.

---

## 1. What Was Built

### Deliverables
- [x] **@team-sdk/protocol** (v1.0.0) — Machine-readable Bus message schema (JSON Schema), canonical parser (`parseBusMessage`), validator (`validateBusMessage`), unified role taxonomy (26 roles as data structure), action registry, intent resolver, and all protocol enums. Zero runtime dependencies. 399 tests.
- [x] **@team-sdk/context** (v1.0.0) — Context index generator (`generateIndex`), manifest generator (`generateManifest`), declarative file catalog (24 entries with version field), query API (`queryContext`), schema versioning with `SUPPORTED_SCHEMA_VERSIONS`, path-traversal-safe file resolver, markdown section utilities, frontmatter parser, staleness calculator. 180 tests.
- [x] **@team-sdk/cli** (v1.0.0) — Consultation extension API (`createConsultant` factory), role resolver, role loader (parses .md into structured sections), context loader (works with or without project), keyword-based role suggestion (`suggestRole`). 152 tests.
- [x] **Monorepo workspace** — npm workspaces configured at root. Three packages in `packages/` directory. Dependency chain: protocol (zero deps) → context → cli.
- [x] **doc.js extraction** — `cmdManifest` and `cmdIndex` delegated to @team-sdk/context. ~400 lines removed from doc.js. Thin re-export wrappers in `scripts/lib/intent-resolver.js` and `scripts/lib/action-registry.js`.
- [x] **Schema version bump** — context-index.json bumped from v2.0 to v3.0. Backward compatibility: SUPPORTED_INDEX_VERSIONS includes both 2.0 and 3.0.

### What Did Not Ship (and why)
- Tier 2: Cross-Project Memory — blocked on Tier 1 completion. Deferred to next cycle.
- Tier 2: Pluggable LLM Runtime — blocked on protocol spec. Deferred.
- Tier 2: Squad Marketplace — blocked on protocol + runtime. Deferred.
- ajv dependency for JSON Schema validation — CTO decided pure JS validation for v1, ajv deferred. Rationale: zero-dependency principle for @team-sdk/protocol.
- npm publish — packages built but not published. Awaiting Anthropic acceptable use policy verification (CLO action item).

---

## 2. Mission Record

### Missions Executed
| Mission | Pod | Appetite | Outcome | Shipped |
|---|---|---|---|---|
| Protocol Schema (@team-sdk/protocol) | CTO (direct build) | S (1 week) | Met | 2026-04-17 |
| Knowledge Graph (@team-sdk/context) | CTO + PM (direct build) | M (2 weeks) | Met | 2026-04-17 |
| Consultation Extension (@team-sdk/cli) | PM + CTO (direct build) | M (2 weeks) | Met | 2026-04-17 |

### Missions Deferred
| Mission | Reason | Recommended for next cycle? |
|---|---|---|
| Cross-Project Memory | Depends on Knowledge Graph (now shipped) | YES |
| Pluggable LLM Runtime | Depends on Protocol Spec (now shipped) | YES |
| Squad Marketplace | Depends on Protocol + Runtime | YES (after runtime ships) |

---

## 3. Decision Log

Every consequential decision made during this release. Full detail in `history.md`.

| Date | Decision | Made by | Reversible | Reference |
|---|---|---|---|---|
| 2026-04-17 | Monorepo with npm workspaces (3 packages) | CTO, confirmed by Owner | YES | history.md: New Discovery Cycle |
| 2026-04-17 | doc.js audit before timeline commitment | Owner | YES | history.md: New Discovery Cycle |
| 2026-04-17 | Consultation extends agentic environments, not standalone binary | Owner | YES | history.md: New Discovery Cycle |
| 2026-04-17 | Package names: @team-sdk/protocol, @team-sdk/context, @team-sdk/cli | CTO, Mario approved | NO (npm scope permanent) | history.md: Mario Gate |
| 2026-04-17 | parseBusMessage stays regex-based (with contract test suite) | CTO, Mario approved with conditions | YES | history.md: Mario Gate |
| 2026-04-17 | Role mapping unified as data structure (not if-chains) | CTO, Mario approved with conditions | YES | history.md: Mario Gate |
| 2026-04-17 | CATALOG becomes declarative schema with version field | CTO, Mario approved with conditions | YES | history.md: Mario Gate |
| 2026-04-17 | context-index.json schema version bumped to 3.0 | CTO, Mario approved | NO (consumers depend on version) | history.md: Mario Gate |
| 2026-04-17 | CLO gate: MIT → scoped npm, no issues | CLO | N/A | history.md: CLO + CISO Gate |
| 2026-04-17 | CISO gate: path traversal guard required, npm 2FA required | CISO | N/A | history.md: CLO + CISO Gate |
| 2026-04-18 | Bus communication mandatory everywhere (dogfood fully) | Owner | YES | history.md: Bus Policy Decision |

---

## 4. Frameworks and Processes Established

- **Package extraction pattern:** Identify functional clusters in monolith → extract to package → update monolith to thin re-export → run existing tests to verify zero regression. Applied successfully to doc.js (CATALOG, manifest, index) and scripts/lib (intent-resolver, action-registry).
- **Contract test suite discipline (Mario condition):** Before any external consumer imports a function, the contract test suite must cover every field, edge case, and malformed input. Applied to parseBusMessage (40 tests), validateBusMessage (30 tests), ROLES (329 tests).
- **Schema version negotiation:** SUPPORTED_SCHEMA_VERSIONS constant exported from packages. Consumers check programmatically, not by hardcoding strings. Applied to context-index.json (2.0 + 3.0) and context-manifest.json (1.0).

---

## 5. Architecture and Technical Decisions

- **Dependency chain:** protocol (zero deps) → context (depends on protocol) → cli (depends on both). This is irreversible — adding a reverse dependency would create a cycle.
- **Relative imports during dev, npm workspace resolution for publish:** Packages use relative paths (`../../protocol/src`) during development. npm workspaces will resolve `@team-sdk/protocol` on publish. This avoids requiring `npm install` for dev.
- **Pure JS validation (no ajv):** @team-sdk/protocol validates Bus messages with hand-written checks, not JSON Schema + ajv. Rationale: zero dependencies for the protocol package. ajv can be added later without changing the interface.
- **Role mapping as frozen data structure:** 26 roles defined as `Object.freeze()` map. All consumers look up by key or title — no if-chains. Mario condition.

---

## 6. Guardrails and Non-Negotiables Discovered

- **Path traversal guard (CISO):** Every file-reading operation in @team-sdk/context goes through `safePath()` with realpath verification against project root. Symlink escapes tested.
- **npm supply chain (CISO):** 2FA on org account, provenance attestation (`--provenance` flag), pin deps with package-lock.json, `npm audit` in CI. Required before first publish.
- **Contract tests before export (Mario):** No function exported from a package without a contract test suite. This is a non-negotiable for the extractable core.
- **Bus mandatory everywhere (Owner):** Bus communication is mandatory for all inter-agent communication, including internal SDK development. The SDK dogfoods its own protocol.

---

## 7. Open Questions for Future Discussions

- **Anthropic acceptable use policy:** CLO flagged: verify that CLI tool extensions are explicitly permitted before first npm publish. Not a blocker for development, but blocks distribution.
- **doc.js full decomposition:** Only Clusters A (markdown utils) and D (context generation) were extracted. Clusters B (protocol-aware), C (team management), E (sessions), F (discovery), G (history/disagreement) remain in doc.js. Future extraction depends on Tier 2 scope.
- **Consultation Mode distribution:** How does a user install `/ask` capability into their Claude Code environment? The `createConsultant()` API exists but no distribution mechanism. MCP server? Custom skill? npm global install?
- **Cross-project knowledge graph schema:** When Tier 2 starts, the decision record schema (kills, decisions, challenges) needs to work across projects. The per-project schema exists in @team-sdk/context; the cross-project aggregation is undefined.

---

## 8. Requirements State at Close

| Domain | File | Pending at close | Done | Notes |
|---|---|---|---|---|
| Product | product-requirements.md | Tier 2 missions | Tier 1 missions | Kanban partially updated |
| Engineering | engineering-requirements.md | Tier 2 architecture | Tier 1 packages + pods | Comprehensive, 768 lines |
| Legal | discovery-requirements.md | Anthropic AUP check | MIT + npm scoped, no PII | CLO gate cleared |
| Security | security-requirements.md | npm publish hygiene | Path traversal guard, auth model | CISO gate cleared |

---

## 9. Area Logs State at Close

| Area | File | CEO sign-off |
|---|---|---|
| Strategy | strategy-log.md | [x] Current — 1 discovery entry |
| Engineering | engineering-log.md | [x] Current — 4 entries, Mario gate, pod completions |
| Product | product-log.md | [x] Current — 1 shaping entry, Kanban board |
| Design | design-log.md | [x] Intentionally empty — no design scoped for Tier 1 |
| Operations | operations-log.md | [x] Backfilled — CLO, CISO, CFO gate entries |
| People | people-log.md | [x] Updated — Tier 1 agent activations logged |
| Research | research-log.md | [x] N/A — no research chapter for SDK project |

---

## 10. Retrospective Summary

Tier 1 shipped all three packages in a single session. The extraction pattern worked: identify clusters, extract to package, re-export from original, verify with existing tests. 848 tests, zero failures.

What worked: The gate sequence (CLO → CISO → CTO → Mario → PM) produced high-quality architecture decisions. Mario's conditions (contract tests, data structure for roles, schema versioning) directly improved the packages. The CTO's doc.js audit identified the extraction seams accurately.

What to change: The execution bypassed the framework's pod model — no formal pod composition, no Bus messages, no EM sprint management. This was pragmatic for velocity but means the project can't serve as a full dogfood reference. For Tier 2, use the Bus. Compose pods. Run the full protocol. The Bus is now mandatory everywhere (Owner decision 2026-04-18).

What to keep: The mission-shaped, dependency-ordered build (Protocol → Context → CLI) was the right sequencing. Each package had a clean done definition. The existing test suite caught the schema version bump immediately. Keep the pattern of shipping with existing tests as the regression gate.

---

## 11. CEO Validation Checklist

- [x] All deliverables are documented in Section 1
- [x] All missions are recorded in Section 2 (including deferred)
- [x] All consequential decisions are in Section 3 and `history.md`
- [x] Any new frameworks or processes are documented in Section 4
- [x] All Non-Negotiables discovered are in Section 6
- [x] Open questions for future cycles are captured in Section 7
- [x] All requirements files reflect actual state (Section 8)
- [x] All area logs are current (Section 9)
- [x] Retrospective is written (Section 10)
- [ ] `current-status.md` updated to reflect release close
- [ ] `history.md` has the release close entry

**CEO sign-off:** [ ] PENDING — awaiting current-status.md update and history.md close entry.

---

*Project Map awaits final seal by Coordinator after CEO validation and remaining items.*
