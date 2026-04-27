'use strict';

const fs = require('fs');
const path = require('path');
const { writeFile } = require('../lib/doc-utils');
const { parseFrontmatter } = require('../lib/frontmatter');

/**
 * cmdDomain — Add, list, or update project domains.
 */
module.exports = function cmdDomain({ args, filePath, dryRun }) {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const domainsDir = path.join(projectDir, 'domains');
  const subcommand = args[2]; // add | list | update

  if (!subcommand || !['add', 'list', 'update'].includes(subcommand)) {
    console.error('Usage: sdk-doc domain <project-dir> add --name <name> --lead <role> [--summary "..."] | list | update --name <name> [--lead, --summary, --spawn-when, --context-provides]');
    process.exit(1);
  }

  // -- list --
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
    console.log('  ' + '\u2500'.repeat(80));
    for (const dd of dirs) {
      const summaryPath = path.join(domainsDir, dd, 'summary.md');
      let lead = '\u2014';
      let summary = '\u2014';
      let l1Count = 0;
      if (fs.existsSync(summaryPath)) {
        const content = fs.readFileSync(summaryPath, 'utf8');
        const fm = parseFrontmatter(content);
        lead = fm.lead || '\u2014';
        const bodyMatch = content.match(/^---[\s\S]*?---\s*\n([\s\S]*)/);
        const body = bodyMatch ? bodyMatch[1].trim() : '';
        summary = body.split('\n')[0] || '\u2014';
      }
      const allFiles = fs.readdirSync(path.join(domainsDir, dd)).filter(f => f.endsWith('.md') && f !== 'summary.md');
      l1Count = allFiles.length;
      console.log('  ' + dd.padEnd(20) + lead.padEnd(16) + String(l1Count).padEnd(10) + summary.slice(0, 50));
    }
    console.log();
    return;
  }

  // -- add --
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
    writeFile(outPath, body, dryRun);
    console.log(`\u2713 Domain created: ${slug}`);
    console.log(`  Lead: ${lead}`);
    console.log(`  Path: domains/${slug}/summary.md`);
    console.log(`  Next: fill in the summary, then add L1 detail files as domains/${slug}/<topic>.md`);
    return;
  }

  // -- update --
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
    console.log(`\u2713 Domain updated: ${slug}`);
    return;
  }
};
