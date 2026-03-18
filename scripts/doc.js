#!/usr/bin/env node

/**
 * doc.js — Document operations for company-sdk project files
 *
 * Usage:
 *   node scripts/doc.js append  <file> --section <heading> --content <text>
 *   node scripts/doc.js rewrite <file> --section <heading> --content <text>
 *   node scripts/doc.js read    <file> --section <heading>
 *   node scripts/doc.js add-item <file> --section <heading> --item <text> [--status pending|done|blocked]
 *   node scripts/doc.js decision <file> --decision <text> --context <text> --made-by <role>
 *
 * Examples:
 *   node scripts/doc.js append project.md --section "## Sprint 1" --content "Day 1: Auth complete"
 *   node scripts/doc.js add-item security-requirements.md --section Pending --item "Implement rate limiting"
 *   node scripts/doc.js decision history.md --decision "Use Postgres" --context "Needed ACID" --made-by CTO
 */

const fs = require('fs');
const path = require('path');

// ─── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];
const filePath = args[1];

if (!command || !filePath || command === '--help' || command === '-h') {
  printHelp();
  process.exit(command ? 1 : 0);
}

function printHelp() {
  console.log(`
Usage:
  node scripts/doc.js <command> <file> [options]

Commands:
  append   <file> --section <heading> --content <text>    Append content after a section heading
  rewrite  <file> --section <heading> --content <text>    Replace section content
  read     <file> --section <heading>                     Read a section
  add-item <file> --section <heading> --item <text>       Add a checklist item to a section
               [--status pending|done|blocked]
  decision <file> --decision <text> --context <text>      Append a decision entry
               --made-by <role> [--release <id>]
               [--rationale <text>] [--reversible yes|no]
  list     <file>                                         List all headings in the file

Examples:
  node scripts/doc.js append project.md --section "## Sprint 1" --content "Day 1 complete"
  node scripts/doc.js add-item security-requirements.md --section Pending --item "Rate limiting"
  node scripts/doc.js decision history.md --decision "Use Postgres" --context "ACID needed" --made-by CTO
  node scripts/doc.js read general-requirements.md --section "## Pending"
  node scripts/doc.js list project.md
`);
}

// Parse named args after the command and file
function parseOptions(args) {
  const opts = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1]) {
      const key = args[i].slice(2);
      opts[key] = args[++i];
    }
  }
  return opts;
}

const opts = parseOptions(args);

// ─── File utilities ──────────────────────────────────────────────────────────

function readFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }
  return fs.readFileSync(abs, 'utf8');
}

function writeFile(filePath, content) {
  const abs = path.resolve(filePath);
  fs.writeFileSync(abs, content, 'utf8');
}

function findSectionIndex(lines, heading) {
  const normalizedHeading = heading.toLowerCase().replace(/^#+\s*/, '').trim();
  for (let i = 0; i < lines.length; i++) {
    const lineNorm = lines[i].toLowerCase().replace(/^#+\s*/, '').trim();
    if (lineNorm === normalizedHeading) {
      return i;
    }
  }
  return -1;
}

function getSectionLevel(line) {
  const match = line.match(/^(#+)\s/);
  return match ? match[1].length : 0;
}

function findSectionEnd(lines, startIndex) {
  const startLevel = getSectionLevel(lines[startIndex]);
  for (let i = startIndex + 1; i < lines.length; i++) {
    const level = getSectionLevel(lines[i]);
    if (level > 0 && level <= startLevel) {
      return i;
    }
  }
  return lines.length;
}

// ─── Commands ────────────────────────────────────────────────────────────────

function cmdList() {
  const content = readFile(filePath);
  const lines = content.split('\n');
  console.log(`\nHeadings in ${filePath}:\n`);
  for (const line of lines) {
    if (/^#+\s/.test(line)) {
      const level = getSectionLevel(line);
      const indent = '  '.repeat(level - 1);
      console.log(`${indent}${line.trim()}`);
    }
  }
  console.log();
}

function cmdRead() {
  if (!opts.section) {
    console.error('Missing --section option');
    process.exit(1);
  }
  const content = readFile(filePath);
  const lines = content.split('\n');
  const startIdx = findSectionIndex(lines, opts.section);
  if (startIdx === -1) {
    console.error(`Section not found: "${opts.section}"`);
    process.exit(1);
  }
  const endIdx = findSectionEnd(lines, startIdx);
  const section = lines.slice(startIdx, endIdx).join('\n');
  console.log(`\n${section}\n`);
}

function cmdAppend() {
  if (!opts.section || !opts.content) {
    console.error('Missing --section or --content option');
    process.exit(1);
  }
  const content = readFile(filePath);
  const lines = content.split('\n');
  const startIdx = findSectionIndex(lines, opts.section);

  if (startIdx === -1) {
    // Section doesn't exist; append to end
    const newContent = content.trimEnd() + `\n\n${opts.section}\n\n${opts.content}\n`;
    writeFile(filePath, newContent);
    console.log(`✓ Created section "${opts.section}" and appended content.`);
    return;
  }

  const endIdx = findSectionEnd(lines, startIdx);
  const before = lines.slice(0, endIdx);
  const after = lines.slice(endIdx);

  // Remove trailing empty lines from before and add content
  while (before.length > 0 && before[before.length - 1].trim() === '') {
    before.pop();
  }

  before.push('');
  before.push(...opts.content.split('\n'));

  const newLines = [...before, '', ...after];
  writeFile(filePath, newLines.join('\n'));
  console.log(`✓ Appended to section "${opts.section}" in ${filePath}`);
}

function cmdRewrite() {
  if (!opts.section || !opts.content) {
    console.error('Missing --section or --content option');
    process.exit(1);
  }
  const content = readFile(filePath);
  const lines = content.split('\n');
  const startIdx = findSectionIndex(lines, opts.section);

  if (startIdx === -1) {
    // Section doesn't exist; create it
    cmdAppend();
    return;
  }

  const endIdx = findSectionEnd(lines, startIdx);
  const before = lines.slice(0, startIdx + 1); // include heading
  const after = lines.slice(endIdx);

  const newLines = [
    ...before,
    '',
    ...opts.content.split('\n'),
    '',
    ...after,
  ];
  writeFile(filePath, newLines.join('\n'));
  console.log(`✓ Rewrote section "${opts.section}" in ${filePath}`);
}

function cmdAddItem() {
  if (!opts.section || !opts.item) {
    console.error('Missing --section or --item option');
    process.exit(1);
  }

  const status = opts.status || 'pending';
  let prefix;
  if (status === 'done') prefix = '- [x]';
  else if (status === 'blocked') prefix = '- [!]';
  else prefix = '- [ ]';

  const item = `${prefix} ${opts.item}`;

  const content = readFile(filePath);
  const lines = content.split('\n');
  const startIdx = findSectionIndex(lines, opts.section);

  if (startIdx === -1) {
    const newContent = content.trimEnd() + `\n\n### ${opts.section}\n\n${item}\n`;
    writeFile(filePath, newContent);
    console.log(`✓ Created section "${opts.section}" and added item.`);
    return;
  }

  const endIdx = findSectionEnd(lines, startIdx);
  const before = lines.slice(0, endIdx);
  const after = lines.slice(endIdx);

  while (before.length > 0 && before[before.length - 1].trim() === '') {
    before.pop();
  }

  before.push(item);

  const newLines = [...before, '', ...after];
  writeFile(filePath, newLines.join('\n'));
  console.log(`✓ Added item to section "${opts.section}" in ${filePath}`);
}

function cmdDecision() {
  if (!opts.decision || !opts.context || !opts['made-by']) {
    console.error('Missing required options: --decision, --context, --made-by');
    process.exit(1);
  }

  const now = new Date().toISOString().split('T')[0];
  const release = opts.release || 'current';
  const rationale = opts.rationale || '—';
  const reversible = opts.reversible || 'unknown';

  const entry = `
### Decision: ${opts.decision}

| Field | Value |
|-------|-------|
| Date | ${now} |
| Release | ${release} |
| Made by | ${opts['made-by']} |
| Context | ${opts.context} |
| Decision | ${opts.decision} |
| Rationale | ${rationale} |
| Reversible | ${reversible} |
`.trimStart();

  const content = readFile(filePath);
  const lines = content.split('\n');

  // Try to find "## Decision History" or similar
  const sectionNames = ['decision history', 'decisions', '## decisions', '## decision history'];
  let sectionIdx = -1;
  for (const name of sectionNames) {
    sectionIdx = findSectionIndex(lines, name);
    if (sectionIdx !== -1) break;
  }

  if (sectionIdx === -1) {
    // Append to end
    const newContent = content.trimEnd() + `\n\n## Decision History\n\n${entry}\n`;
    writeFile(filePath, newContent);
  } else {
    const endIdx = findSectionEnd(lines, sectionIdx);
    const before = lines.slice(0, endIdx);
    const after = lines.slice(endIdx);

    while (before.length > 0 && before[before.length - 1].trim() === '') {
      before.pop();
    }

    const newLines = [...before, '', ...entry.split('\n'), '', ...after];
    writeFile(filePath, newLines.join('\n'));
  }

  console.log(`✓ Decision logged to ${filePath}`);
}

// ─── Dispatch ────────────────────────────────────────────────────────────────

switch (command) {
  case 'list': cmdList(); break;
  case 'read': cmdRead(); break;
  case 'append': cmdAppend(); break;
  case 'rewrite': cmdRewrite(); break;
  case 'add-item': cmdAddItem(); break;
  case 'decision': cmdDecision(); break;
  default:
    console.error(`Unknown command: "${command}"`);
    printHelp();
    process.exit(1);
}
