// retrospective-v0.1
//
// When to run:
//   - After PROCEED or DE-RISK→PROCEED shipped decisions (cross-reference
//     intent-spec/<slug>/shaped-brief.md Decision field).
//   - After KILL decisions, to capture the kill learning.
//   - After REVISE that produced a v2 shipped — once v2 is shipped, retro the
//     whole arc against the original brief.
//
// Owner principle: self-improving is as important as executing the task.
// This workflow runs AFTER every major sprint or shipped idea, equal-importance
// partner to idea-execution. One slug per run. No multi-sprint synthesis.

export const meta = {
  name: 'retrospective-v0.1',
  description: 'Post-ship retrospective for a single idea slug. Reads intent-spec/<slug>/ artifacts (shaped-brief, claims, critique, red-team, loops/) and produces an honest outcome assessment, surprises log, keep/change lists, and categorized protocol-change proposals per §15a SDK self-improvement loop. Emits Layer B claims tagged behavior:retrospective so they do not collide with the original idea claims. One slug at a time — no cross-sprint synthesis.',
  phases: [
    { title: 'Load context' },
    { title: 'Outcome assessment' },
    { title: 'Surprises log' },
    { title: 'Keep / change' },
    { title: 'Protocol change proposals' },
    { title: 'Write retro doc' },
  ],
}

const projectRoot = '/Users/matias.bargas/dev/ai-repos/team-sdk'
const input = typeof args === 'string'
  ? { slug: args, date: '2026-06-14' }
  : (args || { slug: 'unnamed', date: '2026-06-14' })

const slug = input.slug
const date = input.date

const ideaFolder = `${projectRoot}/intent-spec/${slug}`
const claimsFolder = `${projectRoot}/generated-spec/${slug}`
const retroIndex = `${projectRoot}/intent-spec/_RETRO-INDEX.md`

log(`Starting retrospective v0.1 — slug="${slug}" date="${date}"`)

phase('Load context')

const situation = await agent(`You are loading the full situation for a post-ship retrospective on slug "${slug}".

Read every file that exists under ${ideaFolder}/ — at minimum:
- shaped-brief.md (the Decision, Final shape, Deferred risk, De-risk plan)
- _critique.md (constitutional critique that shaped the brief)
- _red-team.md (the killing assumption + cheapest test)
- sdd.md and sdd-v2.md if present
- loops/ subfolder content if present (deepening loops, follow-up shaping)
- _revision-notes.md if present

Also read ${claimsFolder}/claims.yaml to see the Layer B claims the original run emitted — these are what the sprint PROMISED would be true post-ship.

Use Bash \`ls ${ideaFolder}/\` first to enumerate what is actually present. Do not invent files.

Produce a tight situation summary, ≤500 words, with these sections:

## What was decided
The shaped-brief Decision (PROCEED / DE-RISK / REVISE / KILL) and the one-paragraph reasoning.

## What was promised
The 3-7 Layer B claims from claims.yaml, restated as plain-English promises about post-ship reality.

## What was flagged as risk
The red-team killing_assumption and the deferred risk (if any).

## What loops or follow-ups happened
If loops/ exists, what those rounds shaped further. If not, say so plainly.

Return ONLY the situation summary as raw markdown — no commentary, no opinions. Honesty over polish.`, {
  label: 'load-situation',
  phase: 'Load context',
})

phase('Outcome assessment')

const outcome = await agent(`You are the retrospective assessor. The question is simple and the answer must be honest: did the shipped artifact do what the brief said it would?

Situation summary:
"""
${situation}
"""

Read again, with fresh eyes, the artifacts at ${ideaFolder}/ — especially shaped-brief.md and ${claimsFolder}/claims.yaml. Then look for downstream evidence: any retro-relevant artifact in ${ideaFolder}/loops/, any updates to ${projectRoot}/protocol.md, ${projectRoot}/STRATEGY.md, ${projectRoot}/team/roles/, or other team-sdk files that this sprint was supposed to produce. Use Bash \`grep -r\` against ${projectRoot} only if a specific claim can be verified that way — do not fish.

For EACH Layer B claim from claims.yaml, judge it:
- MET — evidence in the repo or downstream artifacts confirms the claim is true
- PARTIAL — evidence shows partial truth, with the gap named
- UNMET — no evidence, or evidence contradicts the claim
- UNTESTABLE — the claim is too vague to assess (this is itself a finding)

Then make ONE overall call:
- DELIVERED — the brief substantially did what it said
- PARTIAL — meaningful progress but a named gap remains
- MISSED — the artifact did not do what the brief said, even if effort was real
- ABANDONED — the work was dropped or rerouted before completion

CRITICAL: if the answer is MISSED or ABANDONED, say so plainly. Do not soften. Honest failure capture is the entire point of this phase — a retro that always says DELIVERED is worthless.

Return ONLY a JSON object:

{
  "overall": "DELIVERED|PARTIAL|MISSED|ABANDONED",
  "overall_reasoning": "one paragraph, cite specific evidence (file paths, sections)",
  "claim_assessments": [
    { "claim_id": "claim-${slug}-NNN", "verdict": "MET|PARTIAL|UNMET|UNTESTABLE", "evidence": "one sentence with a file path or grep hit, or 'no evidence found'" }
  ]
}`, {
  label: 'outcome-assessment',
  phase: 'Outcome assessment',
  schema: {
    type: 'object',
    required: ['overall', 'overall_reasoning', 'claim_assessments'],
    properties: {
      overall: { type: 'string', enum: ['DELIVERED', 'PARTIAL', 'MISSED', 'ABANDONED'] },
      overall_reasoning: { type: 'string', minLength: 20 },
      claim_assessments: {
        type: 'array',
        items: {
          type: 'object',
          required: ['claim_id', 'verdict', 'evidence'],
          properties: {
            claim_id: { type: 'string' },
            verdict: { type: 'string', enum: ['MET', 'PARTIAL', 'UNMET', 'UNTESTABLE'] },
            evidence: { type: 'string' },
          },
        },
      },
    },
  },
})

phase('Surprises log')

const surprises = await agent(`You are logging surprises — things we LEARNED that we did NOT predict at shaping time.

Situation summary:
"""
${situation}
"""

Outcome assessment:
"""
${JSON.stringify(outcome, null, 2)}
"""

A surprise is the gap between what the shaped-brief and red-team anticipated, vs. what actually happened during execution or post-ship. Sources of surprises:
- A claim was MET in a different way than expected
- A risk that was flagged turned out NOT to bite (or bit in a different way)
- A risk that was NOT flagged bit hard
- An assumption embedded in the brief turned out wrong (or unexpectedly right)
- An emergent behavior, side effect, or downstream use case nobody mentioned at shaping

Produce a structured list — 2 to 6 entries. Quality over quantity. If there were genuinely no surprises (rare and suspicious), return an empty list and say so in the implication of a single "no surprises" entry — do not pad.

Return ONLY a JSON object:

{
  "surprises": [
    {
      "surprise": "one-sentence headline",
      "what_we_thought": "what shaping or red-team predicted",
      "what_actually_happened": "what we observed instead",
      "implication": "what this means going forward — for THIS arc or for the SDK"
    }
  ]
}`, {
  label: 'surprises-log',
  phase: 'Surprises log',
  schema: {
    type: 'object',
    required: ['surprises'],
    properties: {
      surprises: {
        type: 'array',
        items: {
          type: 'object',
          required: ['surprise', 'what_we_thought', 'what_actually_happened', 'implication'],
          properties: {
            surprise: { type: 'string' },
            what_we_thought: { type: 'string' },
            what_actually_happened: { type: 'string' },
            implication: { type: 'string' },
          },
        },
      },
    },
  },
})

phase('Keep / change')

const keepChange = await agent(`Produce two lists from this retro — what to do MORE of, and what to do DIFFERENTLY.

Situation summary:
"""
${situation}
"""

Outcome assessment:
"""
${JSON.stringify(outcome, null, 2)}
"""

Surprises:
"""
${JSON.stringify(surprises, null, 2)}
"""

Rules:
- Each item is SPECIFIC (names a file, role, phase, or behavior) and ACTIONABLE (a future agent could apply it).
- "We should communicate better" is BANNED. "Coordinator should emit Bus message at phase boundary, not just at synthesis" is acceptable.
- 2-5 items per list. Resist padding.
- If a keep item is just "the workflow worked", say which step in particular and why.

Return ONLY a JSON object:

{
  "keep": [
    { "item": "specific behavior or artifact to do more of", "why": "what evidence in this arc supports it" }
  ],
  "change": [
    { "item": "specific behavior or artifact to do differently next time", "why": "what evidence in this arc supports it", "proposed_change": "the concrete delta" }
  ]
}`, {
  label: 'keep-change',
  phase: 'Keep / change',
  schema: {
    type: 'object',
    required: ['keep', 'change'],
    properties: {
      keep: {
        type: 'array',
        items: {
          type: 'object',
          required: ['item', 'why'],
          properties: { item: { type: 'string' }, why: { type: 'string' } },
        },
      },
      change: {
        type: 'array',
        items: {
          type: 'object',
          required: ['item', 'why', 'proposed_change'],
          properties: {
            item: { type: 'string' },
            why: { type: 'string' },
            proposed_change: { type: 'string' },
          },
        },
      },
    },
  },
})

phase('Protocol change proposals')

const proposals = await agent(`You are categorizing the keep/change list against §15a — the SDK self-improvement loop.

Read ${projectRoot}/protocol.md section 15a (use Bash + grep to locate it) to ground yourself in the exact proposal format the SDK expects. If §15a is absent or thin, say so in your output rather than inventing structure.

Keep / change input:
"""
${JSON.stringify(keepChange, null, 2)}
"""

For EACH item in keep + change, categorize as exactly one of:
- "protocol-change-proposal" — touches protocol.md, role definitions, Bus format, or any SDK-wide contract. Will require a §15a-formatted proposal to land.
- "layer-a-foundation-delta" — touches the constitutional grounding: Priority Constraints, Purpose substrates, Soul principles, design principles. Higher bar than a protocol change.
- "project-level-note" — applies only to THIS arc / THIS slug, not the SDK. Captured for memory but not promoted upstream.

For protocol-change-proposal entries, also draft a one-paragraph proposal stub in the §15a format (problem → proposed change → expected impact). For layer-a entries, draft a one-sentence delta and flag who must approve (Greg for Soul, Mario for design principles, etc.).

Return ONLY a JSON object:

{
  "proposals": [
    {
      "source_item": "the keep or change item this came from",
      "category": "protocol-change-proposal|layer-a-foundation-delta|project-level-note",
      "proposal_stub": "for protocol/layer-a only — the draft. For project-level, repeat the action.",
      "approver": "for layer-a only — who must approve. null otherwise."
    }
  ],
  "protocol_change_proposal_count": <integer — count of category == 'protocol-change-proposal'>
}`, {
  label: 'protocol-proposals',
  phase: 'Protocol change proposals',
  schema: {
    type: 'object',
    required: ['proposals', 'protocol_change_proposal_count'],
    properties: {
      proposals: {
        type: 'array',
        items: {
          type: 'object',
          required: ['source_item', 'category', 'proposal_stub'],
          properties: {
            source_item: { type: 'string' },
            category: { type: 'string', enum: ['protocol-change-proposal', 'layer-a-foundation-delta', 'project-level-note'] },
            proposal_stub: { type: 'string' },
            approver: { type: ['string', 'null'] },
          },
        },
      },
      protocol_change_proposal_count: { type: 'integer', minimum: 0 },
    },
  },
})

phase('Write retro doc')

const written = await agent(`Final step — consolidate the retro into a single document and index it.

Inputs (all already produced this run):

Situation:
"""
${situation}
"""

Outcome:
"""
${JSON.stringify(outcome, null, 2)}
"""

Surprises:
"""
${JSON.stringify(surprises, null, 2)}
"""

Keep / change:
"""
${JSON.stringify(keepChange, null, 2)}
"""

Proposals:
"""
${JSON.stringify(proposals, null, 2)}
"""

PART 1 — Write the retrospective document to ${ideaFolder}/_retrospective.md with this structure:

# Retrospective: ${slug}
**Date:** ${date}
**Workflow:** retrospective-v0.1
**Overall outcome:** ${outcome.overall}

## Situation
(the situation summary, verbatim)

## Outcome assessment
**Overall:** ${outcome.overall}
${outcome.overall_reasoning}

### Claim-by-claim verdict
(table: claim_id | verdict | evidence)

## Surprises
(one subsection per surprise, with the four fields)

## Keep
(bullets, each "item — why")

## Change
(bullets, each "item — why → proposed change")

## Proposals
### Protocol change proposals
(only category == protocol-change-proposal, each with its stub)

### Layer A foundation deltas
(only category == layer-a-foundation-delta, each with delta + approver)

### Project-level notes
(only category == project-level-note)

## Honest line
If outcome is MISSED or ABANDONED, write one plain sentence here that does NOT soften the result. If DELIVERED or PARTIAL, write one sentence naming the most important thing still owed forward.

PART 2 — Append a one-line entry to ${retroIndex}.

If ${retroIndex} does NOT exist, create it with this header:

# Retrospective Index

> Append-only ledger of every retro run. Most recent at top.

| Date | Slug | Outcome | Proposals | Retro doc |
|------|------|---------|-----------|-----------|

Then prepend (most recent at top, just under the header rule) this row:

| ${date} | ${slug} | ${outcome.overall} | ${proposals.protocol_change_proposal_count} protocol / ${proposals.proposals.filter(p => p.category === 'layer-a-foundation-delta').length} layer-A | [retro](${slug}/_retrospective.md) |

Use Edit if the file exists; Write if it does not. Preserve all existing rows.

PART 3 — Emit Layer B retrospective claims to ${claimsFolder}/claims-retro.yaml.

Each retro claim follows the SAME Layer B schema as idea-execution but with:
- id: claim-retro-${slug}-NNN
- epic: ${slug}
- tags include "behavior:retrospective" so they do not collide with original idea claims
- sources cite intent-spec/${slug}/_retrospective.md
- added_in_workflow_run: ${date}-${slug}-retro-001
- provenance_hash_input.pattern: retrospective-v0.1
- provenance_hash_input.spawning_agent: retrospective-author

Emit 2-5 atomic claims about what we LEARNED in this arc — phrased as durable behavioral facts (e.g., "Constitutional Critique without anonymization produces sycophantic revisions on bold ideas"). Skip if outcome is ABANDONED with no learning extracted.

Run \`mkdir -p ${claimsFolder}\` via Bash if needed, then Write the file.

Return ONLY a JSON object:

{
  "retro_doc_path": "intent-spec/${slug}/_retrospective.md",
  "index_path": "intent-spec/_RETRO-INDEX.md",
  "retro_claims_path": "generated-spec/${slug}/claims-retro.yaml",
  "retro_claim_count": N
}`, {
  label: 'write-retro-doc',
  phase: 'Write retro doc',
  schema: {
    type: 'object',
    required: ['retro_doc_path', 'index_path', 'retro_claims_path', 'retro_claim_count'],
    properties: {
      retro_doc_path: { type: 'string' },
      index_path: { type: 'string' },
      retro_claims_path: { type: 'string' },
      retro_claim_count: { type: 'integer', minimum: 0 },
    },
  },
})

return {
  workflow: 'retrospective-v0.1',
  slug,
  date,
  overall_outcome: outcome.overall,
  surprise_count: surprises.surprises.length,
  keep_count: keepChange.keep.length,
  change_count: keepChange.change.length,
  protocol_change_proposal_count: proposals.protocol_change_proposal_count,
  layer_a_delta_count: proposals.proposals.filter(p => p.category === 'layer-a-foundation-delta').length,
  retro_claim_count: written.retro_claim_count,
  files: {
    retrospective: `${ideaFolder}/_retrospective.md`,
    index: retroIndex,
    retro_claims: `${claimsFolder}/claims-retro.yaml`,
  },
}
