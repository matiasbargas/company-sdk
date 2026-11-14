# Discovery synthesis — Portfolio Orchestrator

**Author:** Greg (CEO) · **Date:** 2026-11-13 · **Inputs:** CFO (§36 draft), CTO (machinery), CISO (threat model), CLO (legal shape), Red-Team (killing assumption). All were read-only consultation spawns, and their full returns are summarized here.
**Status:** Discovery delivered. Owner decisions pending (bottom). §36 stays a draft until the Owner decides and the Discovery Guardian graduates it.

## The shape everyone converged on
- **The holding is a team-sdk instance** with a `holding/` dir: `portfolio.json` (registry), `fuel/ledger.jsonl`, `commons/`, `runs/`. *(CTO)*
- **One git repo per company. Never shared worktrees between companies.** Worktrees share `.git` (refs, config, hooks path), so they isolate nothing. *(CTO + CISO)*
- **The runner is the only authority.** It starts sessions, meters usage from stream-json, checks fuel before every run, and is the only writer of the ledger. Instances never report their own burn. Hooks are advisory: graceful "landing mode", never a kill. *(CTO + CISO + CFO)*
- **The ledger is event-sourced, append-only and hash-chained, and records raw tokens by type and model.** Fuel Units and USD are views derived from it, so prices can change without rewriting history. *(CFO + CTO)* Only the holding Owner can write `fund`, which keeps allocation inside Autonomy Limit 2. *(CFO)*
- **Fuel is never a tradable token.** It is a non-transferable, non-redeemable metered allocation. Anything else risks stored-value or crypto-asset treatment. *(CLO)*
- **The commons works like a package manager:** copy plus lockfile, content-hashed, pull-only, adopted only on the Owner's approval for that act. It never carries settings, hooks, CHARTER or scripts. New items sit in quarantine, then pass a §34 surface with a verifier from another company plus the CISO. Revocation is a new entry. *(CTO + CISO)*

## The conflict, and how it is resolved
**Red-Team (critical):** when the company being funded certifies its own proof, fuel flows to whoever is best at paperwork (Goodhart), and the commons spreads the gaming to every company.
**CFO default:** each company's own gates, plus sampling by the holding.
**Resolution (Greg, pending Owner):** *self-verification never releases fuel.* A tranche's named proof counts only when a verifier outside the company has signed it: the holding, or another company's roster. The weighted metric (VOF) guides the Betting Table and never decides on its own. The company Owner's judgment and real-world signals (users, revenue) are a required column next to VOF.

## §36 Fuel Allocation Protocol — draft v0.1 (CFO text, amended)
1. **Units:** raw tokens (in/out/cache-write/cache-read, model) per instance/role/mission/loop. Fuel Unit = raw × price ratios (`fuel.priceTable`). Sessions with no usage record are logged as `unmetered`, never as zero.
2. **Lifecycle:** request (mission, appetite in FU, tranches, named proof per tranche, kill condition) → Portfolio Betting Table (holding Greg + CFO) → holding Owner ratifies → draw (runner-metered, stops at a turn boundary) → **proof, verified outside the company** → automatic release of the next tranche → close/return. Unspent fuel returns to the pool. The holding can stop funding; it cannot direct operations.
3. **Ledger:** `holding/fuel/ledger.jsonl`. Event types: `fund | grant | release | draw | proof | overrun | reclaim | return | close`. Invariants: no negative balances; every draw has a live grant and mission; idempotent; hash-chained; only the Owner funds; one proof unlocks one tranche.
4. **Limits (`.sdkrc`, §16.1):** `fuel.trancheSize`/`tranchesPerGrant` null (each grant declares them, otherwise it is malformed); `fuel.reclaimCyclesWithoutProof` 1; `fuel.smallBetReserve` 0.2; `fuel.overrunReserve` 0.05; `fuel.proofRevertCommits` 10. Grants never live in `.sdkrc`, because an instance can write it. *(CTO)*
5. **Guardrails:** no draw without a grant; all fuel counts in the denominator, killed bets and verifiers included; returned fuel earns credit (no use-it-or-lose-it); proof is pass/fail and named in advance; proof that gets reverted is clawed back; weights change only at the Table; a small-bet reserve; new companies are judged on proofs per tranche.
6. **Metric:** VOF = Σ weight(proof verified outside the company, not reverted) ÷ FU drawn, fully loaded. Compared only within a bet class, and always shown with the Owner-judgment column.

## v0 gates
**Two-instance proof (your own ventures):** separate clones; per-instance keys or an allowed auth mode for parallel headless runs (CLO: prefer API keys over a subscription); runner-owned settings and hooks, no skip-permissions; the ledger as above; the commons controls above; a kill switch (halt any instance, freeze the ledger); a one-page internal fuel memo; no personal data; CHARTER ratified.
**First company owned by someone else (blocked until):** a CHARTER amendment for holding Owner vs company Owner; a portfolio agreement; counsel confirms what fuel is legally; written assignment or licensing of outputs; a DPA if there is personal data; commons consent records; conflict and competition disclosure; ideally each company brings its own key.

## Build list for the smallest proof (CTO, ~8–10 engineer-days)
portfolio.json + validator (S) · ledger lib (S–M) · meter: stream-json + transcript backfill (M) · LocalRunner: spawn, semaphore, per-company lock, graceful stop (M) · fuel gate: pre-flight + landing-mode PreToolUse + `--settings` injection (S–M) · `sdk-commons publish|pull` + lockfile (M) · `sdk-holding` CLI (S–M) · office-day parametrized by `project_dir` (S) · tests (M).

## Irreversible decisions for Mario (before build)
Ledger data model · trust boundary (runner is the only meter) · one repo per company · runner contract (4 methods + Agent SDK usage shape) · commons identity (hash + surface id, copy + lockfile) · **account topology** (shared account vs a key per company).

## Owner decisions (asked 2026-11-13)
See history.md once answered.
