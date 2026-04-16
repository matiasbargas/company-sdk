# Kill Log — Protocol Addition (Section 25)

**Status:** Spec — reviewed (CTO + Mario)
**Protocol version:** 4.1 → 4.2
**Affects:** protocol.md, history.md template, sdk-status output, new script `scripts/kill.js` (`sdk-kill`)

---

## Design Decisions

1. **Cross-project by default.** The Kill Log is an account-level artifact, not per-project. It persists at `~/.claude/kill-log.json` (structured store) + `~/.claude/kill-log.md` (human-readable view, generated from JSON). Per-project kills are also logged to the project's `history.md` for local context, but the cross-project log is the compounding asset.

2. **JSON backing store.** `sdk-status` reads from `.json`, not `.md`. The markdown view is generated on write for human readability. Sequential IDs are per-date, auto-incremented from the JSON array.

3. **kill_class is mandatory.** Every kill is classified. Only `FRAMING_WRONG` kills feed the judgment corpus (the cross-project log's primary read path). Other classes are operational — useful for project context, not for teaching future judgment.

4. **No approval chain for Owner kills.** The Owner kills. The pod dissolves. The rationale logs. Agent-initiated kills require Owner confirmation.

5. **CLI script, not conversational command.** `sdk-kill` (implemented as `scripts/kill.js`) handles all file I/O. Agents invoke the script. Consistent with `sdk-doc`, `sdk-gate-check`.

6. **Known limitation: durability.** `~/.claude/kill-log.json` is not version-controlled. Accidental deletion loses the cross-project corpus. Per-project `history.md` entries survive (git-tracked). **Wave 1.5 adds `sdk-kill export` to dump the corpus to a portable file.** This is a documented known limitation, not a blocker.

---

## Kill Classes

| Class | Meaning | Compounds? |
|---|---|---|
| `FRAMING_WRONG` | The bet was wrong. The assumption, target user, hypothesis, or scope boundary was incorrect. | Yes — feeds cross-project judgment corpus |
| `SCOPE_OBSOLETE` | External change made the work irrelevant. Market shifted, regulation changed, dependency removed. | No — operational |
| `PRIORITY_SHIFT` | Higher-priority work displaced this. The framing may have been fine; the timing wasn't. | No — operational |
| `EXECUTION_STALLED` | The pod couldn't execute. Blocked, understaffed, or unable to converge. | No — operational |

---

## Kill Log Entry Schema

### Cross-project log (`~/.claude/kill-log.md`)

```
### KILL-[YYYY-MM-DD]-[sequential-id]
Project: [project name or path]
Release: [release ID]
Pod: [pod name or mission name]
Date: [YYYY-MM-DD]
Killed by: [Owner | Role name]
Kill class: FRAMING_WRONG | SCOPE_OBSOLETE | PRIORITY_SHIFT | EXECUTION_STALLED
Alive for: [duration — e.g., "12 days", "3 sprints"]
Reason: [one sentence — what was wrong]
Assumption that failed: [one sentence — the falsifiable claim that turned out false. Required for FRAMING_WRONG, optional for others.]
```

### Per-project entry (`history.md`)

```
## Pod Kill: [pod/mission name]
**Date:** [YYYY-MM-DD]
**Release:** [release ID]
**Killed by:** [Owner | Role name]
**Kill class:** [FRAMING_WRONG | SCOPE_OBSOLETE | PRIORITY_SHIFT | EXECUTION_STALLED]
**Alive for:** [duration]
**Reason:** [one sentence]
**Assumption that failed:** [one sentence, if applicable]
**Coverage:** [What domain responsibilities this pod held and who absorbs them, or "none — work stops"]
**Gate impact:** [If the killed agent held a gate (CLO, CISO, Mario), state whether the gate is waived (requires CEO + logged decision) or reassigned]
```

---

## sdk-kill Command Spec

```
Usage:
  sdk-kill <project-dir> <pod-or-mission> --reason "..." --class <kill_class>
  sdk-kill <project-dir> <pod-or-mission> --reason "..." --class FRAMING_WRONG --assumption "..."

Options:
  --reason       Required. One-sentence rationale.
  --class        Required. One of: FRAMING_WRONG, SCOPE_OBSOLETE, PRIORITY_SHIFT, EXECUTION_STALLED.
  --assumption   Required when --class is FRAMING_WRONG. The falsifiable claim that was wrong.
  --killed-by    Optional. Defaults to "Owner". Set to role name for agent-initiated kills.
```

**Behavior:**

1. Log kill to cross-project `~/.claude/kill-log.md` (append)
2. Log kill to project `history.md` (append, per-project schema)
3. Send Bus message `PRIORITY: INFO, TO: ALL` with kill rationale
4. Trigger pod dissolution (EM cleanup: engineers return to pool, mission → Killed in kanban)
5. Update `current-status.md` — remove pod from Active Missions, add to "Killed This Session"
6. Run coverage check: if killed agent held a gate role (CLO, CISO, Mario), warn and require explicit gate waiver or reassignment before continuing

**Authority:**
- Owner: unrestricted. No confirmation needed.
- Any agent: requires Owner confirmation before executing. Agent sends `DECISION NEEDED` Bus message with kill rationale; Owner confirms or rejects.

**Cool-down:** If a pod/mission with the same name is re-activated within the same release after being killed, the re-activation requires CEO approval with logged rationale. This prevents thrashing.

---

## sdk-status Integration

`sdk-status` output adds a Kill Log section after Active Missions:

```
RECENT KILLS (last 5)
| Pod          | Killed    | Class          | Reason                        |
|-------------|-----------|----------------|-------------------------------|
| Auth-v2     | 2026-04-12| FRAMING_WRONG  | Users don't want SSO for MVP  |
| Notif-push  | 2026-04-08| PRIORITY_SHIFT | Payments corridor took priority|
```

When `--cross-project` flag is passed, shows kills from all projects:

```
sdk-status --kills                    # current project kills
sdk-status --kills --cross-project    # all projects, FRAMING_WRONG only (judgment corpus)
```

---

## Read Path for Judgment Corpus

The cross-project Kill Log's primary consumers are:

1. **New pod spin-up.** Before a pod starts, the PM or EM checks: "Has something like this been killed before?" Query: `sdk-doc kills --search "keyword"` scans the cross-project log.
2. **Retrospective.** `sdk-retro` includes Kill Log review — were the kills right in hindsight?
3. **Owner daily surface.** The conversational interface (Greg/Coordinator) includes recent kills when opening a session.

The cross-project log is append-only. No edits. No deletions. The rationale is the Owner's judgment on record.
