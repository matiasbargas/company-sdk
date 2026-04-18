#!/usr/bin/env node
'use strict';

/**
 * consult.js — CLI wrapper for @team-sdk/cli consultation.
 *
 * Dogfooding: this script uses createConsultant() from the cli package
 * to prepare consultation payloads. The .claude/commands/ slash commands
 * call this to get structured role and context data.
 *
 * Usage:
 *   node scripts/consult.js --role cto --question "What database?"
 *   node scripts/consult.js --role cto --project ./my-project
 *   node scripts/consult.js --suggest "Is this GDPR compliant?"
 *   node scripts/consult.js --list-roles
 *   node scripts/consult.js --list-roles --group strategic
 *   node scripts/consult.js --role-info cto
 *
 * Output: JSON to stdout (for consumption by slash commands or other tools)
 */

const path = require('path');
const { createConsultant } = require('../packages/cli/src');

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

const sdkRoot = path.resolve(__dirname, '..');
const consultant = createConsultant({
  sdkRoot,
  projectDir: getArg('project') || null,
});

// --list-roles [--group <group>]
if (args.includes('--list-roles')) {
  const group = getArg('group');
  const roles = consultant.listRoles(group ? { group } : {});
  const summary = roles.map(r => ({
    key: r.key,
    title: r.title,
    domain: r.domain,
    group: r.group,
  }));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

// --suggest "question"
if (args.includes('--suggest')) {
  const question = getArg('suggest');
  if (!question) {
    console.error('Usage: --suggest "your question"');
    process.exit(1);
  }
  const role = consultant.suggestRole(question);
  console.log(JSON.stringify({ suggestedRole: role }));
  process.exit(0);
}

// --role-info <role>
if (args.includes('--role-info')) {
  const roleInput = getArg('role-info');
  if (!roleInput) {
    console.error('Usage: --role-info <role>');
    process.exit(1);
  }
  const role = consultant.getRole(roleInput);
  if (!role) {
    console.error(`Unknown role: ${roleInput}`);
    process.exit(1);
  }
  console.log(JSON.stringify({
    key: role.key,
    title: role.title,
    domain: role.domain,
    group: role.group,
    filePath: role.filePath,
    capability: role.capability,
    hasConsultation: role.hasConsultation,
    hasChallenge: role.hasChallenge,
  }, null, 2));
  process.exit(0);
}

// --role <role> [--question "..."] [--project <dir>]
const roleInput = getArg('role');
const question = getArg('question') || args.filter(a => !a.startsWith('--')).join(' ');

if (!roleInput && !question) {
  console.log(`
Usage:
  node scripts/consult.js --role <role> --question "..."  # consult a role
  node scripts/consult.js --suggest "question"            # suggest best role
  node scripts/consult.js --list-roles [--group <group>]  # list roles
  node scripts/consult.js --role-info <role>              # role details
`);
  process.exit(0);
}

const payload = consultant.consult(question || '(no question provided)', {
  role: roleInput,
});

// Output the consultation payload
console.log(JSON.stringify({
  question: payload.question,
  role: payload.role,
  roleError: payload.roleError,
  context: payload.context,
  relevantFiles: payload.relevantFiles.map(f => f.path),
  roleFilePath: payload.role ? payload.role.filePath : null,
  capability: payload.roleData ? payload.roleData.capability : null,
  busTrace: payload.busTrace || null,
}, null, 2));
