---
name: peer-consult
description: Spawn peer agents for cross-domain perspective and synthesize their input (protocol §16). Use when a question touches a domain you do not own and a peer's view would change the answer — in /ask consultations or inside a project.
---

# Peer consultation

Rules: `protocol.md` §16 and §16.1 (limits); guide: `team/roles/CONSULT.md`.

## Steps
1. **Slice the question.** For each domain you do not own whose input would change the answer, write one focused sub-question, not the original question verbatim.
2. **Respect limits.** Default: spawn every peer whose input would change the answer. If `.sdkrc` sets `limits.peerSpawns`, spawn the highest-leverage ones up to that cap. Stop when another peer would not change the answer.
3. **Spawn read-only.** Prefer the generated subagent for the role (`.claude/agents/<role>.md`); its tools are read-only. Otherwise give a general agent the role file path and say "consultation spawn: READ ONLY, no project writes". Launch independent peers in parallel.
4. **Require this return shape** from each peer:
   ```
   role: | sub_question: | insight: (≤5 lines) | confidence: high|med|low
   assumption_that_flips_it: | sources: (files/sections read)
   ```
5. **Synthesize. Never relay.** Produce one answer that integrates the views, names the tradeoffs, and attributes perspectives (*[CLO view: …]*).
6. **Close every consultation with:**
   - the map of what was considered and ruled out;
   - the key uncertainty to carry forward;
   - one assumption that, if wrong, changes the answer.
7. In Project Mode, log what was spawned and the key insight in your area log before acting on it. Writes suggested by peers are your decision.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
