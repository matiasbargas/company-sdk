# Second company — where provider spend caps live (D3.2, Mario C13)

**Status:** DESIGN; the facts below are **not verified**. The Owner performs the check in §4 and records the outcome. **Date:** 2026-11-15.
**Binding sources:** `variables.yaml` → `mario_conditions.C13` ("CTO + CLO verify where provider spend caps live (per key vs per workspace); if workspace, one workspace + key per company — BLOCKS two-company run"), `Fuel.physical` (one API key per company), `Runner.budget_ceiling` (`--max-budget-usd` is soft; the provider key cap is the hard ceiling); `claims.yaml` → `cap-po-budget-001`, `cap-po-reconcile-001`; `discovery-synthesis.md` → Regulatory map row 1 (provider terms: LOW confidence on exact clauses, live terms not read).

## 1. Why this matters

The runner's budget flag overshoots (spike 1: $0.05 cap ended at $0.084; README: $0.02 set, $0.085 spent). A session can also read its own key from its environment and spend outside the runner (`isolation.md` §5). So the **only hard ceiling** on a company's spend is whatever the provider enforces. With two companies, the ceiling must be per company. If the provider caps only at a level that two companies share, company A can exhaust the money that funds company B, and no runner code can prevent it.

## 2. What we know and what we do not

| Statement | Status | Source |
|---|---|---|
| The runner passes one API key per company through the environment | **Known** (built) | `src/runner/spawn.js`, `cap-po-sandbox-001` |
| `--max-budget-usd` is checked after a turn and overshoots | **Known** (measured twice) | `record/experiments/2026-11-13-metering-spike/`, `2026-11-14-metering-spike-2/` |
| Killed sessions may be billed with no usage visible to the runner | **Known as possible** (spike 2, run b); amount unknown | `history.md` → "Metering spike 2" |
| The provider lets a spend limit be set **per API key** | **UNKNOWN** | Not checked |
| The provider lets a spend limit be set **per workspace** (a group of keys) | **UNKNOWN** | Not checked. Mario's C13 names this possibility; nobody has confirmed it |
| The provider has an **organization-wide** spend limit | **UNKNOWN** | Not checked |
| A limit, wherever it lives, **refuses requests** once reached (hard) rather than only alerting | **UNKNOWN** | Not checked |
| How quickly spend counts against a limit (real time vs delayed), so how far a limit can be overshot | **UNKNOWN** | Not checked |
| Whether the provider reports usage **per key** or only per workspace / organization (needed for per-key reconciliation, C14) | **UNKNOWN** | Not checked |
| Whether rate limits are per key, per workspace or per organization (the `concurrency` assumption in `variables.yaml` is marked untested) | **UNKNOWN** | Not checked |
| Who in the provider console can change a limit (a company Owner with console access could raise the cap on holding money) | **UNKNOWN** | Not checked |
| Whether the provider's terms allow parallel headless sessions on API keys for this use | **UNKNOWN** (CLO: LOW confidence, live terms not read) | `discovery-synthesis.md` Regulatory map |

The team's prior belief is that the console groups keys into workspaces and that limits attach to workspaces rather than single keys. **It is a belief, not a fact, and no decision below depends on it**: every outcome has a row.

## 3. Decision table

Read the outcome of §4 into the first column. "Per-company cap" means a hard limit that only one company's key can consume.

| # | Outcome of the check | Per-company hard ceiling possible? | Account topology | Registry / runner rule | C13 |
|---|---|---|---|---|---|
| O1 | Hard limits exist **per key** | Yes | One key per company (any workspace). Each key's limit ≤ that company's cycle appetite | Record `scope: key` and the limit per company; refuse a run when absent | Met when recorded for every company |
| O2 | Hard limits exist **per workspace only** | Yes, through workspaces | **One workspace + one key per company** (Mario C13). No other key in that workspace | Record `scope: workspace`, the workspace id and the limit; refuse `WORKSPACE_SHARED` when two companies record the same workspace id | Met when recorded and distinct |
| O3 | Both per key and per workspace | Yes | Use O2 anyway (one workspace per company). It also isolates rate limits and usage reporting, if those are per workspace | As O2 | Met |
| O4 | Hard limit **only per organization** | **No**, inside one account | Either (a) one provider organization per company, which changes who pays and who holds the account; **CLO must review** (billing, terms, fuel's legal category) before choosing it; or (b) do not register the second company | Registry refuses the second Owner while the cap scope is `org` and companies share the org | **Unmet**. Owner decides (a) or (b) |
| O5 | Limits exist but only **alert** (do not refuse requests) | No | Treat as O4. Alerts can still be wired to `sdk-holding freeze`, but that is detection, not a ceiling | As O4 | **Unmet** |
| O6 | Hard limits exist but count spend **with a delay** of D | Yes, with an overshoot window | As O1/O2. Set each limit at `appetite − (concurrency × worst observed per-minute spend × D)` and record D as an assumption | Record `enforcement_delay` with its evidence | Met with the recorded margin |
| O7 | **No per-key usage report** (only workspace or org totals) | — | Per-key reconciliation (C14) needs one workspace per company even under O1 | Reconciliation evidence must be per workspace; refuse the per-key reconciliation gate under O1 without it | Affects C14, not C13 |
| O8 | A **company Owner can change their own limit** in the console | Ceiling exists but is not under holding control | The key and workspace that spend holding fuel live in an account only the holding Owner administers; the company Owner gets no console role there | Owner attestation in the gate (G18) | Met only with the attestation |
| O9 | Terms **do not allow** this use | — | Stop. No second company until CLO clears an alternative | Registry refuses (G7) | Blocks everything |

## 4. The exact check the Owner performs

The Owner does this, because it needs the provider account and it may change spend settings (Autonomy Limit 2). Agents do not log in to provider consoles. Screen labels are not given here because nobody on the team has looked at the current console; record what you actually see.

**Part A — read, no spend (about 15 minutes).**
1. Sign in to the provider console of the account that pays for company fuel (for Anthropic: the Console at console.anthropic.com).
2. Find **every** place a spend or usage limit can be set. For each one, write down:
   - the level it attaches to: one key / a group of keys (workspace or project) / the whole organization;
   - whether reaching it **refuses requests** or **only notifies**, as the console or the linked documentation states it;
   - the period (monthly, custom) and the currency;
   - which console roles can change it.
3. Open the documentation page the console links for limits. Record its URL and the date you read it.
4. Find the usage or cost report. Record whether it can be filtered **by API key**, by workspace, or only for the organization.
5. Find the rate-limit page. Record whether rate limits are per key, per workspace or per organization.
6. Ask the CLO to read the current commercial terms on automated, parallel use with API keys, and record the clause and date (closes the LOW-confidence row in the Regulatory map).

**Part B — prove it, small Owner-approved spend (optional, recommended before O6 margins are trusted).**
Create a throwaway key (and workspace, if that is the level found in Part A) with the **lowest** limit the console accepts. Run one real session through `sdk-holding run` with `--max-turns 2` against that key, using the key's own company only, until the limit is reached. Record: did requests stop, after how much spend over the limit, and how long the console took to show the spend. Then delete the throwaway key. This is the only way to measure O5/O6, and it costs money, so it needs the Owner's explicit approval for that run.

**Record the result.** Write it to `record/experiments/<date>-provider-caps/README.md` with the evidence (URLs, dates, screenshots kept by the Owner outside the repo if they show account details), then record a `provider_caps` ledger event per company through `sdk-holding` (`cap-po-second-owner-005`). The outcome row (O1–O9) goes into the gate checklist (G18) and `history.md` as a decision.

## 5. What we will not do

- We will not set `scope: key` or `scope: workspace` from memory or from this document's prior belief.
- We will not call a provider admin API from the runner. Reconciliation stays manual (`cap-po-reconcile-001`) until a separate decision approves API access, because an admin key is a credential the sandbox must never see.
- We will not treat infinite fuel (`envelopePerCycle: null`) as an exemption for a second-Owner company. This is a deliberate tightening: v0 (`variables.yaml` → `isolation_v0.required`) asks for a provider cap "unless infinite", which is fine while one human pays for and owns everything. With two Owners, infinite fuel removes the pool limit, but company A's uncapped key could still drain the account that funds company B, so the per-company hard ceiling stays required. The tightening is proposed in `claims-proposed.yaml` (`cap-po-second-owner-005`) for Greg to merge.
