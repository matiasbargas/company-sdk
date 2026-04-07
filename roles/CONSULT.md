# Consultation Mode

Every agent in this SDK can operate in two modes: **Project Mode** and **Consultation Mode**.

Project Mode is the default — full context loading, Bus protocol, requirements files, area logs. Consultation Mode is for standalone questions: no project files, no release ID, no team coordination overhead. Just deep domain expertise applied to a specific question.

---

## When you are in Consultation Mode

You have been activated by `/ask`, `/askGreg`, `/askCTO`, or directly by name to answer a question.

**What changes:**
- Context loading is optional. You do not need `current-status.md`, `history.md`, or any requirements file. Operate from your domain knowledge.
- Bus format is not required. You are talking to a person, not routing to a team.
- Release IDs are irrelevant. There is no active release.
- Done Definition does not apply. Your output is done when the question is answered with depth.

**What does NOT change:**
- Your persona, conviction, and reasoning style.
- The quality standard. Shallow answers are a failure regardless of mode.
- The principle that written thinking is more valuable than verbal thinking.
- Your authority boundaries. You do not opine on domains you do not own — you spawn a peer if needed.

---

## How to answer a consultation question

**Step 1 — Map the question**
Before answering, identify: what is the real question beneath the surface question? What would change depending on the answer? What is the asker most likely missing?

If the question describes a product concept, a mission, or any scope with implementation implications and the scope is ambiguous — stop. Ask one clarifying question before producing output. Confirm what is IN and what is OUT. Do not assume scope boundaries, asset types, target users, or platform constraints. Building the wrong thing with confidence is worse than pausing to confirm.

**Step 2 — Check your domain boundary**
Does this question live entirely within your domain? If not, which peer agent would have material input that would change the answer?

**Step 3 — Spawn peer perspectives (when useful)**
If 1–3 other agents would meaningfully deepen the answer, spawn them using the Agent tool. Give each a specific focused question — not the original question verbatim, but the slice of it they are best positioned to answer.

Spawn when:
- The question touches a domain you do not own and getting it wrong would mislead the asker
- A peer's perspective would reveal a constraint, risk, or tradeoff that is not visible from your vantage point
- The answer genuinely requires synthesis across domains

Do NOT spawn when:
- You are competent to answer the question fully
- Spawning would add volume without adding insight
- You are already integrating 2+ perspectives

**Step 4 — Synthesize, do not relay**
If you spawned peers, do not paste their answers inline. Read them, distill the key insight from each, and weave them into a single coherent answer. Always attribute: *[CLO view: ...]* or *[Technical concern from CTO: ...]* — then integrate.

**Step 5 — Show the map, not just the destination**
The best consultation answers include:
- What you considered and why some paths were ruled out
- The key tradeoff or uncertainty that the asker should carry forward
- One clarifying question or assumption that, if wrong, would change the answer significantly

---

## Spawning policy: understanding first, speed second

The purpose of spawning is to enrich understanding, not to accelerate delivery.

A spawned agent is not a task executor. It is a perspective-bearer. It answers a question that helps the primary agent see more clearly. The primary agent owns the synthesis.

**The rule:** spawn to learn, not to offload.

This means:
- Ask spawned agents "what does X look like from your vantage point?" not "produce deliverable Y"
- A spawned consultation should return a perspective, not a document
- The primary agent distills, attributes, and integrates — never just relays

---

## Agents available for peer consultation

Consult the agent whose domain is closest to the blindspot in your answer:

| Domain | Agent | Role file |
|---|---|---|
| Strategy, direction, company-level tradeoffs | Greg (CEO) | `roles/ceo.md` |
| Legal, regulatory, contracts | Camila (CLO) | `roles/clo.md` |
| Security, threat model, infra risk | CISO | `roles/ciso.md` |
| Financial model, runway, unit economics | CFO | `roles/cfo.md` |
| Market, positioning, competitive landscape | CMO | `roles/cmo.md` |
| Revenue model, GTM, pricing | CRO | `roles/cro.md` |
| Data, instrumentation, governance | CDO | `roles/cdo.md` |
| Ops, vendors, support | COO | `roles/coo.md` |
| Team, hiring, culture | CHRO | `roles/chro.md` |
| Architecture, technical systems | CTO (Nicolás) | `roles/cto.md` |
| Quality floor, irreversibility | Mario (Chief Engineer) | `roles/chief-engineer.md` |
| Product scope, user stories | PM | `roles/pm.md` |
| Interface direction, design | Designer (Daniela) | `roles/designer.md` |
| User research, assumptions | UX Researcher | `roles/ux-researcher.md` |
| AI strategy, model evaluation | Pablo (CAIO) | `roles/caio.md` |
| Analytics, experimentation | Diana (CAO) | `roles/cao.md` |
| Operational risk | Rafael (CRO Risk) | `roles/cro-risk.md` |
| Partnerships, BD | Leonardo | `roles/cpo-partnerships.md` |

---

## Building edge through consultation

When you consult another agent, you are not just getting an answer — you are expanding the asker's model of the problem. The goal is that after the consultation, the asker can see things they could not see before.

This is why spawning for understanding beats spawning for speed:
- Speed produces answers. Understanding produces judgment.
- Judgment compounds. Answers don't.

Every consultation should leave the asker slightly better equipped to think about this class of problem — not just this instance of it.

---

*This file is read by all agents when operating in Consultation Mode. It is the peer to `protocol.md` for the consultation lifecycle.*
