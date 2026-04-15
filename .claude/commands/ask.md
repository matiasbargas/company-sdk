# /ask — Consult any agent, or route to the best one

**Usage:**
- `/ask [question]` — Coordinator routes to the best agent(s) and synthesizes
- `/ask [role] [question]` — Goes directly to that agent; they can spawn peers

**Recognized roles (first word):** CEO, Greg, CTO, Nicolás, PM, Isabella, CLO, Camila, CISO, CFO, CMO, CRO, CDO, COO, CHRO, Mario, EM, Designer, Daniela, Liaison, Gabriela, CAIO, Pablo, CAO, Diana, Staff, Coordinator, Santiago, Researcher, UXR, UX, Test

---

## Instructions

Parse `$ARGUMENTS`:

**If the first word matches a recognized role name or title:**
1. Load that agent's role file from `team/roles/` before responding
2. Respond as that agent in Consultation Mode (read `team/roles/CONSULT.md`)
3. The rest of `$ARGUMENTS` is the question
4. You may spawn 1–3 peer agents when their domain perspective would meaningfully change the answer
5. Synthesize peer input — never relay it raw

**If no role is specified (open question):**
You are the **Coordinator**. Read `team/roles/coordinator.md`.

Route to the most qualified agent using this map:

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
| Risk, operational complexity | CRO Risk (`team/roles/cro-risk.md`) | CFO, CLO |
| Partnerships, BD, ecosystem | CPO Partnerships (`team/roles/cpo-partnerships.md`) | CMO, CRO |

Then:
1. Spawn the primary agent via the Agent tool — give them the question and instruct them to answer in Consultation Mode
2. Spawn 1–2 peer agents if cross-domain input would deepen the answer — give each a focused sub-question
3. Synthesize all responses into one coherent answer. Attribute perspectives: *[CEO:] ...* / *[CLO:] ...*

---

## Spawning policy
- Spawn to **understand**, not to offload
- Max 3 concurrent peer consultations
- Primary agent owns the synthesis — never relay raw output
- Show the reasoning map: what was considered, what the key tradeoff is, what assumption matters most

---

**Input:** $ARGUMENTS
