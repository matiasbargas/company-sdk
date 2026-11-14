# Metering spike — 2026-11-13

**Why:** the Discovery Guardian (cycle 1) failed criterion 4, because the runner-only metering claim was untested and one of Mario's irreversible decisions rests on it. The Owner approved a small spend.

**Setup:** two parallel `claude -p "Reply with exactly the word: ok" --output-format stream-json --verbose --max-turns 1 --max-budget-usd 0.05 --no-session-persistence`, each run in its own empty temp dir. Claude Code 2.1.292, model claude-opus-5-5. The raw streams are in this folder (`run-a`, `run-b`).

**Results:**

| Observation | Evidence | Consequence |
|---|---|---|
| The top-level `result.usage` was **all zeros**, while `result.modelUsage` carried the real counts (in 2, out 4, cache-creation 16,706) | both runs, `type:"result"` | **Meter from `modelUsage` (per model), never `usage`.** The CTO's assumption was wrong; a meter built on it would record zero burn. |
| `--max-budget-usd 0.05` ended at **$0.0836** (`subtype: error_max_budget_usd`, `is_error: true`) | both runs | The budget is checked **after** a turn, so a single turn can overshoot. The overrun reserve is required, and a provider-side key cap is the only hard ceiling. |
| A bare session costs **~16.7k cache-creation tokens (~$0.08 on Opus)** before doing any work | `modelUsage.cacheCreationInputTokens` | Fuel needs a **per-session floor**. Many tiny sessions are expensive; the runner should batch work. |
| `costUSD` is labelled `costBasis: "list"` | modelUsage | USD is a list-price estimate. Keep raw tokens as the source of truth (as designed). |
| Two parallel runs: 4 s wall time, no rate-limit event | stream | Two-way parallelism works. **Rate limits at scale are still untested**, so keep that assumption open. |

**Total spend:** about $0.17 (2 × $0.0836).
