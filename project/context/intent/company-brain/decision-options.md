# Brain storage and identity model: decision options (prepared, not decided)

**Prepared by:** CTO, with CFO, CISO, Mario and CLO verifying (2026-11-15) · **Release:** v2026.Q2.3
**Status:** waiting for the Owner. Working surface: `project/surfaces/SURFACE-20261115-brain-identity-storage-001.md` (state `blocked`: the CISO no-go is unresolved).
**Rule:** agents prepared this. Only the Owner decides it (CHARTER Autonomy Limit 4, protocol §34.7).

## 1. What is actually irreversible

| # | Sub-decision | Irreversible? | Same in (a), (b), (c)? |
|---|---|---|---|
| D1 | Truth lives in each company's own git repo; everything else is derived | Yes | Yes |
| D2 | Principal id format and where the registry lives | Yes (ids enter append-only signed history) | Yes |
| D3 | Signature scheme and verification point | Mostly (old signatures must verify forever) | **No: this is where the options differ** |
| D4 | Transport (CLI, local MCP, GitHub PR, HTTP gateway) | No | No, and it does not matter: every transport ends in the same signed commit |

D4 does not need to wait for this decision.

## 2. Options at a glance

| | (a) Signed-commit principals + local MCP | (b) OIDC + HTTP gateway writing signed commits | (c) Hybrid: (a) now for internal humans, (b) later for external ones |
|---|---|---|---|
| Who signs | The human's own key | The gateway's KMS key, attesting for the human | The human now; the gateway later, under one envelope |
| Server-side check | GitHub ruleset + CI (neither exists yet) | The gateway, plus the ruleset | Ruleset + CI now |
| Cash, recurring (CFO, assumptions) | about $0 | IdP seats + hosting + KMS + **on-call** | about $0 now |
| Cash, one-time | About $50–$90 per human, two hardware keys each | IdP setup, gateway build | (a) now |
| Reversal cost | Low for transport; **high for D2/D3** once on `main` | **High**: vendor, KMS trust root, second provenance meaning, hosted service | Low now; the (b) cost is paid only if triggered |
| CISO NN1: strong per-person authentication | Partial: met only with touch-required keys | Met | As (a), then (b) |
| CISO NN2: per-company authorization and isolation | Storage met (repo per company). Machine isolation not met: agents share the Owner's OS user | Met if the gateway authorizes per tenant | As (a), then (b) |
| CISO NN3: append-only, server-verified signed provenance | Partial: no server-side check yet | Met as designed | As (a) |
| CISO NN4: human content untrusted + passed red-team | Not met (no red-team loop run) | Not met | Not met |
| CISO NN5: ingestion scan, access log, incident plan | Not met (scan is publish-time only) | Can be met at the gateway | Not met |
| Verdicts | — | — | **Recommended.** CISO no-go until C1–C4; CFO, Mario, CLO concern |

## 3. Conditions collected from the roster

| Id | From | Condition | Blocks |
|---|---|---|---|
| C1 | CISO | Human signing keys are non-exportable and need a physical touch (FIDO2 `-sk` or Secure Enclave). Enrolment is recorded in an Owner-signed commit. | Any human verdict counting |
| C2 | CISO | `allowed_signers` and principal registry changes are accepted only from Owner-signed commits, verified on the server (ruleset + CI). | Same |
| C3 | CISO | A fail-closed secret/PII scan runs on every human-path write before the commit. Reuse `packages/holding/src/commons/scan.js`. | Same |
| C4 | CISO | A §32 red-team loop on human-content injection has run and passed against the real write path. | Same |
| M1 | Mario | Rotation sets `valid-before`; lines in `allowed_signers` are never deleted. | Implementation start |
| M2 | Mario | One provenance envelope (`principal`, `signed_by`, `attested_by?`, `kind`) in commit trailers and block provenance, decided now. | Implementation start |
| M3 | Mario | `human:<handle>` is scoped per company and is never a commons join key. | Implementation start |
| M4 | Mario | Agent commits carry `principal: agent:<role>:<name>` in the same envelope. | Implementation start |
| F1 | CFO | The (b) trigger is written down as a named condition and reopens the decision with a budget. It never starts a build automatically. | (b) |
| F2 | CFO | Check that the GitHub plan supports a required-signed-commits ruleset on the repo. | C2 |
| L1 | CLO | Pseudonymous handles and noreply emails only. The person mapping stays outside git. No names or emails in the registry. | Any human enrolment |
| L2 | CLO | A written contributor term (content IP to the company, notice that the handle and signature are permanent) before a second human writes. | Second human |
| L3 | CLO | A DPA with the IdP vendor, contributor terms and a breach process (GDPR 72-hour clock) before any external human. | (b) |

## 4. Signature sheet

Tick one option. If you choose (c), each line below is part of what you sign. Strike out any line you reject and give a reason; the reason is logged beside your decision.

- [ ] **(c) hybrid** (recommended)
  1. D1: each company's brain truth is its own git repository; everything else is derived.
  2. D2: principals are `human:<handle>` / `agent:<role>:<name>`, scoped per company, registered in `## Principals` in `team.md`, with no names or emails.
  3. D3: SSH commit signing with touch-required, non-exportable keys. `allowed_signers` is generated from the registry, and revocation uses `valid-before` only. I enable the GitHub ruleset and the CI check myself (a push, Autonomy Limit 1).
  4. Envelope: `principal`, `signed_by`, `attested_by?`, `kind`.
  5. No human verdict counts until the CISO withdraws the no-go on evidence of C1–C4.
  6. The (b) trigger: a named external human who needs write access and cannot use git. Reaching it reopens this decision with a CFO budget and CLO blockers L3.
- [ ] **(a) only.** Internal humans only; no external path planned.
- [ ] **(b) now.** Requires a CFO budget and the CLO L3 blockers first. The CFO would record a no-go.
- [ ] **None.** The brain stays agent-and-Owner only; revisit when: ______

Dissent acknowledged: CISO no-go (C1–C4) · CFO concern (F1, F2) · Mario concern (M1–M4) · CLO concern (L1–L3)

**Decided by:** __________________________ (Owner) **on** __________

Once signed, the decision is logged to `history.md` per §6 (Reversible: NO for D1, D2 and D3), with the dissent listed. The surface then records a reconciliation block, or an Owner override of the CISO no-go if you choose to override it.
