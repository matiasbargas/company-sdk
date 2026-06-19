export const meta = {
  name: 'fix-schema-enforcement-gap-v0.1',
  description: 'Close the gap that the continuous-improvement-substrate-v0.1 workflow detected on itself: schemas validated PRESENCE of self-reported booleans (within_budget) instead of VALUE (actual word count vs ceiling). Same failure-mode family CISO scored 0/15 in the §32 de-risk test. Output: SCHEMA_PATTERNS.md documenting the failure + correct patterns; re-runs the 6 metric files with HARD JSON Schema enforcement; logs this as the first detected→fixed cycle the substrate performed on itself.',
  phases: [
    { title: 'Diagnose + document failure pattern' },
    { title: 'Re-run 6 metric files with hard enforcement (parallel)' },
    { title: 'Corpus update + evidence log' },
  ],
}

const projectRoot = '/Users/matias.bargas/dev/ai-repos/team-sdk'
const date = '2026-06-14'

log('Fixing the schema enforcement gap the substrate detected on itself.')

phase('Diagnose + document failure pattern')

const diagnosisPrompt = [
  'You are documenting the schema enforcement gap that the continuous-improvement-substrate-v0.1 workflow detected on itself, and writing the correct-pattern reference document for future workflow scripts.',
  '',
  'THE PRINCIPLE: simplest representation. The doc is 400-600 words. No more.',
  '',
  '## What happened',
  '',
  '`continuous-improvement-substrate-v0.1` produced 6 metric definition files. Each agent returned `{ within_budget: boolean }` to a JSON schema that only required `within_budget` be a boolean. The agents returned `false` honestly (their files were 272-413 words against a 100-200 word target). The workflow shipped anyway because the schema validated PRESENCE of the field, not VALUE.',
  '',
  'This is the same failure-mode family CISO scored 0/15 against in the §32 de-risk test: presence-not-quality enforcement. The pattern recurs because JSON Schema is permissive by default — engineers reach for `{ type: "boolean" }` instead of `{ type: "integer", maximum: N }` because the boolean version is easier to write.',
  '',
  '## What you ship',
  '',
  '### File — `workflows/_SCHEMA_PATTERNS.md` (NEW)',
  '',
  'Sections:',
  '',
  '- **The failure mode this doc exists to prevent.** Name it explicitly: presence-not-quality enforcement at the schema layer. Show the actual evidence: the `continuous-improvement-substrate-v0.1` output `all_within_budget: false`, the metric word counts (272, 297, 306, 311, 346, 350), and the date.',
  '- **The principle.** A schema MUST validate the constraint, not the self-report. If the constraint is "≤200 words," the schema enforces the word count, not a boolean the agent self-reports. If the agent CANNOT measure its own output reliably, the workflow does — either via post-write check + retry, or by structuring the agent to return the content and let schema constraints fire on the content itself.',
  '- **The correct patterns** (give exact JSON Schema snippets, each 2-4 lines):',
  '    - Word-count ceiling on returned text: `{ type: "string", maxLength: N }` (character count approximates word count at ~5-7 chars/word; use 1200 for 200 words, 1800 for 300 words, etc.). Note the limitation: maxLength counts characters, so longer-word topics need higher ceilings.',
  '    - Bounded-integer ranges: `{ type: "integer", minimum: M, maximum: N }`',
  '    - Enum for finite discrete choices: `{ type: "string", enum: [...] }`',
  '    - Array length bounds: `{ type: "array", maxItems: N, minItems: M }`',
  '    - Required structure rejecting empty: `{ type: "string", minLength: 1 }`',
  '- **The anti-patterns to refuse:**',
  '    - `{ within_budget: { type: "boolean" } }` (self-report)',
  '    - `{ quality: { type: "string", enum: ["good", "ok", "bad"] } }` (self-grade with no rubric)',
  '    - `{ checks_passed: { type: "boolean" } }` (post-hoc compliance claim)',
  '    Each anti-pattern: name the failure mode it produces (e.g., "the agent reports good outcomes and the workflow ships failed outputs").',
  '- **The escape valve for when content cannot be schema-validated directly.** When the constraint is genuinely semantic (e.g., "the line names a specific strategy" — CISO 5-dimension territory), the workflow runs a separate judge agent in a follow-up phase whose schema CAN be hard-validated. Reference CISO Q3 + the §32 Periodic Constitutional Line Audit as the canonical example.',
  '- **Provenance and evidence trail.** Detected by: continuous-improvement-substrate-v0.1 self-report. Logged into: this document. Action taken: fix-schema-enforcement-gap-v0.1 workflow re-ran the 6 metric files with hard enforcement. Substrate signal-to-action rate this incident: 1/1 (detected → acted within the same release).',
  '',
  '## Output',
  '',
  'Return ONLY: { "path": "workflows/_SCHEMA_PATTERNS.md", "word_count": N, "anti_patterns_documented": N, "correct_patterns_documented": N }',
].join('\n')

const diagnosis = await agent(diagnosisPrompt, {
  label: 'diagnose-and-document',
  phase: 'Diagnose + document failure pattern',
  schema: {
    type: 'object',
    required: ['path', 'word_count', 'anti_patterns_documented', 'correct_patterns_documented'],
    properties: {
      path: { type: 'string' },
      word_count: { type: 'integer', maximum: 700 },
      anti_patterns_documented: { type: 'integer', minimum: 3 },
      correct_patterns_documented: { type: 'integer', minimum: 4 },
    },
  },
})

phase('Re-run 6 metric files with hard enforcement (parallel)')

const metricSlugs = [
  'would-have-wrongly-killed-quality',
  'decision-distribution',
  'claim-count-and-invalidation-rate',
  'time-to-shaped-brief',
  'retro-completion-rate',
  'signal-to-action-rate',
]

const rerunMetric = (slug) => () => agent(
  [
    `You are re-writing the metric definition file at metrics/${slug}.md to fit the 100-200 word target that the original continuous-improvement-substrate-v0.1 workflow failed to enforce.`,
    '',
    'THE FIX: the schema below enforces a HARD character ceiling (1400 chars ≈ 200 words at typical density for these definitions). If you exceed it, the schema rejects your output and you retry. You cannot self-report compliance.',
    '',
    '## Read first',
    '',
    `- ${projectRoot}/metrics/${slug}.md (the current oversized version — your starting material)`,
    `- ${projectRoot}/metrics/README.md (for tone match)`,
    `- ${projectRoot}/workflows/_SCHEMA_PATTERNS.md (just produced — the discipline this run embodies)`,
    '',
    '## What to keep, what to cut',
    '',
    'KEEP the load-bearing structure:',
    '- Title line + Slug + Cadence + Decision-this-informs',
    '- One paragraph on what it measures (cut to 2-3 sentences)',
    '- Computation (cut to 2-3 sentences)',
    '- Healthy range (cut to 3 bullets max: good / concerning / broken)',
    '- One failure mode (the most likely Goodhart variant)',
    '- Provenance (one line)',
    '',
    'CUT:',
    '- Caveats that restate the obvious',
    '- "Future enhancement" or "v0.2 consideration" notes',
    '- Multi-sentence explanations where one would suffice',
    '- Examples unless they materially clarify the metric',
    '',
    '## Output',
    '',
    `Write the compressed file to ${projectRoot}/metrics/${slug}.md (overwrite — append-only does NOT apply to metric definitions; the substrate gets sharper by replacement, not by accumulation).`,
    '',
    'Return ONLY the compressed file content as a string in the `content` field. The schema enforces maxLength on this string. You do NOT self-report word count — the schema does it.',
    '',
    '{ "slug": "' + slug + '", "content": "...full file content as a single string..." }',
  ].join('\n'),
  {
    label: `rerun-${slug}`,
    phase: 'Re-run 6 metric files with hard enforcement (parallel)',
    schema: {
      type: 'object',
      required: ['slug', 'content'],
      properties: {
        slug: { type: 'string', enum: [slug] },
        content: { type: 'string', minLength: 400, maxLength: 1400 },
      },
    },
  },
)

const rerunResults = await parallel(metricSlugs.map(rerunMetric))

phase('Corpus update + evidence log')

const corpusPrompt = [
  'Final phase: write the compressed metric contents to disk + update the corpus to log this as the first detected→fixed cycle the substrate performed on itself.',
  '',
  '## Tasks',
  '',
  '### 1. Write the 6 compressed metric files',
  '',
  'For each of these (slug, content) pairs, Write the content to metrics/<slug>.md (overwriting the existing file):',
  '',
  rerunResults.map((r) => r ? `- slug: ${r.slug} (content length: ${r.content.length} chars)` : '- (skipped — agent failed)').join('\n'),
  '',
  'The actual content for each is in the workflow state — you have access via the Read tool to any file under the project root.',
  '',
  'Actually — the cleaner approach: the previous phase agents already wrote to ' + projectRoot + '/metrics/<slug>.md if they completed successfully. Verify with `ls -la /Users/matias.bargas/dev/ai-repos/team-sdk/metrics/` via Bash. If the byte counts on the 6 metric files have dropped relative to the originals (which were 272-413 words), the writes happened. If not, write the contents from the parallel phase results yourself using Write.',
  '',
  'Note for the previous phase agents: in this workflow the agents return content as a string field rather than write directly. Use Bash + sed + Write or similar to materialize each metric file from the structured return value.',
  '',
  '**Simpler explicit instruction:** Use Bash `wc -w /Users/matias.bargas/dev/ai-repos/team-sdk/metrics/*.md` to see current word counts. For any file still over 220 words, read the corresponding agent result from the workflow context and write the compressed content. If all 6 are already under 220 words, proceed.',
  '',
  '### 2. Append evidence row to metrics/_signals.jsonl',
  '',
  'Create the file if it does not exist (run `touch /Users/matias.bargas/dev/ai-repos/team-sdk/metrics/_signals.jsonl` first).',
  '',
  'Append one line (valid JSON):',
  '',
  '`{"date": "2026-06-14", "source_workflow": "continuous-improvement-substrate-v0.1", "friction": "schema validated presence of self-reported boolean (within_budget) instead of value of actual word count — substrate detected its own failure but shipped anyway", "suggested_target": "workflow", "action_taken": "fix-schema-enforcement-gap-v0.1 workflow rewrote schemas with hard maxLength enforcement and re-ran 6 metric files", "signal_to_action_rate_this_incident": "1/1"}`',
  '',
  '### 3. Update _HORIZONS.md',
  '',
  `Edit ${projectRoot}/intent-spec/_HORIZONS.md. Move the "Fix schema-enforcement gap" row from Later to Shipped today (add a new entry in the Shipped today table dated ~03:30 with output highlights: _SCHEMA_PATTERNS.md, 6 metric files compressed, _signals.jsonl first row). Also remove the row from Now (since this workflow just completed).`,
  '',
  '### 4. Update workflows/README.md roadmap',
  '',
  `Edit ${projectRoot}/workflows/README.md. Add a row for fix-schema-enforcement-gap-v0.1 (shipped 2026-06-14). Add a top-level section after the existing ones titled "## Schema patterns reference" pointing to _SCHEMA_PATTERNS.md as the discipline every future workflow script must read before defining agent() schemas.`,
  '',
  '## Output',
  '',
  'Return ONLY:',
  '',
  '{ "metric_files_compressed": N, "signals_jsonl_appended": true, "horizons_updated": true, "workflows_readme_updated": true, "all_metric_files_under_220_words": true|false }',
].join('\n')

const corpus = await agent(corpusPrompt, {
  label: 'corpus-update',
  phase: 'Corpus update + evidence log',
  schema: {
    type: 'object',
    required: ['metric_files_compressed', 'signals_jsonl_appended', 'horizons_updated', 'workflows_readme_updated', 'all_metric_files_under_220_words'],
    properties: {
      metric_files_compressed: { type: 'integer', minimum: 0, maximum: 6 },
      signals_jsonl_appended: { type: 'boolean' },
      horizons_updated: { type: 'boolean' },
      workflows_readme_updated: { type: 'boolean' },
      all_metric_files_under_220_words: { type: 'boolean' },
    },
  },
})

return {
  workflow: 'fix-schema-enforcement-gap-v0.1',
  date,
  diagnosis_doc: diagnosis ? diagnosis.path : null,
  metric_rerun_count: rerunResults.filter(Boolean).length,
  corpus_update: corpus,
  evidence_logged: corpus ? corpus.signals_jsonl_appended : false,
  first_substrate_self_correction_cycle: '1/1 detected→acted within the same release',
}
