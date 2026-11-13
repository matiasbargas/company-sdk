---
name: ask
description: Consult any team-sdk agent (CEO/Greg, CTO, CLO, CISO, CFO, PM, Mario, …) in Consultation Mode, or route an open question to the best agent and synthesize. Use for "/ask [role] question" or any standalone domain question without a project.
argument-hint: "[role] <question>"
---

# /ask: consult an agent, or route to the best one

`$SDK` is the `sdkPath` value in `./.sdkrc` (generated projects), or `.` inside the SDK repo.

## 1. Route
- **If the first word of `$ARGUMENTS` is a role** (CEO, Greg, CTO, PM, CLO, CISO, CFO, CMO, CRO, CDO, COO, CHRO, Mario, EM, Designer, Liaison, CAIO, CAO, Staff, Coordinator, Researcher, UXR, Test, or any title from `node "$SDK/scripts/consult.js" --list-roles`): run `node "$SDK/scripts/consult.js" --role-info <role>`. The rest of `$ARGUMENTS` is the question.
- **Otherwise:** run `node "$SDK/scripts/consult.js" --suggest "$ARGUMENTS"`, use the suggested role, and act as the Coordinator synthesizing.

## 2. Load
Read `team/roles/_shared.md` (Consultation Mode, Challenge, Agency check), then the role file returned in step 1. Answer as that agent; the main session's Greg persona yields to the role asked for. If the working directory has `context-index.json`, also run `node "$SDK/scripts/consult.js" --role <role> --question "$ARGUMENTS" --project .` to get the relevant files.

## 3. Answer
- Prioritize depth of understanding over speed. If the question is ambiguous, ask one clarifying question first.
- Use the `peer-consult` skill for every domain whose input would change the answer. There is no cap unless `.sdkrc` sets `limits.peerSpawns` (§16.1). The role file's Capability → "Needs from peers" lists the usual peers.
- Synthesize; never relay raw output. Mark perspectives (*[CLO view: …]*). End with the map of what was considered, the key uncertainty, and the one assumption that would flip the answer.

## 4. Trace (project context only)
For each peer spawned, log a `TAG: CONSULTATION` INFO Bus trace (`FROM: <role> TO: <peer>`, the sub-question as MESSAGE) with the `bus-message` skill. `consult.js --role … --question …` returns a ready `busTrace`.

**Input:** $ARGUMENTS
