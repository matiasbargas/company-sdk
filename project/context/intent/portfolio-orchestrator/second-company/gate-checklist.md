# Second-Owner gate checklist (D3.4)

**Status:** DESIGN. **Date:** 2026-11-15. The registry (`src/portfolio.js`, `cap-po-registry-002`) must hold **every** row below before it accepts a company whose Owner is not the holding Owner. Rows also apply before the first **two-company** run with one Owner where marked "2C" (Mario: C4, C12, C13 and C14 block the two-company run).

**Sources:** CLO = `discovery-synthesis.md` → Regulatory map ("before 2nd Owner" and "before 2 competing Owners" rows) and the Owner decisions in `history.md`; CISO = `discovery-synthesis.md` → Deferred table and the commons decision (2026-11-14 addendum); Mario = `variables.yaml` → `mario_conditions`; D3.1–D3.3 = `isolation.md`, `provider-caps.md`, `charter-amendment-proposal.md`.

**Kinds.**
- **Code** — the registry or runner computes it from files, the ledger or the OS each time. A flag cannot satisfy it.
- **Attestation** — a fact only a human or counsel can establish. It is satisfied by an attestation record in the ledger (a new holding-Owner `gate_attest` event: `{gate, attested_by, at, evidence, statement}`), signed by the Owner who owns that fact (`cap-po-second-owner-006`), never by a boolean in `portfolio.json`.
- **Both** — an attestation plus a code check on what can be checked.

**Change to today's registry.** `portfolio.json` → `second_owner_gates` is three Owner-set booleans (`os_isolation`, `multi_owner_charter_amendment`, `clo_gate_items`). Any of them can be set `true` by hand without evidence. This checklist replaces them with the rows below (`cap-po-second-owner-007`): code rows are recomputed on every registry validation, and attestation rows are read from the ledger.

## Checklist

| # | Condition | Source | Kind | How it is checked | Applies | Proposed cap | Today |
|---|---|---|---|---|---|---|---|
| G1 | The holding's CHARTER carries the ratified Owners amendment (holding Owner vs company Owner) | CLO; D3.3 | Code | The holding `CHARTER.md` has an `## Owners` section and a signed ratification line (same parse as `charterProblem()`), at a version that includes the amendment | 2nd Owner | `-008` | Not met (v0.2 unratified, no amendment) |
| G2 | The new company's CHARTER is ratified, **by its own company Owner** | CLO; `cap-po-registry-002` | Both | Code: signed ratification line (exists). Attestation: the ratification is signed with the company Owner's registered key | 2nd Owner | `-006` | Partly: line check built; signer not checked |
| G3 | A holding agreement (what the company accepts for fuel: metering, tranches, proofs, runner safeguards, commons rules; fuel non-transferable and non-redeemable) is ratified by both Owners | D3.3; CLO (fuel never a token) | Both | Attestation by each Owner with the agreement's content hash; code: both signatures verify and the hash matches the file in the holding repo | 2nd Owner | `-006`, `-007` | Not met |
| G4 | Fuel's legal category (grant, service, investment, credit) is chosen with counsel | CLO ("LOW, needs counsel") | Attestation | Holding Owner attests, citing counsel's written advice (reference only, not the advice) | 2nd Owner | `-007` | Not met |
| G5 | Outputs are assigned or licensed in writing to the company | CLO (API outputs go to the account holder) | Attestation | Both Owners attest, citing the signed assignment | 2nd Owner | `-007` | Not met |
| G6 | Personal data: the company handles none, **or** a DPA is in place | CLO (GDPR Art. 28) | Both | Attestation by the company Owner (none / DPA reference). Code: commons publication runs the secret and PII scans (`cap-po-data-001`, D2.4) | 2nd Owner | `-007` | Scans in build (D2); attestation not met |
| G7 | Provider terms allow parallel headless sessions on API keys for this use | CLO (LOW confidence, live terms not read) | Attestation | CLO record with clause and date read, attested by the holding Owner (`provider-caps.md` §4 A6; outcome O9 stops everything) | 2nd Owner, 2C | `-007` | Not met |
| G8 | Internal fuel memo, plus an intercompany note if the companies are separate entities | CLO (tax treatment) | Attestation | Holding Owner attests with the memo reference | 2nd Owner | `-007` | Not met |
| G9 | If the Owners compete: an information barrier and the `competitively_sensitive` flag on published context | CLO (Sherman §1 / TFEU 101) | Both | Attestation: both Owners state whether they compete; if yes, the barrier is described. Code: a consent record without `competitively_sensitive` is refused (D2.4) | Competing Owners | `-007` | Flag in build (D2); attestation not met |
| G10 | The second Owner acknowledges in writing that the holding operator (the Owner's account and root on the machine) can read the company's clone, home and transcripts | D3.1 §7 (honest limit) | Attestation | Company Owner attests, signed | 2nd Owner | `-007` | Not met |
| G11 | One OS user and group per company; no two companies share a user, group, home or session root | CISO (deferred OS isolation); Mario C12; D3.1 §4 | Code | Pre-flight `SANDBOX_SHARED` from the per-company `sandbox` events; doctor compares real `id -G` sets | 2nd Owner, 2C | `-001` | Not met (one sandbox user) |
| G12 | No company user can reach another company's clone, home, session root or temp folder, nor `holding/` | Mario C12; D3.1 §6 | Code | Negative reach checks with `sandbox-access.js` in pre-flight (`SANDBOX_CROSS_REACH`) and live negative proofs (`sudo -u <a> /bin/test -r <b path>` must fail) in the setup script | 2nd Owner, 2C | `-002` | Not met |
| G13 | Run files are private per company (session root `0750` group = company, files `0640`); private `TMPDIR`; session umask 077 | D3.1 §3 | Code | Doctor checks modes and owners; first-run check on created temp files | 2nd Owner, 2C | `-002` | Not met (0755/0644 shared) |
| G14 | One key per company, all different | Owner decision (one key per company); Mario C14 | Code | Pre-flight `KEY_SHARED` compares sha256 of the key files | 2nd Owner, 2C | `-003` | Not met (no cross-company check) |
| G15 | No company user can read any key file | Mario C14 | Code | Negative reach check on `holding/keys/*` for every company user; `holding/` 0700 Owner (doctor, exists for one user) | 2nd Owner, 2C | `-003` | Met for one user |
| G16 | A company user cannot see another company session's environment | Mario C14; D3.1 §5 | Code | Live probe in the setup script (`ps -E` as user B on a probe process of user A shows no probe variable) | 2nd Owner, 2C | `-004` | Not met (not built; result on macOS unverified) |
| G17 | The company key is not persisted by Claude Code outside the company's private home | Mario C14; D3.1 §5 | Both | First-run check: the Owner greps the company home for the key suffix and attests the result; code: home is 0700 to its user | 2nd Owner, 2C | `-004` | Not met (unknown) |
| G18 | Where provider caps live is verified, a hard per-company ceiling exists, and if the ceiling is per workspace each company has its own workspace and key; the company Owner cannot raise the ceiling on holding money | Mario C13; D3.2 | Both | Attestation: the outcome row O1–O9 with evidence (`provider-caps.md` §4). Code: a `provider_caps` ledger event per company; `WORKSPACE_SHARED` refused; a run refused without it, infinite fuel included | 2nd Owner, 2C | `-005` | Not met (unknown) |
| G19 | Per-key reconciliation runs every cycle for every company | Mario C14; `cap-po-reconcile-001` | Code | Cycle close with ≥ 2 companies records any company without a `reconcile` for that cycle; that company's next tranche is not drawable until it is reconciled | 2nd Owner, 2C | `-009` | Not met (reconcile is manual and optional) |
| G20 | Second metering spike done: multi-turn tools, a Task subagent, a mid-run kill, transcript backfill; meter contract tests on the recorded fixtures | Mario C4 | Both | Attestation with the experiment path; code: the recorded fixtures exist and their `@covers` tests pass | 2C | `-007` | Not met (first real run should cover it, `current-status.md`) |
| G21 | Company-Owner acts carry a signature from that Owner's registered key (adoption approval, consent record, judgment rating, grant acceptance, CHARTER ratification) | CISO (signed commons commits when a second Owner publishes); D3.3 "Proof of an Owner's act" | Code | Signatures verified against the registry's allowed signers for that company; an unsigned or wrongly signed act is refused | 2nd Owner | `-006` | Not met |
| G22 | Commons admission needs another company's roster plus the CISO; surface ids qualified `companyId/surfaceId@sha` | Owner decision 2026-11-14; Mario C11 | Code | Admission check (D2.2) | Commons use | `cap-po-commons-001` (D2) | In build (D2) |
| G23 | The outside-verifier decision for **fuel** proof is made (a second Owner fires the revisit trigger) | Owner decision 3 (accepted risk); `cap-po-proof-002` | Attestation | The holding Owner's decision is logged in `history.md` and attested with its heading; `sdk-health` already reports it as due | 2nd Owner | `-007` | Not met (trigger built, decision not made) |
| G24 | Holding and company clones never nested; `sdkPath` pinned | Mario C7 | Code | `validatePortfolio()` (exists) | Always | `cap-po-registry-002` | Met |
| G25 | Registering another person's company is logged as a decision with both gates if marked `Reversible: NO` (shared data cannot be unshared) | CHARTER Autonomy Limit 4 | Attestation | `history.md` entry with Mario's review and the Owner's sign-off | 2nd Owner | `-007` | Not met |

## Summary by kind

25 rows: **11 code** (G1, G11, G12, G13, G14, G15, G16, G19, G21, G22, G24), **7 attestation** (G4, G5, G7, G8, G10, G23, G25), **7 both** (G2, G3, G6, G9, G17, G18, G20). Rows marked 2C (G7, G11–G20) also block the first two-company run with one Owner.

## Order of work

1. Owner: ratify CHARTER v0.2, then rule on the amendment (G1).
2. Owner: run the provider check (G18, G7); it can kill the plan (O4, O5, O9) before any code is written.
3. Build `cap-po-second-owner-001` to `-005` (isolation and keys), then `-009`, then `-006`/`-007`/`-008`.
4. CLO with counsel: G4, G5, G8, G9; the second Owner: G2, G3, G10.
5. Mario reviews the per-company user design (D3.1) and the new ledger events before they are written for real (C1 formats).
