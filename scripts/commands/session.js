'use strict';

const fs = require('fs');
const path = require('path');
const { writeFile } = require('../lib/doc-utils');
const { parseFrontmatter } = require('../lib/frontmatter');

/**
 * cmdSession — Save, list, promote, or clean session memory files.
 */
module.exports = function cmdSession({ args, filePath, dryRun }) {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const tempDir = path.join(projectDir, 'sessions', 'temp');
  const permDir = path.join(projectDir, 'sessions', 'permanent');
  const subcommand = args[2]; // save | list | promote | clean

  if (!subcommand || !['save', 'list', 'promote', 'clean'].includes(subcommand)) {
    console.error('Usage: sdk-doc session <project-dir> save --title "..." | list | promote <file> | clean --confirm');
    process.exit(1);
  }

  // -- save --
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

- [Decision or option discussed \u2014 not necessarily committed to history.md]

## Context Surfaced

- [Important context that came up \u2014 links to files, external references, domain knowledge]

## Key Takeaways

1. [Actionable insight or conclusion]

## Open Threads

- [Anything left unresolved that a future session should pick up]

---

*Session saved by ${savedBy} on ${today}. Status: temp*
`;

    const outPath = path.join(tempDir, filename);
    writeFile(outPath, body, dryRun);
    console.log(`\u2713 Session saved: ${path.relative(process.cwd(), outPath)}`);
    console.log(`  Title: ${title}`);
    console.log(`  Status: temp \u2014 promote with: sdk-doc session ${path.relative(process.cwd(), projectDir)} promote ${filename}`);
    return;
  }

  // -- list --
  if (subcommand === 'list') {
    const statusFilter = args.find(a => a === '--status') ? args[args.indexOf('--status') + 1] : 'all';
    const dirs = [];
    if (statusFilter === 'all' || statusFilter === 'temp') dirs.push({ dir: tempDir, status: 'temp' });
    if (statusFilter === 'all' || statusFilter === 'permanent') dirs.push({ dir: permDir, status: 'permanent' });

    let total = 0;
    console.log(`\n  Sessions (${statusFilter})\n`);
    console.log('  ' + 'Date'.padEnd(12) + 'Status'.padEnd(12) + 'Domains'.padEnd(24) + 'Title');
    console.log('  ' + '\u2500'.repeat(72));

    for (const { dir, status } of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse();
      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        const fm = parseFrontmatter(content);
        const date = fm.date || file.slice(0, 10);
        const domains = fm.domains || '\u2014';
        const title = fm.title || file.replace(/\.md$/, '');
        console.log('  ' + date.padEnd(12) + status.padEnd(12) + domains.slice(0, 22).padEnd(24) + title);
        total++;
      }
    }

    if (total === 0) console.log('  (none)');
    console.log();
    return;
  }

  // -- promote --
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
    console.log(`\u2713 Session promoted: ${filename}`);
    console.log(`  Moved: sessions/temp/ \u2192 sessions/permanent/`);
    console.log(`  Now indexed in context-index.json (run: sdk-doc index ${path.relative(process.cwd(), projectDir)})`);
    return;
  }

  // -- clean --
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
    console.log(`\n\u2713 Deleted ${files.length} temp session(s).`);
  }
};
