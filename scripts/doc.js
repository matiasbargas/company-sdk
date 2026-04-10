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
 *   node scripts/doc.js log <area-log-file> --role <role> --level <level> --goal <text> [--outcome <text>] [--reqs <text>] [--status active|completed|blocked]
 *   node scripts/doc.js status [<project-dir>]
 *   node scripts/doc.js pod-update <current-status-file> --mission <name> --status <status> --next <action>
 *   node scripts/doc.js spawn <project-dir> --name <name> --role <role> --level <level> --activated-by <activator> --profile <text> --how <text> --fun-fact <text>
 *   node scripts/doc.js dissolve <project-dir> --name <name> --dissolved-by <dissolvedBy> --reason <text>
 *   node scripts/doc.js manifest <project-dir>
 *   node scripts/doc.js index   <project-dir>
 *
 * Examples:
 *   node scripts/doc.js append project.md --section "## Sprint 1" --content "Day 1: Auth complete"
 *   node scripts/doc.js add-item security-requirements.md --section Pending --item "Implement rate limiting"
 *   node scripts/doc.js decision history.md --decision "Use Postgres" --context "Needed ACID" --made-by CTO
 *   node scripts/doc.js log engineering-log.md --role EM --level M1 --goal "Pod-A completed auth service" --status completed
 *   node scripts/doc.js status ./projects/my-project
 *   node scripts/doc.js pod-update current-status.md --mission "Auth Service" --status "Active" --next "EM: integrate with API gateway"
 *   node scripts/doc.js spawn ./my-project --name "Fatima Nairobi" --role CLO --level M3 --activated-by "Soren Aarhus (Coordinator)" --profile "Nairobi's startup energy..." --how "I prefer async-first..." --fun-fact "Nairobi is the only city with a national park inside city limits."
 *   node scripts/doc.js dissolve ./my-project --name "Fatima Nairobi" --dissolved-by "Lena Tbilisi (EM)" --reason "Mission complete"
 */

const fs = require('fs');
const path = require('path');
const { printNextStub } = require('./lib/next-stub');

// ─── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const command = args[0];
const filePath = args[1];

// spawn, dissolve, manifest, and index take a project-dir as second arg — no file-path requirement for other checks
const spawnDissolveCommands = ['spawn', 'dissolve', 'manifest', 'index'];

if (!command || (!filePath && !spawnDissolveCommands.includes(command)) || command === '--help' || command === '-h') {
  printHelp();
  process.exit(command ? 1 : 0);
}

function printHelp() {
  console.log(`
Usage:
  node scripts/doc.js <command> <file> [options]

Commands:
  append      <file> --section <heading> --content <text>   Append content after a section heading
  rewrite     <file> --section <heading> --content <text>   Replace section content
  read        <file> --section <heading>                    Read a section
  add-item    <file> --section <heading> --item <text>      Add a checklist item to a section
                     [--status pending|done|blocked]
  decision    <file> --decision <text> --context <text>     Append a decision entry
                     --made-by <role> [--release <id>]
                     [--rationale <text>] [--reversible yes|no]
  log         <area-log-file> --role <role> --level <level> Write a structured area log entry
                     --goal <text> [--outcome <text>]        (saves tokens vs. full file read/write)
                     [--reqs <text>] [--status active|completed|blocked|cancelled]
  status      [<project-dir>]                               Print current-status.md (session resume)
  pod-update  <current-status-file> --mission <name>        Update a mission row in current-status.md
                     --status <status> --next <action>
  manifest    <project-dir>                                 Generate context-manifest.json from current-status.md
  index       <project-dir>                                 Generate context-index.json — file map, domain routing, query map
  list        <file>                                        List all headings in the file
  spawn       <project-dir> --name <name> --role <role>     Add an agent to team.md Active Agents table,
                     --level <level>                         append onboarding log entry, and increment
                     --activated-by <activator>              metrics (Current active agents +
                     --profile <text> --how <text>           Total agents ever activated)
                     --fun-fact <text>
  dissolve    <project-dir> --name <name>                   Move agent from Active Agents to Dissolved
                     --dissolved-by <dissolvedBy>            Agents in team.md; decrement Current active
                     --reason <text>                         agents. Never deletes rows.

Options:
  --dry-run         Preview what would be written without modifying any file

Examples:
  node scripts/doc.js log engineering-log.md --role EM --level M1 --goal "Pod-A completed auth" --status completed
  node scripts/doc.js status ./projects/my-project
  node scripts/doc.js pod-update current-status.md --mission "Auth Service" --status Active --next "EM: wire API"
  node scripts/doc.js decision history.md --decision "Use Postgres" --context "ACID needed" --made-by CTO
  node scripts/doc.js read general-requirements.md --section "## Pending"
  node scripts/doc.js spawn ./my-project --name "Fatima Nairobi" --role CLO --level M3 --activated-by "Soren Aarhus (Coordinator)" --profile "Nairobi's startup energy..." --how "Async-first, writes before talking." --fun-fact "Nairobi has the only national park inside a capital city."
  node scripts/doc.js dissolve ./my-project --name "Fatima Nairobi" --dissolved-by "Lena Tbilisi (EM)" --reason "Mission complete"
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
  if (dryRun) {
    console.log(`\nDRY RUN — no files modified`);
    console.log(`  File: ${filePath}`);
    console.log(`  Content:\n${content.slice(0, 500)}${content.length > 500 ? '\n  ... (truncated)' : ''}`);
    return;
  }
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

// ─── New commands ─────────────────────────────────────────────────────────────

function cmdLog() {
  if (!opts.role || !opts.level || !opts.goal) {
    console.error('Missing required options: --role, --level, --goal');
    process.exit(1);
  }

  const now = new Date().toISOString().split('T')[0];
  const status = opts.status || 'active';
  const outcome = opts.outcome || '—';
  const reqs = opts.reqs || 'None';

  const entry = `
## ${now} ${opts.role} ${opts.level}
Goal/Change: ${opts.goal}
Expected outcome: ${outcome}
Requirements discovered: ${reqs}
Status: ${status.toUpperCase()}
`.trimStart();

  const content = readFile(filePath);
  const newContent = content.trimEnd() + '\n\n---\n\n' + entry;
  writeFile(filePath, newContent);
  console.log(`✓ Area log entry written to ${filePath}`);
}

function cmdStatus() {
  // filePath is the project dir when command is 'status'
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const statusFile = path.join(projectDir, 'current-status.md');

  if (!fs.existsSync(statusFile)) {
    console.error(`current-status.md not found in: ${projectDir}`);
    console.error('Run sdk-bootstrap first or check the project directory.');
    process.exit(1);
  }

  const content = fs.readFileSync(statusFile, 'utf8');
  console.log('\n' + content);
  printNextStub(projectDir);
}

function cmdPodUpdate() {
  if (!opts.mission || !opts.status || !opts.next) {
    console.error('Missing required options: --mission, --status, --next');
    process.exit(1);
  }

  const content = readFile(filePath);
  const now = new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().slice(0, 5);

  // Update "Last updated" line
  let updated = content.replace(
    /\*\*Last updated:\*\* .+/,
    `**Last updated:** ${now}`
  );

  // Try to find and update the mission row in the Active Missions table
  const missionRegex = new RegExp(`(\\|[^|]*${opts.mission}[^|]*\\|[^|]*\\|[^|]*\\|)[^|]*(\\|)[^|]*(\\|)`, 'i');
  if (missionRegex.test(updated)) {
    updated = updated.replace(missionRegex, (match, p1, p2, p3) => {
      return `${p1} ${opts.status} ${p2} ${opts.next} ${p3}`;
    });
    console.log(`✓ Updated mission "${opts.mission}" in ${filePath}`);
  } else {
    // Append to Active Missions section
    updated = updated.replace(
      /(\| \[Mission name\][^\n]*\n)/,
      `$1| ${opts.mission} | — | — | ${opts.status} | ${opts.next} |\n`
    );
    console.log(`✓ Added mission "${opts.mission}" to ${filePath}`);
  }

  writeFile(filePath, updated);
}

// ─── Team.md helpers ─────────────────────────────────────────────────────────

/**
 * Update a single metric value in the Metrics table of team.md.
 * Matches a row like: | Metric name | value |
 * and replaces the value cell.
 */
function updateTeamMetric(content, metricName, updater) {
  // Escape special regex chars in the metric name
  const escaped = metricName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(\\|\\s*${escaped}\\s*\\|\\s*)(\\d+)(\\s*\\|)`, 'i');
  return content.replace(re, (match, pre, num, post) => {
    const updated = updater(parseInt(num, 10));
    return `${pre}${updated}${post}`;
  });
}

/**
 * DS-01: spawn — add agent to Active Agents table + onboarding log, increment metrics.
 */
function cmdSpawn() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const teamFile = path.join(projectDir, 'team.md');

  const required = ['name', 'role', 'level', 'activated-by', 'profile', 'how', 'fun-fact'];
  const missing = required.filter(k => !opts[k]);
  if (missing.length) {
    console.error(`Missing required options: ${missing.map(k => '--' + k).join(', ')}`);
    process.exit(1);
  }

  if (!fs.existsSync(teamFile)) {
    console.error(`team.md not found in: ${projectDir}`);
    process.exit(1);
  }

  const now = new Date().toISOString().split('T')[0];
  let content = fs.readFileSync(teamFile, 'utf8');

  // --- 1. Append row to Active Agents table ---
  // Find the Active Agents table header row and the separator row, then inject after them
  // The table pattern: | Name | Role | Level | Cultural profile | How they work | Fun fact | Activated by | Date |
  // We look for the empty placeholder row and replace it, or append a new row before the next section.
  const agentRow = `| ${opts['name']} | ${opts['role']} | ${opts['level']} | ${opts['profile']} | ${opts['how']} | ${opts['fun-fact']} | ${opts['activated-by']} | ${now} |`;

  // If the table has only the empty placeholder row, replace it; otherwise insert before the --- separator after the table
  const emptyRowPattern = /(\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|\s*\n)(---)/;
  if (emptyRowPattern.test(content)) {
    // Replace the empty placeholder row with the real row
    content = content.replace(emptyRowPattern, `${agentRow}\n\n---`);
  } else {
    // Table already has rows — find the Active Agents section end and insert before the closing ---
    // Strategy: find "## Active Agents" section, find the last table row in it, insert after
    const activeSection = /## Active Agents[\s\S]*?(?=\n---\n)/;
    content = content.replace(activeSection, (section) => {
      return section.trimEnd() + '\n' + agentRow;
    });
  }

  // --- 2. Increment metrics ---
  content = updateTeamMetric(content, 'Current active agents', n => n + 1);
  content = updateTeamMetric(content, 'Total agents ever activated', n => n + 1);

  // --- 3. Append onboarding log entry ---
  const onboardingEntry = `
### ${now} — ${opts['name']} (${opts['role']}, ${opts['level']})
- **Activated by:** ${opts['activated-by']}
- **Cultural profile:** ${opts['profile']}
- **How they work:** ${opts['how']}
- **Fun fact:** ${opts['fun-fact']}
`;

  // Find the Onboarding log section and append inside it
  const onboardingHeadingIdx = content.indexOf('## Onboarding log');
  if (onboardingHeadingIdx === -1) {
    content = content.trimEnd() + '\n\n## Onboarding log\n' + onboardingEntry + '\n';
  } else {
    // Insert at end of file (onboarding log is the last section per template)
    content = content.trimEnd() + '\n' + onboardingEntry;
  }

  writeFile(teamFile, content);
  console.log(`Agent ${opts['name']} (${opts['role']}) added to team.md`);
}

/**
 * DS-02: dissolve — move agent from Active Agents to Dissolved Agents, decrement current count.
 */
function cmdDissolve() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const teamFile = path.join(projectDir, 'team.md');

  const required = ['name', 'dissolved-by', 'reason'];
  const missing = required.filter(k => !opts[k]);
  if (missing.length) {
    console.error(`Missing required options: ${missing.map(k => '--' + k).join(', ')}`);
    process.exit(1);
  }

  if (!fs.existsSync(teamFile)) {
    console.error(`team.md not found in: ${projectDir}`);
    process.exit(1);
  }

  const now = new Date().toISOString().split('T')[0];
  let content = fs.readFileSync(teamFile, 'utf8');

  // --- 1. Find the agent row in Active Agents table ---
  // Rows look like: | Name | Role | Level | ... |
  // We need to match the name column exactly (first cell after opening pipe)
  const escapedName = opts['name'].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const activeRowRe = new RegExp(`^(\\|\\s*${escapedName}\\s*\\|)(.*)(\\|\\s*\\n?)`, 'm');
  const match = activeRowRe.exec(content);

  if (!match) {
    console.error(`Agent "${opts['name']}" not found in Active Agents table.`);
    process.exit(1);
  }

  // Extract role and level from the matched row (columns 2 and 3)
  const rowCells = match[0].split('|').map(c => c.trim()).filter(Boolean);
  // rowCells: [Name, Role, Level, Cultural profile, How they work, Fun fact, Activated by, Date]
  const role = rowCells[1] || '—';
  const level = rowCells[2] || '—';

  // Remove the row from the Active Agents section
  content = content.replace(activeRowRe, '');

  // --- 2. Append row to Dissolved Agents table ---
  const dissolvedRow = `| ${opts['name']} | ${role} | ${level} | ${opts['dissolved-by']} | ${now} | ${opts['reason']} |`;

  // Find Dissolved Agents table — replace empty placeholder row or append
  const dissolvedEmptyRow = /(\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|\s*\n)(---|\*)/;
  if (dissolvedEmptyRow.test(content)) {
    content = content.replace(dissolvedEmptyRow, (m, emptyRow, after) => {
      return `${dissolvedRow}\n\n${after}`;
    });
  } else {
    // Find Dissolved Agents section and insert a new row at its end
    const dissolvedSection = /## Dissolved Agents[\s\S]*?(?=\n---\n|\n\*)/;
    content = content.replace(dissolvedSection, (section) => {
      return section.trimEnd() + '\n' + dissolvedRow;
    });
  }

  // --- 3. Decrement current active agents metric ---
  content = updateTeamMetric(content, 'Current active agents', n => Math.max(0, n - 1));

  // Clean up any double blank lines left by row removal
  content = content.replace(/\n{3,}/g, '\n\n');

  writeFile(teamFile, content);
  console.log(`Agent ${opts['name']} dissolved and logged to Dissolved Agents table`);
}

// ─── manifest ─────────────────────────────────────────────────────────────────

/**
 * cmdManifest — Generate context-manifest.json from current-status.md in <project-dir>.
 *
 * Reads:  <project-dir>/current-status.md
 * Writes: <project-dir>/context-manifest.json
 *
 * Fallback: if current-status.md is missing, writes a minimal manifest with staleness.flag = "stale".
 *
 * Deterministic: identical input files produce byte-identical output.
 * The generatedAt field uses the source file's mtime so re-running with the same unmodified
 * current-status.md produces the same timestamp.
 *
 * schemaVersion: "1.0" — always written. Consumers that read an unknown schemaVersion
 * must fail loudly (unknown contract) — they must not silently degrade.
 */
function cmdManifest() {
  // filePath holds the project dir for this command (same pattern as cmdStatus)
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const statusFile = path.join(projectDir, 'current-status.md');
  const manifestFile = path.join(projectDir, 'context-manifest.json');

  // Read existing manifest to determine next manifestVersion (sequential int)
  let previousVersion = 0;
  if (fs.existsSync(manifestFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      if (typeof existing.manifestVersion === 'number') {
        previousVersion = existing.manifestVersion;
      }
    } catch (_) {
      // corrupt existing manifest — reset version counter
    }
  }

  // ── Fallback: current-status.md missing ──────────────────────────────────
  if (!fs.existsSync(statusFile)) {
    const minimal = {
      schemaVersion: '1.0',
      manifestVersion: previousVersion + 1,
      generatedAt: new Date(0).toISOString(),
      release: 'unknown',
      phase: 'unknown',
      activeMissions: [],
      waitingOn: [],
      openDecisions: [],
      lastUpdatedBy: 'unknown',
      nextAgentToActivate: { role: 'unknown', activationPrompt: '' },
      staleness: { currentStatusAge: -1, flag: 'stale' },
    };
    writeFile(manifestFile, JSON.stringify(minimal, null, 2) + '\n');
    console.log('Warning: current-status.md not found — wrote minimal stale manifest.');
    console.log(manifestFile);
    return;
  }

  // ── Parse current-status.md ───────────────────────────────────────────────
  const raw = fs.readFileSync(statusFile, 'utf8');
  const statusMtime = fs.statSync(statusFile).mtime;
  const ageHours = Math.round((Date.now() - statusMtime.getTime()) / 1000 / 60 / 60);
  const stalenessFlag = ageHours <= 24 ? 'fresh' : 'stale';

  const lines = raw.split('\n');

  // Release — line like: **Release:** v2026.Q2.1
  let release = 'unknown';
  const releaseMatch = raw.match(/\*\*Release:\*\*\s*(.+)/);
  if (releaseMatch) release = releaseMatch[1].trim();

  // Last updated by — line like: **Updated by:** Soren Aarhus (Coordinator)
  let lastUpdatedBy = 'unknown';
  const updatedByMatch = raw.match(/\*\*Updated by:\*\*\s*(.+)/);
  if (updatedByMatch) lastUpdatedBy = updatedByMatch[1].trim();

  // Phase — look for explicit "Phase N" mention anywhere in the file
  let phase = 'unknown';
  const phaseMatch = raw.match(/Phase\s+(\d+|[A-Za-z]+)/);
  if (phaseMatch) phase = `Phase ${phaseMatch[1]}`;

  // Active Missions table — parse rows after the separator row
  // Table format: | Mission | Owner | Appetite remaining | Status | Next action |
  const activeMissions = [];
  let inMissionsTable = false;
  let missionHeaderPassed = false;
  for (const line of lines) {
    if (/^##\s+Active Missions/i.test(line)) {
      inMissionsTable = true;
      missionHeaderPassed = false;
      continue;
    }
    if (inMissionsTable) {
      if (/^\|[-|\s:]+\|/.test(line)) { missionHeaderPassed = true; continue; }
      if (missionHeaderPassed && line.startsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length >= 4) {
          activeMissions.push({
            name: cells[0],
            status: cells[3] || '',
            nextAction: cells[4] || '',
          });
        }
        continue;
      }
      if (missionHeaderPassed && !line.startsWith('|') && line.trim() !== '') {
        inMissionsTable = false;
      }
    }
  }

  // Waiting On — checklist items after "## Waiting On"
  const waitingOn = [];
  let inWaiting = false;
  for (const line of lines) {
    if (/^##\s+Waiting On/i.test(line)) { inWaiting = true; continue; }
    if (inWaiting) {
      if (/^##/.test(line)) { inWaiting = false; continue; }
      const itemMatch = line.match(/^-\s+\[[ x!]\]\s+(.+)/);
      if (itemMatch) {
        const full = itemMatch[1];
        const blocksMatch = full.match(/\|\s*[Bb]locks?:\s*(.+)/);
        const item = full.replace(/\|.*$/, '').trim();
        const blocks = blocksMatch ? blocksMatch[1].trim() : '';
        waitingOn.push({ item, blocks });
      }
    }
  }

  // Open Decisions — list items after "## Open Decisions"
  const openDecisions = [];
  let inDecisions = false;
  for (const line of lines) {
    if (/^##\s+Open Decisions/i.test(line)) { inDecisions = true; continue; }
    if (inDecisions) {
      if (/^##/.test(line)) { inDecisions = false; continue; }
      const itemMatch = line.match(/^-\s+(.+)/);
      if (itemMatch) {
        const full = itemMatch[1];
        const needsMatch = full.match(/\|\s*[Nn]eeds?:\s*([^|]+)/);
        const byMatch = full.match(/\|\s*[Bb]y:\s*([^|]+)/);
        const decision = full.replace(/\|.*$/, '').trim();
        const neededBy = needsMatch ? needsMatch[1].trim() : (byMatch ? byMatch[1].trim() : '');
        openDecisions.push({ decision, neededBy });
      }
    }
  }

  // Next Agent To Activate — bold role name + activation prompt
  let nextAgentRole = 'unknown';
  let nextAgentPrompt = '';
  let inNextAgent = false;
  for (const line of lines) {
    if (/^##\s+Next Agent To Activate/i.test(line)) { inNextAgent = true; continue; }
    if (inNextAgent) {
      if (/^##/.test(line)) { inNextAgent = false; continue; }
      if (nextAgentRole === 'unknown') {
        const boldMatch = line.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
          nextAgentRole = boldMatch[1].trim();
          nextAgentPrompt = line.trim();
        }
      }
    }
  }

  // ── Build and write manifest ──────────────────────────────────────────────
  const manifest = {
    schemaVersion: '1.0',
    manifestVersion: previousVersion + 1,
    generatedAt: statusMtime.toISOString(),
    release,
    phase,
    activeMissions,
    waitingOn,
    openDecisions,
    lastUpdatedBy,
    nextAgentToActivate: {
      role: nextAgentRole,
      activationPrompt: nextAgentPrompt,
    },
    staleness: {
      currentStatusAge: ageHours,
      flag: stalenessFlag,
    },
  };

  writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`✓ context-manifest.json written (v${manifest.manifestVersion}, schema ${manifest.schemaVersion})`);
  console.log(manifestFile);
}

// ─── Index: context-index.json ───────────────────────────────────────────────

/**
 * cmdIndex — Generate context-index.json for a project directory.
 *
 * Produces a machine-readable index of every project file (path, domain,
 * owner, purpose, load_when, staleness), a domain routing table (who leads
 * each domain and which files they own), and a queryMap (topic → files + agent
 * to consult). Agents read this file second (after SDK.md) to self-direct their
 * context loading and route CONTEXT REQUEST Bus messages correctly.
 *
 * Deterministic: uses file mtime, not current clock. Byte-identical output for
 * identical inputs. Increments indexVersion on each generation.
 *
 * Schema: schemaVersion "1.0" — consumers that encounter an unknown version
 * must fail loudly, not degrade silently.
 */
function cmdIndex() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const indexFile  = path.join(projectDir, 'context-index.json');

  // Read existing index to increment version
  let previousVersion = 0;
  if (fs.existsSync(indexFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
      if (typeof existing.indexVersion === 'number') previousVersion = existing.indexVersion;
    } catch (_) {}
  }

  // Release ID — prefer .sdkrc, fall back to current-status.md
  let release = 'unknown';
  const sdkrcPath = path.join(projectDir, '.sdkrc');
  if (fs.existsSync(sdkrcPath)) {
    try {
      const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
      if (sdkrc.release) release = sdkrc.release;
    } catch (_) {}
  }
  if (release === 'unknown') {
    const statusPath = path.join(projectDir, 'current-status.md');
    if (fs.existsSync(statusPath)) {
      const m = fs.readFileSync(statusPath, 'utf8').match(/\*\*Release:\*\*\s*(.+)/);
      if (m) release = m[1].trim();
    }
  }

  // Canonical reference time for determinism — use oldest available file mtime
  const refMtime = (() => {
    const statusPath = path.join(projectDir, 'current-status.md');
    if (fs.existsSync(statusPath)) return fs.statSync(statusPath).mtime;
    return new Date();
  })();

  // ── File catalog ──────────────────────────────────────────────────────────
  // Each entry: path (relative to project dir), domain, owner (agent role),
  // purpose (one line), load_when (trigger list), ageHours, stale
  const CATALOG = [
    // Core session files
    { path: 'current-status.md',           domain: 'strategy',     owner: 'Coordinator',    purpose: 'Session continuity — read every session, always first',                           load_when: ['session-start'] },
    { path: 'project.md',                  domain: 'strategy',     owner: 'Coordinator',    purpose: 'Full conversation record and release plan',                                        load_when: ['session-start', 'full-context'] },
    { path: 'history.md',                  domain: 'strategy',     owner: 'all',            purpose: 'Permanent decision record — all consequential decisions with rationale',            load_when: ['decision-review', 'pre-tag', 'irreversible-decision'] },
    { path: 'project-map.md',              domain: 'strategy',     owner: 'CEO',            purpose: 'CEO-validated release artifact — sealed at project completion',                    load_when: ['release-close', 'ceo-gate'] },
    { path: 'idea.md',                     domain: 'strategy',     owner: 'CEO',            purpose: 'Day 0 brief — raw idea shaped into the CEO activation message',                   load_when: ['discovery', 'first-session'] },
    { path: 'strategy-log.md',             domain: 'strategy',     owner: 'Coordinator',    purpose: 'CEO and Coordinator strategy decisions and retrospectives',                         load_when: ['strategy-review', 'retro'] },
    { path: 'team.md',                     domain: 'people',       owner: 'Coordinator',    purpose: 'Active agents roster, metrics, dissolved agents history, onboarding log',          load_when: ['session-start', 'team-review', 'onboarding'] },
    { path: '.sdkrc',                      domain: 'strategy',     owner: 'Coordinator',    purpose: 'SDK configuration — release ID, squad type, project metadata',                     load_when: ['session-start', 'config'] },
    // Requirements files
    { path: 'general-requirements.md',     domain: 'strategy',     owner: 'Coordinator',    purpose: 'Cross-domain requirements aggregate — Coordinator-maintained',                     load_when: ['full-context', 'session-start'] },
    { path: 'engineering-requirements.md', domain: 'engineering',  owner: 'CTO',            purpose: 'Architecture decisions, make/buy/partner, interface contracts, delivery state',    load_when: ['architecture-review', 'sprint-planning', 'technical-decision', 'build-vs-buy'] },
    { path: 'product-requirements.md',     domain: 'product',      owner: 'PM',             purpose: 'Product scope, user stories, friction log, mission kanban',                       load_when: ['mission-shaping', 'scope-review', 'sprint-planning', 'user-story'] },
    { path: 'discovery-requirements.md',   domain: 'legal',        owner: 'CLO',            purpose: 'CLO + CISO regulatory map and legal blockers — hard gate for CTO activation',     load_when: ['legal-review', 'before-cto-activation', 'compliance-check', 'regulatory'] },
    { path: 'security-requirements.md',    domain: 'security',     owner: 'CISO',           purpose: 'CISO threat model, auth design constraints, security requirements',                load_when: ['security-review', 'before-cto-activation', 'threat-model', 'auth-design'] },
    { path: 'design-requirements.md',      domain: 'design',       owner: 'Designer',       purpose: 'Interface requirements, design direction, SDD artifacts',                          load_when: ['interface-design', 'sdd-step2', 'ux-review'] },
    { path: 'business-requirements.md',    domain: 'business',     owner: 'CFO',            purpose: 'Finance, marketing, revenue, data, operations, and people requirements',           load_when: ['budget-review', 'gtm-planning', 'vendor-review', 'unit-economics'] },
    // Area logs
    { path: 'engineering-log.md',          domain: 'engineering',  owner: 'CTO',            purpose: 'CTO, Mario, Staff Eng, EM, IC engineers — state changes and decisions',           load_when: ['engineering-domain', 'architecture-review'] },
    { path: 'product-log.md',              domain: 'product',      owner: 'PM',             purpose: 'PM, CMO, CRO, CDO — product and go-to-market state changes',                      load_when: ['product-domain', 'mission-shaping'] },
    { path: 'design-log.md',               domain: 'design',       owner: 'Designer',       purpose: 'Designer and UX Researcher — design decisions and research findings',              load_when: ['design-domain', 'interface-design'] },
    { path: 'operations-log.md',           domain: 'business',     owner: 'COO',            purpose: 'COO, CLO, CISO, CFO — operations and compliance state changes',                   load_when: ['operations-domain', 'vendor-review'] },
    { path: 'people-log.md',               domain: 'people',       owner: 'CHRO',           purpose: 'CHRO and EM — team changes, pod formation, onboarding entries',                   load_when: ['people-domain', 'pod-management', 'hiring'] },
    // Generated files
    { path: 'context-manifest.json',       domain: 'strategy',     owner: 'Coordinator',    purpose: 'Generated project snapshot — current phase, missions, next agent to activate',    load_when: ['session-start'] },
    { path: 'context-index.json',          domain: 'strategy',     owner: 'Coordinator',    purpose: 'Generated file map — domain routing, query map, agent capabilities',               load_when: ['session-start'] },
  ];

  // Compute staleness for each file
  const now = Date.now();
  const files = CATALOG.map(entry => {
    const fullPath = path.join(projectDir, entry.path);
    const exists   = fs.existsSync(fullPath);
    let ageHours   = null;
    let stale      = null;
    if (exists) {
      const mtime = fs.statSync(fullPath).mtime;
      ageHours = Math.round((now - mtime.getTime()) / 1000 / 60 / 60);
      stale    = ageHours > 48;
    }
    return { ...entry, exists, ageHours, stale };
  }).filter(f => f.exists); // only include files that exist in this project

  // ── Domain routing table ──────────────────────────────────────────────────
  const domains = {
    strategy:    { lead: 'Coordinator', consult: 'CEO',        files: ['current-status.md', 'project.md', 'history.md', 'project-map.md', 'strategy-log.md', 'general-requirements.md'] },
    engineering: { lead: 'CTO',         consult: 'CTO',        files: ['engineering-requirements.md', 'engineering-log.md'] },
    legal:       { lead: 'CLO',         consult: 'CLO',        files: ['discovery-requirements.md'] },
    security:    { lead: 'CISO',        consult: 'CISO',       files: ['security-requirements.md'] },
    product:     { lead: 'PM',          consult: 'PM',         files: ['product-requirements.md', 'product-log.md'] },
    design:      { lead: 'Designer',    consult: 'Designer',   files: ['design-requirements.md', 'design-log.md'] },
    business:    { lead: 'CFO',         consult: 'CFO',        files: ['business-requirements.md', 'operations-log.md'] },
    people:      { lead: 'CHRO',        consult: 'CHRO',       files: ['people-log.md', 'team.md'] },
  };

  // ── Query map — topic → files to read + agent to consult ─────────────────
  // Agents use this to self-direct context loading and route CONTEXT REQUEST messages.
  // Consult the domain lead first; they will route internally to sub-roles if needed.
  const queryMap = {
    'architecture':         { read: ['engineering-requirements.md'],                           consult: 'CTO' },
    'technical-decision':   { read: ['engineering-requirements.md', 'history.md'],             consult: 'CTO' },
    'build-vs-buy':         { read: ['engineering-requirements.md', 'business-requirements.md'], consult: 'CTO' },
    'platform-risk':        { read: ['engineering-requirements.md', 'security-requirements.md'], consult: 'CTO' },
    'irreversible-decision':{ read: ['engineering-requirements.md', 'history.md'],             consult: 'Mario' },
    'quality-standard':     { read: ['engineering-requirements.md'],                           consult: 'Mario' },
    'interface-contract':   { read: ['engineering-requirements.md'],                           consult: 'Staff Engineer' },
    'sprint-state':         { read: ['engineering-requirements.md', 'product-requirements.md'], consult: 'EM' },
    'pod-composition':      { read: ['engineering-requirements.md', 'people-log.md'],          consult: 'EM' },
    'legal-constraints':    { read: ['discovery-requirements.md'],                             consult: 'CLO' },
    'compliance':           { read: ['discovery-requirements.md', 'security-requirements.md'], consult: 'CLO' },
    'regulatory':           { read: ['discovery-requirements.md'],                             consult: 'CLO' },
    'contracts':            { read: ['discovery-requirements.md', 'history.md'],               consult: 'CLO' },
    'security':             { read: ['security-requirements.md'],                              consult: 'CISO' },
    'threat-model':         { read: ['security-requirements.md'],                              consult: 'CISO' },
    'auth-design':          { read: ['security-requirements.md', 'engineering-requirements.md'], consult: 'CISO' },
    'data-protection':      { read: ['security-requirements.md', 'discovery-requirements.md'], consult: 'CISO' },
    'product-scope':        { read: ['product-requirements.md'],                               consult: 'PM' },
    'user-story':           { read: ['product-requirements.md', 'design-requirements.md'],    consult: 'PM' },
    'mission-kanban':       { read: ['product-requirements.md', 'product-log.md'],            consult: 'PM' },
    'friction-log':         { read: ['product-requirements.md'],                               consult: 'PM' },
    'interface-design':     { read: ['design-requirements.md'],                                consult: 'Designer' },
    'ux-patterns':          { read: ['design-requirements.md'],                                consult: 'Designer' },
    'user-research':        { read: ['design-requirements.md', 'design-log.md'],              consult: 'UX Researcher' },
    'assumption-validation':{ read: ['design-requirements.md', 'product-requirements.md'],    consult: 'UX Researcher' },
    'budget':               { read: ['business-requirements.md'],                              consult: 'CFO' },
    'unit-economics':       { read: ['business-requirements.md'],                              consult: 'CFO' },
    'runway':               { read: ['business-requirements.md'],                              consult: 'CFO' },
    'revenue-model':        { read: ['business-requirements.md'],                              consult: 'CRO' },
    'pricing':              { read: ['business-requirements.md'],                              consult: 'CRO' },
    'gtm':                  { read: ['business-requirements.md'],                              consult: 'CMO' },
    'positioning':          { read: ['business-requirements.md'],                              consult: 'CMO' },
    'vendor':               { read: ['business-requirements.md', 'operations-log.md'],        consult: 'COO' },
    'operations-runbook':   { read: ['business-requirements.md', 'operations-log.md'],        consult: 'COO' },
    'data-governance':      { read: ['business-requirements.md', 'engineering-requirements.md'], consult: 'CDO' },
    'instrumentation':      { read: ['business-requirements.md', 'product-requirements.md'],  consult: 'CDO' },
    'ai-strategy':          { read: ['engineering-requirements.md'],                           consult: 'CAIO' },
    'model-evaluation':     { read: ['engineering-requirements.md'],                           consult: 'CAIO' },
    'analytics':            { read: ['business-requirements.md', 'product-requirements.md'],  consult: 'CAO' },
    'experimentation':      { read: ['business-requirements.md', 'product-requirements.md'],  consult: 'CAO' },
    'hiring':               { read: ['people-log.md'],                                         consult: 'CHRO' },
    'team-composition':     { read: ['team.md', 'people-log.md'],                             consult: 'CHRO' },
    'partnerships':         { read: ['business-requirements.md'],                              consult: 'CPO Partnerships' },
    'ecosystem':            { read: ['business-requirements.md'],                              consult: 'CPO Partnerships' },
    'enterprise-risk':      { read: ['business-requirements.md', 'discovery-requirements.md'], consult: 'CRO Risk' },
    'credit-risk':          { read: ['business-requirements.md'],                              consult: 'CCO Credit' },
    'customer-success':     { read: ['business-requirements.md', 'product-requirements.md'],  consult: 'CCO Customer' },
    'protocol-design':      { read: ['engineering-requirements.md'],                           consult: 'CPO Protocol' },
    'decisions':            { read: ['history.md'],                                            consult: 'Coordinator' },
    'current-state':        { read: ['current-status.md'],                                     consult: 'Coordinator' },
    'release-plan':         { read: ['current-status.md', 'history.md'],                      consult: 'Coordinator' },
    'strategy':             { read: ['project.md', 'history.md'],                             consult: 'CEO' },
    'vision':               { read: ['project.md', 'idea.md'],                                consult: 'CEO' },
  };

  const index = {
    schemaVersion: '1.0',
    indexVersion:  previousVersion + 1,
    generatedAt:   refMtime.toISOString(),
    release,
    files,
    domains,
    queryMap,
  };

  writeFile(indexFile, JSON.stringify(index, null, 2) + '\n');
  console.log(`✓ context-index.json written (v${index.indexVersion}, ${files.length} files indexed)`);
  console.log(indexFile);
}

// ─── Dispatch ────────────────────────────────────────────────────────────────

switch (command) {
  case 'list': cmdList(); break;
  case 'read': cmdRead(); break;
  case 'append': cmdAppend(); break;
  case 'rewrite': cmdRewrite(); break;
  case 'add-item': cmdAddItem(); break;
  case 'decision': cmdDecision(); break;
  case 'log': cmdLog(); break;
  case 'status': cmdStatus(); break;
  case 'pod-update': cmdPodUpdate(); break;
  case 'spawn': cmdSpawn(); break;
  case 'dissolve': cmdDissolve(); break;
  case 'manifest': cmdManifest(); break;
  case 'index':    cmdIndex();    break;
  default:
    console.error(`Unknown command: "${command}"`);
    printHelp();
    process.exit(1);
}
