# Design Principle: Domains Get Agents, Constraints Get Protocol Fields

**Status:** Spec — reviewed (CTO + Mario)
**Affects:** protocol.md (new subsection — Design Principles), STRATEGY.md

---

## The Principle

When proposing a new addition to the SDK, test: **is this a domain or a constraint?**

- **Domains get agents.** A domain is a body of knowledge with its own reasoning patterns, its own failure modes, and its own perspective on problems. Legal is a domain. Architecture is a domain. User research is a domain. Each has depth that justifies a dedicated persona with context loading, conviction, and challenge obligations.

- **Constraints get protocol fields.** A constraint is a dimension that every agent should carry. Cost is a constraint. Time is a constraint. Solution class is a constraint. Adding an agent for a constraint creates the illusion that someone else is watching the constraint — that illusion is the failure mode.

## How to Apply

Before adding a new agent, answer:

1. Does this need its own persona, conviction, and reasoning style? → Agent
2. Does this need its own requirements file and area log? → Agent
3. Or does this need to be visible on every output-bearing Bus message? → Protocol field

If the answer is "every agent should think about this," it's a constraint, not a domain. Make it a Bus field.

## Examples

| Proposed addition | Domain or constraint? | Implementation |
|---|---|---|
| Cost/Time tracking | Constraint — every agent should carry cost awareness | `COST_SIGNAL` and `TIME_SIGNAL` Bus fields |
| Solution classification | Constraint — every technical agent should declare method | `SOLUTION_CLASS` Bus field (already exists) |
| AI strategy and governance | Domain — has its own reasoning, failure modes, regulations | CAIO agent (Pablo) |
| Enterprise risk management | Domain — requires specialized risk frameworks | CRO Risk agent (Rafael) |
| Framing challenge | Constraint — any agent should be able to challenge framing | `TAG: FRAMING-CHALLENGE` Bus field |

## Anti-Pattern

The anti-pattern is: "We need someone to watch X" → create an agent whose job is to watch X.

This fails because:
1. The team assumes the watcher is watching, so they stop watching themselves
2. The watcher has no domain of their own — they become a meta-process agent
3. Meta-process agents produce process artifacts, not domain insights
4. The coordination cost of one more agent exceeds the value of their output

The test: if you remove this agent, does the team lose a perspective they can't get elsewhere? If yes, it's a domain agent. If the team just loses a reminder to think about something, it's a constraint that should be embedded in the protocol.

---

## Protocol Text

Add to protocol.md as a new section (Section 25c or in a Design Principles preamble):

```
### Design Principle: Domains vs Constraints

When extending the SDK, test whether the addition is a domain or a constraint.

- **Domains** have their own reasoning patterns, failure modes, and perspectives.
  They get agents with personas, requirements files, and challenge obligations.

- **Constraints** are dimensions every agent should carry. They get protocol fields
  on Bus messages, visible on every output-bearing communication.

If the answer to "should every agent think about this?" is yes, it is a constraint.
Make it a protocol field, not an agent. Adding an agent for a constraint creates the
illusion that someone else is watching — that illusion is the failure mode.
```
