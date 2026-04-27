'use strict';

const fs = require('fs');
const path = require('path');
const { writeFile } = require('../lib/doc-utils');
const { parseFrontmatter } = require('../lib/frontmatter');

/**
 * cmdStudy — Create or list scientific study files in research/studies/.
 */
module.exports = function cmdStudy({ args, filePath, dryRun }) {
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
    console.log('  ' + '\u2500'.repeat(60));
    for (const file of files) {
      const content = fs.readFileSync(path.join(studiesDir, file), 'utf8');
      const fm = parseFrontmatter(content);
      const date = fm.date || file.slice(0, 10);
      const confidence = fm.confidence || '\u2014';
      const status = fm.status || '\u2014';
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

1. [Observation \u2014 behavioral, not interpretive]
2. [Observation]
3. [Observation]

### Patterns (appeared in 3+ sessions)

- [Pattern + frequency]

## Findings

[What the data means. First-principles analysis. Connect observations to causes.]

### Confirmed

- [Hypothesis element confirmed \u2014 evidence]

### Refuted

- [Hypothesis element refuted \u2014 evidence]

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
  writeFile(outPath, body, dryRun);
  console.log(`\u2713 Study created: ${path.relative(process.cwd(), outPath)}`);
  console.log(`  Title: ${title}`);
  console.log(`  Requested by: ${requestedBy}`);
  console.log(`  Next: fill in Hypothesis and Method, then execute the study.`);
};
