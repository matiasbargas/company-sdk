#!/usr/bin/env node

/**
 * init.js — Create a new team-sdk project, init Claude project, and prime idea.md
 *
 * Usage:
 *   node scripts/init.js <project-name> [--output <dir>] [--squad <type>] [--idea "your idea"]
 *
 * Options:
 *   --output <dir>    Output directory (default: ../projects/<project-name>)
 *   --squad <type>    website | mvp | feature | startup  (default: startup)
 *   --idea "..."      Drop your raw idea directly — skips the placeholder in idea.md
 *
 * What it does:
 *   1. Scaffolds project from project-template/ with all team folders and docs
 *   2. Creates .claude/settings.json to register it as a Claude Code project
 *   3. Pre-fills current-status.md with Day 0 state (ready for Greg)
 *   4. If --idea is given, writes it into idea.md Section 1 immediately
 *   5. Prints the exact prompt to paste to Greg when you're ready
 */

const fs   = require('fs');
const path = require('path');

// ─── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  node scripts/init.js <project-name> [--output <dir>] [--squad <type>] [--idea "..."]

Options:
  --output <dir>    Output directory (default: ../projects/<project-name>)
  --squad <type>    website | mvp | feature | startup  (default: startup)
  --idea "..."      Seed idea.md Section 1 with your raw idea text

Examples:
  node scripts/init.js my-saas --squad mvp
  node scripts/init.js landing-page --squad website --output ~/projects/landing
  node scripts/init.js fintech-tool --idea "A tool that helps solo founders track burn rate in real time"
`);
  process.exit(0);
}

const projectName = args[0];
let outputDir  = null;
let squadType  = 'startup';
let seedIdea   = null;

for (let i = 1; i < args.length; i++) {
  if      (args[i] === '--output' && args[i + 1]) outputDir = args[++i];
  else if (args[i] === '--squad'  && args[i + 1]) squadType = args[++i];
  else if (args[i] === '--idea'   && args[i + 1]) seedIdea  = args[++i];
}

const VALID_SQUADS = ['website', 'mvp', 'feature', 'startup'];
if (!VALID_SQUADS.includes(squadType)) {
  console.error(`Invalid squad type: "${squadType}". Valid: ${VALID_SQUADS.join(', ')}`);
  process.exit(1);
}

const sdkRoot    = path.resolve(__dirname, '..');
const templateDir = path.join(sdkRoot, 'project-template');
const squadsDir   = path.join(sdkRoot, 'team/squads');

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
console.log(`    Output:  ${outputDir}`);
console.log(`    Release: ${releaseId}\n`);

ensureDir(outputDir);

const templateFiles = fs.readdirSync(templateDir);
let count = 0;

for (const file of templateFiles) {
  const src  = path.join(templateDir, file);
  const dest = path.join(outputDir, file);
  if (fs.statSync(src).isFile()) {
    copyAndProcess(src, dest, vars);
    console.log(`    ✓  ${file}`);
    count++;
  }
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

// ─── 2. Init Claude project (.claude/) ───────────────────────────────────────

const claudeDir      = path.join(outputDir, '.claude');
const settingsPath   = path.join(claudeDir, 'settings.json');

ensureDir(claudeDir);

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

// ─── Done ─────────────────────────────────────────────────────────────────────

const ideaFile    = path.join(outputDir, 'idea.md');
const claudeMdFile = path.join(outputDir, 'CLAUDE.md');

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  ${projectName}  ready  (${count + 2} files)
    ${outputDir}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS
──────────
1.  Open the project in Claude Code:

      claude ${outputDir}

    (Claude will load CLAUDE.md automatically — every agent
     instruction and key file reference is already wired in.)

2.  Fill in your idea:

      open ${ideaFile}

    Complete all five sections. When Section 4 (the brief) is
    ready, move on.

3.  Activate Greg to start Discovery — paste this into Claude:

      Hey Greg — here's a new project brief.

      Idea: ${projectName}

      The problem:
      [paste from idea.md Section 4]

      The user:
      [paste from idea.md Section 4]

      What we're building:
      [paste from idea.md Section 4]

      What winning looks like at 18 months:
      [paste from idea.md Section 4]

      What I'm NOT doing:
      [paste from idea.md Section 4]

      Biggest risk:
      [paste from idea.md Section 4]

      Constraints:
      [paste from idea.md Section 4]

    Greg will kick off Discovery and activate the Coordinator,
    who routes the rest of the team in the order defined in SQUAD.md.

4.  Resume any session with:

      node ${path.relative(process.cwd(), path.join(sdkRoot, 'scripts/doc.js'))} status ${outputDir}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
