'use strict';

/**
 * _paths.js — single source of truth for where a project's context + record layers live.
 *
 * The layered-context consolidation (2026-07) moved the three context layers and the
 * record/exhaust layers under one `project/` tree:
 *
 *   <base>/context/foundation   Layer A — human-authored, stable (pointer)
 *   <base>/context/spec/<slug>  Layer B — AI-maintained claims
 *   <base>/context/intent/<slug>Layer C — task intent
 *   <base>/record/loops/<id>    run exhaust — loop state
 *   <base>/record/metrics       run exhaust — metric defs + JSONL streams
 *
 * `<base>` differs by project shape, and this is the ONLY place that distinction lives:
 *   - SDK self-dev  → the map is under `project/`, so <base> = <projectRoot>/project
 *   - generated app → the map is at root,        so <base> = <projectRoot>
 *
 * Detection mirrors scripts/lib/map-gate-lib.js findMapDirRel: probe for current-status.md.
 *
 * CANONICAL for real Node scripts (scripts/*.js, the index generator) which `require()` it.
 * The Workflow runtime has NO require()/fs, so the live workflows
 * (idea-execution-v0.1.js, retrospective.js, retrospective-v0.1.js) cannot import this —
 * they carry a compact inline mirror of the same layout in their preamble. This module is
 * the source of truth; the inline copies must track it. Keep them in sync on any layout change.
 */

const fs   = require('fs');
const path = require('path');

/** <projectRoot>/project if that holds the map, else <projectRoot>. */
function resolveBase(projectRoot) {
  const nested = path.join(projectRoot, 'project', 'current-status.md');
  return fs.existsSync(nested) ? path.join(projectRoot, 'project') : projectRoot;
}

/**
 * paths(projectRoot) → { absolute paths, per-slug helpers, and repo-relative twins }.
 * Absolute forms (for Bash/Write in prompts) and `.rel` forms (for citation paths that
 * land inside claims.yaml and must stay repo-relative + portable).
 */
function paths(projectRoot) {
  const base    = resolveBase(projectRoot);
  const context = path.join(base, 'context');
  const record  = path.join(base, 'record');
  const rel = (p) => path.relative(projectRoot, p).split(path.sep).join('/');

  const abs = {
    base, context, record,

    // Layer A
    foundation: path.join(context, 'foundation'),

    // Layer B — specifications (per slug)
    specDir: (slug) => path.join(context, 'spec', slug),

    // Layer C — task intent (per slug) + corpus indexes
    intentDir:         (slug) => path.join(context, 'intent', slug),
    intentIndex:       path.join(context, 'intent', '_INDEX.md'),
    retroIndex:        path.join(context, 'intent', '_RETRO-INDEX.md'),
    horizons:          path.join(context, 'intent', '_HORIZONS.md'),
    protocolProposals: path.join(context, 'intent', '_PROTOCOL_PROPOSALS'),

    // Records — run exhaust
    loopDir:      (id) => path.join(record, 'loops', id),
    metrics:      path.join(record, 'metrics'),
    signals:      path.join(record, 'metrics', '_signals.jsonl'),
    cadenceRuns:  path.join(record, 'metrics', '_cadence-runs.jsonl'),
    dailyDigests: path.join(record, 'metrics', '_daily-digests'),
  };

  // Repo-relative twins: same keys, relative to projectRoot.
  abs.rel = {
    context:     rel(context),
    record:      rel(record),
    foundation:  rel(abs.foundation),
    specDir:     (slug) => rel(abs.specDir(slug)),
    intentDir:   (slug) => rel(abs.intentDir(slug)),
    intentIndex: rel(abs.intentIndex),
    retroIndex:  rel(abs.retroIndex),
    horizons:    rel(abs.horizons),
    loopDir:     (id) => rel(abs.loopDir(id)),
    metrics:     rel(abs.metrics),
    signals:     rel(abs.signals),
    cadenceRuns: rel(abs.cadenceRuns),
    dailyDigests: rel(abs.dailyDigests),
  };

  return abs;
}

module.exports = { paths, resolveBase };
