#!/usr/bin/env node

/**
 * squad.js — Display squad roster and activation sequence
 *
 * Rosters, levels, and sequences are parsed from team/squads/<type>.md
 * (## Role Roster and ## Activation Sequence). Edit the .md, not this file.
 *
 * Usage:
 *   node scripts/squad.js <squad-type>
 *   node scripts/squad.js list
 *
 * Squad types:
 *   website   — Marketing site, landing page, docs site (3–10 days, 5–7 roles)
 *   mvp       — Minimum viable product (1–3 weeks, 8–12 roles)
 *   feature   — Single feature delivery (1–5 days, 3–5 roles)
 *   startup   — Full company bootstrap (3–6 weeks, 18+ roles)
 *
 * Example:
 *   node scripts/squad.js website
 *   node scripts/squad.js list
 */

const fs = require('fs');
const path = require('path');

const { listSquads } = require('../packages/cli/src/squad-loader');

// Single source of truth: team/squads/*.md (Role Roster + Activation Sequence).
const SDK_ROOT = path.resolve(__dirname, '..');

function toView(parsed) {
  const firstSentence = (parsed.purpose.match(/^.*?[.!?](\s|$)/) || [parsed.purpose])[0].trim();
  return {
    name: parsed.name,
    duration: parsed.duration || parsed.size,
    description: firstSentence || parsed.useWhen,
    roles: parsed.roles.map(r => ({
      role: r.role,
      level: r.level,
      required: r.required !== false,
      owns: r.condition ? `${r.owns} (${r.condition})` : r.owns,
    })),
    sequence: (parsed.sequence || []).map(p => `${p.phase}: ${p.roles.join(', ')}`),
  };
}

function loadAll() {
  const out = {};
  for (const s of listSquads({ sdkRoot: SDK_ROOT })) {
    out[path.basename(s.filePath, '.md')] = toView(s);
  }
  return out;
}

const SQUADS = loadAll();

// ─── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  console.log(`
Usage:
  node scripts/squad.js <squad-type>
  node scripts/squad.js list

Squad types (from team/squads/*.md):
${Object.entries(SQUADS).map(([k, q]) => `  ${k.padEnd(9)} ${q.description} (${q.duration}, ${q.roles.length} roles)`).join('\n')}
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
