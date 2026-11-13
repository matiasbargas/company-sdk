---
name: office-day
description: Run the office daily operating rhythm (surface sweep, signal harvest, daily digest, retro-trigger sweep, status reconcile) and report what needs a human. Use when asked to run the office day, the daily rituals, or a morning sweep.
---

# Office day

Rituals: `team/office/rituals/README.md` and `office/01-…05-*.md` (the sources); orchestrator: `workflows/office-day-v0.1.js`.

## Steps
1. **Get today's date** from the environment. Workflow scripts cannot read the clock, so pass it as `args.date` (YYYY-MM-DD).
2. **Run the orchestrator:** `Workflow({ scriptPath: "<repo-root>/workflows/office-day-v0.1.js", args: { date } })`. This needs the Owner's opt-in to workflows. Without it, run the five rituals by hand in their numbered order.
3. **Honour the README's "Honest gaps".**
   - Surface Sweep only reports; it does not advance verification.
   - Retro firing is a deliberate PM or Owner act. Report owed retros, and do not fire them.
4. **Finish with `sdk-health`**, and put its result in the day report.
5. **Report:** what moved, what is stalled (and who owns it), and which decisions need a human.
