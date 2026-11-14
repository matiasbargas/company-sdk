'use strict';

const fs = require('fs');
const path = require('path');

/**
 * cmdDisagreement — Open, resolve, or list structured disagreements in history.md.
 */
module.exports = function cmdDisagreement({ args, filePath, dryRun }) {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const subcommand = args[2]; // open | resolve | list
  const historyPath = path.join(projectDir, 'history.md');

  if (!subcommand || !['open', 'resolve', 'list'].includes(subcommand)) {
    console.error(`Usage:
  sdk-doc disagreement <project-dir> open --topic "..." --positions "A:...,B:..."
  sdk-doc disagreement <project-dir> open --topic "..." --position-a "Role: position" --position-b "Role: position"
  sdk-doc disagreement <project-dir> resolve --id DISAGREE-NNN --decision "..." --decided-by Role --reasoning "..."
  sdk-doc disagreement <project-dir> list`);
    process.exit(1);
  }

  const opts = {};
  for (let i = 3; i < args.length; i++) {
    if (args[i] === '--dry-run') continue;
    if (args[i].startsWith('--') && args[i + 1]) {
      opts[args[i].slice(2)] = args[++i];
    }
  }

  if (subcommand === 'open') {
    const topic     = opts.topic;
    let posA        = opts['position-a'];
    let posB        = opts['position-b'];

    // --positions "A:...,B:..." (the documented form): split on a comma that starts a new "Role:".
    if (opts.positions && !posA && !posB) {
      const parts = opts.positions.split(/,(?=\s*[^,:]+:)/).map(p => p.trim()).filter(Boolean);
      if (parts.length !== 2) {
        console.error('Error: --positions must hold exactly two "Role: position" entries, e.g. "CFO: raise,CRO: hold".');
        process.exit(1);
      }
      [posA, posB] = parts;
    }

    if (!topic || !posA || !posB) {
      console.error('Error: --topic and --positions "A:...,B:..." (or --position-a and --position-b) are required.');
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
Date resolved: \u2014
Status: OPEN

**Positions:**

| Agent | Position | Key tradeoff |
|-------|----------|-------------|
| ${a.role} | ${a.position} | |
| ${b.role} | ${b.position} | |

**Resolution:** Pending
**Decided by:** \u2014
**Reasoning:** \u2014
**Dissent on record:** \u2014
`;

    if (dryRun) {
      console.log(`\nDRY RUN \u2014 no files modified`);
      console.log(`  Would append ${id} to: ${historyPath}`);
      return;
    } else if (!fs.existsSync(historyPath)) {
      fs.writeFileSync(historyPath, `# History\n${entry}`, 'utf8');
    } else {
      fs.appendFileSync(historyPath, entry, 'utf8');
    }

    console.log(`\u2713 Disagreement opened: ${id} \u2014 ${topic}`);
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

    // Locate exactly this entry's block (heading up to the next "### " heading or "---" rule).
    // Edits are confined to the block so a resolved id can never touch another entry.
    const escId = String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const headRe = new RegExp(`^### \\[${escId}\\][^\\n]*$`, 'im');
    const head = headRe.exec(content);
    let blockEnd = -1;
    if (head) {
      const rest = content.slice(head.index + head[0].length);
      const next = rest.search(/\n(?:### |---\s*(?:\n|$))/);
      blockEnd = next === -1 ? content.length : head.index + head[0].length + next;
    }
    const block = head ? content.slice(head.index, blockEnd) : '';
    if (!head || !/^Status: OPEN\s*$/m.test(block)) {
      console.error(`Error: ${id} not found or not OPEN.`);
      process.exit(1);
    }

    const newBlock = block
      .replace(/^Status: OPEN\s*$/m, 'Status: RESOLVED')
      .replace('Date resolved: \u2014', () => `Date resolved: ${date}`)
      .replace('**Resolution:** Pending', () => `**Resolution:** ${decision}`)
      .replace('**Decided by:** \u2014', () => `**Decided by:** ${decidedBy}`)
      .replace('**Reasoning:** \u2014', () => `**Reasoning:** ${reasoning}`)
      .replace('**Dissent on record:** \u2014', () => `**Dissent on record:** ${dissent}`);
    content = content.slice(0, head.index) + newBlock + content.slice(blockEnd);

    if (dryRun) {
      console.log(`\nDRY RUN \u2014 no files modified`);
      console.log(`  Would resolve ${id} in: ${historyPath}`);
      return;
    }

    fs.writeFileSync(historyPath, content, 'utf8');
    console.log(`\u2713 Disagreement resolved: ${id}`);
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
};
