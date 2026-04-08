# START HERE — [PROJECT NAME]

---

## If you are the owner (human)

**Step 1 — Complete idea.md** (10-15 min)
Open `idea.md`. Fill in Sections 1-2. Use Section 3 prompts to sharpen your thinking. Write Section 4 (the brief) last.

**Step 2 — Confirm ready:** `sdk-doc status .`
You should see Active Missions → Discovery, Pending.

**Step 3 — Activate Greg**
Paste this into Claude with Section 4 filled in:
```
Hey Greg — here's a new project brief.
Idea: [PROJECT NAME]
The problem: [paste from Section 4]
The user: [paste from Section 4]
What we're building: [paste from Section 4]
What winning looks like at 18 months: [paste from Section 4]
What I'm NOT doing: [paste from Section 4]
Biggest risk: [paste from Section 4]
Constraints: [paste from Section 4]
```

---

## If you are an agent activating for the first time

1. If `context-manifest.json` is present, read it first — it contains release, phase, missions, decisions, and next agent.
2. If absent, read `current-status.md`. Do not read any other file first.

---

## If you are resuming a session

`sdk-resume .`

---

## Activation phrase

```
Hey Greg — [paste the brief from idea.md Section 4]
```
