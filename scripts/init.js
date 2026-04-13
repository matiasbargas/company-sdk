#!/usr/bin/env node

/**
 * init.js — Create a new team-sdk project, init Claude project, and prime idea.md
 *
 * Usage:
 *   node scripts/init.js <project-name> [--output <dir>] [--squad <type>] [--type <type>] [--idea "your idea"] [--source <file>]
 *
 * Options:
 *   --output <dir>    Output directory (default: ../projects/<project-name>)
 *   --squad <type>    website | mvp | feature | startup  (default: startup)
 *   --type <type>     Project type config from team/types/ (default: product)
 *   --idea "..."      Drop your raw idea directly — skips the placeholder in idea.md
 *   --source <file>   Path to a vision doc (PDF, markdown, text) — copied into project as source material
 *   --no-git          Skip git init + initial commit
 *
 * What it does:
 *   1. Scaffolds project from project-template/ with all team folders and docs
 *   2. Creates .claude/settings.json to register it as a Claude Code project
 *   3. Pre-fills current-status.md with Day 0 state (ready for Greg)
 *   4. If --idea is given, writes it into idea.md Section 1 immediately
 *   5. If --source is given, copies the file into the project root as reference material
 *   6. Seeds history.md with Project Start entry
 *   7. Generates context-manifest.json and context-index.json
 *   8. Initializes git repo with initial commit (unless --no-git)
 *   9. Prints the exact prompt to paste to Greg when you're ready
 */

const fs   = require('fs');
const path = require('path');
const { printNextStub } = require('./lib/next-stub');

// ─── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  node scripts/init.js <project-name> [--output <dir>] [--squad <type>] [--type <type>] [--idea "..."]

Options:
  --output <dir>    Output directory (default: ../projects/<project-name>)
  --squad <type>    website | mvp | feature | startup  (default: startup)
  --type <type>     Project type from team/types/ (default: product)
  --idea "..."      Seed idea.md Section 1 with your raw idea text

Examples:
  node scripts/init.js my-saas --squad mvp
  node scripts/init.js landing-page --squad website --output ~/projects/landing
  node scripts/init.js fintech-tool --idea "A tool that helps solo founders track burn rate in real time"
  node scripts/init.js api-service --type api --squad mvp
  node scripts/init.js nu-chain --squad startup --source ~/Downloads/vision.pdf
`);
  process.exit(0);
}

const projectName = args[0];
let outputDir   = null;
let squadType   = 'startup';
let projectType = 'product';
let seedIdea    = null;
let sourceFile  = null;
let skipGit     = false;

for (let i = 1; i < args.length; i++) {
  if      (args[i] === '--output'  && args[i + 1]) outputDir   = args[++i];
  else if (args[i] === '--squad'   && args[i + 1]) squadType   = args[++i];
  else if (args[i] === '--type'    && args[i + 1]) projectType = args[++i];
  else if (args[i] === '--idea'    && args[i + 1]) seedIdea    = args[++i];
  else if (args[i] === '--source'  && args[i + 1]) sourceFile  = args[++i];
  else if (args[i] === '--no-git')                 skipGit     = true;
}

const VALID_SQUADS = ['website', 'mvp', 'feature', 'startup'];
if (!VALID_SQUADS.includes(squadType)) {
  console.error(`Invalid squad type: "${squadType}". Valid: ${VALID_SQUADS.join(', ')}`);
  process.exit(1);
}

// Validate --source file exists
if (sourceFile) {
  sourceFile = path.resolve(sourceFile);
  if (!fs.existsSync(sourceFile)) {
    console.error(`Source file not found: ${sourceFile}`);
    process.exit(1);
  }
}

const sdkRoot    = path.resolve(__dirname, '..');
const templateDir = path.join(sdkRoot, 'project-template');
const squadsDir   = path.join(sdkRoot, 'team/squads');
const typesDir    = path.join(sdkRoot, 'team/types');

// ─── Load type config ─────────────────────────────────────────────────────────

function loadTypeConfig(typeName) {
  const typePath = path.join(typesDir, `${typeName}.json`);
  if (!fs.existsSync(typePath)) {
    const available = fs.existsSync(typesDir)
      ? fs.readdirSync(typesDir)
          .filter(f => f.endsWith('.json') && !f.startsWith('_'))
          .map(f => f.replace('.json', ''))
      : [];
    console.error(`Unknown project type: "${typeName}".`);
    if (available.length > 0) {
      console.error(`Available types: ${available.join(', ')}`);
    } else {
      console.error(`No type configs found in ${typesDir}`);
    }
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(typePath, 'utf8'));
  } catch (e) {
    console.error(`Failed to parse type config ${typePath}: ${e.message}`);
    process.exit(1);
  }
}

const typeConfig = loadTypeConfig(projectType);

// Requirements file name mapping
const REQUIREMENTS_MAP = {
  discovery:   'discovery-requirements.md',
  security:    'security-requirements.md',
  engineering: 'engineering-requirements.md',
  product:     'product-requirements.md',
  design:      'design-requirements.md',
  business:    'business-requirements.md',
  general:     'general-requirements.md',
};

// Log file name mapping
const LOGS_MAP = {
  engineering: 'engineering-log.md',
  product:     'product-log.md',
  design:      'design-log.md',
  operations:  'operations-log.md',
  people:      'people-log.md',
  strategy:    'strategy-log.md',
};

// Always-copied files (not controlled by type config)
const ALWAYS_COPY = new Set([
  'idea.md', 'current-status.md', 'history.md', 'project-map.md',
  'CLAUDE.md', 'DISCLAIMER.md', 'context-manifest.json', '.gitignore',
  'team.md', 'project.md',
]);

const activeRequirementsFiles = new Set(
  (typeConfig.requirements_files || Object.keys(REQUIREMENTS_MAP))
    .map(k => REQUIREMENTS_MAP[k])
    .filter(Boolean)
);

const activeLogFiles = new Set(
  (typeConfig.logs || Object.keys(LOGS_MAP))
    .map(k => LOGS_MAP[k])
    .filter(Boolean)
);

outputDir = outputDir
  ? path.resolve(outputDir)
  : path.resolve(sdkRoot, '..', 'projects', projectName);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function replacePlaceholders(content, vars) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{{${key}}}`).join(value);
    result = result.split(`[${key}]`).join(value);
  }
  return result;
}

function copyAndProcess(src, dest, vars) {
  const content   = fs.readFileSync(src, 'utf8');
  const processed = replacePlaceholders(content, vars);
  fs.writeFileSync(dest, processed, 'utf8');
}

// ─── Date / release ──────────────────────────────────────────────────────────

const now       = new Date();
const year      = now.getFullYear();
const quarter   = Math.ceil((now.getMonth() + 1) / 3);
const releaseId = `v${year}.Q${quarter}.1`;
const dateStr   = now.toISOString().split('T')[0];
const timeStr   = now.toISOString().replace('T', ' ').slice(0, 16);

// Build domain context block for CLAUDE.md
let domainContext = `*No source document provided. Fill this section with project-specific context after Discovery.*\n\n*To populate automatically, re-run init with --source <vision-doc>.*`;

if (sourceFile) {
  const sourceBasename = path.basename(sourceFile);
  domainContext = `**Source document:** \`${sourceBasename}\` — read this for full project context.\n\nThis project was initialized from a vision document. The source file is included in the project root. During Discovery, Greg and the team will extract domain-specific operating rules, non-negotiables, and technical constraints from it into this section.`;
}

if (seedIdea) {
  domainContext = `**Idea:** ${seedIdea}\n\nThis project was initialized with a seed idea. During Discovery, Greg and the team will expand this into domain-specific operating rules, non-negotiables, and technical constraints.`;
}

const vars = {
  'PROJECT NAME': projectName,
  PROJECT_NAME:   projectName,
  PROJECT_DIR:    outputDir,
  RELEASE:        releaseId,
  DATE:           dateStr,
  'YYYY-MM-DD HH:MM': timeStr,
  YEAR:           String(year),
  SQUAD:          squadType,
  COMPANY:        projectName,
  DOMAIN_CONTEXT: domainContext,
};

// ─── Pre-flight ───────────────────────────────────────────────────────────────

if (!fs.existsSync(templateDir)) {
  console.error(`Template directory not found: ${templateDir}`);
  process.exit(1);
}

if (fs.existsSync(outputDir)) {
  console.error(`Directory already exists: ${outputDir}`);
  console.error('Remove it first or choose a different --output path.');
  process.exit(1);
}

// ─── 1. Scaffold project files ───────────────────────────────────────────────

console.log(`\n🚀  Initialising project: ${projectName}`);
console.log(`    Squad:   ${squadType}`);
console.log(`    Type:    ${typeConfig.type} (${typeConfig.name})`);
console.log(`    Output:  ${outputDir}`);
console.log(`    Release: ${releaseId}\n`);

ensureDir(outputDir);

const templateFiles = fs.readdirSync(templateDir);
let count = 0;

// Determine all requirements and log filenames for quick lookup
const allRequirementsFiles = new Set(Object.values(REQUIREMENTS_MAP));
const allLogFiles          = new Set(Object.values(LOGS_MAP));

for (const file of templateFiles) {
  const src  = path.join(templateDir, file);
  const dest = path.join(outputDir, file);
  if (!fs.statSync(src).isFile()) continue;

  // Always-copied files
  if (ALWAYS_COPY.has(file)) {
    copyAndProcess(src, dest, vars);
    console.log(`    ✓  ${file}`);
    count++;
    continue;
  }

  // Requirements files — copy only if in type config
  if (allRequirementsFiles.has(file)) {
    if (activeRequirementsFiles.has(file)) {
      copyAndProcess(src, dest, vars);
      console.log(`    ✓  ${file}`);
      count++;
    } else {
      console.log(`    –  ${file}  (skipped — not in type "${typeConfig.type}")`);
    }
    continue;
  }

  // Log files — copy only if in type config
  if (allLogFiles.has(file)) {
    if (activeLogFiles.has(file)) {
      copyAndProcess(src, dest, vars);
      console.log(`    ✓  ${file}`);
      count++;
    } else {
      console.log(`    –  ${file}  (skipped — not in type "${typeConfig.type}")`);
    }
    continue;
  }

  // Any other template file — copy as-is
  copyAndProcess(src, dest, vars);
  console.log(`    ✓  ${file}`);
  count++;
}

// Squad file
const squadSrc = path.join(squadsDir, `${squadType}.md`);
if (fs.existsSync(squadSrc)) {
  copyAndProcess(squadSrc, path.join(outputDir, 'SQUAD.md'), vars);
  console.log(`    ✓  SQUAD.md  ← ${squadType}.md`);
  count++;
}

// Shared SDK docs
for (const extra of ['protocol.md', 'AGENTS.md', 'STRATEGY.md']) {
  const src = path.join(sdkRoot, extra);
  if (fs.existsSync(src)) {
    copyAndProcess(src, path.join(outputDir, extra), vars);
    console.log(`    ✓  ${extra}`);
    count++;
  }
}

// team/ — roles, levels, squads (agents read these at activation)
const teamSrc  = path.join(sdkRoot, 'team');
const teamDest = path.join(outputDir, 'team');
function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}
if (fs.existsSync(teamSrc)) {
  copyDir(teamSrc, teamDest);
  console.log(`    ✓  team/  (roles, levels, squads)`);
  count++;
}

// ─── 2. Init Claude project (.claude/) ───────────────────────────────────────

const claudeDir      = path.join(outputDir, '.claude');
const settingsPath   = path.join(claudeDir, 'settings.json');

ensureDir(claudeDir);

// Copy .claude/commands/ — slash commands (/ask, /askGreg, /askCTO)
const sdkCommandsSrc  = path.join(sdkRoot, '.claude', 'commands');
const sdkCommandsDest = path.join(claudeDir, 'commands');
if (fs.existsSync(sdkCommandsSrc)) {
  copyDir(sdkCommandsSrc, sdkCommandsDest);
  console.log(`    ✓  .claude/commands/  (/ask, /askGreg, /askCTO)`);
}

const claudeSettings = {
  projectName,
  releaseId,
  createdAt: dateStr,
  squad: squadType,
  permissions: {
    allow: [
      "Bash(node:*)",
      "Bash(node scripts/doc.js:*)"
    ]
  }
};

fs.writeFileSync(settingsPath, JSON.stringify(claudeSettings, null, 2) + '\n', 'utf8');
console.log(`    ✓  .claude/settings.json`);

// ─── 3. Seed idea.md if --idea was given ─────────────────────────────────────

const ideaPath = path.join(outputDir, 'idea.md');

if (seedIdea) {
  let ideaContent = fs.readFileSync(ideaPath, 'utf8');
  ideaContent = ideaContent.replace(
    '[Describe the idea in plain language. What does it do? Who is it for? What problem does it solve? Don\'t optimize this — just write what you know right now.]',
    seedIdea
  );
  // Mark as "Raw idea — being shaped"
  ideaContent = ideaContent.replace(
    '**Status:** Raw idea — not yet shaped',
    '**Status:** Raw idea — being shaped'
  );
  fs.writeFileSync(ideaPath, ideaContent, 'utf8');
  console.log(`    ✓  idea.md  ← seeded with your idea`);
}

// ─── 4. Prime current-status.md for Day 0 ────────────────────────────────────

const statusPath    = path.join(outputDir, 'current-status.md');
let   statusContent = fs.readFileSync(statusPath, 'utf8');

// Replace the placeholder active missions table row with Day 0 state
statusContent = statusContent.replace(
  '| [Mission name] | [PM name] | [N weeks] | Active / Blocked / Paused | [Specific next step with owner] |',
  `| Discovery | — | — | Pending | Owner to fill idea.md Section 4 and activate Greg |`
);

statusContent = statusContent.replace(
  '- [ ] [What is needed] | From: [Role] | Since: [YYYY-MM-DD] | Blocks: [what]',
  `- [ ] idea.md Section 4 brief complete | From: Owner | Since: ${dateStr} | Blocks: Greg activation`
);

statusContent = statusContent.replace(
  '- [What was done] | By: [Role] | Completed: [YYYY-MM-DD]',
  `- Project scaffolded | By: init.js | Completed: ${dateStr}`
);

statusContent = statusContent.replace(
  '**[Role name]** — because [reason: what they need to do next]',
  `**Greg (CEO)** — paste the brief from idea.md Section 4 to start Discovery`
);

statusContent = statusContent.replace(
  '[Any context that does not fit the above — what was mid-flight when the session ended, specific files that were being edited, etc.]',
  `Day 0 — project just bootstrapped. No sessions yet.\nOwner must complete idea.md before activating the team.`
);

// Fix the Last updated / Updated by lines
statusContent = statusContent
  .replace('[YYYY-MM-DD HH:MM]', timeStr)
  .replace('[Role]', 'init.js');

fs.writeFileSync(statusPath, statusContent, 'utf8');
console.log(`    ✓  current-status.md  ← primed for Day 0`);

// Write .sdkrc — persists SDK source path, project type, and release
const sdkrcPath = path.join(outputDir, '.sdkrc');
fs.writeFileSync(sdkrcPath, JSON.stringify({
  releaseId,
  squad: squadType,
  projectName,
  sdkPath: sdkRoot,
  type: typeConfig.type
}, null, 2) + '\n', 'utf8');
console.log(`    ✓  .sdkrc  (release + squad + SDK path persisted)`);

// ─── 5. Copy --source file ──────────────────────────────────────────────────

if (sourceFile) {
  const sourceBasename = path.basename(sourceFile);
  const sourceDest     = path.join(outputDir, sourceBasename);
  fs.copyFileSync(sourceFile, sourceDest);
  console.log(`    ✓  ${sourceBasename}  ← source document copied`);
}

// ─── 6. Seed history.md with Project Start ──────────────────────────────────

const historyPath = path.join(outputDir, 'history.md');
if (fs.existsSync(historyPath)) {
  let historyContent = fs.readFileSync(historyPath, 'utf8');

  const ideaLabel = seedIdea
    ? seedIdea.slice(0, 120) + (seedIdea.length > 120 ? '...' : '')
    : sourceFile
      ? `Vision document provided: ${path.basename(sourceFile)}`
      : 'Project scaffolded. Idea to be shaped during Discovery.';

  const projectStartEntry = `## Project Start
**Date:** ${dateStr}
**Status:** Initiated

**What happened:**
Owner initiated ${projectName}. ${ideaLabel}
Squad: ${squadType}. Release target: ${releaseId}.

**Capital / constraints:**
[To be filled during Discovery]

**Key decisions:**
- Squad type: ${squadType}
- Project type: ${typeConfig.type} (${typeConfig.name})
- Release: ${releaseId}`;

  historyContent = historyContent.replace(
    `## [Project Start]
**Date:** [YYYY-MM-DD]
**Status:** Initiated

**What happened:**
[1-2 sentences: who briefed whom, what the strategic direction is.]

**Capital / constraints:**
[Budget, runway, team size, hard deadlines.]

**Key decisions:**
[Decisions made at project start.]`,
    projectStartEntry
  );

  fs.writeFileSync(historyPath, historyContent, 'utf8');
  console.log(`    ✓  history.md  ← Project Start entry seeded`);
}

// ─── 7. Generate context-manifest.json and context-index.json ───────────────

const docScript = path.join(sdkRoot, 'scripts', 'doc.js');
if (fs.existsSync(docScript)) {
  try {
    const { execSync } = require('child_process');
    execSync(`node "${docScript}" manifest "${outputDir}"`, { stdio: 'pipe' });
    console.log(`    ✓  context-manifest.json  ← generated`);
  } catch (_) {
    console.log(`    ⚠  context-manifest.json  ← generation failed (non-blocking)`);
  }
  try {
    const { execSync } = require('child_process');
    execSync(`node "${docScript}" index "${outputDir}"`, { stdio: 'pipe' });
    console.log(`    ✓  context-index.json  ← generated`);
  } catch (_) {
    console.log(`    ⚠  context-index.json  ← generation failed (non-blocking)`);
  }
}

// ─── 8. Git init + initial commit ────────────────────────────────────────────

if (!skipGit) {
  try {
    const { execSync } = require('child_process');
    execSync('git init', { cwd: outputDir, stdio: 'pipe' });
    execSync('git branch -m main', { cwd: outputDir, stdio: 'pipe' });
    execSync('git add -A', { cwd: outputDir, stdio: 'pipe' });
    const commitMsg = `feat: initialize ${projectName} with team-sdk\n\nSquad: ${squadType} | Type: ${typeConfig.type} | Release: ${releaseId}${sourceFile ? '\nSource: ' + path.basename(sourceFile) : ''}`;
    execSync(`git commit -m "${commitMsg}"`, { cwd: outputDir, stdio: 'pipe' });
    console.log(`    ✓  git  ← initialized with initial commit (main branch)`);
  } catch (e) {
    console.log(`    ⚠  git  ← init failed: ${e.message.split('\n')[0]} (non-blocking)`);
  }
}

// ─── Done ─────────────────────────────────────────────────────────────────────

const ideaFile    = path.join(outputDir, 'idea.md');
const claudeMdFile = path.join(outputDir, 'CLAUDE.md');

printNextStub(outputDir);

const gitStatus = skipGit ? '' : '    Git: initialized (main branch, initial commit)\n';
const sourceStatus = sourceFile ? `    Source: ${path.basename(sourceFile)}\n` : '';

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${projectName}  ready
    ${outputDir}
    Squad: ${squadType} | Type: ${typeConfig.type} | Release: ${releaseId}
${gitStatus}${sourceStatus}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS
──────────
1.  Open the project in Claude Code:

      claude ${outputDir}

2.  ${seedIdea || sourceFile ? 'Review idea.md — it has been seeded. Complete Section 4 if needed.' : 'Fill in idea.md — complete all five sections. Section 4 is the Greg brief.'}

3.  Activate Greg to start Discovery:

      Hey Greg — here's a new project brief.
      [paste from idea.md Section 4]

    Greg kicks off Discovery and activates the team per SQUAD.md.

4.  Resume any session with:

      sdk-resume ${outputDir}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
