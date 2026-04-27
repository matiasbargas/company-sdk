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
const spawnDissolveCommands = ['spawn', 'dissolve', 'manifest', 'index', 'study', 'iteration'];

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
  study       <project-dir> create --title <text>            Create a new study file in research/studies/
                     [--team <text>] [--requested-by <role>]   with scientific format frontmatter
                     [--method <text>] [--tags <csv>]
  study       <project-dir> list                             List all studies with title, date, status, confidence
  session     <project-dir> save --title <text>              Save a session summary to sessions/temp/
                     [--participants <csv>] [--domains <csv>]
                     [--tags <csv>] [--saved-by <role>]
  session     <project-dir> list [--status temp|permanent|all]  List saved sessions
  session     <project-dir> promote <filename>               Move session from temp to permanent (indexed)
  session     <project-dir> clean [--confirm]                Delete all temp sessions
  cockpit     <project-dir> --role <role>                     Role-specific session briefing (replaces 6-read startup)
  bus         <project-dir> --from <role> --to <role>         Send a Bus message: logs to bus-log.md + intent resolution
  disagreement <project-dir> open --topic "..." --positions "A:...,B:..."  Open a structured disagreement
  history      <project-dir> [--domain X] [--search Y] [--reversible Z]  Query structured decisions
                     --message "..." [--priority INFO|BLOCKER|DECISION NEEDED|CONTEXT REQUEST]
  domain      <project-dir> add --name <name> --lead <role>  Create a new project domain
                     [--summary "..."] [--spawn-when "..."]
                     [--context-provides "..."]
  domain      <project-dir> list                             List all project domains
  domain      <project-dir> update --name <name>             Update domain metadata
                     [--lead, --summary, --spawn-when, --context-provides]
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
  node scripts/doc.js iteration ./my-project create --loop discovery --guardian "Yuki Osaka"
  node scripts/doc.js iteration ./my-project review --loop discovery --cycle 1 --verdict iterate --feedback "Target user too broad"
  node scripts/doc.js iteration ./my-project graduate --loop architecture --cycle 2
  node scripts/doc.js iteration ./my-project list --loop discovery
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

// ─── Domain inference ────────────────────────────────────────────────────────

function inferDomain(role) {
  const r = (role || '').toLowerCase();
  if (['cto', 'mario', 'chief engineer', 'staff engineer', 'em', 'engineer'].some(k => r.includes(k))) return 'engineering';
  if (['pm', 'cmo', 'cro'].some(k => r.includes(k))) return 'product';
  if (['clo', 'ciso'].some(k => r.includes(k))) return 'legal-security';
  if (['cfo'].some(k => r.includes(k))) return 'finance';
  if (['designer', 'ux researcher'].some(k => r.includes(k))) return 'design';
  if (['ceo', 'coordinator', 'greg'].some(k => r.includes(k))) return 'strategy';
  if (['cdo'].some(k => r.includes(k))) return 'data';
  if (['coo'].some(k => r.includes(k))) return 'operations';
  if (['chro'].some(k => r.includes(k))) return 'people';
  return 'general';
}

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
  const domain = opts.domain || inferDomain(opts['made-by']);
  const affects = opts.affects || '—';

  // YAML frontmatter structured entry (protocol v4.2)
  const entry = `
### Decision: ${opts.decision}

<!--
decision: "${opts.decision.replace(/"/g, '\\"')}"
date: "${now}"
release: "${release}"
made_by: "${opts['made-by']}"
domain: "${domain}"
reversible: ${reversible}
affects: "${affects}"
-->

| Field | Value |
|-------|-------|
| Date | ${now} |
| Release | ${release} |
| Made by | ${opts['made-by']} |
| Domain | ${domain} |
| Context | ${opts.context} |
| Decision | ${opts.decision} |
| Rationale | ${rationale} |
| Reversible | ${reversible} |
| Affects | ${affects} |
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

  // Conflict detection: check existing decisions in same domain for keyword overlap
  const existingDecisions = [];
  const decisionPattern = /<!--\n([\s\S]*?)-->/g;
  let cdMatch;
  while ((cdMatch = decisionPattern.exec(content)) !== null) {
    const block = cdMatch[1];
    const d = {};
    for (const line of block.split('\n')) {
      const kvMatch = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
      if (kvMatch) d[kvMatch[1]] = kvMatch[2].trim();
    }
    if (d.decision) existingDecisions.push(d);
  }

  const sameDomain = existingDecisions.filter(d => d.domain === domain && d.decision !== opts.decision);
  if (sameDomain.length > 0) {
    // Extract keywords from new decision
    const newWords = new Set(opts.decision.toLowerCase().split(/\s+/).filter(w => w.length >= 4));
    const conflicts = [];

    for (const existing of sameDomain) {
      const existingWords = new Set((existing.decision || '').toLowerCase().split(/\s+/).filter(w => w.length >= 4));
      const overlap = [...newWords].filter(w => existingWords.has(w));

      if (overlap.length >= 2) {
        conflicts.push({ decision: existing.decision, date: existing.date, overlap });
      }
    }

    if (conflicts.length > 0) {
      console.log('');
      console.log('  ⚠  Potential conflicts with existing decisions:');
      for (const c of conflicts) {
        console.log(`     ${c.date || '?'}  "${c.decision}"`);
        console.log(`     Overlapping terms: ${c.overlap.join(', ')}`);
      }
      console.log('  Review these decisions to ensure consistency.');
    }
  }
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
  const { generateManifest } = require('../packages/context/src');
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const manifestFile = path.join(projectDir, 'context-manifest.json');

  const manifest = generateManifest(projectDir);
  writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n');

  if (manifest._warning) {
    console.log(`Warning: ${manifest._warning}`);
  } else {
    console.log(`✓ context-manifest.json written (v${manifest.manifestVersion}, schema ${manifest.schemaVersion})`);
  }
  console.log(manifestFile);
}

// ─── Index: context-index.json ───────────────────────────────────────────────

function cmdIndex() {
  const { generateIndex } = require('../packages/context/src');
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const indexFile  = path.join(projectDir, 'context-index.json');

  const index = generateIndex(projectDir);
  writeFile(indexFile, JSON.stringify(index, null, 2) + '\n');
  console.log(`✓ context-index.json written (v${index.indexVersion}, ${index.files.length} files indexed)`);
  console.log(indexFile);
}

// ─── Study: research/studies/ ─────────────────────────────────────────────────

/**
 * cmdStudy — Create or list scientific study files in research/studies/.
 *
 * Subcommands:
 *   create  — generate a new study file with YAML frontmatter + scientific body
 *   list    — list all studies with title, date, status, confidence
 */
function cmdStudy() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const studiesDir = path.join(projectDir, 'research', 'studies');
  const subcommand = args[2]; // create | list

  if (!subcommand || !['create', 'list'].includes(subcommand)) {
    console.error('Usage: sdk-doc study <project-dir> create --title "..." | list');
    process.exit(1);
  }

  if (subcommand === 'list') {
    if (!fs.existsSync(studiesDir)) {
      console.log('No studies directory found. Run `sdk-doc study <project-dir> create` to create the first study.');
      return;
    }
    const files = fs.readdirSync(studiesDir).filter(f => f.endsWith('.md')).sort();
    if (files.length === 0) {
      console.log('No studies found.');
      return;
    }
    console.log(`\n  Studies in ${path.relative(process.cwd(), studiesDir)}/\n`);
    console.log('  ' + 'Date'.padEnd(12) + 'Confidence'.padEnd(12) + 'Status'.padEnd(12) + 'Title');
    console.log('  ' + '─'.repeat(60));
    for (const file of files) {
      const content = fs.readFileSync(path.join(studiesDir, file), 'utf8');
      const fm = parseFrontmatter(content);
      const date = fm.date || file.slice(0, 10);
      const confidence = fm.confidence || '—';
      const status = fm.status || '—';
      const title = fm.title || file.replace(/\.md$/, '');
      console.log('  ' + date.padEnd(12) + confidence.padEnd(12) + status.padEnd(12) + title);
    }
    console.log();
    return;
  }

  // create — re-parse options starting from args[3] since args[2] is 'create'
  const studyOpts = {};
  for (let i = 3; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1]) {
      studyOpts[args[i].slice(2)] = args[++i];
    }
  }
  const title = studyOpts.title;
  if (!title) {
    console.error('--title is required for study create');
    process.exit(1);
  }
  const team = studyOpts.team || 'Research Chapter';
  const requestedBy = studyOpts['requested-by'] || 'unspecified';
  const method = studyOpts.method || 'TBD';
  const tagsRaw = studyOpts.tags || '';
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : [];

  const today = new Date().toISOString().slice(0, 10);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const filename = `${today}-${slug}.md`;

  // Ensure directories exist
  fs.mkdirSync(studiesDir, { recursive: true });

  const tagsYaml = tags.length > 0 ? `[${tags.map(t => `"${t}"`).join(', ')}]` : '[]';

  const body = `---
title: "${title}"
date: "${today}"
team: "${team}"
requested_by: "${requestedBy}"
method: "${method}"
confidence: "TBD"
tags: ${tagsYaml}
status: "draft"
---

# ${title}

**Date:** ${today}
**Researcher:** [PERSONA_NAME]
**Release:** [RELEASE]
**Requested by:** ${requestedBy}

---

## Hypothesis

[What the team believed before this study. State it as a falsifiable claim.]

## Method

[What was done. Sample size, participant criteria, duration, tools used.]

## Data

[Raw observations. What happened, not what it means.]

### Key observations

1. [Observation — behavioral, not interpretive]
2. [Observation]
3. [Observation]

### Patterns (appeared in 3+ sessions)

- [Pattern + frequency]

## Findings

[What the data means. First-principles analysis. Connect observations to causes.]

### Confirmed

- [Hypothesis element confirmed — evidence]

### Refuted

- [Hypothesis element refuted — evidence]

### Edge insights

- [Unexpected finding that no one asked about but matters]

## Implications

| Domain | Implication | Recommended action |
|---|---|---|
| [PM / Designer / CTO / etc.] | [What this means for their domain] | [Specific next step] |

## Confidence Assessment

**Level:** TBD
**Why:** [Sample size, method limitations, representativeness, replicability]

## Open Questions

- [What this study raised but did not answer]

---

*Study format: scientific, first-principles. Edge insights are the most valuable section.*
`;

  const outPath = path.join(studiesDir, filename);
  writeFile(outPath, body);
  console.log(`✓ Study created: ${path.relative(process.cwd(), outPath)}`);
  console.log(`  Title: ${title}`);
  console.log(`  Requested by: ${requestedBy}`);
  console.log(`  Next: fill in Hypothesis and Method, then execute the study.`);
}

const { parseFrontmatter } = require('./lib/frontmatter');

// ─── Session: sessions/temp/ and sessions/permanent/ ─────────────────────────

/**
 * cmdSession — Save, list, promote, or clean session memory files.
 *
 * Subcommands:
 *   save     — create a session file in sessions/temp/
 *   list     — list sessions (filter by --status temp|permanent|all)
 *   promote  — move a session from temp/ to permanent/ (becomes indexed)
 *   clean    — delete all temp sessions (requires --confirm)
 */
function cmdSession() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const tempDir = path.join(projectDir, 'sessions', 'temp');
  const permDir = path.join(projectDir, 'sessions', 'permanent');
  const subcommand = args[2]; // save | list | promote | clean

  if (!subcommand || !['save', 'list', 'promote', 'clean'].includes(subcommand)) {
    console.error('Usage: sdk-doc session <project-dir> save --title "..." | list | promote <file> | clean --confirm');
    process.exit(1);
  }

  // ── save ──────────────────────────────────────────────────────────────────
  if (subcommand === 'save') {
    const sessionOpts = {};
    for (let i = 3; i < args.length; i++) {
      if (args[i].startsWith('--') && args[i + 1]) {
        sessionOpts[args[i].slice(2)] = args[++i];
      }
    }
    const title = sessionOpts.title;
    if (!title) {
      console.error('--title is required for session save');
      process.exit(1);
    }
    const participants = sessionOpts.participants || '';
    const sessionDomains = sessionOpts.domains || '';
    const tags = sessionOpts.tags || '';
    const savedBy = sessionOpts['saved-by'] || 'unspecified';

    // Read release from .sdkrc or current-status.md
    let release = '';
    const sdkrcPath = path.join(projectDir, '.sdkrc');
    if (fs.existsSync(sdkrcPath)) {
      try {
        const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
        if (sdkrc.releaseId) release = sdkrc.releaseId;
      } catch (_) {}
    }

    const today = new Date().toISOString().slice(0, 10);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    const filename = `${today}-${slug}.md`;

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const body = `---
title: "${title}"
date: "${today}"
participants: "${participants}"
domains: "${sessionDomains}"
release: "${release}"
saved_by: "${savedBy}"
status: "temp"
tags: "${tags}"
---

# ${title}

**Date:** ${today}
**Release:** ${release}
**Participants:** ${participants || 'unspecified'}

---

## Summary

[1-3 sentence overview of what this session accomplished]

## Decisions Explored

- [Decision or option discussed — not necessarily committed to history.md]

## Context Surfaced

- [Important context that came up — links to files, external references, domain knowledge]

## Key Takeaways

1. [Actionable insight or conclusion]

## Open Threads

- [Anything left unresolved that a future session should pick up]

---

*Session saved by ${savedBy} on ${today}. Status: temp*
`;

    const outPath = path.join(tempDir, filename);
    writeFile(outPath, body);
    console.log(`✓ Session saved: ${path.relative(process.cwd(), outPath)}`);
    console.log(`  Title: ${title}`);
    console.log(`  Status: temp — promote with: sdk-doc session ${path.relative(process.cwd(), projectDir)} promote ${filename}`);
    return;
  }

  // ── list ──────────────────────────────────────────────────────────────────
  if (subcommand === 'list') {
    const statusFilter = args.find(a => a === '--status') ? args[args.indexOf('--status') + 1] : 'all';
    const dirs = [];
    if (statusFilter === 'all' || statusFilter === 'temp') dirs.push({ dir: tempDir, status: 'temp' });
    if (statusFilter === 'all' || statusFilter === 'permanent') dirs.push({ dir: permDir, status: 'permanent' });

    let total = 0;
    console.log(`\n  Sessions (${statusFilter})\n`);
    console.log('  ' + 'Date'.padEnd(12) + 'Status'.padEnd(12) + 'Domains'.padEnd(24) + 'Title');
    console.log('  ' + '─'.repeat(72));

    for (const { dir, status } of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse();
      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        const fm = parseFrontmatter(content);
        const date = fm.date || file.slice(0, 10);
        const domains = fm.domains || '—';
        const title = fm.title || file.replace(/\.md$/, '');
        console.log('  ' + date.padEnd(12) + status.padEnd(12) + domains.slice(0, 22).padEnd(24) + title);
        total++;
      }
    }

    if (total === 0) console.log('  (none)');
    console.log();
    return;
  }

  // ── promote ───────────────────────────────────────────────────────────────
  if (subcommand === 'promote') {
    const filename = args[3];
    if (!filename) {
      console.error('Usage: sdk-doc session <project-dir> promote <filename>');
      process.exit(1);
    }
    const src = path.join(tempDir, filename);
    if (!fs.existsSync(src)) {
      console.error(`Session not found: ${src}`);
      console.error(`Available temp sessions:`);
      if (fs.existsSync(tempDir)) {
        fs.readdirSync(tempDir).filter(f => f.endsWith('.md')).forEach(f => console.error(`  ${f}`));
      }
      process.exit(1);
    }

    if (!fs.existsSync(permDir)) fs.mkdirSync(permDir, { recursive: true });

    let content = fs.readFileSync(src, 'utf8');
    content = content.replace(/status:\s*"temp"/, 'status: "permanent"');
    content = content.replace(/Status: temp/, 'Status: permanent');

    const dest = path.join(permDir, filename);
    fs.writeFileSync(dest, content, 'utf8');
    fs.unlinkSync(src);
    console.log(`✓ Session promoted: ${filename}`);
    console.log(`  Moved: sessions/temp/ → sessions/permanent/`);
    console.log(`  Now indexed in context-index.json (run: sdk-doc index ${path.relative(process.cwd(), projectDir)})`);
    return;
  }

  // ── clean ─────────────────────────────────────────────────────────────────
  if (subcommand === 'clean') {
    const confirm = args.includes('--confirm');
    if (!fs.existsSync(tempDir)) {
      console.log('No temp sessions directory found.');
      return;
    }
    const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.md'));
    if (files.length === 0) {
      console.log('No temp sessions to clean.');
      return;
    }

    console.log(`Temp sessions (${files.length}):`);
    for (const f of files) {
      const content = fs.readFileSync(path.join(tempDir, f), 'utf8');
      const fm = parseFrontmatter(content);
      console.log(`  ${f}: "${fm.title || f.replace(/\.md$/, '')}"`);
    }

    if (!confirm) {
      console.log(`\nRe-run with --confirm to delete all ${files.length} temp session(s).`);
      return;
    }

    for (const f of files) {
      fs.unlinkSync(path.join(tempDir, f));
    }
    console.log(`\n✓ Deleted ${files.length} temp session(s).`);
  }
}

// ─── Discovery: structured requirements gathering ────────────────────────────

/**
 * cmdDiscovery — Greg's Discovery Loop: generate questions, capture answers, track state.
 *
 * Subcommands:
 *   start    — generate initial questionnaire from idea.md + domains
 *   answer   — capture an answer and route to domain/requirements
 *   status   — show what's answered, pending, and what blocks team activation
 */
function cmdDiscovery() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const subcommand = args[2]; // start | answer | status

  if (!subcommand || !['start', 'answer', 'status'].includes(subcommand)) {
    console.error('Usage: sdk-doc discovery <project-dir> start | answer --id <id> --answer "..." | status');
    process.exit(1);
  }

  const stateFile = path.join(projectDir, 'discovery-state.json');

  // ── start ─────────────────────────────────────────────────────────────
  if (subcommand === 'start') {
    // Read idea.md for project context
    const ideaPath = path.join(projectDir, 'idea.md');
    let ideaContent = '';
    if (fs.existsSync(ideaPath)) {
      ideaContent = fs.readFileSync(ideaPath, 'utf8');
    }

    // Read domains
    const domainsDir = path.join(projectDir, 'domains');
    const domainNames = [];
    if (fs.existsSync(domainsDir)) {
      const dirs = fs.readdirSync(domainsDir).filter(d => fs.statSync(path.join(domainsDir, d)).isDirectory());
      domainNames.push(...dirs);
    }

    // Read .sdkrc for project type
    let projectType = 'product';
    const sdkrcPath = path.join(projectDir, '.sdkrc');
    if (fs.existsSync(sdkrcPath)) {
      try { const s = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8')); if (s.type) projectType = s.type; } catch (_) {}
    }

    // Generate questions
    const questions = [];
    let qid = 1;

    // Core scope questions (always asked)
    questions.push({ id: `Q${qid++}`, category: 'scope', priority: 'blocks-discovery', question: 'What is IN scope for v1? List the core features or capabilities.', routes_to: 'product-requirements.md', domain: null, answered: false, answer: '' });
    questions.push({ id: `Q${qid++}`, category: 'scope', priority: 'blocks-discovery', question: 'What is explicitly OUT of scope for v1? What are you deliberately NOT building?', routes_to: 'product-requirements.md', domain: null, answered: false, answer: '' });
    questions.push({ id: `Q${qid++}`, category: 'scope', priority: 'blocks-discovery', question: 'What is the appetite — how many weeks is this worth? (2, 4, 6, 8+)', routes_to: 'current-status.md', domain: null, answered: false, answer: '' });

    // User questions
    questions.push({ id: `Q${qid++}`, category: 'user', priority: 'blocks-discovery', question: 'Who exactly is the target user? Be specific: role, situation, current tools.', routes_to: 'product-requirements.md', domain: null, answered: false, answer: '' });
    questions.push({ id: `Q${qid++}`, category: 'user', priority: 'important', question: 'What does the user do TODAY without this product? What is painful about it?', routes_to: 'product-requirements.md', domain: null, answered: false, answer: '' });
    questions.push({ id: `Q${qid++}`, category: 'user', priority: 'important', question: 'What is the moment of value — the first time the user says "this was worth it"?', routes_to: 'product-requirements.md', domain: null, answered: false, answer: '' });

    // Non-negotiables
    questions.push({ id: `Q${qid++}`, category: 'non-negotiables', priority: 'blocks-discovery', question: 'What absolutely cannot be wrong? (security, compliance, data handling, UX invariants)', routes_to: 'discovery-requirements.md', domain: null, answered: false, answer: '' });

    // Constraints
    questions.push({ id: `Q${qid++}`, category: 'constraints', priority: 'important', question: 'Budget constraints? Team size? Hard deadlines? Technology mandates?', routes_to: 'business-requirements.md', domain: null, answered: false, answer: '' });
    questions.push({ id: `Q${qid++}`, category: 'constraints', priority: 'important', question: 'Any regulatory or compliance requirements? (GDPR, PCI, SOC 2, industry-specific)', routes_to: 'discovery-requirements.md', domain: null, answered: false, answer: '' });

    // Risk
    questions.push({ id: `Q${qid++}`, category: 'risk', priority: 'important', question: 'What is the riskiest assumption? What has to be true for this to work?', routes_to: 'history.md', domain: null, answered: false, answer: '' });

    // Domain-specific questions
    for (const dName of domainNames) {
      const summaryPath = path.join(domainsDir, dName, 'summary.md');
      if (fs.existsSync(summaryPath)) {
        const content = fs.readFileSync(summaryPath, 'utf8');
        const fm = parseFrontmatter(content);
        const bodyMatch = content.match(/^---[\s\S]*?---\s*\n([\s\S]*)/);
        const body = bodyMatch ? bodyMatch[1].trim() : '';
        const isPlaceholder = body.includes('[Describe the');

        if (isPlaceholder) {
          questions.push({ id: `Q${qid++}`, category: 'domain', priority: 'blocks-discovery', question: `Describe the "${dName}" domain: what does it cover, what are its key components, what are the boundaries?`, routes_to: `domains/${dName}/summary.md`, domain: dName, answered: false, answer: '' });
        }
        questions.push({ id: `Q${qid++}`, category: 'domain', priority: 'important', question: `For the "${dName}" domain: what technical decisions are already locked? What is still open?`, routes_to: `domains/${dName}/summary.md`, domain: dName, answered: false, answer: '' });
      }
    }

    // Write state
    const state = {
      schemaVersion: '1.0',
      startedAt: new Date().toISOString(),
      projectType,
      domains: domainNames,
      questions,
      totalQuestions: questions.length,
      answered: 0,
      blockers: questions.filter(q => q.priority === 'blocks-discovery').length,
      readyForActivation: false,
    };

    writeFile(stateFile, JSON.stringify(state, null, 2) + '\n');

    console.log(`✓ Discovery started: ${state.totalQuestions} questions generated`);
    console.log(`  Blocking: ${state.blockers} question(s) must be answered before team activation`);
    console.log(`  Domains: ${domainNames.length > 0 ? domainNames.join(', ') : 'none defined'}`);
    console.log('');
    console.log('Questions (blocks-discovery first):');
    const blocking = questions.filter(q => q.priority === 'blocks-discovery' && !q.answered);
    for (const q of blocking) {
      console.log(`  [${q.id}] ${q.category}: ${q.question}`);
    }
    console.log('');
    console.log(`Answer: sdk-doc discovery ${path.relative(process.cwd(), projectDir)} answer --id Q1 --answer "..."`);
    return;
  }

  // ── answer ────────────────────────────────────────────────────────────
  if (subcommand === 'answer') {
    if (!fs.existsSync(stateFile)) {
      console.error('Discovery not started. Run: sdk-doc discovery <dir> start');
      process.exit(1);
    }

    const answerOpts = {};
    for (let i = 3; i < args.length; i++) {
      if (args[i].startsWith('--') && args[i + 1]) {
        answerOpts[args[i].slice(2)] = args[++i];
      }
    }

    const qid = answerOpts.id;
    const answer = answerOpts.answer;
    if (!qid || !answer) {
      console.error('Usage: sdk-doc discovery <dir> answer --id <id> --answer "..."');
      process.exit(1);
    }

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const question = state.questions.find(q => q.id === qid);
    if (!question) {
      console.error(`Question ${qid} not found.`);
      process.exit(1);
    }

    question.answered = true;
    question.answer = answer;
    question.answeredAt = new Date().toISOString();
    state.answered = state.questions.filter(q => q.answered).length;

    // Check if all blocking questions are answered
    const blockingUnanswered = state.questions.filter(q => q.priority === 'blocks-discovery' && !q.answered);
    state.readyForActivation = blockingUnanswered.length === 0;

    writeFile(stateFile, JSON.stringify(state, null, 2) + '\n');

    // Route answer to target file
    if (question.routes_to && question.routes_to.startsWith('domains/')) {
      const targetPath = path.join(projectDir, question.routes_to);
      if (fs.existsSync(targetPath)) {
        // Update domain summary with the answer (replace placeholder)
        let content = fs.readFileSync(targetPath, 'utf8');
        if (content.includes('[Describe the')) {
          content = content.replace(/\[Describe the[^\]]*\]/, answer);
          fs.writeFileSync(targetPath, content, 'utf8');
          console.log(`  → Routed to ${question.routes_to} (summary updated)`);
        } else {
          fs.appendFileSync(targetPath, `\n\n<!-- Discovery ${qid}: ${question.question} -->\n${answer}\n`, 'utf8');
          console.log(`  → Appended to ${question.routes_to}`);
        }
      }
    }

    console.log(`✓ ${qid} answered (${state.answered}/${state.totalQuestions})`);

    if (state.readyForActivation) {
      console.log('');
      console.log('🟢 All blocking questions answered. Ready to activate the team.');
      console.log('   Next: "Hey Greg — activate the Coordinator and start Discovery."');
    } else {
      console.log(`  Remaining blockers: ${blockingUnanswered.length}`);
      if (blockingUnanswered.length > 0) {
        console.log(`  Next: ${blockingUnanswered[0].id} — ${blockingUnanswered[0].question.slice(0, 80)}`);
      }
    }
    return;
  }

  // ── status ────────────────────────────────────────────────────────────
  if (subcommand === 'status') {
    if (!fs.existsSync(stateFile)) {
      console.error('Discovery not started. Run: sdk-doc discovery <dir> start');
      process.exit(1);
    }

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    console.log(`\nDiscovery Status: ${state.answered}/${state.totalQuestions} answered`);
    console.log(`Ready for activation: ${state.readyForActivation ? '🟢 YES' : '🔴 NO'}`);
    console.log('');

    const unanswered = state.questions.filter(q => !q.answered);
    const blocking = unanswered.filter(q => q.priority === 'blocks-discovery');
    const important = unanswered.filter(q => q.priority === 'important');

    if (blocking.length > 0) {
      console.log(`Blocking (${blocking.length}):`);
      for (const q of blocking) {
        console.log(`  [${q.id}] ${q.category}: ${q.question.slice(0, 80)}`);
      }
    }

    if (important.length > 0) {
      console.log(`\nImportant (${important.length}):`);
      for (const q of important) {
        console.log(`  [${q.id}] ${q.category}: ${q.question.slice(0, 80)}`);
      }
    }

    const answered = state.questions.filter(q => q.answered);
    if (answered.length > 0) {
      console.log(`\nAnswered (${answered.length}):`);
      for (const q of answered) {
        console.log(`  [${q.id}] ✓ ${q.category}: ${q.answer.slice(0, 60)}...`);
      }
    }
    console.log('');
    return;
  }
}

// ─── Cockpit: role-specific session briefing ─────────────────────────────────

/**
 * cmdCockpit — Generate a role-specific session start briefing.
 *
 * Reads context-index.json, context-manifest.json, current-status.md,
 * bus-log.md, and history.md to produce a single coherent view for the
 * activating agent. Includes L0 domain summaries and context gap analysis.
 *
 * Usage:
 *   sdk-doc cockpit <project-dir> --role CTO
 */
function cmdCockpit() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const role = opts.role || 'Coordinator';

  // Read context-index.json
  const indexPath = path.join(projectDir, 'context-index.json');
  let index = null;
  if (fs.existsSync(indexPath)) {
    try { index = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch (_) {}
  }

  // Read context-manifest.json
  const manifestPath = path.join(projectDir, 'context-manifest.json');
  let manifest = null;
  if (fs.existsSync(manifestPath)) {
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (_) {}
  }

  // Read current-status.md as fallback
  const statusPath = path.join(projectDir, 'current-status.md');
  let statusContent = '';
  if (fs.existsSync(statusPath)) {
    statusContent = fs.readFileSync(statusPath, 'utf8');
  }

  // Read recent bus-log.md entries (last 10)
  const busLogPath = path.join(projectDir, 'bus-log.md');
  let recentBus = [];
  if (fs.existsSync(busLogPath)) {
    const busContent = fs.readFileSync(busLogPath, 'utf8');
    const entries = busContent.split(/\n---\n/).filter(e => e.trim() && !e.startsWith('# Bus Log'));
    recentBus = entries.slice(-10);
  }

  // Read recent history.md decisions (last 48h worth)
  const historyPath = path.join(projectDir, 'history.md');
  let recentDecisions = [];
  if (fs.existsSync(historyPath)) {
    const histContent = fs.readFileSync(historyPath, 'utf8');
    const decisionMatches = histContent.match(/### DECISION:.*(?:\n(?!###).)*/g) || [];
    recentDecisions = decisionMatches.slice(-5);
  }

  // ── Build output ────────────────────────────────────────────────────────
  const lines = [];
  const projectName = (index && index.project && index.project.name) || path.basename(projectDir);
  const release = (manifest && manifest.release) || (index && index.release) || 'unknown';
  const phase = (manifest && manifest.phase) || 'unknown';

  lines.push(`COCKPIT: ${role}`);
  lines.push(`Project: ${projectName} | Release: ${release} | Phase: ${phase}`);
  lines.push('');

  // ── Project state ─────────────────────────────────────────────────────
  if (manifest) {
    const missions = (manifest.activeMissions || []);
    const active = missions.filter(m => m.status && !m.status.includes('Paused')).length;
    const blocked = (manifest.waitingOn || []).length;
    const decisions = (manifest.openDecisions || []).length;
    lines.push(`STATE: ${active} active mission(s), ${blocked} blocker(s), ${decisions} open decision(s)`);
    if (manifest.staleness && manifest.staleness.flag === 'stale') {
      lines.push(`  ⚠ current-status.md is stale (${manifest.staleness.currentStatusAge}h old)`);
    }
  } else {
    lines.push('STATE: No manifest — read current-status.md directly');
  }
  lines.push('');

  // ── L0 domain summaries ───────────────────────────────────────────────
  if (index && index.projectDomains && Object.keys(index.projectDomains).length > 0) {
    lines.push('PROJECT DOMAINS (L0):');
    for (const [name, dom] of Object.entries(index.projectDomains)) {
      const summary = dom.summary ? dom.summary.slice(0, 120) : '(no summary)';
      lines.push(`  ${name} [${dom.lead}]: ${summary}`);
    }
    lines.push('');
  }

  // ── Active missions ───────────────────────────────────────────────────
  if (manifest && manifest.activeMissions && manifest.activeMissions.length > 0) {
    lines.push('ACTIVE MISSIONS:');
    for (const m of manifest.activeMissions) {
      lines.push(`  ${m.status || '?'} — ${m.name}`);
      if (m.nextAction) lines.push(`    Next: ${m.nextAction.slice(0, 100)}`);
    }
    lines.push('');
  }

  // ── Waiting on ────────────────────────────────────────────────────────
  if (manifest && manifest.waitingOn && manifest.waitingOn.length > 0) {
    lines.push('WAITING ON:');
    for (const w of manifest.waitingOn) {
      lines.push(`  - ${w.item}${w.blocks ? ` [blocks: ${w.blocks}]` : ''}`);
    }
    lines.push('');
  }

  // ── Context gap analysis ──────────────────────────────────────────────
  if (index && index.projectDomains && manifest && manifest.activeMissions) {
    const roleLower = role.toLowerCase();
    const touchedDomains = new Set();

    // Infer which domains the active missions touch
    for (const m of manifest.activeMissions) {
      const mText = `${m.name} ${m.nextAction || ''}`.toLowerCase();
      for (const [dName, dom] of Object.entries(index.projectDomains)) {
        if (mText.includes(dName) || (dom.spawn_when || []).some(sw => mText.includes(sw.toLowerCase()))) {
          touchedDomains.add(dName);
        }
      }
    }

    if (touchedDomains.size > 0) {
      lines.push('CONTEXT GAP ANALYSIS:');
      for (const dName of touchedDomains) {
        const dom = index.projectDomains[dName];
        const isLead = dom.lead && dom.lead.toLowerCase().includes(roleLower);
        const l1Files = dom.files.L1 || [];
        if (isLead) {
          lines.push(`  ${dName} — you are the lead. L1: ${l1Files.length} file(s) available.`);
        } else if (dom.cross_loadable) {
          lines.push(`  ${dName} — cross-loadable. Read: ${l1Files.join(', ') || '(no L1 files yet)'}`);
        }
        const triggers = dom.spawn_when || [];
        if (triggers.length > 0 && !isLead) {
          lines.push(`    Spawn ${dom.lead} for: ${triggers.join(', ')}`);
        }
      }
      lines.push('');
    }
  }

  // ── Recent Bus activity (relevant to this role) ───────────────────────
  const roleBus = recentBus.filter(e => {
    const rl = role.toLowerCase();
    const el = e.toLowerCase();
    return el.includes(`to: ${rl}`) || el.includes(`from: ${rl}`) || el.includes('to: all');
  });
  if (roleBus.length > 0) {
    lines.push(`RECENT BUS MESSAGES (for ${role}):`);
    for (const entry of roleBus.slice(-5)) {
      const firstLine = entry.trim().split('\n')[0];
      lines.push(`  ${firstLine.slice(0, 120)}`);
    }
    lines.push('');
  }

  // ── Available operations ──────────────────────────────────────────────
  if (index && index.opsMap) {
    const opNames = Object.keys(index.opsMap);
    lines.push(`AVAILABLE OPERATIONS: ${opNames.join(', ')}`);
    lines.push('');
  }

  // ── Next agent ────────────────────────────────────────────────────────
  if (manifest && manifest.nextAgentToActivate) {
    lines.push(`NEXT AGENT: ${manifest.nextAgentToActivate.role}`);
    if (manifest.nextAgentToActivate.activationPrompt) {
      lines.push(`  ${manifest.nextAgentToActivate.activationPrompt.slice(0, 200)}`);
    }
    lines.push('');
  }

  console.log(lines.join('\n'));
}

// ─── Bus: bus-log.md + intent resolution ──────────────────────────────────────

/**
 * cmdBus — Send a Bus message: logs to bus-log.md + runs intent resolver.
 *
 * Usage:
 *   sdk-doc bus <project-dir> --from CTO --to CLO --priority "DECISION NEEDED" --message "..."
 */
function cmdBus() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const busOpts = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1]) {
      busOpts[args[i].slice(2)] = args[++i];
    }
  }

  const from           = busOpts.from;
  const to             = busOpts.to;
  const priority       = busOpts.priority || 'INFO';
  const message        = busOpts.message;
  const tag            = busOpts.tag || '';
  const solutionClass  = busOpts['solution-class'] || '';
  const costSignal     = busOpts['cost-signal'] || '';
  const timeSignal     = busOpts['time-signal'] || '';

  if (!from || !to || !message) {
    console.error('Usage: sdk-doc bus <project-dir> --from <role> --to <role> --message "..." [--priority ...] [--tag ...] [--solution-class KNOWN|EXPLORATORY|HYBRID] [--cost-signal LOW|MEDIUM|HIGH] [--time-signal "Nh"]');
    process.exit(1);
  }

  // Validate TAG + PRIORITY combinations
  if (tag === 'FRAMING-CHALLENGE' && priority === 'INFO') {
    console.error('Error: FRAMING-CHALLENGE tag requires PRIORITY: DECISION NEEDED or BLOCKER, not INFO.');
    process.exit(1);
  }

  // Enforce SOLUTION_CLASS on output-bearing messages from technical roles
  const technicalRoles = ['cto', 'mario', 'chief engineer', 'em', 'staff engineer', 'coordinator'];
  const fromLower = (from || '').toLowerCase();
  const isTechnicalRole = technicalRoles.some(r => fromLower.includes(r));
  const isOutputBearing = priority !== 'INFO' || message.length > 50; // INFO with substantial content is output-bearing

  if (isTechnicalRole && isOutputBearing && !solutionClass) {
    console.error(`Error: SOLUTION_CLASS is required for output-bearing messages from ${from}.`);
    console.error('Add --solution-class KNOWN|EXPLORATORY|HYBRID');
    process.exit(1);
  }

  if (solutionClass && !['KNOWN', 'EXPLORATORY', 'HYBRID'].includes(solutionClass)) {
    console.error('Error: --solution-class must be KNOWN, EXPLORATORY, or HYBRID.');
    process.exit(1);
  }

  // Read release from .sdkrc
  let release = 'unknown';
  const sdkrcPath = path.join(projectDir, '.sdkrc');
  if (fs.existsSync(sdkrcPath)) {
    try {
      const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
      if (sdkrc.releaseId) release = sdkrc.releaseId;
    } catch (_) {}
  }

  // Format the Bus message
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 16);
  const solLine  = solutionClass ? `\nSOLUTION_CLASS: ${solutionClass}` : '';
  const tagLine  = tag ? `\nTAG: ${tag}` : '';
  const costLine = costSignal ? `\nCOST_SIGNAL: ${costSignal}` : '';
  const timeLine = timeSignal ? `\nTIME_SIGNAL: ${timeSignal}` : '';
  const formatted = `FROM: ${from}\nTO: ${to}\nRELEASE: ${release}\nPRIORITY: ${priority}${solLine}${tagLine}${costLine}${timeLine}\nMESSAGE: ${message}`;

  // Append to bus-log.md
  const logPath = path.join(projectDir, 'bus-log.md');
  const tagSuffix = tag ? ` | TAG: ${tag}` : '';
  const solSuffix = solutionClass ? ` | SOL: ${solutionClass}` : '';
  const logEntry = `\n---\n[${timestamp}] FROM: ${from} → TO: ${to} | PRIORITY: ${priority}${solSuffix}${tagSuffix} | RELEASE: ${release}\n${message}\n`;

  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, `# Bus Log\n\n> Append-only record of all inter-agent communication. Do not edit — only append.\n${logEntry}`, 'utf8');
  } else {
    fs.appendFileSync(logPath, logEntry, 'utf8');
  }

  console.log(`✓ Bus message logged to bus-log.md`);
  console.log(`  ${from} → ${to} [${priority}]${tag ? ` TAG: ${tag}` : ''}`);

  // Run intent resolver
  const { resolve: resolveIntent } = require('./lib/intent-resolver');
  const resolution = resolveIntent(formatted);

  if (resolution && resolution.action) {
    console.log(`  Intent resolved: ${resolution.action}`);
    // Don't auto-execute — report what WOULD happen. Agent or Coordinator decides.
    const def = resolution.definition;
    if (def) {
      console.log(`    Would run: ${def.script} (writes: ${def.writes})`);
      console.log(`    Params: ${JSON.stringify(resolution.params)}`);
    }
    if (resolution.side_effects) {
      for (const se of resolution.side_effects) {
        console.log(`    Side effect: ${se.action}`);
      }
    }
  } else if (resolution && resolution.routing) {
    console.log(`  Routing: topic="${resolution.routing.topic}" → consult ${resolution.routing.consult}`);
  } else {
    console.log(`  No action implied — pure communication`);
  }

  // Output the formatted message for the agent to paste
  console.log(`\n--- Bus Message ---`);
  console.log(formatted);
  console.log(`---`);
}

// ─── Domain: domains/*/summary.md ─────────────────────────────────────────────

/**
 * cmdDomain — Add, list, or update project domains.
 *
 * Subcommands:
 *   add     — create a new domain with summary.md
 *   list    — list all project domains with lead and summary
 *   update  — update a domain's summary or metadata
 */
function cmdDomain() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const domainsDir = path.join(projectDir, 'domains');
  const subcommand = args[2]; // add | list | update

  if (!subcommand || !['add', 'list', 'update'].includes(subcommand)) {
    console.error('Usage: sdk-doc domain <project-dir> add --name <name> --lead <role> [--summary "..."] | list | update --name <name> [--lead, --summary, --spawn-when, --context-provides]');
    process.exit(1);
  }

  // ── list ──────────────────────────────────────────────────────────────────
  if (subcommand === 'list') {
    if (!fs.existsSync(domainsDir)) {
      console.log('No domains directory found. Run `sdk-doc domain <dir> add --name <name> --lead <role>` to create the first domain.');
      return;
    }
    const dirs = fs.readdirSync(domainsDir).filter(d => {
      return fs.statSync(path.join(domainsDir, d)).isDirectory();
    }).sort();
    if (dirs.length === 0) {
      console.log('No domains found.');
      return;
    }
    console.log(`\n  Project Domains (${dirs.length})\n`);
    console.log('  ' + 'Domain'.padEnd(20) + 'Lead'.padEnd(16) + 'L1 files'.padEnd(10) + 'Summary');
    console.log('  ' + '─'.repeat(80));
    for (const dd of dirs) {
      const summaryPath = path.join(domainsDir, dd, 'summary.md');
      let lead = '—';
      let summary = '—';
      let l1Count = 0;
      if (fs.existsSync(summaryPath)) {
        const content = fs.readFileSync(summaryPath, 'utf8');
        const fm = parseFrontmatter(content);
        lead = fm.lead || '—';
        const bodyMatch = content.match(/^---[\s\S]*?---\s*\n([\s\S]*)/);
        const body = bodyMatch ? bodyMatch[1].trim() : '';
        summary = body.split('\n')[0] || '—';
      }
      const allFiles = fs.readdirSync(path.join(domainsDir, dd)).filter(f => f.endsWith('.md') && f !== 'summary.md');
      l1Count = allFiles.length;
      console.log('  ' + dd.padEnd(20) + lead.padEnd(16) + String(l1Count).padEnd(10) + summary.slice(0, 50));
    }
    console.log();
    return;
  }

  // ── add ───────────────────────────────────────────────────────────────────
  if (subcommand === 'add') {
    const domainOpts = {};
    for (let i = 3; i < args.length; i++) {
      if (args[i].startsWith('--') && args[i + 1]) {
        domainOpts[args[i].slice(2)] = args[++i];
      }
    }
    const name = domainOpts.name;
    if (!name) {
      console.error('--name is required for domain add');
      process.exit(1);
    }
    const lead = domainOpts.lead || 'Coordinator';
    const summary = domainOpts.summary || `[Describe the ${name} domain in 2-3 sentences. What does it cover? What are the key components?]`;
    const spawnWhen = domainOpts['spawn-when'] || '';
    const contextProvides = domainOpts['context-provides'] || '';

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const domainDir = path.join(domainsDir, slug);

    if (fs.existsSync(domainDir)) {
      console.error(`Domain already exists: ${slug}`);
      console.error(`Use 'sdk-doc domain ${path.relative(process.cwd(), projectDir)} update --name ${slug} ...' to modify it.`);
      process.exit(1);
    }

    fs.mkdirSync(domainDir, { recursive: true });

    const body = `---
lead: "${lead}"
spawn_when: "${spawnWhen}"
context_provides: "${contextProvides}"
---

${summary}
`;

    const outPath = path.join(domainDir, 'summary.md');
    writeFile(outPath, body);
    console.log(`✓ Domain created: ${slug}`);
    console.log(`  Lead: ${lead}`);
    console.log(`  Path: domains/${slug}/summary.md`);
    console.log(`  Next: fill in the summary, then add L1 detail files as domains/${slug}/<topic>.md`);
    return;
  }

  // ── update ────────────────────────────────────────────────────────────────
  if (subcommand === 'update') {
    const domainOpts = {};
    for (let i = 3; i < args.length; i++) {
      if (args[i].startsWith('--') && args[i + 1]) {
        domainOpts[args[i].slice(2)] = args[++i];
      }
    }
    const name = domainOpts.name;
    if (!name) {
      console.error('--name is required for domain update');
      process.exit(1);
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const summaryPath = path.join(domainsDir, slug, 'summary.md');

    if (!fs.existsSync(summaryPath)) {
      console.error(`Domain not found: ${slug}`);
      console.error(`Available domains:`);
      if (fs.existsSync(domainsDir)) {
        fs.readdirSync(domainsDir).filter(d => fs.statSync(path.join(domainsDir, d)).isDirectory()).forEach(d => console.error(`  ${d}`));
      }
      process.exit(1);
    }

    let content = fs.readFileSync(summaryPath, 'utf8');

    // Update frontmatter fields
    if (domainOpts.lead) content = content.replace(/lead:\s*"[^"]*"/, `lead: "${domainOpts.lead}"`);
    if (domainOpts['spawn-when']) content = content.replace(/spawn_when:\s*"[^"]*"/, `spawn_when: "${domainOpts['spawn-when']}"`);
    if (domainOpts['context-provides']) content = content.replace(/context_provides:\s*"[^"]*"/, `context_provides: "${domainOpts['context-provides']}"`);

    // Update body if --summary is provided
    if (domainOpts.summary) {
      content = content.replace(/^---[\s\S]*?---\s*\n[\s\S]*$/, (match) => {
        const fmMatch = match.match(/^---[\s\S]*?---/);
        return fmMatch[0] + '\n\n' + domainOpts.summary + '\n';
      });
    }

    fs.writeFileSync(summaryPath, content, 'utf8');
    console.log(`✓ Domain updated: ${slug}`);
    return;
  }
}

// ─── History Query ───────────────────────────────────────────────────────────

/**
 * cmdHistory — Query structured decisions from history.md.
 *
 * Usage:
 *   sdk-doc history <project-dir>                             # all decisions
 *   sdk-doc history <project-dir> --domain engineering        # filter by domain
 *   sdk-doc history <project-dir> --since 2026-Q1             # filter by date
 *   sdk-doc history <project-dir> --search "auth"             # keyword search
 *   sdk-doc history <project-dir> --reversible false          # irreversible only
 */
function cmdHistory() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const historyPath = path.join(projectDir, 'history.md');

  if (!fs.existsSync(historyPath)) {
    console.error('history.md not found.');
    process.exit(1);
  }

  const content = fs.readFileSync(historyPath, 'utf8');

  // Parse YAML-structured decision entries (HTML comments with structured data)
  const decisionPattern = /### Decision:\s*(.+)\n\n<!--\n([\s\S]*?)-->/g;
  const decisions = [];
  let match;

  while ((match = decisionPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const yamlBlock = match[2];

    const entry = { title };
    for (const line of yamlBlock.split('\n')) {
      const kvMatch = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
      if (kvMatch) {
        entry[kvMatch[1]] = kvMatch[2].trim();
      }
    }
    decisions.push(entry);
  }

  // Also parse old-format entries (table format without YAML)
  const oldPattern = /### Decision:\s*(.+)\n\n\| Field[\s\S]*?\| Date \| (.+?) \|[\s\S]*?\| Made by \| (.+?) \|/g;
  while ((match = oldPattern.exec(content)) !== null) {
    // Check if we already captured this via YAML
    const title = match[1].trim();
    if (!decisions.some(d => d.title === title)) {
      decisions.push({
        title,
        date: match[2].trim(),
        made_by: match[3].trim(),
        domain: 'unknown',
        reversible: 'unknown',
      });
    }
  }

  if (decisions.length === 0) {
    console.log('No structured decisions found in history.md.');
    console.log('Decisions logged with sdk-doc decision include structured metadata.');
    return;
  }

  // Apply filters
  const filterOpts = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1]) {
      filterOpts[args[i].slice(2)] = args[++i];
    }
  }

  let filtered = decisions;

  if (filterOpts.domain) {
    filtered = filtered.filter(d => (d.domain || '').toLowerCase().includes(filterOpts.domain.toLowerCase()));
  }

  if (filterOpts.since) {
    const since = filterOpts.since.replace('Q', '-Q');
    filtered = filtered.filter(d => (d.date || '') >= since.slice(0, 10));
  }

  if (filterOpts.search) {
    const term = filterOpts.search.toLowerCase();
    filtered = filtered.filter(d =>
      (d.title || '').toLowerCase().includes(term) ||
      (d.decision || '').toLowerCase().includes(term) ||
      (d.domain || '').toLowerCase().includes(term)
    );
  }

  if (filterOpts.reversible) {
    filtered = filtered.filter(d => String(d.reversible) === filterOpts.reversible);
  }

  // Output
  console.log(`\nDecisions (${filtered.length}/${decisions.length}):\n`);
  for (const d of filtered) {
    const rev = d.reversible === 'false' ? ' [IRREVERSIBLE]' : '';
    console.log(`  ${d.date || '?'}  ${(d.domain || '?').padEnd(16)}  ${d.title}${rev}`);
    if (d.made_by) console.log(`  ${' '.repeat(10)}${' '.repeat(16)}  by ${d.made_by}`);
  }
  console.log('');
}

// ─── Disagreement Log ────────────────────────────────────────────────────────

/**
 * cmdDisagreement — Open, resolve, or list structured disagreements in history.md.
 *
 * Usage:
 *   sdk-doc disagreement <project-dir> open --topic "..." --position-a "Role: position" --position-b "Role: position"
 *   sdk-doc disagreement <project-dir> resolve --id DISAGREE-NNN --decision "..." --decided-by Role --reasoning "..."
 *   sdk-doc disagreement <project-dir> list
 */
function cmdDisagreement() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const subcommand = args[2]; // open | resolve | list
  const historyPath = path.join(projectDir, 'history.md');

  if (!subcommand || !['open', 'resolve', 'list'].includes(subcommand)) {
    console.error(`Usage:
  sdk-doc disagreement <project-dir> open --topic "..." --position-a "Role: position" --position-b "Role: position"
  sdk-doc disagreement <project-dir> resolve --id DISAGREE-NNN --decision "..." --decided-by Role --reasoning "..."
  sdk-doc disagreement <project-dir> list`);
    process.exit(1);
  }

  const opts = {};
  for (let i = 3; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1]) {
      opts[args[i].slice(2)] = args[++i];
    }
  }

  if (subcommand === 'open') {
    const topic     = opts.topic;
    const posA      = opts['position-a'];
    const posB      = opts['position-b'];

    if (!topic || !posA || !posB) {
      console.error('Error: --topic, --position-a, and --position-b are required.');
      process.exit(1);
    }

    // Parse "Role: position" format
    const parsePosition = (pos) => {
      const colonIdx = pos.indexOf(':');
      if (colonIdx === -1) return { role: 'Unknown', position: pos.trim() };
      return { role: pos.slice(0, colonIdx).trim(), position: pos.slice(colonIdx + 1).trim() };
    };

    const a = parsePosition(posA);
    const b = parsePosition(posB);

    // Generate ID
    let nextId = 1;
    if (fs.existsSync(historyPath)) {
      const content = fs.readFileSync(historyPath, 'utf8');
      const matches = content.match(/DISAGREE-(\d+)/g);
      if (matches) {
        const ids = matches.map(m => parseInt(m.replace('DISAGREE-', '')));
        nextId = Math.max(...ids) + 1;
      }
    }

    const id = `DISAGREE-${String(nextId).padStart(3, '0')}`;
    const date = new Date().toISOString().slice(0, 10);

    const entry = `
---

### [${id}] ${topic}
Date opened: ${date}
Date resolved: —
Status: OPEN

**Positions:**

| Agent | Position | Key tradeoff |
|-------|----------|-------------|
| ${a.role} | ${a.position} | |
| ${b.role} | ${b.position} | |

**Resolution:** Pending
**Decided by:** —
**Reasoning:** —
**Dissent on record:** —
`;

    if (!fs.existsSync(historyPath)) {
      fs.writeFileSync(historyPath, `# History\n${entry}`, 'utf8');
    } else {
      fs.appendFileSync(historyPath, entry, 'utf8');
    }

    console.log(`✓ Disagreement opened: ${id} — ${topic}`);
    console.log(`  Positions: ${a.role} vs ${b.role}`);
    console.log(`  Status: OPEN (surfaces in sdk-status)`);
    return;
  }

  if (subcommand === 'resolve') {
    const id        = opts.id;
    const decision  = opts.decision;
    const decidedBy = opts['decided-by'];
    const reasoning = opts.reasoning || '';
    const dissent   = opts.dissent || 'None';

    if (!id || !decision || !decidedBy) {
      console.error('Error: --id, --decision, and --decided-by are required.');
      process.exit(1);
    }

    if (!fs.existsSync(historyPath)) {
      console.error('Error: history.md not found.');
      process.exit(1);
    }

    let content = fs.readFileSync(historyPath, 'utf8');
    const date = new Date().toISOString().slice(0, 10);

    // Find the disagreement entry and update it
    const pattern = new RegExp(`(### \\[${id}\\][\\s\\S]*?)Status: OPEN`, 'i');
    if (!pattern.test(content)) {
      console.error(`Error: ${id} not found or not OPEN.`);
      process.exit(1);
    }

    content = content.replace(pattern, `$1Status: RESOLVED`);
    content = content.replace(
      new RegExp(`(### \\[${id}\\][\\s\\S]*?)Date resolved: —`),
      `$1Date resolved: ${date}`
    );
    content = content.replace(
      new RegExp(`(### \\[${id}\\][\\s\\S]*?)\\*\\*Resolution:\\*\\* Pending`),
      `$1**Resolution:** ${decision}`
    );
    content = content.replace(
      new RegExp(`(### \\[${id}\\][\\s\\S]*?)\\*\\*Decided by:\\*\\* —`),
      `$1**Decided by:** ${decidedBy}`
    );
    content = content.replace(
      new RegExp(`(### \\[${id}\\][\\s\\S]*?)\\*\\*Reasoning:\\*\\* —`),
      `$1**Reasoning:** ${reasoning}`
    );
    content = content.replace(
      new RegExp(`(### \\[${id}\\][\\s\\S]*?)\\*\\*Dissent on record:\\*\\* —`),
      `$1**Dissent on record:** ${dissent}`
    );

    fs.writeFileSync(historyPath, content, 'utf8');
    console.log(`✓ Disagreement resolved: ${id}`);
    console.log(`  Decision: ${decision}`);
    console.log(`  Decided by: ${decidedBy}`);
    if (dissent !== 'None') console.log(`  Dissent: ${dissent}`);
    return;
  }

  if (subcommand === 'list') {
    if (!fs.existsSync(historyPath)) {
      console.log('No history.md found. No disagreements recorded.');
      return;
    }

    const content = fs.readFileSync(historyPath, 'utf8');
    const entries = content.match(/### \[DISAGREE-\d+\][^\n]*/g);

    if (!entries || entries.length === 0) {
      console.log('No disagreements recorded.');
      return;
    }

    console.log(`\nDisagreements (${entries.length}):\n`);
    for (const entry of entries) {
      const idMatch = entry.match(/\[(DISAGREE-\d+)\]/);
      const topic = entry.replace(/### \[DISAGREE-\d+\]\s*/, '').trim();
      const id = idMatch ? idMatch[1] : '?';

      // Find status
      const fullEntry = content.match(new RegExp(`### \\[${id}\\][\\s\\S]*?Status:\\s*(\\w+)`, 'i'));
      const status = fullEntry ? fullEntry[1] : 'UNKNOWN';
      const statusIcon = status === 'OPEN' ? '!' : '-';

      console.log(`  ${statusIcon} ${id}  ${status.padEnd(10)}  ${topic}`);
    }
    console.log('');
    return;
  }
}

// ─── Iteration loops (protocol Section 31) ──────────────────────────────────

const VALID_LOOPS = ['discovery', 'architecture', 'implementation'];
const VALID_STATUSES = ['draft', 'in-review', 'rework', 'graduated'];

const LOOP_EXIT_CRITERIA = {
  discovery: [
    'Problem statement is falsifiable (can be proven wrong with evidence)',
    'Target user is specific enough to exclude someone',
    'Regulatory constraints are mapped with confidence levels (HIGH/MED/LOW)',
    'At least one core assumption has been tested, not just stated',
    'Non-goals are explicit and reasoned (not deferred — excluded with rationale)',
    'The brief could survive a FRAMING-CHALLENGE without collapsing',
  ],
  architecture: [
    'Architecture serves at 10x current scale without fundamental redesign',
    'Every irreversible decision has a named alternative and documented rejection reason',
    'Interface contracts are complete enough for independent pod execution',
    'Make/buy/partner decisions have cost projections beyond year 1',
    'Security model satisfies CISO non-negotiables (not deferred)',
    'The design traces back to the graduated Discovery output (not a drifted version)',
  ],
  implementation: [
    'Deliverables match the spec from the graduated Architecture output',
    'No security shortcuts taken (auth, data handling, secrets management)',
    'Code is maintainable by a team that did not write it',
    'Edge cases from the pre-mortem are handled or explicitly deferred with reason',
    'Instrumentation covers the friction points PM identified',
    'The output creates user capability, not dependency (Constraint 1 check)',
  ],
};

function cmdIteration() {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const subcommand = args[2]; // create | review | list | graduate

  if (!subcommand || !['create', 'review', 'list', 'graduate'].includes(subcommand)) {
    console.error('Usage: sdk-doc iteration <project-dir> create|review|list|graduate [options]');
    console.error('\n  create    --loop <type> [--pod <name>] [--guardian <name>]');
    console.error('  review    --loop <type> --cycle <N> [--pod <name>] --verdict graduate|iterate --feedback "..."');
    console.error('  list      [--loop <type>] [--status <status>]');
    console.error('  graduate  --loop <type> --cycle <N> [--pod <name>]');
    process.exit(1);
  }

  const iterOpts = {};
  for (let i = 3; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1]) {
      iterOpts[args[i].slice(2)] = args[++i];
    }
  }

  // ── list ──
  if (subcommand === 'list') {
    const loopFilter = iterOpts.loop;
    const statusFilter = iterOpts.status;
    const iterDir = path.join(projectDir, 'iterations');
    if (!fs.existsSync(iterDir)) {
      console.log('No iterations directory found.');
      return;
    }

    const loops = loopFilter ? [loopFilter] : VALID_LOOPS;
    let found = false;

    console.log('\n  Iteration Loops\n');
    console.log('  ' + 'Loop'.padEnd(18) + 'Cycle'.padEnd(8) + 'Status'.padEnd(14) + 'Guardian'.padEnd(22) + 'Pod');
    console.log('  ' + '\u2500'.repeat(72));

    for (const loop of loops) {
      const loopDir = path.join(iterDir, loop);
      if (!fs.existsSync(loopDir)) continue;

      // For implementation, scan pod subdirs
      const entries = fs.readdirSync(loopDir);
      const mdFiles = entries.filter(f => f.endsWith('.md'));
      const subdirs = entries.filter(f => fs.statSync(path.join(loopDir, f)).isDirectory());

      for (const file of mdFiles) {
        const content = fs.readFileSync(path.join(loopDir, file), 'utf8');
        const fm = parseFrontmatter(content);
        if (statusFilter && fm.status !== statusFilter) continue;
        found = true;
        const cycle = fm.cycle || file.replace('iter-', '').replace('.md', '');
        console.log('  ' + loop.padEnd(18) + String(cycle).padEnd(8) + (fm.status || 'draft').padEnd(14) + (fm.guardian || '\u2014').padEnd(22) + (fm.pod || '\u2014'));
      }

      for (const sub of subdirs) {
        const podDir = path.join(loopDir, sub);
        const podFiles = fs.readdirSync(podDir).filter(f => f.endsWith('.md'));
        for (const file of podFiles) {
          const content = fs.readFileSync(path.join(podDir, file), 'utf8');
          const fm = parseFrontmatter(content);
          if (statusFilter && fm.status !== statusFilter) continue;
          found = true;
          const cycle = fm.cycle || file.replace('iter-', '').replace('.md', '');
          console.log('  ' + loop.padEnd(18) + String(cycle).padEnd(8) + (fm.status || 'draft').padEnd(14) + (fm.guardian || '\u2014').padEnd(22) + (fm.pod || sub));
        }
      }
    }

    if (!found) console.log('  No iterations found.');
    console.log('');
    return;
  }

  // ── create ──
  if (subcommand === 'create') {
    const loop = iterOpts.loop;
    const pod = iterOpts.pod;
    const guardian = iterOpts.guardian || 'unassigned';

    if (!loop || !VALID_LOOPS.includes(loop)) {
      console.error(`--loop is required. Valid: ${VALID_LOOPS.join(', ')}`);
      process.exit(1);
    }
    if (loop === 'implementation' && !pod) {
      console.error('--pod is required for implementation loop iterations');
      process.exit(1);
    }

    const loopDir = pod
      ? path.join(projectDir, 'iterations', loop, pod.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      : path.join(projectDir, 'iterations', loop);
    fs.mkdirSync(loopDir, { recursive: true });

    // Find next cycle number
    const existing = fs.existsSync(loopDir)
      ? fs.readdirSync(loopDir).filter(f => f.match(/^iter-\d+\.md$/))
      : [];
    const maxCycle = existing.reduce((max, f) => {
      const n = parseInt(f.replace('iter-', '').replace('.md', ''), 10);
      return n > max ? n : max;
    }, 0);
    const cycle = maxCycle + 1;
    const filename = `iter-${String(cycle).padStart(3, '0')}.md`;
    const today = new Date().toISOString().slice(0, 10);

    const criteria = LOOP_EXIT_CRITERIA[loop];
    const criteriaBlock = criteria.map(c => `- [ ] ${c}`).join('\n');

    const content = `---
loop: "${loop}"
cycle: ${cycle}
${pod ? `pod: "${pod}"\n` : ''}guardian: "${guardian}"
status: "draft"
created: "${today}"
graduated: ""
---

## Input

[What the team produced this cycle]

## Guardian Review

[Guardian's assessment \u2014 filled during review]

## Exit Criteria

${criteriaBlock}

## Verdict

[GRADUATE | ITERATE \u2014 reason]

## Feedback

[Specific items to address in next cycle, if ITERATE]
`;

    const destPath = path.join(loopDir, filename);
    if (dryRun) {
      console.log(`[DRY RUN] Would create: ${destPath}`);
      console.log(content);
      return;
    }
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`\u2713  Created iteration: ${path.relative(process.cwd(), destPath)}`);
    console.log(`   Loop: ${loop} | Cycle: ${cycle} | Guardian: ${guardian}${pod ? ' | Pod: ' + pod : ''}`);
    return;
  }

  // ── review ──
  if (subcommand === 'review') {
    const loop = iterOpts.loop;
    const cycle = parseInt(iterOpts.cycle, 10);
    const pod = iterOpts.pod;
    const verdict = iterOpts.verdict;
    const feedback = iterOpts.feedback || '';

    if (!loop || !VALID_LOOPS.includes(loop)) {
      console.error(`--loop is required. Valid: ${VALID_LOOPS.join(', ')}`);
      process.exit(1);
    }
    if (!cycle || isNaN(cycle)) {
      console.error('--cycle <N> is required');
      process.exit(1);
    }
    if (!verdict || !['graduate', 'iterate'].includes(verdict)) {
      console.error('--verdict graduate|iterate is required');
      process.exit(1);
    }

    const loopDir = pod
      ? path.join(projectDir, 'iterations', loop, pod.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      : path.join(projectDir, 'iterations', loop);
    const filename = `iter-${String(cycle).padStart(3, '0')}.md`;
    const iterPath = path.join(loopDir, filename);

    if (!fs.existsSync(iterPath)) {
      console.error(`Iteration file not found: ${iterPath}`);
      process.exit(1);
    }

    let content = fs.readFileSync(iterPath, 'utf8');
    const today = new Date().toISOString().slice(0, 10);

    // Update status in frontmatter
    const newStatus = verdict === 'graduate' ? 'graduated' : 'rework';
    content = content.replace(/^status:\s*"[^"]*"/m, `status: "${newStatus}"`);
    if (verdict === 'graduate') {
      content = content.replace(/^graduated:\s*"[^"]*"/m, `graduated: "${today}"`);
    }

    // Update verdict section
    const verdictText = verdict === 'graduate'
      ? `GRADUATE \u2014 All exit criteria passed. Output ready for canonical docs.`
      : `ITERATE \u2014 ${feedback}`;
    content = content.replace(
      /## Verdict\n\n\[GRADUATE \| ITERATE .+\]/,
      `## Verdict\n\n${verdictText}`
    );

    // Update feedback section if iterating
    if (verdict === 'iterate' && feedback) {
      content = content.replace(
        /## Feedback\n\n\[Specific items.+\]/,
        `## Feedback\n\n- ${feedback}`
      );
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would update: ${iterPath}`);
      console.log(content);
      return;
    }

    fs.writeFileSync(iterPath, content, 'utf8');
    const icon = verdict === 'graduate' ? '\u2713' : '\u21bb';
    console.log(`${icon}  Iteration reviewed: ${path.relative(process.cwd(), iterPath)}`);
    console.log(`   Verdict: ${verdict.toUpperCase()}${feedback ? ' \u2014 ' + feedback : ''}`);
    return;
  }

  // ── graduate ──
  if (subcommand === 'graduate') {
    const loop = iterOpts.loop;
    const cycle = parseInt(iterOpts.cycle, 10);
    const pod = iterOpts.pod;

    if (!loop || !VALID_LOOPS.includes(loop)) {
      console.error(`--loop is required. Valid: ${VALID_LOOPS.join(', ')}`);
      process.exit(1);
    }
    if (!cycle || isNaN(cycle)) {
      console.error('--cycle <N> is required');
      process.exit(1);
    }

    const loopDir = pod
      ? path.join(projectDir, 'iterations', loop, pod.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      : path.join(projectDir, 'iterations', loop);
    const filename = `iter-${String(cycle).padStart(3, '0')}.md`;
    const iterPath = path.join(loopDir, filename);

    if (!fs.existsSync(iterPath)) {
      console.error(`Iteration file not found: ${iterPath}`);
      process.exit(1);
    }

    let content = fs.readFileSync(iterPath, 'utf8');
    const today = new Date().toISOString().slice(0, 10);

    content = content.replace(/^status:\s*"[^"]*"/m, `status: "graduated"`);
    content = content.replace(/^graduated:\s*"[^"]*"/m, `graduated: "${today}"`);

    if (dryRun) {
      console.log(`[DRY RUN] Would graduate: ${iterPath}`);
      return;
    }

    fs.writeFileSync(iterPath, content, 'utf8');
    console.log(`\u2713  Iteration graduated: ${path.relative(process.cwd(), iterPath)}`);
    console.log(`   Loop: ${loop} | Cycle: ${cycle} | Graduated: ${today}`);
    console.log(`   Next: Coordinator triggers canonical doc flow (protocol.md Section 31.4)`);
    return;
  }
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
  case 'study':    cmdStudy();    break;
  case 'session':  cmdSession();  break;
  case 'domain':   cmdDomain();   break;
  case 'bus':      cmdBus();      break;
  case 'cockpit':    cmdCockpit();    break;
  case 'discovery':  cmdDiscovery();  break;
  case 'disagreement': cmdDisagreement(); break;
  case 'history':      cmdHistory();      break;
  case 'iteration':    cmdIteration();    break;
  default:
    console.error(`Unknown command: "${command}"`);
    printHelp();
    process.exit(1);
}
