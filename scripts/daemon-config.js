'use strict';

/**
 * daemon-config.js — Night Watch configuration
 *
 * Pure data. No logic, no I/O. Frozen at export to prevent runtime mutation.
 * This is the single source of truth for agent schedules, operational
 * thresholds, file paths, and recovery settings.
 */

const config = {
  // ── Agent schedules (CronCreate expressions, off the :00/:30 marks) ──────
  agents: {
    coordinator: {
      cron: '17 */2 * * *',
      label: 'Coordinator health sweep',
      checks: [
        'current-status-staleness',
        'blocker-age',
        'waiting-on-age',
        'decision-deadlines',
        'decision-needed-age',
        'session-close-validation',
      ],
      watchFiles: [
        'current-status.md',
        'general-requirements.md',
        'team.md',
      ],
    },
    cto: {
      cron: '43 */6 * * *',
      label: 'CTO architecture scan',
      checks: [
        'requirements-staleness',
        'mario-review-gate',
      ],
      watchFiles: [
        'engineering-requirements.md',
        'engineering-log.md',
      ],
    },
    clo: {
      cron: '57 6 * * *',
      label: 'CLO regulatory scan',
      checks: [
        'clo-ciso-gate',
        'decision-deadlines',
        'requirements-staleness',
        'research-backlog-aging',
      ],
      watchFiles: [
        'compliance-requirements.md',
      ],
    },
  },

  // ── Temporal thresholds (hours) ──────────────────────────────────────────
  thresholds: {
    blockerUnresolved: 4,
    decisionNeeded: 48,
    currentStatusStale: 48,
    requirementsStale: 168,       // 7 days
    researchBacklogAging: 168,    // 7 days
    ceoValidationPending: 24,
    marioReviewPending: 48,
    waitingOnDefault: 72,
  },

  // ── Paths (relative to project dir) ──────────────────────────────────────
  paths: {
    agentState: 'agent-state.json',
    agentEvents: 'agent-events.jsonl',
    agentDrafts: 'agent-drafts',
  },

  // ── Recovery ─────────────────────────────────────────────────────────────
  recovery: {
    stuckTimeout: 300000,         // 5 minutes in ms
  },
};

module.exports = Object.freeze(config);
