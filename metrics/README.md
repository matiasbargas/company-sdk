# metrics/

## What this directory is

Definitions of observable signals on team-sdk performance. Not implementations. Not dashboards. Each file in this directory describes one signal: what it measures, how to compute it from artifacts already in the repo, what healthy looks like, and how it can mislead.

## The principle

**Metrics exist to inform decisions, not to fill dashboards.** Every metric in this directory has a paired decision it is in the conversation for. If the decision evaporates, the metric is deleted — not archived, deleted. A metric that nobody acts on is noise that competes with the signals that matter.

This directory does not start large. Six metrics. Each earns its place by being the cheapest available signal for a decision the team actually makes.

## The roster

| Metric | Cadence | Decision it informs |
|---|---|---|
| [would-have-wrongly-killed-quality](would-have-wrongly-killed-quality.md) | quarterly | §32 anti-sycophancy contract integrity |
| [decision-distribution](decision-distribution.md) | sprint | Is the workflow converging too fast or too slow? |
| [claim-count-and-invalidation-rate](claim-count-and-invalidation-rate.md) | sprint | Is Layer B accumulating signal or noise? |
| [time-to-shaped-brief](time-to-shaped-brief.md) | daily | Is the substrate fast enough to actually be used? |
| [retro-completion-rate](retro-completion-rate.md) | quarterly | Is the team paying the retro tax or skipping it? |
| [signal-to-action-rate](signal-to-action-rate.md) | quarterly | Does the substrate hear itself, and does it act? |

## Cadence

- **Daily** — `time-to-shaped-brief`. Cheap to compute, fast feedback, used for substrate ergonomics.
- **Sprint** — `decision-distribution`, `claim-count-and-invalidation-rate`. Computed at sprint retros; surfaces workflow drift early.
- **Quarterly** — `would-have-wrongly-killed-quality`, `retro-completion-rate`, `signal-to-action-rate`. Computed at quarterly retros; surfaces meta-failures of the substrate itself.

A metric at the wrong cadence is worse than no metric — it either over-reacts to noise or under-reacts to drift. Cadences here are deliberate and not negotiable without re-justification.

## Anti-patterns this directory rejects

- **Vanity metrics** — counts of activations, messages, files touched. They go up when work happens and when work is wasted. No decision is informed.
- **Presence-without-quality counters** — "agent X was consulted N times." Tells nothing about whether the consultation changed an outcome.
- **Anything unfalsifiable** — if no plausible observation could make the metric look bad, it cannot make the metric look good either.
- **Composite scores** — a single number rolling up five things obscures all five. Keep metrics atomic.
- **Metrics without an owner-action** — if there is no decision the Owner or an agent would make differently based on this number, the metric is theater.
