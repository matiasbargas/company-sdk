#!/usr/bin/env node

/**
 * squad.js — Display squad roster and activation sequence
 *
 * Usage:
 *   node scripts/squad.js <squad-type>
 *   node scripts/squad.js list
 *
 * Squad types:
 *   website   — Marketing site, landing page, docs site (3–10 days, 5–7 roles)
 *   mvp       — Minimum viable product (1–3 weeks, 8–12 roles)
 *   feature   — Single feature delivery (1–5 days, 3–5 roles)
 *   startup   — Full company bootstrap (3–6 weeks, 16 roles)
 *
 * Example:
 *   node scripts/squad.js website
 *   node scripts/squad.js list
 */

const fs = require('fs');
const path = require('path');

const SQUADS = {
  website: {
    name: 'Website',
    duration: '3–10 days',
    description: 'Marketing site, landing page, documentation site, or portfolio.',
    roles: [
      { role: 'Coordinator', level: 'M3', required: true, owns: 'Release management, project.md, history.md' },
      { role: 'PM', level: 'L3/M1', required: true, owns: 'Scope document, page map, acceptance criteria' },
      { role: 'CTO', level: 'M4', required: true, owns: 'Tech stack, product-engineering-requirements.md' },
      { role: 'Staff Engineer', level: 'L4', required: true, owns: 'Interface contracts, component standards' },
      { role: 'EM', level: 'M1', required: true, owns: 'Sprint delivery, cell management' },
      { role: 'Liaison', level: 'L3', required: true, owns: 'Daily communication, liaison-log.md' },
      { role: 'CMO', level: 'M3', required: false, owns: 'Positioning, brand voice, copy review' },
      { role: 'CISO', level: 'M3', required: false, owns: 'Auth requirements, data handling (if user data)' },
      { role: 'CLO', level: 'M3', required: false, owns: 'Legal review (if regulated content)' },
    ],
    sequence: [
      'Coordinator (brief)',
      'PM (scope document)',
      'CTO (tech stack)',
      'CMO [optional] + CISO [if user data]',
      'Staff Engineer (contracts)',
      'EM (sprint plan)',
      'Liaison (active until ship)',
    ],
  },
  mvp: {
    name: 'MVP',
    duration: '1–3 weeks',
    description: 'Minimum viable product for validating a hypothesis.',
    roles: [
      { role: 'Coordinator', level: 'M3', required: true, owns: 'Release management' },
      { role: 'CEO', level: 'M4', required: true, owns: 'Hypothesis, strategic framing' },
      { role: 'CLO', level: 'M3', required: true, owns: 'Regulatory blockers (abbreviated)' },
      { role: 'CISO', level: 'M3', required: true, owns: 'Security non-negotiables (abbreviated)' },
      { role: 'CFO', level: 'M3', required: true, owns: 'Budget validation (1-scenario)' },
      { role: 'CTO', level: 'M4', required: true, owns: 'Architecture brief' },
      { role: 'Mario (Chief Engineer)', level: 'L5', required: true, owns: 'Irreversible decision review' },
      { role: 'PM', level: 'L3', required: true, owns: 'MVP scope, user stories' },
      { role: 'Staff Engineer', level: 'L4', required: true, owns: 'Interface contracts' },
      { role: 'EM', level: 'M1', required: true, owns: 'Sprint delivery' },
      { role: 'Liaison', level: 'L3', required: true, owns: 'Communication' },
      { role: 'CMO', level: 'M3', required: false, owns: 'Positioning (if public launch)' },
    ],
    sequence: [
      'Coordinator (brief) + CEO (hypothesis)',
      'CLO + CISO + CFO (compressed discovery, same day)',
      'CTO (architecture) → Mario (review)',
      'PM (MVP scope) + Staff Engineer (contracts)',
      'EM (sprint plan)',
      'Liaison (active until ship)',
    ],
  },
  feature: {
    name: 'Feature',
    duration: '1–5 days',
    description: 'Single, well-scoped feature delivery.',
    roles: [
      { role: 'PM', level: 'L3', required: true, owns: 'Feature scope, acceptance criteria' },
      { role: 'EM', level: 'M1', required: true, owns: 'Sprint delivery, task breakdown' },
      { role: 'Liaison', level: 'L3', required: true, owns: 'Communication, liaison-log.md' },
      { role: 'Staff Engineer', level: 'L4', required: false, owns: 'Interface contract (if platform touch)' },
      { role: 'Coordinator', level: 'M3', required: false, owns: 'Decision logging (if consequential decisions made)' },
    ],
    sequence: [
      'PM (feature brief)',
      'Staff Engineer [if platform touch]',
      'EM (sprint plan)',
      'Liaison (active until ship)',
    ],
  },
  startup: {
    name: 'Startup / Company Bootstrap',
    duration: '3–6 weeks',
    description: 'Full company-sdk activation for a new product or company.',
    roles: [
      { role: 'Coordinator', level: 'M3', required: true, owns: 'Release management, org memory' },
      { role: 'CEO', level: 'M4', required: true, owns: 'Company direction, strategic brief' },
      { role: 'CLO', level: 'M3', required: true, owns: 'Legal, legal-requirements.md' },
      { role: 'CFO', level: 'M3/M4', required: true, owns: 'Finance, runway, finance-requirements.md' },
      { role: 'CISO', level: 'M3', required: true, owns: 'Security, threat model' },
      { role: 'CMO', level: 'M3', required: true, owns: 'Marketing, positioning' },
      { role: 'CRO', level: 'M3', required: true, owns: 'Revenue, GTM, pricing' },
      { role: 'CDO', level: 'M3', required: true, owns: 'Data, instrumentation' },
      { role: 'COO', level: 'M3', required: true, owns: 'Operations, vendors' },
      { role: 'CHRO', level: 'M3', required: true, owns: 'People, hiring, culture' },
      { role: 'CTO', level: 'M4', required: true, owns: 'Architecture' },
      { role: 'Mario (Chief Engineer)', level: 'L5', required: true, owns: 'Quality floor, irreversible decisions' },
      { role: 'PM', level: 'L3/M1', required: true, owns: 'Scope, user stories' },
      { role: 'Staff Engineer', level: 'L4', required: true, owns: 'Interface contracts, platform' },
      { role: 'EM', level: 'M1', required: true, owns: 'Sprint delivery, cells' },
      { role: 'Liaison', level: 'L3', required: true, owns: 'Communication bridge' },
    ],
    sequence: [
      'Coordinator (brief)',
      'CEO (strategic frame)',
      'CLO → CISO → CFO → CMO → CRO → CDO → COO → CHRO (discovery, can parallelize)',
      '→ Sprint 0 Gate ←',
      'CTO (architecture)',
      'Mario (irreversible review)',
      'PM (scope) + Staff Engineer (contracts)',
      'EM (sprint plan)',
      'Liaison (active until ship)',
      'Coordinator (retro + history.md)',
    ],
  },
};

// ─── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  console.log(`
Usage:
  node scripts/squad.js <squad-type>
  node scripts/squad.js list

Squad types:
  website   Marketing site, landing page, docs site (3–10 days, 5–7 roles)
  mvp       Minimum viable product (1–3 weeks, 8–12 roles)
  feature   Single feature delivery (1–5 days, 3–5 roles)
  startup   Full company bootstrap (3–6 weeks, 16 roles)
`);
  process.exit(0);
}

// ─── List all squads ─────────────────────────────────────────────────────────

if (command === 'list') {
  console.log('\nAvailable squads:\n');
  for (const [key, squad] of Object.entries(SQUADS)) {
    const required = squad.roles.filter(r => r.required).length;
    const optional = squad.roles.filter(r => !r.required).length;
    console.log(`  ${key.padEnd(10)} ${squad.duration.padEnd(15)} ${required} required${optional ? ` + ${optional} optional` : ''}`);
    console.log(`             ${squad.description}`);
    console.log();
  }
  process.exit(0);
}

// ─── Show squad ──────────────────────────────────────────────────────────────

const squad = SQUADS[command];
if (!squad) {
  console.error(`Unknown squad: "${command}". Run "node scripts/squad.js list" to see available squads.`);
  process.exit(1);
}

const required = squad.roles.filter(r => r.required);
const optional = squad.roles.filter(r => !r.required);

console.log(`\n${'═'.repeat(60)}`);
console.log(`  Squad: ${squad.name}`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Duration: ${squad.duration}`);
console.log(`  Description: ${squad.description}`);
console.log(`  Roles: ${required.length} required${optional.length ? ` + ${optional.length} optional` : ''}`);
console.log();

console.log('── Required Roles ───────────────────────────────────────────');
for (const r of required) {
  console.log(`  ${r.role.padEnd(22)} [${r.level}]  ${r.owns}`);
}

if (optional.length > 0) {
  console.log();
  console.log('── Optional Roles ───────────────────────────────────────────');
  for (const r of optional) {
    console.log(`  ${r.role.padEnd(22)} [${r.level}]  ${r.owns}`);
  }
}

console.log();
console.log('── Activation Sequence ──────────────────────────────────────');
squad.sequence.forEach((step, i) => {
  console.log(`  ${String(i + 1).padStart(2)}. ${step}`);
});

console.log();
console.log('── Bootstrap ────────────────────────────────────────────────');
console.log(`  node scripts/bootstrap.js <project-name> --squad ${command}`);
console.log();
