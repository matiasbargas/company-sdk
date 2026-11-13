// retrospective
//
// One workflow, four cadences: loop / daily / sprint / quarterly.
// Each cadence reads everything below it. Quarterly reads sprint reads daily
// reads loop signals. Provenance for every run is appended to
// metrics/_cadence-runs.jsonl. Sprint body is the verbatim v0.1 retro.

export const meta = {
  name: 'retrospective',
  description: 'Continuous-improvement retrospective with four cadences. cadence=loop appends a single improvement_signal from a closed loop to metrics/_signals.jsonl. cadence=daily digests the signal stream since the last daily into metrics/_daily-digests/YYYY-MM-DD.md. cadence=sprint is the v0.1 single-slug post-ship retro (situation, outcome, surprises, keep/change, §15a proposals, _retrospective.md + _RETRO-INDEX.md + claims-retro.yaml). cadence=quarterly synthesizes the period: KR attribution, Layer A delta candidates, _HORIZONS.md update, quarterly memo.',
  phases: [
    { title: 'Validate + load' },
    { title: 'Cadence body' },
    { title: 'Provenance' },
  ],
}

const input = typeof args === 'string' ? { cadence: args } : (args || {})
// Workflow scripts cannot read the clock or cwd: date is required, projectRoot overridable.
const projectRoot = input.projectRoot || '/Users/matias.bargas/dev/ai-repos/team-sdk'
const today = input.date
if (!today || !/^\d{4}-\d{2}-\d{2}$/.test(String(today))) {
  throw new Error('retrospective requires args.date in YYYY-MM-DD form (workflow scripts cannot read the clock). e.g. args: { cadence: "daily", date: "2026-06-22" }')
}
const cadence = input.cadence
const VALID = ['loop', 'daily', 'sprint', 'quarterly']
if (!VALID.includes(cadence)) throw new Error(`cadence must be one of ${VALID.join('|')}, got "${cadence}"`)

// Consolidated project layout (2026-07). The Workflow runtime has no require(), so this
// mirrors workflows/_paths.js (canonical for Node scripts) inline. projectRoot nests project/.
const base = `${projectRoot}/project`
const P = {
  context: `${base}/context`, record: `${base}/record`, metrics: `${base}/record/metrics`,
  foundation: `${base}/context/foundation`,
  specDir: (s) => `${base}/context/spec/${s}`,
  intentDir: (s) => `${base}/context/intent/${s}`,
  intentIndex: `${base}/context/intent/_INDEX.md`,
  retroIndex: `${base}/context/intent/_RETRO-INDEX.md`,
  horizons: `${base}/context/intent/_HORIZONS.md`,
  loopDir: (id) => `${base}/record/loops/${id}`,
  signals: `${base}/record/metrics/_signals.jsonl`,
  cadenceRuns: `${base}/record/metrics/_cadence-runs.jsonl`,
  dailyDigests: `${base}/record/metrics/_daily-digests`,
  rel: {
    context: 'project/context',
    retroIndex: 'project/context/intent/_RETRO-INDEX.md',
    dailyDigests: 'project/record/metrics/_daily-digests',
    specDir: (s) => `project/context/spec/${s}`,
    intentDir: (s) => `project/context/intent/${s}`,
  },
}
const signalsFile = P.signals
const runsFile = P.cadenceRuns
const dailyDir = P.dailyDigests
const horizonsFile = P.horizons          // was stale: projectRoot/_HORIZONS.md; canonical home is Layer C
const retroIndex = P.retroIndex

log(`Starting retrospective — cadence="${cadence}"`)

phase('Validate + load')

let result

if (cadence === 'loop') {
  // --- LOOP CADENCE: 2 phases, 1 agent. Read one loops/<id>/state.md, ---
  // --- extract improvement_signal, append to metrics/_signals.jsonl.   ---
  const loopId = input.loop_id
  if (!loopId) throw new Error('cadence=loop requires input.loop_id')
  const statePath = input.state_path || `${P.loopDir(loopId)}/state.md`
  log(`Loop close: extracting signal from ${statePath}`)

  phase('Cadence body')

  result = await agent(`You are extracting the improvement_signal from a freshly closed loop and appending it to the signal stream.

Read ${statePath} — find the \`## improvement_signal\` heading and the YAML block beneath it. The schema (from team/roles/loops/_IMPROVEMENT_SIGNAL.md) is:

\`\`\`yaml
improvement_signal:
  friction: "<one sentence>"
  suggested_target: loop-pattern | layer-A | workflow | protocol | none
  evidence_link: "<optional path>"
\`\`\`

\`friction\` and \`suggested_target\` are required. \`suggested_target: none\` is valid but must be explicit. If the field is missing entirely, that is a convergence-contract failure — return verdict "missing" rather than fabricating.

Then append ONE JSONL line to ${signalsFile} (create the file if it does not exist; never edit existing lines — append-only). The line shape:

{"ts":"${today}","loop_id":"${loopId}","friction":"...","suggested_target":"...","evidence_link":"..."}

Use Bash with \`>>\` redirection to append. Use \`mkdir -p\` for the metrics/ directory if needed.

Return ONLY a JSON object:

{ "verdict": "appended|missing|malformed", "loop_id": "${loopId}", "signal": { "friction": "...", "suggested_target": "...", "evidence_link": "..." } }`, {
    label: 'loop-signal-append',
    phase: 'Cadence body',
    schema: {
      type: 'object',
      required: ['verdict', 'loop_id'],
      properties: {
        verdict: { type: 'string', enum: ['appended', 'missing', 'malformed'] },
        loop_id: { type: 'string' },
        signal: { type: ['object', 'null'] },
      },
    },
  })
}

if (cadence === 'daily') {
  // --- DAILY CADENCE: 3 phases, 2 agents. Read tail of signal stream ---
  // --- since the last daily, digest, write a markdown digest.         ---
  const date = input.date || today
  log(`Daily digest for ${date}`)

  phase('Cadence body')

  const digest = await agent(`You are producing today's improvement-signal digest.

Source: ${signalsFile} (JSONL, append-only). Use Bash \`ls ${dailyDir}/\` to find the most recent prior daily digest filename (YYYY-MM-DD.md). If none exists, treat "since" as the start of the signal file.

Read the tail of ${signalsFile} since that cutoff (use \`tail\` + \`jq\` or just read the whole file if small). Group signals by \`suggested_target\` (loop-pattern, layer-A, workflow, protocol, none). For each group, surface the 1-3 most action-able friction lines verbatim — do not paraphrase. If two signals point at the same amendment, cluster them and note the count.

Produce a tight digest, ≤400 words, with these sections:

## Date
${date}

## Signal volume
N signals since last digest (date range).

## By target
### loop-pattern
- friction line (loop_id) — cluster count if N>1
### layer-A
...
### workflow
...
### protocol
...
### none
N signals (count only — no detail needed)

## Watchlist
1-3 lines: which clusters are starting to look like a pattern that a sprint or quarterly retro should action. Be specific: "3 loops in the last week flagged friction with X — sprint retro should consider Y."

Return ONLY the digest as raw markdown.`, {
    label: 'daily-digest',
    phase: 'Cadence body',
  })

  const written = await agent(`Write the digest to ${dailyDir}/${date}.md.

Digest content:
"""
${digest}
"""

Run \`mkdir -p ${dailyDir}\` first. Then Write the file. If the file already exists for today, overwrite it (idempotent re-run).

Return ONLY a JSON object: { "digest_path": "${P.rel.dailyDigests}/${date}.md" }`, {
    label: 'daily-write',
    phase: 'Cadence body',
    schema: { type: 'object', required: ['digest_path'], properties: { digest_path: { type: 'string' } } },
  })

  result = { date, digest_path: written.digest_path }
}

if (cadence === 'sprint') {
  // --- SPRINT CADENCE: 6 phases. Verbatim port of retrospective-v0.1. ---
  // --- One slug per run. Trigger checklist enforced before any agents fire. ---
  const slug = input.slug
  const date = input.date || today
  if (!slug) throw new Error('cadence=sprint requires input.slug')
  const ideaFolder = P.intentDir(slug)
  const claimsFolder = P.specDir(slug)

  // Trigger checklist — PROCEED/HOLDS, 24h wait, not already retroed.
  const trigger = await agent(`You are checking the sprint retro trigger checklist for slug "${slug}" before any retro agents fire.

Enforce ALL THREE:
1. Decision in ${ideaFolder}/shaped-brief.md is PROCEED, DE-RISK→PROCEED, KILL, or REVISE-shipped-as-v2. Read the Decision field. If REVISE without v2 shipped, FAIL.
2. At least 24h since ship date (shipped_at field in shaped-brief.md or claims.yaml). Today is ${date}. If <24h, FAIL.
3. Not already retroed — ${ideaFolder}/_retrospective.md must NOT already exist. Use Bash \`ls ${ideaFolder}/_retrospective.md 2>/dev/null\`.

Return ONLY a JSON object:

{ "ok": true|false, "reasons": ["..."], "decision": "PROCEED|DE-RISK|KILL|REVISE", "hours_since_ship": N, "already_retroed": true|false }`, {
    label: 'sprint-trigger-check',
    phase: 'Cadence body',
    schema: {
      type: 'object',
      required: ['ok', 'reasons'],
      properties: {
        ok: { type: 'boolean' },
        reasons: { type: 'array', items: { type: 'string' } },
        decision: { type: ['string', 'null'] },
        hours_since_ship: { type: ['number', 'null'] },
        already_retroed: { type: ['boolean', 'null'] },
      },
    },
  })

  if (!trigger.ok) {
    result = { skipped: true, slug, reasons: trigger.reasons }
  } else {
    phase('Cadence body')

    const situation = await agent(`You are loading the full situation for a post-ship retrospective on slug "${slug}". Read every file under ${ideaFolder}/ (shaped-brief.md, _critique.md, _red-team.md, sdd.md/sdd-v2.md if present, loops/, _revision-notes.md if present) and ${claimsFolder}/claims.yaml. Use Bash \`ls ${ideaFolder}/\` first — do not invent files. Produce a tight ≤500-word summary with sections: ## What was decided, ## What was promised, ## What was flagged as risk, ## What loops or follow-ups happened. Return ONLY raw markdown.`, { label: 'load-situation', phase: 'Cadence body' })

    const outcome = await agent(`You are the retrospective assessor. Did the shipped artifact do what the brief said it would?\n\nSituation:\n"""\n${situation}\n"""\n\nRe-read ${ideaFolder}/shaped-brief.md and ${claimsFolder}/claims.yaml. Look for downstream evidence (loops/, protocol.md, STRATEGY.md, team/roles/) — use \`grep -r\` only when a specific claim can be verified that way. For EACH Layer B claim: MET | PARTIAL | UNMET | UNTESTABLE. Then ONE overall call: DELIVERED | PARTIAL | MISSED | ABANDONED. If MISSED or ABANDONED, say so plainly — do not soften.\n\nReturn ONLY:\n{ "overall": "...", "overall_reasoning": "...", "claim_assessments": [{ "claim_id": "...", "verdict": "...", "evidence": "..." }] }`, {
      label: 'outcome-assessment',
      phase: 'Cadence body',
      schema: {
        type: 'object',
        required: ['overall', 'overall_reasoning', 'claim_assessments'],
        properties: {
          overall: { type: 'string', enum: ['DELIVERED', 'PARTIAL', 'MISSED', 'ABANDONED'] },
          overall_reasoning: { type: 'string', minLength: 20 },
          claim_assessments: { type: 'array', items: { type: 'object', required: ['claim_id', 'verdict', 'evidence'], properties: { claim_id: { type: 'string' }, verdict: { type: 'string', enum: ['MET', 'PARTIAL', 'UNMET', 'UNTESTABLE'] }, evidence: { type: 'string' } } } },
        },
      },
    })

    const surprises = await agent(`Log surprises — things we LEARNED but did NOT predict at shaping.\n\nSituation:\n"""\n${situation}\n"""\n\nOutcome:\n"""\n${JSON.stringify(outcome, null, 2)}\n"""\n\n2-6 entries. Quality over quantity. If genuinely none, return empty list with one "no surprises" entry.\n\nReturn ONLY: { "surprises": [{ "surprise": "...", "what_we_thought": "...", "what_actually_happened": "...", "implication": "..." }] }`, {
      label: 'surprises-log',
      phase: 'Cadence body',
      schema: { type: 'object', required: ['surprises'], properties: { surprises: { type: 'array', items: { type: 'object', required: ['surprise', 'what_we_thought', 'what_actually_happened', 'implication'], properties: { surprise: { type: 'string' }, what_we_thought: { type: 'string' }, what_actually_happened: { type: 'string' }, implication: { type: 'string' } } } } } },
    })

    const keepChange = await agent(`Two lists: keep (do MORE of) and change (do DIFFERENTLY).\n\nSituation/outcome/surprises above. Each item SPECIFIC + ACTIONABLE. "Communicate better" is BANNED. 2-5 per list.\n\nInputs:\nSituation:\n"""${situation}"""\nOutcome:\n"""${JSON.stringify(outcome, null, 2)}"""\nSurprises:\n"""${JSON.stringify(surprises, null, 2)}"""\n\nReturn ONLY: { "keep": [{ "item": "...", "why": "..." }], "change": [{ "item": "...", "why": "...", "proposed_change": "..." }] }`, {
      label: 'keep-change',
      phase: 'Cadence body',
      schema: { type: 'object', required: ['keep', 'change'], properties: { keep: { type: 'array', items: { type: 'object', required: ['item', 'why'], properties: { item: { type: 'string' }, why: { type: 'string' } } } }, change: { type: 'array', items: { type: 'object', required: ['item', 'why', 'proposed_change'], properties: { item: { type: 'string' }, why: { type: 'string' }, proposed_change: { type: 'string' } } } } } },
    })

    const proposals = await agent(`Categorize each keep/change item against protocol.md §15a (locate via Bash + grep). Categories: protocol-change-proposal | layer-a-foundation-delta | project-level-note. For protocol-change-proposal, draft a §15a stub (problem → change → impact). For layer-a, draft a one-sentence delta + approver (Greg for Soul, Mario for design principles, etc.).\n\nInput:\n"""${JSON.stringify(keepChange, null, 2)}"""\n\nReturn ONLY: { "proposals": [{ "source_item": "...", "category": "...", "proposal_stub": "...", "approver": "..."|null }], "protocol_change_proposal_count": N }`, {
      label: 'protocol-proposals',
      phase: 'Cadence body',
      schema: { type: 'object', required: ['proposals', 'protocol_change_proposal_count'], properties: { proposals: { type: 'array', items: { type: 'object', required: ['source_item', 'category', 'proposal_stub'], properties: { source_item: { type: 'string' }, category: { type: 'string', enum: ['protocol-change-proposal', 'layer-a-foundation-delta', 'project-level-note'] }, proposal_stub: { type: 'string' }, approver: { type: ['string', 'null'] } } } }, protocol_change_proposal_count: { type: 'integer', minimum: 0 } } },
    })

    const written = await agent(`Consolidate and index.\n\nInputs: situation, outcome, surprises, keep/change, proposals (all in this run).\n\nPART 1 — Write ${ideaFolder}/_retrospective.md:\n# Retrospective: ${slug}\n**Date:** ${date}\n**Workflow:** retrospective (cadence=sprint)\n**Overall outcome:** ${outcome.overall}\n## Situation\n(verbatim)\n## Outcome assessment\n**Overall:** ${outcome.overall}\n${outcome.overall_reasoning}\n### Claim-by-claim verdict\n(table)\n## Surprises\n(one subsection per surprise)\n## Keep / Change / Proposals (Protocol / Layer A / Project-level)\n## Honest line\nIf MISSED/ABANDONED, do NOT soften. If DELIVERED/PARTIAL, name the most important thing still owed forward.\n\nPART 2 — Prepend a row to ${retroIndex} (create with header if absent):\n| ${date} | ${slug} | ${outcome.overall} | ${proposals.protocol_change_proposal_count} protocol / ${proposals.proposals.filter(p => p.category === 'layer-a-foundation-delta').length} layer-A | [retro](${slug}/_retrospective.md) |\n\nPART 3 — Emit Layer B retro claims to ${claimsFolder}/claims-retro.yaml. id: claim-retro-${slug}-NNN, tag behavior:retrospective, sources cite ${P.rel.intentDir(slug)}/_retrospective.md, added_in_workflow_run: ${date}-${slug}-retro-001. 2-5 atomic durable learning claims. Skip if ABANDONED with no learning. \`mkdir -p ${claimsFolder}\` first.\n\nInputs (verbatim):\nSituation: """${situation}"""\nOutcome: """${JSON.stringify(outcome, null, 2)}"""\nSurprises: """${JSON.stringify(surprises, null, 2)}"""\nKeep/change: """${JSON.stringify(keepChange, null, 2)}"""\nProposals: """${JSON.stringify(proposals, null, 2)}"""\n\nReturn ONLY: { "retro_doc_path": "...", "index_path": "...", "retro_claims_path": "...", "retro_claim_count": N }`, {
      label: 'write-retro-doc',
      phase: 'Cadence body',
      schema: { type: 'object', required: ['retro_doc_path', 'index_path', 'retro_claims_path', 'retro_claim_count'], properties: { retro_doc_path: { type: 'string' }, index_path: { type: 'string' }, retro_claims_path: { type: 'string' }, retro_claim_count: { type: 'integer', minimum: 0 } } },
    })

    result = { slug, date, overall_outcome: outcome.overall, surprise_count: surprises.surprises.length, keep_count: keepChange.keep.length, change_count: keepChange.change.length, protocol_change_proposal_count: proposals.protocol_change_proposal_count, layer_a_delta_count: proposals.proposals.filter(p => p.category === 'layer-a-foundation-delta').length, retro_claim_count: written.retro_claim_count, files: written }
  }
}

if (cadence === 'quarterly') {
  // --- QUARTERLY CADENCE: 5 phases. Period synthesis: sprint retros + ---
  // --- daily digests + signal stream. KR attribution, Layer A delta   ---
  // --- candidates, _HORIZONS.md update, quarterly memo.               ---
  const quarter = input.quarter
  const from = input.from
  const to = input.to || today
  if (!quarter || !from) throw new Error('cadence=quarterly requires input.quarter (e.g. "2026.Q2") and input.from (YYYY-MM-DD)')

  phase('Cadence body')

  const period = await agent(`Load the full period for quarterly retro ${quarter} (${from} → ${to}).\n\nGather:\n1. All ${P.context}/intent/*/_retrospective.md whose Date is in [${from}, ${to}]. Use Bash \`grep -l '**Date:** 2026'\` then filter dates.\n2. All ${P.dailyDigests}/*.md in the date range.\n3. The signal stream ${signalsFile} — count by suggested_target for the period.\n4. ${projectRoot}/STRATEGY.md (Betting Table, 4 success themes, KRs).\n5. ${P.horizons} if it exists.\n\nReturn ≤600 words: ## Sprint retros (count by outcome + slug list with overall), ## Daily-digest themes (recurring watchlist items), ## Signal volume by target, ## KRs as currently stated in STRATEGY.md.\n\nReturn ONLY raw markdown.`, { label: 'quarterly-load-period', phase: 'Cadence body' })

  const krAttribution = await agent(`Attribute KR movement this quarter to shipped slugs.\n\nPeriod context:\n"""${period}"""\n\nFor each KR in STRATEGY.md: which shipped slugs (from the retros) materially moved it? Cite the slug + the retro's overall outcome + one-line evidence. Be honest: if no slug moved a KR, say "no attributable movement". Do not stretch.\n\nReturn ONLY: { "attributions": [{ "kr": "...", "movement": "advanced|held|regressed|none", "slugs": ["..."], "evidence": "..." }] }`, {
    label: 'kr-attribution',
    phase: 'Cadence body',
    schema: { type: 'object', required: ['attributions'], properties: { attributions: { type: 'array', items: { type: 'object', required: ['kr', 'movement', 'slugs', 'evidence'], properties: { kr: { type: 'string' }, movement: { type: 'string', enum: ['advanced', 'held', 'regressed', 'none'] }, slugs: { type: 'array', items: { type: 'string' } }, evidence: { type: 'string' } } } } } },
  })

  const layerADeltas = await agent(`Surface Layer A foundation delta candidates accumulated this quarter.\n\nPeriod:\n"""${period}"""\nKR attribution:\n"""${JSON.stringify(krAttribution, null, 2)}"""\n\nAcross the sprint retros, find every proposal categorized as \`layer-a-foundation-delta\`. Use Bash + grep against ${P.context}/intent/*/_retrospective.md. Cluster by theme. For each cluster, draft a candidate amendment to the constitutional grounding (Priority Constraints, Purpose substrates, Soul principles, design principles) — one sentence + named approver (Greg / Mario / etc.) + supporting slug count.\n\nReturn ONLY: { "candidates": [{ "theme": "...", "amendment": "...", "approver": "...", "supporting_slugs": ["..."] }] }`, {
    label: 'layer-a-deltas',
    phase: 'Cadence body',
    schema: { type: 'object', required: ['candidates'], properties: { candidates: { type: 'array', items: { type: 'object', required: ['theme', 'amendment', 'approver', 'supporting_slugs'], properties: { theme: { type: 'string' }, amendment: { type: 'string' }, approver: { type: 'string' }, supporting_slugs: { type: 'array', items: { type: 'string' } } } } } } },
  })

  const horizons = await agent(`Update ${horizonsFile} with this quarter's horizon shifts.\n\nPeriod: """${period}"""\nKR attribution: """${JSON.stringify(krAttribution, null, 2)}"""\nLayer A candidates: """${JSON.stringify(layerADeltas, null, 2)}"""\n\nRead ${horizonsFile} via Read (or create if missing — header: "# Horizons\\n\\n> Quarterly view of where the company is pointed."). Append a new section for ${quarter}:\n\n## ${quarter}\n**Period:** ${from} → ${to}\n### KR movement\n(one bullet per attribution.movement != none)\n### Layer A candidates pending\n(one bullet per candidate)\n### Watchlist into next quarter\n(2-4 lines synthesizing the daily-digest themes that still need action)\n\nUse Edit to append at end of file, or Write if creating. Preserve all prior sections.\n\nReturn ONLY: { "horizons_path": "_HORIZONS.md", "section_added": "${quarter}" }`, {
    label: 'horizons-update',
    phase: 'Cadence body',
    schema: { type: 'object', required: ['horizons_path', 'section_added'], properties: { horizons_path: { type: 'string' }, section_added: { type: 'string' } } },
  })

  const memo = await agent(`Write the quarterly memo to ${P.context}/intent/_QUARTERLY-${quarter}.md.\n\nInputs:\nPeriod: """${period}"""\nKR: """${JSON.stringify(krAttribution, null, 2)}"""\nLayer A: """${JSON.stringify(layerADeltas, null, 2)}"""\nHorizons section added: ${horizons.section_added}\n\nStructure:\n# Quarterly Retrospective: ${quarter}\n**Period:** ${from} → ${to}\n**Workflow:** retrospective (cadence=quarterly)\n## Headline\n(one paragraph: what this quarter actually was, honestly)\n## KR movement\n(table from attribution)\n## Layer A candidates pending decision\n(list with approvers)\n## What the signal stream told us\n(2-3 paragraphs from period digest themes)\n## What we owe next quarter\n(3-5 specific items, not vibes)\n## Honest line\n(one sentence; if no KR moved, say so plainly)\n\nWrite the file. Return ONLY: { "memo_path": "${P.rel.context}/intent/_QUARTERLY-${quarter}.md" }`, {
    label: 'quarterly-memo',
    phase: 'Cadence body',
    schema: { type: 'object', required: ['memo_path'], properties: { memo_path: { type: 'string' } } },
  })

  result = { quarter, from, to, kr_attribution_count: krAttribution.attributions.length, layer_a_candidate_count: layerADeltas.candidates.length, horizons_path: horizons.horizons_path, memo_path: memo.memo_path }
}

phase('Provenance')

// One JSONL line per cadence run, append-only, into metrics/_cadence-runs.jsonl.
const scope = cadence === 'loop' ? input.loop_id
  : cadence === 'daily' ? (input.date || today)
  : cadence === 'sprint' ? input.slug
  : `${input.quarter}:${input.from}..${input.to || today}`
const provenanceLine = JSON.stringify({ ts: today, cadence, scope, outputs: result })

await agent(`Append exactly ONE line to ${runsFile} (create file + parent dir if missing, append-only — never edit existing lines):\n\n${provenanceLine}\n\nUse Bash: \`mkdir -p ${P.metrics} && printf '%s\\n' '${provenanceLine.replace(/'/g, "'\\''")}' >> ${runsFile}\`.\n\nReturn ONLY: { "appended": true }`, {
  label: 'provenance-append',
  phase: 'Provenance',
  schema: { type: 'object', required: ['appended'], properties: { appended: { type: 'boolean' } } },
})

return { workflow: 'retrospective', cadence, scope, result }
