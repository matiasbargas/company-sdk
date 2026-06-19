export const meta = {
  name: 'idea-execution-v0.1',
  description: 'Take a raw idea, ground it in Layer A (Constraints + Soul + protocol), draft SDD as Layer C, run Constitutional Critique-Revise (with Mario\'s would-have-wrongly-killed guardrail) + Red-Team, synthesize the shaped brief, extract Layer B atomic claims with source attribution. Always-documented folder output. v0.1 ships only Critique-Revise + Red-Team — Dialectic defers to v0.2 with author anonymization, per 2025-2026 research on sycophancy in named-role multi-agent debate.',
  phases: [
    { title: 'Layer A — Foundation grounding' },
    { title: 'Layer C — SDD draft' },
    { title: 'Critique-Revise loop' },
    { title: 'Red-Team pass' },
    { title: 'Synthesize + Layer B claims' },
    { title: 'Index + document' },
  ],
}

const projectRoot = '/Users/matias.bargas/dev/ai-repos/team-sdk'
const input = typeof args === 'string'
  ? { idea: args, slug: 'unnamed-idea', date: '2026-06-14' }
  : (args || { idea: 'no idea provided', slug: 'unnamed', date: '2026-06-14' })

const idea = input.idea
const slug = input.slug
const date = input.date

const ideaFolder = `${projectRoot}/intent-spec/${slug}`
const claimsFolder = `${projectRoot}/generated-spec/${slug}`

log(`Starting idea-execution v0.1 — slug="${slug}" date="${date}"`)

phase('Layer A — Foundation grounding')

const foundation = await agent(`You are loading Layer A — the stable, human-authored constitutional grounding that every downstream agent in this workflow leans on.

Read these files and produce a tight distillation that captures:
1. The 3 Priority Constraints
2. The 4 Purpose substrates
3. The 6 Soul principles
4. The Bus message format (FROM/TO/RELEASE/PRIORITY/TAG/MESSAGE)
5. The Ideation Cycle (§15) and Shipping Cycle structure — who governs, what happens
6. The §24 Halloway Ratchet doctrine — when to apply deterministic Level 3/4 vs exploratory Level 1
7. The §30 Design Principles
8. The Consultation Mode + Spawning Policy (§16) — synthesis ownership

Files:
- ${projectRoot}/team/roles/_shared.md
- ${projectRoot}/protocol.md (sections 1, 15, 16, 22, 24, 25, 30)

Output: a single markdown document, ≤600 words, no commentary or opinions. This is the constitution downstream phases will be tested against.

Also write the distillation to ${ideaFolder}/_foundation-snapshot.md using the Write tool. Run \`mkdir -p ${ideaFolder}\` first via Bash if the directory does not exist.

Return ONLY the distillation content as raw markdown.`, {
  label: 'load-layer-A',
  phase: 'Layer A — Foundation grounding',
})

phase('Layer C — SDD draft')

const sddDraft = await agent(`You are the team-sdk PM. Take this raw idea and produce a Layer C intent document — an SDD draft in the spirit of Shape Up + the team-sdk PM role.

Idea:
"""
${idea}
"""

Date: ${date}
Slug: ${slug}

Layer A foundation (respect constitutionally — these are non-negotiable):
"""
${foundation}
"""

Write the SDD draft as markdown with these sections, IN THIS ORDER:

# SDD: ${slug}
**Date:** ${date}
**Author:** PM (auto-drafted)
**Stage:** Draft v1

## Problem
What condition in the world makes this worth building NOW. Not what we will build — what is true today that demands a response.

## Target user
Specific. Name a role or type of person. Their problem today, in one sentence.

## Appetite
S (1-2 days) / M (1 week) / L (2 weeks). Pick one. Justify in one line.

## Solution sketch
The MINIMUM-VALUE increment. ONE thing. Not the full vision. If the idea is large, scope it down ruthlessly to the smallest version that produces real signal.

## Non-Negotiables
What cannot be compromised regardless of pressure. Bullet list.

## Out-of-Bounds
What we are explicitly NOT doing. This is as important as what we ARE doing.

## Open questions
What would change the approach if answered differently. Bullet list.

## Success looks like
Concrete signal. What we'd observe if this worked.

---

CRITICAL: this is MINIMUM-VALUE first ship. Resist scope sprawl. The PM's non-negotiable: the shaped brief is the ONLY artifact that crosses to Shipping. Make it small enough to actually cross.

Write the SDD to ${ideaFolder}/sdd.md using the Write tool.

Return ONLY the SDD content (raw markdown).`, {
  label: 'pm-sdd-draft',
  phase: 'Layer C — SDD draft',
})

phase('Critique-Revise loop')

const critique = await agent(`You are the Constitutional Critic for the team-sdk. Run a single critique pass per Pablo's pattern, with Mario's would-have-wrongly-killed guardrail.

Inputs:

Layer A foundation (the constitution):
"""
${foundation}
"""

SDD draft (Layer C v1):
"""
${sddDraft}
"""

Your task — produce a structured critique with two parts:

PART 1 — Critiques.
Identify where the SDD violates, underspecifies, or is in tension with the Priority Constraints, Purpose substrates, or Soul principles. For each finding, produce:
  - principle: the exact name (e.g. "Constraint 1 — capability not dependency", "Soul: Bold creative solutions")
  - sdd_section: which section of the SDD (e.g. "Solution sketch", "Out-of-Bounds")
  - conflict: one sentence describing the tension
  - severity: LOW | MED | HIGH

PART 2 — Mario's guardrail (non-negotiable).
You MUST produce a "would_have_wrongly_killed" line: name at least one historically-bold-and-correct kind of idea that this critique pattern would have rejected. Be specific (e.g., "this critique would have killed a v0 that ships without test coverage during a 2-day spike whose entire goal is to learn whether the problem is real"). If you cannot name one, your critique is running too tight — re-run more permissively. Without this line, downstream phases will reject your output.

Return ONLY a JSON object, no surrounding prose:

{
  "critiques": [
    { "principle": "...", "sdd_section": "...", "conflict": "...", "severity": "LOW|MED|HIGH" }
  ],
  "would_have_wrongly_killed": "..."
}

Also write a human-readable version of your critique to ${ideaFolder}/_critique.md using the Write tool.`, {
  label: 'constitutional-critique',
  phase: 'Critique-Revise loop',
  schema: {
    type: 'object',
    required: ['critiques', 'would_have_wrongly_killed'],
    properties: {
      critiques: {
        type: 'array',
        items: {
          type: 'object',
          required: ['principle', 'sdd_section', 'conflict', 'severity'],
          properties: {
            principle: { type: 'string' },
            sdd_section: { type: 'string' },
            conflict: { type: 'string' },
            severity: { type: 'string', enum: ['LOW', 'MED', 'HIGH'] },
          },
        },
      },
      would_have_wrongly_killed: { type: 'string', minLength: 10 },
    },
  },
})

const revised = await agent(`You are the team-sdk PM revising the SDD given the critique.

Original SDD (Layer C v1):
"""
${sddDraft}
"""

Critique:
"""
${JSON.stringify(critique, null, 2)}
"""

Revise the SDD addressing HIGH and MED severity critiques. SKIP LOW severity unless the fix is one-line trivial.

Critically: do NOT over-correct. Read the "would_have_wrongly_killed" field — if the critique pattern is too tight, KEEP the bold aspects of the original that the critic flagged. This is Mario's guardrail at work: a revision that capitulates to every critique produces beige strategy.

Write:
1. The revised SDD to ${ideaFolder}/sdd-v2.md using Write
2. A revision rationale to ${ideaFolder}/_revision-notes.md with sections:
   - "Addressed" — which critiques you took on board and how
   - "Rejected" — which critiques you REJECTED and why (cite "would_have_wrongly_killed" when relevant)

Return ONLY the revised SDD content (raw markdown).`, {
  label: 'pm-revise',
  phase: 'Critique-Revise loop',
})

phase('Red-Team pass')

const redTeam = await agent(`You are the Red Team. Single pass per Pablo's pattern.

Find ONE assumption in this revised SDD that, if wrong, breaks the entire thing. Not ten weaknesses. ONE killing assumption. The forced economy of attention is what makes this pattern useful.

Revised SDD:
"""
${revised}
"""

Return ONLY a JSON object:

{
  "killing_assumption": "the assumption in plain language",
  "why_it_kills": "the chain from assumption-false to mission-broken, in one paragraph",
  "cheapest_test": "the cheapest concrete action that learns whether the assumption holds. NOT 'do research' — a specific action.",
  "if_holds": "what happens to the SDD if the test passes — proceed unchanged? minor tweak? what tweak?",
  "if_breaks": "what happens if the test fails — kill the mission? pivot to what?",
  "test_cost_estimate": "rough estimate in engineer-hours"
}

Also write a human-readable version to ${ideaFolder}/_red-team.md using the Write tool.`, {
  label: 'red-team',
  phase: 'Red-Team pass',
  schema: {
    type: 'object',
    required: ['killing_assumption', 'why_it_kills', 'cheapest_test', 'if_holds', 'if_breaks', 'test_cost_estimate'],
    properties: {
      killing_assumption: { type: 'string' },
      why_it_kills: { type: 'string' },
      cheapest_test: { type: 'string' },
      if_holds: { type: 'string' },
      if_breaks: { type: 'string' },
      test_cost_estimate: { type: 'string' },
    },
  },
})

phase('Synthesize + Layer B claims')

const synthesis = await agent(`You are the Coordinator — the synthesis owner per protocol §16. You hold the final decision.

Inputs:

Revised SDD (Layer C v2):
"""
${revised}
"""

Red Team finding:
"""
${JSON.stringify(redTeam, null, 2)}
"""

PART 1 — The decision.

Make exactly ONE call:
- **PROCEED** — ship as-is, log the red-team killing_assumption as deferred-risk
- **DE-RISK** — execute the red-team cheapest_test BEFORE shipping, then revisit. Use when test_cost_estimate is cheap and the consequence of being wrong is large.
- **REVISE** — the revised SDD has a hole the red-team exposed that one more shaping round would close. Use sparingly.
- **KILL** — the killing_assumption is fatal and no cheap test exists. The mission dies at shaping.

Write the final shaped brief to ${ideaFolder}/shaped-brief.md with this structure:

# Shaped Brief: ${slug}
**Date:** ${date}
**Decision:** <PROCEED | DE-RISK | REVISE | KILL>
**Author:** Coordinator (auto-synthesized)

## Decision reasoning
One paragraph. Why this decision, not the others.

## Final shape
(If PROCEED or DE-RISK): the brief itself — Problem, Appetite, Solution sketch (final), Non-Negotiables, Out-of-Bounds, Success looks like.
(If REVISE): the specific gap the next revision must close.
(If KILL): the kill reason and what we learned.

## Deferred risk
(If PROCEED): the red-team killing_assumption and what would trigger us to revisit.

## De-risk plan
(If DE-RISK): the cheapest_test, who runs it, by when.

## Provenance
- Workflow run: idea-execution-v0.1
- Spawning agent: Coordinator
- Date: ${date}
- Input idea (first 200 chars): "${idea.replace(/"/g, '\\"').slice(0, 200)}"

PART 2 — Layer B claims extraction.

Extract 3-7 atomic claims about what the system WILL DO if shipped (or what we LEARNED if killed). Every claim must follow this exact schema:

\`\`\`yaml
- id: claim-${slug}-NNN
  epic: ${slug}
  statement: "<one-sentence behavioral fact, present tense, declarative>"
  sources:
    - file: intent-spec/${slug}/shaped-brief.md
      lines: <approximate line range, e.g. 12-28>
    - file: intent-spec/${slug}/sdd-v2.md
      lines: <approximate line range>
  tags:
    - bu:team-sdk
    - area:<derive — e.g. ideation, loops, protocol>
    - behavior:<derive>
  confidence: high | medium | low
  added_in_workflow_run: ${date}-${slug}-001
  provenance_hash_input:
    pattern: idea-execution-v0.1
    spawning_agent: coordinator
    input_idea: "${idea.replace(/"/g, '\\"').slice(0, 200)}"
    date: ${date}
  status: valid
\`\`\`

KEYSTONE RULE: every claim MUST cite at least one source under intent-spec/${slug}/. A claim with no source is hallucination and must not be emitted. This is the core defense against the failure mode the brain-structure doc Section 5.3 calls out.

Run \`mkdir -p ${claimsFolder}\` via Bash, then write the claims to ${claimsFolder}/claims.yaml using Write.

Return ONLY a JSON object:

{
  "decision": "PROCEED|DE-RISK|REVISE|KILL",
  "shaped_brief_path": "intent-spec/${slug}/shaped-brief.md",
  "claims_path": "generated-spec/${slug}/claims.yaml",
  "claim_count": N,
  "deferred_risk": "..." or null,
  "de_risk_test": "..." or null,
  "next_action": "concrete one-sentence next action for the team"
}`, {
  label: 'coordinator-synthesize',
  phase: 'Synthesize + Layer B claims',
  schema: {
    type: 'object',
    required: ['decision', 'shaped_brief_path', 'claims_path', 'claim_count', 'next_action'],
    properties: {
      decision: { type: 'string', enum: ['PROCEED', 'DE-RISK', 'REVISE', 'KILL'] },
      shaped_brief_path: { type: 'string' },
      claims_path: { type: 'string' },
      claim_count: { type: 'integer', minimum: 1 },
      deferred_risk: { type: ['string', 'null'] },
      de_risk_test: { type: ['string', 'null'] },
      next_action: { type: 'string', minLength: 10 },
    },
  },
})

phase('Index + document')

const indexed = await agent(`Final documentation step — make this run discoverable to the team.

Read ${projectRoot}/intent-spec/_INDEX.md if it exists. If not, create it with this header:

# Idea Execution Index

> Append-only ledger of every idea run through the idea-execution workflow. Most recent at top.

| Date | Slug | Decision | Shaped Brief | Claims | Next Action |
|------|------|----------|--------------|--------|-------------|

Then prepend (most recent at top, just under the header rule) a new row:

| ${date} | ${slug} | ${synthesis.decision} | [shaped-brief](${slug}/shaped-brief.md) | [claims](../generated-spec/${slug}/claims.yaml) | ${synthesis.next_action} |

Use Edit if the file exists; Write if it does not. Preserve all existing rows.

Also write a one-line summary to ${ideaFolder}/_summary.md:
"${date} — ${slug} — ${synthesis.decision} — ${synthesis.next_action}"

Return ONLY: { "index_updated": true, "summary_written": true }`, {
  label: 'index-and-document',
  phase: 'Index + document',
  schema: {
    type: 'object',
    required: ['index_updated', 'summary_written'],
    properties: {
      index_updated: { type: 'boolean' },
      summary_written: { type: 'boolean' },
    },
  },
})

return {
  workflow: 'idea-execution-v0.1',
  slug,
  date,
  decision: synthesis.decision,
  claim_count: synthesis.claim_count,
  next_action: synthesis.next_action,
  deferred_risk: synthesis.deferred_risk,
  de_risk_test: synthesis.de_risk_test,
  files: {
    foundation_snapshot: `${ideaFolder}/_foundation-snapshot.md`,
    sdd_v1: `${ideaFolder}/sdd.md`,
    critique: `${ideaFolder}/_critique.md`,
    sdd_v2: `${ideaFolder}/sdd-v2.md`,
    revision_notes: `${ideaFolder}/_revision-notes.md`,
    red_team: `${ideaFolder}/_red-team.md`,
    shaped_brief: `${ideaFolder}/shaped-brief.md`,
    summary: `${ideaFolder}/_summary.md`,
    claims: `${claimsFolder}/claims.yaml`,
    index: `${projectRoot}/intent-spec/_INDEX.md`,
  },
}
