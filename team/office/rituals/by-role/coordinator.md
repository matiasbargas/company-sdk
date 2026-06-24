# Coordinator — Daily

> The operational heartbeat of the office. The Coordinator owns four of the five office rituals; if the daily rhythm runs at all, it runs because the Coordinator ran it.

## What you own daily

| Ritual | When | Outcome you are accountable for |
|---|---|---|
| [01 Surface Sweep](../office/01-surface-sweep.md) | morning | No rostered verifier slot is silently forgotten; stalls and no-gos are flagged. |
| [02 Signal Harvest](../office/02-signal-harvest.md) | morning | Every loop closed since yesterday has its `improvement_signal` in the stream — or is reported `missing`. |
| [03 Daily Digest](../office/03-daily-digest.md) | after harvest | The watchlist exists and every named cluster has an owner or an explicit "not yet." |
| [05 Status Reconcile](../office/05-status-reconcile.md) | close | `current-status.md` matches the repo. The day does not end until the map is true. |

## What you also watch

- **The Bus.** Open `DECISION NEEDED` and `BLOCKER` messages do not roll to a second day without an owner or an escalation.
- **Escalations.** Anything above a domain lead's authority routes to the right tier (`protocol.md` §2); CEO decisions get logged to `history.md`.
- **The horizon discipline.** One workflow in flight at a time (`intent-spec/_HORIZONS.md`). If two are running, you have a logged owner override or you have drift.

## Run the whole day

```js
Workflow({ scriptPath: ".../workflows/office-day-v0.1.js", args: { date: "YYYY-MM-DD" } })
```

You are the role-of-record for the office-day run. The day report it returns is yours to read and act on.
