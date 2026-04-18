# /ask — Consult any agent, or route to the best one

**Usage:**
- `/ask [question]` — Coordinator routes to the best agent(s) and synthesizes
- `/ask [role] [question]` — Goes directly to that agent; they can spawn peers

**Recognized roles (first word):** CEO, Greg, CTO, PM, CLO, CISO, CFO, CMO, CRO, CDO, COO, CHRO, Mario, EM, Designer, Liaison, CAIO, CAO, Staff, Coordinator, Researcher, UXR, UX, Test

---

## Step 1: Route via @team-sdk/cli

Parse `$ARGUMENTS`:

**If the first word matches a recognized role name or title:**
1. Run `node scripts/consult.js --role-info <role>` to get the role's capability, domain, and file path from the @team-sdk/protocol ROLES data structure
2. Load that agent's role file from the path returned
3. Respond as that agent in Consultation Mode (read `team/roles/CONSULT.md`)
4. The rest of `$ARGUMENTS` is the question

**If no role is specified (open question):**
1. Run `node scripts/consult.js --suggest "$ARGUMENTS"` to get the recommended role from the @team-sdk/cli keyword router
2. Use the suggested role. Also run `node scripts/consult.js --role-info <suggested-role>` to get capabilities.
3. Load the primary agent's role file. You are the **Coordinator** synthesizing.

## Step 2: Consult

**If project context exists** (current working directory has `context-index.json`):
Run `node scripts/consult.js --role <role> --question "$ARGUMENTS" --project .` to get relevant files for the role's domain.

**Consultation Mode rules:**
- Prioritize **depth of understanding** over speed
- If the question is ambiguous, ask **one clarifying question** before proceeding
- Spawn 1–3 peer agents when their domain perspective would meaningfully change the answer
- Synthesize peer input — never relay it raw
- Show your reasoning map

## Spawning policy

Use the routing table from `node scripts/consult.js --list-roles` for the full role catalog. Spawn via Agent tool:

| Question type | Primary agent | Likely peers |
|---|---|---|
| Strategy, vision, priorities, tradeoffs | CEO (`team/roles/ceo.md`) | CLO, CFO, CTO |
| Architecture, technical decisions, make/buy | CTO (`team/roles/cto.md`) | Mario, CISO, PM |
| Product scope, user stories, missions | PM (`team/roles/pm.md`) | Designer, UX Researcher, CTO |
| Legal, regulatory, compliance | CLO (`team/roles/clo.md`) | CISO, CFO |
| Security, threat model, infra risk | CISO (`team/roles/ciso.md`) | CLO, CTO |
| Financial model, unit economics, runway | CFO (`team/roles/cfo.md`) | CRO, CEO |
| Interface, UX, product design | Designer (`team/roles/designer.md`) | PM, UX Researcher |
| User research, discovery | UX Researcher (`team/roles/ux-researcher.md`) | PM, Designer |
| AI strategy, model evaluation | CAIO (`team/roles/caio.md`) | CTO, CDO |
| Analytics, experimentation | CAO (`team/roles/cao.md`) | CDO, PM |
| People, hiring, team health | CHRO (`team/roles/chro.md`) | CEO, EM |
| Sprint, pod, delivery | EM (`team/roles/em.md`) | PM, Liaison |
| Irreversibility, quality, architecture review | Mario (`team/roles/chief-engineer.md`) | CTO, Staff |

Rules:
- Spawn to **understand**, not to offload
- Max 3 concurrent peer consultations
- Primary agent owns the synthesis — never relay raw output

## Step 3: Bus trace

After synthesis, if peer agents were spawned, log Bus traces to `bus-log.md` (if project context exists):
1. Run `node scripts/consult.js --role <role> --question "$ARGUMENTS"` — the `busTrace` field in the response is the formatted Bus message
2. For each spawned peer, generate an additional Bus trace: `FROM: <primary role> TO: <peer role> ... TAG: CONSULTATION`
3. Append all traces to `bus-log.md` using `sdk-doc append bus-log.md --section "## Consultation Log" --content "<traces>"`

This makes every consultation discoverable in the project's Bus history and feeds the cross-project memory corpus.

---

**Input:** $ARGUMENTS
