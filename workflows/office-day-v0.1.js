// office-day
//
// The office daily operating rhythm, as a runnable conductor.
// Five rituals in sequence — each maps to a file under team/office/rituals/office/:
//   01 Surface sweep  → read + report §34 surfaces (no writes; company-loop-v0.1 not built)
//   02 Signal harvest → compose retrospective.js --cadence loop per unharvested closed loop
//   03 Daily digest   → compose retrospective.js --cadence daily
//   04 Retro-trigger sweep → report shipped slugs owed a sprint retro (NO auto-fire)
//   05 Status reconcile → rewrite current-status.md to match on-disk reality
//
// Honesty contract (per §32 retro proposal #4 — a ritual must not claim an enforcement
// mechanism that does not exist):
//   - Surface sweep does NOT advance state. That is company-loop-v0.1's job, and it is not built.
//   - Retro-trigger sweep does NOT fire sprint retros. Firing is a deliberate PM/owner act.
//   - retrospective.js hardcodes today=2026-06-14; we pass `date` so filenames/triggers are
//     correct, but the provenance ts it writes inherits the stale constant until that is fixed.
//
// Workflow scripts cannot read the clock — pass args.date (YYYY-MM-DD).

export const meta = {
  name: 'office-day',
  description: 'The office daily operating rhythm: surface sweep, signal harvest, daily digest, retro-trigger sweep, status reconcile. Reads the company body, moves it forward where a runnable command exists, and reports what needs a human. Requires args.date (YYYY-MM-DD).',
  phases: [
    { title: 'Surface sweep' },
    { title: 'Signal harvest' },
    { title: 'Daily digest' },
    { title: 'Retro-trigger sweep' },
    { title: 'Status reconcile' },
    { title: 'Day report' },
  ],
}

const ROOT = '/Users/matias.bargas/dev/ai-repos/team-sdk'
const RETRO = `${ROOT}/workflows/retrospective.js`

const input = (args && typeof args === 'object') ? args : (typeof args === 'string' ? { date: args } : {})
const date = input.date
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
  throw new Error('office-day requires args.date in YYYY-MM-DD form (workflow scripts cannot read the clock). e.g. Workflow({ scriptPath, args: { date: "2026-06-22" } })')
}
const projectDir = input.project_dir || `${ROOT}/project`

log(`Office day — ${date}`)

// ---------------------------------------------------------------------------
// 01 SURFACE SWEEP — read + report only. No writes.
// ---------------------------------------------------------------------------
phase('Surface sweep')

const surfaces = await agent(`You are running the morning Surface Sweep (team/office/rituals/office/01-surface-sweep.md).

Read every file in ${projectDir}/surfaces/ (use Bash \`ls ${projectDir}/surfaces/*.md\` first; if the directory is empty or absent, return zeros). For each surface, parse the YAML front-matter (id, state, verifier_roster, irreversible) and scan the body's verification blocks for verdicts (pass | concern | no-go | pending).

Classify each surface and DO NOT modify any file. A surface is:
- "open_roster" if state is under-verification AND at least one rostered verifier has no recorded verdict (pending).
- "reconciling" if any verification block carries a no-go (§34.5).
- "blocked" if irreversible:true AND has an unresolved no-go.
- "stalled" if under-verification with all-pending verdicts and the file mtime is older than 2 days before ${date} (use \`ls -la\` / stat; approximate is fine).
- "terminal" if state is verified, superseded, or archived.

Return ONLY a JSON object.`, {
  label: 'surface-sweep',
  phase: 'Surface sweep',
  schema: {
    type: 'object',
    required: ['total', 'flags'],
    properties: {
      total: { type: 'integer', minimum: 0 },
      flags: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'state', 'classification', 'open_verifiers'],
          properties: {
            id: { type: 'string', minLength: 1 },
            state: { type: 'string', minLength: 1 },
            classification: { type: 'string', enum: ['open_roster', 'reconciling', 'blocked', 'stalled', 'terminal'] },
            open_verifiers: { type: 'array', items: { type: 'string' } },
            needs_human: { type: ['boolean', 'null'] },
          },
        },
      },
    },
  },
})

// ---------------------------------------------------------------------------
// 02 SIGNAL HARVEST — discover unharvested closed loops, compose retrospective loop cadence.
// ---------------------------------------------------------------------------
phase('Signal harvest')

const discover = await agent(`You are the discovery step of Signal Harvest (team/office/rituals/office/02-signal-harvest.md).

Goal: find loops that have CLOSED but whose improvement_signal is NOT yet in the stream.

1. List loop ids: \`ls -d ${ROOT}/loops/*/\` → basename each. If none, return empty.
2. A loop is CLOSED if ${ROOT}/loops/<id>/state.md exists and contains a "## improvement_signal" heading. Use \`grep -l "improvement_signal" ${ROOT}/loops/*/state.md\`.
3. Read the already-harvested loop ids from ${ROOT}/metrics/_signals.jsonl — each line is JSON that may carry a "loop_id". Use \`grep -o '"loop_id":"[^"]*"' ${ROOT}/metrics/_signals.jsonl\` (file may not exist → treat as none harvested).
4. unharvested = closed loops whose id is NOT already in the signals stream.

Do NOT append anything yourself — the orchestrator composes the harvest. Return ONLY a JSON object.`, {
  label: 'harvest-discover',
  phase: 'Signal harvest',
  schema: {
    type: 'object',
    required: ['unharvested_loop_ids', 'closed_total', 'already_harvested_total'],
    properties: {
      unharvested_loop_ids: { type: 'array', items: { type: 'string', minLength: 1 } },
      closed_total: { type: 'integer', minimum: 0 },
      already_harvested_total: { type: 'integer', minimum: 0 },
    },
  },
})

const harvested = []
for (const loopId of discover.unharvested_loop_ids) {
  log(`Harvesting signal from ${loopId}`)
  try {
    const r = await workflow({ scriptPath: RETRO }, { cadence: 'loop', loop_id: loopId, date })
    harvested.push({ loop_id: loopId, result: r })
  } catch (e) {
    harvested.push({ loop_id: loopId, result: null, error: String(e && e.message || e) })
  }
}

// ---------------------------------------------------------------------------
// 03 DAILY DIGEST — compose retrospective.js --cadence daily.
// ---------------------------------------------------------------------------
phase('Daily digest')

let digest = null
try {
  digest = await workflow({ scriptPath: RETRO }, { cadence: 'daily', date })
} catch (e) {
  log(`Daily digest failed: ${String(e && e.message || e)}`)
  digest = { error: String(e && e.message || e) }
}

// ---------------------------------------------------------------------------
// 04 RETRO-TRIGGER SWEEP — report owed sprint retros. Does NOT fire them.
// ---------------------------------------------------------------------------
phase('Retro-trigger sweep')

const owed = await agent(`You are running the Retro-Trigger Sweep (team/office/rituals/office/04-retro-trigger-sweep.md). REPORT ONLY — do not run any retro, do not write any file.

For every slug directory in ${ROOT}/intent-spec/ (use \`ls -d ${ROOT}/intent-spec/*/\`, skip names starting with "_"):

1. shaped_brief_exists: does ${ROOT}/intent-spec/<slug>/shaped-brief.md exist?
2. If it exists, read the **Decision:** line. decision_shippable = true if it is PROCEED, DE-RISK→...→PROCEED, DE-RISK→HOLDS, or REVISE shipped as v2; false for KILL or unresolved REVISE.
3. has_retro: does ${ROOT}/intent-spec/<slug>/_retrospective.md exist? (objective file check.)
4. ship date: read shipped_at / date from shaped-brief.md or generated-spec/<slug>/claims.yaml. hours_since_ship: integer hours from that date to ${date} (approximate by day-diff × 24 if only a date is available; null if unknown).

A slug is OWED a sprint retro when: shaped_brief_exists AND decision_shippable AND has_retro is false AND hours_since_ship >= 24.
A slug is UNSWEEPABLE when shaped_brief_exists is false (report it — do not silently skip).

Return ONLY a JSON object. Sort owed oldest-first.`, {
  label: 'retro-trigger-sweep',
  phase: 'Retro-trigger sweep',
  schema: {
    type: 'object',
    required: ['owed', 'unsweepable', 'evaluated_total'],
    properties: {
      evaluated_total: { type: 'integer', minimum: 0 },
      owed: {
        type: 'array',
        items: {
          type: 'object',
          required: ['slug', 'decision', 'has_retro', 'hours_since_ship'],
          properties: {
            slug: { type: 'string', minLength: 1 },
            decision: { type: 'string', minLength: 1 },
            has_retro: { type: 'boolean' },
            hours_since_ship: { type: ['integer', 'null'] },
          },
        },
      },
      unsweepable: { type: 'array', items: { type: 'string' } },
    },
  },
})

// ---------------------------------------------------------------------------
// 05 STATUS RECONCILE — rewrite current-status.md to on-disk reality. Returns drift list.
// ---------------------------------------------------------------------------
phase('Status reconcile')

const reconcile = await agent(`You are running Status Reconcile (team/office/rituals/office/05-status-reconcile.md), the close-of-day ritual. Make ${projectDir}/current-status.md tell the truth.

Gather on-disk reality:
- ${ROOT}/intent-spec/_RETRO-INDEX.md and ${ROOT}/metrics/_cadence-runs.jsonl — what retros actually ran.
- Today's outputs (passed below as JSON): surface flags, signals harvested, daily digest, owed retros.
- \`git -C ${ROOT} log --oneline -5\` — what was actually committed (HEAD).

Then:
1. Read ${projectDir}/current-status.md.
2. Build a drift list: each claim in the file that on-disk evidence contradicts — field, what it "was", what it "now" should be. Be concrete (e.g. retro status, _RETRO-INDEX existence, Next Agent To Activate).
3. Rewrite ${projectDir}/current-status.md so Phase, Active Missions, Next Agent To Activate, and Session Notes match reality. Append a dated Session Notes line for ${date} summarizing the office-day run. Preserve the file's structure and its closing ownership footer. Use the Write tool.

Today's outputs:
- surfaces: ${JSON.stringify(surfaces)}
- harvested: ${JSON.stringify(harvested.map(h => ({ loop_id: h.loop_id, ok: !h.error })))}
- daily_digest: ${JSON.stringify(digest)}
- owed_retros: ${JSON.stringify(owed)}

Return ONLY a JSON object. current_status_path must be the file you wrote. The drifts array IS the evidence of work — do not return an empty array unless the file genuinely already matched reality.`, {
  label: 'status-reconcile',
  phase: 'Status reconcile',
  schema: {
    type: 'object',
    required: ['current_status_path', 'drifts', 'health_summary'],
    properties: {
      current_status_path: { type: 'string', minLength: 1 },
      drifts: {
        type: 'array',
        items: {
          type: 'object',
          required: ['field', 'was', 'now'],
          properties: {
            field: { type: 'string', minLength: 1 },
            was: { type: 'string' },
            now: { type: 'string' },
          },
        },
      },
      health_summary: { type: 'string', minLength: 1 },
    },
  },
})

// ---------------------------------------------------------------------------
// 06 DAY REPORT
// ---------------------------------------------------------------------------
phase('Day report')

return {
  workflow: 'office-day',
  date,
  surface_sweep: {
    total: surfaces.total,
    needs_human: surfaces.flags.filter(f => f.needs_human || f.classification === 'blocked' || f.classification === 'reconciling').map(f => f.id),
    open_roster: surfaces.flags.filter(f => f.classification === 'open_roster').map(f => f.id),
    stalled: surfaces.flags.filter(f => f.classification === 'stalled').map(f => f.id),
  },
  signal_harvest: {
    closed_total: discover.closed_total,
    already_harvested_total: discover.already_harvested_total,
    harvested_now: harvested.filter(h => !h.error).map(h => h.loop_id),
    harvest_errors: harvested.filter(h => h.error).map(h => ({ loop_id: h.loop_id, error: h.error })),
  },
  daily_digest: digest,
  retro_trigger_sweep: {
    owed: owed.owed,
    unsweepable: owed.unsweepable,
  },
  status_reconcile: {
    path: reconcile.current_status_path,
    drift_count: reconcile.drifts.length,
    drifts: reconcile.drifts,
    health: reconcile.health_summary,
  },
}
