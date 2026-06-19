export const meta = {
  name: 'market-prioritization-v0.1',
  description: 'Owner directive 2026-06-14: parallelize 50 alternatives for team-sdk market direction (10 market-strategy frameworks × 5 segments), score each on viability + market growth potential, deep-panel the top 10 through 4 team roles (CEO + CMO + CFO + CRO), synthesize a ranked recommendation. Embeds the new principle: flows are guided by product vision + core principles + lifecycle awareness + well-known market strategies.',
  phases: [
    { title: 'Product vision crystallization' },
    { title: 'Generate 50 alternatives (parallel)' },
    { title: 'Triage scoring → top 10' },
    { title: 'Team panel deep-score on top 10 (parallel)' },
    { title: 'Synthesis + recommendation' },
  ],
}

const projectRoot = '/Users/matias.bargas/dev/ai-repos/team-sdk'
const date = '2026-06-14'
const slug = `market-prioritization-${date}`
const workDir = `${projectRoot}/intent-spec/${slug}`

log('Starting market prioritization workflow: 50 alternatives, team panel scoring.')

phase('Product vision crystallization')

const visionPrompt = [
  'You are Greg (CEO). Crystallize the product vision for team-sdk that the next 50 alternative market directions will be alternatives WITHIN. Without a vision the alternatives have nothing to be alternatives of.',
  '',
  '## Read first',
  '',
  `- ${projectRoot}/CLAUDE.md (project instructions)`,
  `- ${projectRoot}/STRATEGY.md (corporate strategy layer with 4 success themes)`,
  `- ${projectRoot}/team/roles/_shared.md (Constraints + Soul + Purpose substrates)`,
  `- ${projectRoot}/intent-spec/_HORIZONS.md (current horizons + Owner directives collected today)`,
  `- ${projectRoot}/protocol.md sections 15, 15a, 24, 30, 32 (Cycles, Self-improvement loop, Halloway Ratchet, Design Principles, Generative Loops)`,
  `- ${projectRoot}/SDK.md (compressed AI bootstrap)`,
  '',
  '## What you produce',
  '',
  `Write to ${workDir}/_product-vision.md`,
  '',
  'Run `mkdir -p ' + workDir + '` via Bash first.',
  '',
  'Structure (400-700 words total):',
  '',
  '# team-sdk product vision (crystallized 2026-06-14 for market prioritization)',
  '',
  '## What team-sdk IS',
  '',
  'One paragraph. NOT "what it does technically" — what it IS in the market. Use the Sidharta/Diego brain structure framing as scaffold: a layered context architecture for AI-augmented team work. The 20+ role-based agents, the Bus protocol, the §32 generative loops, the continuous-improvement substrate (4 cadences), Layer A/B/C — these are the product. Frame it from the perspective of "what does a team gain by adopting team-sdk."',
  '',
  '## The four Owner directives from 2026-06-14 (non-negotiable as vision)',
  '',
  'List the directives we collected today as load-bearing vision constraints:',
  '- "Self-aware documented contexts will allow incremental project developments that keep all team accountable. We all build our infra."',
  '- "The simplest we can represent the needs of a team the best we will perform."',
  '- "Improvement is continuous through loops AND rituals — not an event after a sprint."',
  '- "Flows are guided by product vision + core principles + lifecycle awareness + well-known market strategies."',
  '',
  '## The core principles team-sdk encodes (drawn from _shared.md)',
  '',
  'Summarize: 3 Priority Constraints, 4 Purpose substrates, 6 Soul principles. Be brief — one sentence each.',
  '',
  '## What team-sdk is NOT',
  '',
  'Explicit non-goals from the corpus + your own CEO judgment. At minimum:',
  '- Not a replacement for human team judgment (Constraint 1)',
  '- Not a tool for solo developers (the substrate value scales with team size)',
  '- Not a productivity tracking system (the metrics inform team decisions, not individual evaluation)',
  '- Not a closed/proprietary system (the corpus is the value; the team owns it)',
  '',
  '## The 18-month winning condition',
  '',
  'Concrete. What does winning look like? Pick one of: users, revenue, market position, or capability milestone. Be specific.',
  '',
  '## What the 50 alternatives are alternatives OF',
  '',
  'The vision above is fixed. The 50 alternatives are 50 different MARKET DIRECTIONS — different combinations of (target segment, value proposition framing, GTM motion, monetization shape) that realize this vision. They are NOT alternative visions. They are alternative paths to the same vision.',
  '',
  '## Provenance',
  '',
  '- Crystallized: 2026-06-14',
  '- Author: Greg (CEO), per Owner directive 2026-06-14',
  '- Sources: CLAUDE.md, STRATEGY.md, _shared.md, _HORIZONS.md, protocol.md, SDK.md',
  '',
  'Return ONLY:',
  '',
  '{ "path": "intent-spec/' + slug + '/_product-vision.md", "winning_condition": "<one line>", "ready_for_alternatives": true }',
].join('\n')

const vision = await agent(visionPrompt, {
  label: 'product-vision',
  phase: 'Product vision crystallization',
  schema: {
    type: 'object',
    required: ['path', 'winning_condition', 'ready_for_alternatives'],
    properties: {
      path: { type: 'string' },
      winning_condition: { type: 'string', minLength: 20, maxLength: 400 },
      ready_for_alternatives: { type: 'boolean' },
    },
  },
})

phase('Generate 50 alternatives (parallel)')

const frameworks = [
  { slug: 'porter-5-forces', name: "Porter's Five Forces", lens: 'analyze the competitive structure of the segment — buyer power, supplier power, threat of substitutes, threat of new entrants, intra-industry rivalry — and position team-sdk where the structure is most favorable' },
  { slug: 'blue-ocean', name: 'Blue Ocean Strategy', lens: 'find uncontested market space within the segment — what factors does the industry compete on that you can eliminate or reduce, and what new factors can you raise or create that the industry has never offered' },
  { slug: 'jobs-to-be-done', name: 'Jobs-to-be-Done', lens: 'identify the specific functional / emotional / social job the segment is hiring tools to do, and position team-sdk as the higher-performing alternative for that exact job' },
  { slug: 'christensen-disruption', name: "Christensen's Innovator's Dilemma", lens: 'enter the segment from below via low-end disruption OR from the side via new-market disruption — what does the incumbent overshoot on, and what underserved customer can team-sdk serve well-enough that incumbents will not respond' },
  { slug: 'bezos-day-1', name: "Bezos Day 1 / Working Backwards", lens: 'write the press release for the day team-sdk wins in this segment — work backwards from the customer experience to the product capability to the GTM motion' },
  { slug: 'lean-startup', name: 'Lean Startup', lens: 'frame the minimum-validated-learning experiment — what is the riskiest assumption in serving this segment with team-sdk, and what is the cheapest build-measure-learn loop that resolves it' },
  { slug: 'crossing-the-chasm', name: 'Crossing the Chasm', lens: 'identify the beachhead — the specific niche within the segment whose pain is acute enough to adopt early, where success makes them advocates that pull pragmatists across the chasm' },
  { slug: 'network-effects', name: 'Network Effects + Reed/Metcalfe', lens: 'find the dimension where team-sdk gets MORE valuable as more teams in the segment adopt it — shared loop patterns, shared claim corpora, cross-team OKR benchmarks — and design GTM around the network compounding' },
  { slug: 'aggregation-theory', name: 'Aggregation Theory (Thompson)', lens: 'identify the supply / distribution / experience axis where team-sdk can aggregate demand by owning the customer relationship and modularizing the upstream — what is the team-sdk equivalent of "owning the relationship with the team"' },
  { slug: 'zero-to-one', name: '0-to-1 (Thiel)', lens: 'find the secret about this segment that competitors do not know or do not believe — what does team-sdk make possible that nobody currently considers possible — and build the monopoly position around that secret' },
]

const segments = [
  { slug: 'regulated-enterprise', name: 'Regulated enterprises (BFSI, healthcare, govtech, pharma)', notes: 'High compliance pressure, append-only audit trails are an active value (Layer B + provenance), discoverability profile is acceptable / required, sales cycles are 6-18 months, willingness to pay is high' },
  { slug: 'devtool-companies', name: 'Dev-tooling companies (IDE makers, observability, CI/CD, platform engineering)', notes: 'Sophisticated buyers, technical evaluation is paramount, fast adoption if value clear, integrate with existing dev stack, willingness to dogfood publicly' },
  { slug: 'agency-networks', name: 'Agency networks / product consultancies running multiple client teams', notes: 'Multi-tenant by default, knowledge transfer across teams is acute pain, billable-time pressure makes substrate ROI immediate, decision-maker is partner / practice lead' },
  { slug: 'ai-labs', name: 'AI labs / research orgs', notes: 'Already AI-native, looking for orchestration substrate, peer review + provenance is core values, may contribute to substrate evolution back, willingness to pay is moderate, prestige value is high' },
  { slug: 'edu-bootcamps', name: 'Educational institutions / bootcamps (CS programs, product schools)', notes: 'Curriculum integration, "students learn by running real loops," low ARR but viral talent pipeline, brand value high, willingness to pay is low but volume of teams is large' },
]

const alternatives = []
for (const f of frameworks) {
  for (const s of segments) {
    alternatives.push({ framework: f, segment: s, id: `${f.slug}__${s.slug}` })
  }
}

log(`Spawning ${alternatives.length} alternatives.`)

const alternativePromptFor = (alt) => [
  `You are generating ONE distinct market direction for team-sdk, using the ${alt.framework.name} framework lens applied to the ${alt.segment.name} segment.`,
  '',
  'THE PRINCIPLE: 50 alternatives must be DISTINCT. Other agents are generating the other 49 right now in parallel. Your contribution is the one that NO OTHER agent will produce because no other agent has your specific (framework, segment) pair. Be true to your lens. Resist defaulting to a generic "team-sdk for X" pitch — that is the failure mode this exercise guards against.',
  '',
  '## Inputs',
  '',
  `- Product vision: ${workDir}/_product-vision.md (read it)`,
  `- Framework: ${alt.framework.name}. Lens: ${alt.framework.lens}.`,
  `- Segment: ${alt.segment.name}. Segment notes: ${alt.segment.notes}.`,
  '',
  '## What you produce',
  '',
  `Write to ${workDir}/alternatives/${alt.id}.md`,
  '',
  'Run `mkdir -p ' + workDir + '/alternatives` via Bash if needed.',
  '',
  'Structure (300-450 words). Be honest where the (framework × segment) combination is awkward — that itself is signal.',
  '',
  `# Alternative: ${alt.framework.name} × ${alt.segment.name}`,
  '',
  '**Framework:** ' + alt.framework.name,
  '**Segment:** ' + alt.segment.name,
  '**Generated:** 2026-06-14',
  '',
  '## The market direction in one sentence',
  '',
  '<who buys what for what reason, in 25 words or less>',
  '',
  '## What the framework reveals about this segment',
  '',
  '<one paragraph applying the lens — Porter would look at competitive structure; Blue Ocean would identify what to eliminate / raise; JTBD would name the job; etc.>',
  '',
  '## The team-sdk value proposition for this segment, via this framework',
  '',
  '<one paragraph — what specific configuration of team-sdk (which loop patterns, which cadences, which Layer B properties, which §32 features) lands hardest here>',
  '',
  '## GTM motion implied',
  '',
  '<one paragraph — sales-led, product-led, partner-led, community-led — and why that fits this segment AND this framework>',
  '',
  '## Monetization shape',
  '',
  '<one line — seat-based, usage-based, value-based, license, hybrid>',
  '',
  '## Honest weaknesses of this alternative',
  '',
  '<one paragraph — where this combo is forced or awkward. This is where the framework and segment do not naturally combine. Naming the weakness is part of the contribution.>',
  '',
  '## Self-score (rough, will be re-scored by triage agent)',
  '',
  '- Viability (0-10): N. Reasoning in one sentence.',
  '- Market growth potential (0-10): N. Reasoning in one sentence.',
  '',
  '## Output contract',
  '',
  'Return ONLY:',
  '',
  '{ "id": "' + alt.id + '", "one_sentence": "...", "viability_self_score": N, "market_growth_self_score": N, "gtm_motion": "...", "monetization": "...", "honest_weakness": "<one sentence>" }',
].join('\n')

const alternativeResults = await parallel(
  alternatives.map((alt) => () =>
    agent(alternativePromptFor(alt), {
      label: `alt-${alt.id}`,
      phase: 'Generate 50 alternatives (parallel)',
      schema: {
        type: 'object',
        required: ['id', 'one_sentence', 'viability_self_score', 'market_growth_self_score', 'gtm_motion', 'monetization', 'honest_weakness'],
        properties: {
          id: { type: 'string' },
          one_sentence: { type: 'string', minLength: 10, maxLength: 300 },
          viability_self_score: { type: 'integer', minimum: 0, maximum: 10 },
          market_growth_self_score: { type: 'integer', minimum: 0, maximum: 10 },
          gtm_motion: { type: 'string' },
          monetization: { type: 'string' },
          honest_weakness: { type: 'string', minLength: 10 },
        },
      },
    })
  )
)

const validAlternatives = alternativeResults.filter(Boolean)
log(`${validAlternatives.length} of ${alternatives.length} alternatives returned valid.`)

phase('Triage scoring → top 10')

const triagePrompt = [
  'You are Greg (CEO). 50 alternatives just landed in parallel. Read them, triage to the top 10 by combined viability × market growth potential, with explicit reasoning for why each made the cut and which were near-misses.',
  '',
  '## Inputs',
  '',
  `- Product vision: ${workDir}/_product-vision.md`,
  `- All 50 alternative files at ${workDir}/alternatives/*.md (you have the self-scores in the JSON below, but ALSO read at least the 1-sentence pitches by scanning the directory)`,
  '',
  '## Self-scores summary',
  '',
  JSON.stringify(validAlternatives.map((a) => ({ id: a.id, one_sentence: a.one_sentence, v: a.viability_self_score, g: a.market_growth_self_score, weakness: a.honest_weakness })), null, 2),
  '',
  '## Triage discipline',
  '',
  '- Do NOT just trust the self-scores. The agents are biased toward their own alternative. Re-evaluate from the vision\'s 18-month winning condition.',
  '- Reject alternatives whose "honest weakness" reveals the combo is fundamentally forced — those self-cancelled.',
  '- Prefer DIVERSITY in the top 10 — do not let one framework dominate (e.g. do not pick 4 Blue Ocean × 4 segments; pick 4 different frameworks).',
  '- Look for non-obvious combos that scored modest self-scores but reveal a real wedge — sometimes the lens that struggles produces the most original direction.',
  '',
  '## Output',
  '',
  `Write a triage report to ${workDir}/_triage.md with: top 10 ranked, near-miss list, killed list with one-line reason each.`,
  '',
  'Return ONLY:',
  '',
  '{ "top_10_ids": [list of 10 ids in ranked order], "near_miss_ids": [list of 5 ids], "killed_count": N, "diversity_check_passed": true|false }',
].join('\n')

const triage = await agent(triagePrompt, {
  label: 'triage',
  phase: 'Triage scoring → top 10',
  schema: {
    type: 'object',
    required: ['top_10_ids', 'near_miss_ids', 'killed_count', 'diversity_check_passed'],
    properties: {
      top_10_ids: { type: 'array', items: { type: 'string' }, minItems: 10, maxItems: 10 },
      near_miss_ids: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 8 },
      killed_count: { type: 'integer', minimum: 30 },
      diversity_check_passed: { type: 'boolean' },
    },
  },
})

phase('Team panel deep-score on top 10 (parallel)')

const panelRoles = [
  { role: 'ceo', file: 'team/roles/ceo.md', name: 'Greg', lens: 'strategic clarity, 18-month winning condition, what to NOT build, the bet that shapes the company' },
  { role: 'cmo', file: 'team/roles/cmo.md', name: 'CMO', lens: 'market context, positioning, competitive narrative, brand differentiation, launch viability' },
  { role: 'cfo', file: 'team/roles/cfo.md', name: 'CFO', lens: 'unit economics, CAC payback, runway implication, gross margin, ARR shape, capital efficiency' },
  { role: 'cro', file: 'team/roles/cro.md', name: 'CRO', lens: 'revenue model, GTM motion fit, pricing power, deal velocity, expansion shape, sales-team scalability' },
]

const panelScoringPromptFor = (altId, role) => [
  `You are ${role.name} of team-sdk. Your role file is at /Users/matias.bargas/dev/ai-repos/team-sdk/${role.file} — load it. You are in Consultation Mode.`,
  '',
  `You are deep-scoring ONE of the top-10 market alternatives that survived triage. Your role-specific lens: ${role.lens}.`,
  '',
  '## Read first',
  '',
  `- ${workDir}/_product-vision.md`,
  `- ${workDir}/alternatives/${altId}.md (the alternative you are scoring)`,
  `- ${workDir}/_triage.md (Greg\'s triage reasoning — useful context)`,
  '',
  '## What you score (and what you must do)',
  '',
  'On the alternative, score 0-10 on these dimensions, from YOUR role\'s vantage:',
  '',
  '- Viability from your domain (would you, as the role responsible for this dimension, sign off on the team executing this direction?)',
  '- Market growth potential from your domain (is the market dynamic in this direction one your domain considers strong, weak, or unknown?)',
  '',
  'AND ALSO produce:',
  '',
  '- One specific risk you see that the alternative did not name (your domain is the only one likely to spot it)',
  '- One specific upside the alternative undersold from your domain (where the role-specific value is bigger than the alternative\'s author realized)',
  '- A go / probe / kill verdict from your role',
  '',
  '## Output',
  '',
  `Write to ${workDir}/panel/${altId}__${role.role}.md (run \`mkdir -p ${workDir}/panel\` first if needed).`,
  '',
  'Return ONLY:',
  '',
  '{ "alt_id": "' + altId + '", "role": "' + role.role + '", "viability_score": N, "market_growth_score": N, "risk_not_named": "...", "upside_undersold": "...", "verdict": "go|probe|kill" }',
].join('\n')

const panelTasks = []
for (const altId of triage.top_10_ids) {
  for (const role of panelRoles) {
    panelTasks.push({ altId, role })
  }
}

log(`Spawning ${panelTasks.length} panel-scoring agents (${triage.top_10_ids.length} alts × ${panelRoles.length} roles).`)

const panelResults = await parallel(
  panelTasks.map((task) => () =>
    agent(panelScoringPromptFor(task.altId, task.role), {
      label: `panel-${task.altId}-${task.role.role}`,
      phase: 'Team panel deep-score on top 10 (parallel)',
      schema: {
        type: 'object',
        required: ['alt_id', 'role', 'viability_score', 'market_growth_score', 'risk_not_named', 'upside_undersold', 'verdict'],
        properties: {
          alt_id: { type: 'string' },
          role: { type: 'string' },
          viability_score: { type: 'integer', minimum: 0, maximum: 10 },
          market_growth_score: { type: 'integer', minimum: 0, maximum: 10 },
          risk_not_named: { type: 'string', minLength: 10 },
          upside_undersold: { type: 'string', minLength: 10 },
          verdict: { type: 'string', enum: ['go', 'probe', 'kill'] },
        },
      },
    })
  )
)

const validPanel = panelResults.filter(Boolean)
log(`${validPanel.length} of ${panelTasks.length} panel scores returned.`)

phase('Synthesis + recommendation')

const aggregateByAlt = {}
for (const p of validPanel) {
  if (!aggregateByAlt[p.alt_id]) {
    aggregateByAlt[p.alt_id] = { alt_id: p.alt_id, scores: [], verdicts: [], risks: [], upsides: [] }
  }
  aggregateByAlt[p.alt_id].scores.push({ role: p.role, v: p.viability_score, g: p.market_growth_score })
  aggregateByAlt[p.alt_id].verdicts.push({ role: p.role, verdict: p.verdict })
  aggregateByAlt[p.alt_id].risks.push({ role: p.role, risk: p.risk_not_named })
  aggregateByAlt[p.alt_id].upsides.push({ role: p.role, upside: p.upside_undersold })
}

const synthesisPrompt = [
  'You are Greg (CEO). Synthesize the team panel results into a ranked recommendation for the Owner.',
  '',
  'THE PRINCIPLE: pick the top 3 to recommend, name the bet shape for each, be honest about risks the panel surfaced. The Owner makes the final call — your job is to give them clarity.',
  '',
  '## Inputs',
  '',
  `- Vision: ${workDir}/_product-vision.md`,
  `- Triage: ${workDir}/_triage.md`,
  `- Panel results (aggregated, all roles per top-10 alternative):`,
  '',
  JSON.stringify(aggregateByAlt, null, 2),
  '',
  '## What you produce',
  '',
  `Write the synthesis to ${workDir}/_recommendation.md with:`,
  '',
  '- Executive summary (≤200 words): the 3 alternatives you recommend in order, headline insight.',
  '- Ranked top 3 deep-dive (one section each): the alt, why it ranks where it does, role-by-role view (CEO/CMO/CFO/CRO), risks not named by alt author, upsides undersold, recommended next step (probe / commit / kill).',
  '- Honorable mentions: 2-4 alternatives that did not make the top 3 but are worth keeping warm.',
  '- The one alternative you would actively kill (with reason — kill log entry).',
  '- The cross-cutting pattern: what did multiple alternatives reveal about the vision that the vision did not name?',
  '- Next action for the Owner: one concrete step.',
  '',
  'Also append entries to:',
  `- ${projectRoot}/intent-spec/_INDEX.md (new row for this slug)`,
  `- ${projectRoot}/intent-spec/_HORIZONS.md — add a NEW directive line under the Vision section (12 months) capturing the Owner principle from today: "flows are guided by product vision + core principles + lifecycle awareness + well-known market strategies." Note that today\'s market-prioritization workflow is the first incarnation of this principle.`,
  '',
  'Return ONLY:',
  '',
  '{ "top_3_ranked": [3 ids], "honorable_mentions": [2-4 ids], "killed_id": "...", "killed_reason": "...", "cross_cutting_insight": "...", "next_action_for_owner": "...", "recommendation_path": "intent-spec/' + slug + '/_recommendation.md" }',
].join('\n')

const synthesis = await agent(synthesisPrompt, {
  label: 'synthesis',
  phase: 'Synthesis + recommendation',
  schema: {
    type: 'object',
    required: ['top_3_ranked', 'honorable_mentions', 'killed_id', 'killed_reason', 'cross_cutting_insight', 'next_action_for_owner', 'recommendation_path'],
    properties: {
      top_3_ranked: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
      honorable_mentions: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 },
      killed_id: { type: 'string' },
      killed_reason: { type: 'string', minLength: 20 },
      cross_cutting_insight: { type: 'string', minLength: 30 },
      next_action_for_owner: { type: 'string', minLength: 20 },
      recommendation_path: { type: 'string' },
    },
  },
})

return {
  workflow: 'market-prioritization-v0.1',
  date,
  slug,
  product_vision: vision,
  alternatives_generated: validAlternatives.length,
  triage: triage,
  panel_scores_collected: validPanel.length,
  recommendation: synthesis,
  next_action_for_owner: synthesis.next_action_for_owner,
  files: {
    vision: `${workDir}/_product-vision.md`,
    alternatives_dir: `${workDir}/alternatives/`,
    triage: `${workDir}/_triage.md`,
    panel_dir: `${workDir}/panel/`,
    recommendation: `${workDir}/_recommendation.md`,
  },
}
