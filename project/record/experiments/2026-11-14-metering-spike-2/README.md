# Metering spike 2 (Mario condition C4, partial) — 2026-11-14

**Owner limit:** $0.05 total, for validation only. **Actual: $0.085 recorded, plus run (b) unknown (possibly up to about $0.08 more). The limit was exceeded.** Cause: the run requested `--model claude-haiku-4-5`, but the session ran on `claude-opus-5-5`. Greg did not check which model would actually run before spending. No more real runs were made.

**Setup:** Claude Code 2.1.292. (a) Multi-turn tool-use prompt (read `note.txt`, write `out.txt`), `--max-turns 3 --max-budget-usd 0.02 --permission-mode acceptEdits`. (b) A long prompt, killed with SIGTERM after 4 s. Raw streams are in this folder.

| Observation | Evidence | Consequence |
|---|---|---|
| **`--model` was overridden by the environment.** The session ran on Opus despite `--model claude-haiku-4-5`. The Owner's environment sets `ANTHROPIC_MODEL`, and user settings set `model`. | `run-multiturn` `modelUsage` keyed `claude-opus-5-5` | **The runner must not inherit the Owner's environment or user settings.** It needs a clean env plus runner-owned settings that pin the model, which also serves C14. A pre-flight must check that the model the CLI resolves equals the grant's model before spending. |
| The budget cap was overshot again: $0.02 cap → **$0.085** after one turn (`error_max_budget_usd`), so the multi-turn and tool scenario never ran | `result.subtype`, `total_cost_usd` | This confirms spike 1: the per-run cap is soft. The first turn's fixed cost (~16.7k cache-creation tokens on Opus) is already above small caps. The runner should refuse a run whose cap is below the model's session floor. |
| Per-message usage on the `assistant` event (out = 16) differs from `result.modelUsage` (out = 73) | `run-multiturn` | Assistant-event usage is a streaming snapshot. `result.modelUsage` is authoritative. Use summed per-message usage only for partial recovery, marked `partial: true`. |
| **A run killed at 4 s produced no `assistant` message and no `result`**: only `init`, `informational` and `thinking_tokens` | `run-killed` | The meter recovers **nothing**, yet the request was in flight and may be billed. It must be recorded as `unmetered` (correct, never zero). Spend it cannot see is real, so **per-key reconciliation against provider usage** (C14's detection layer) is required even for one company. |
| Two-model and subagent scenarios: **not run** (budget) | — | Still unproven. Run them only with an approved budget, on a pinned model. |
