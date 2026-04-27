#!/usr/bin/env node

/**
 * doc.js — Document operations for company-sdk project files
 *
 * Thin dispatcher: each command lives in scripts/commands/<name>.js.
 * Shared utilities live in scripts/lib/doc-utils.js.
 */

const { parseOptions } = require('./lib/doc-utils');

// ─── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const command = args[0];
const filePath = args[1];

// Commands that take a project-dir as second arg (no file-path requirement for others)
const projectDirCommands = [
  'spawn', 'dissolve', 'manifest', 'index', 'study',
  'session', 'domain', 'bus', 'cockpit', 'discovery',
  'disagreement', 'history',
];

if (!command || (!filePath && !projectDirCommands.includes(command)) || command === '--help' || command === '-h') {
  printHelp();
  process.exit(command ? 1 : 0);
}

// ─── Command registry ───────────────────────────────────────────────────────

const commands = {
  'list':         require('./commands/list'),
  'read':         require('./commands/read-cmd'),
  'append':       require('./commands/append'),
  'rewrite':      require('./commands/rewrite'),
  'add-item':     require('./commands/add-item'),
  'decision':     require('./commands/decision'),
  'log':          require('./commands/log'),
  'status':       require('./commands/status'),
  'pod-update':   require('./commands/pod-update'),
  'spawn':        require('./commands/spawn'),
  'dissolve':     require('./commands/dissolve'),
  'manifest':     require('./commands/manifest'),
  'index':        require('./commands/index-cmd'),
  'study':        require('./commands/study'),
  'session':      require('./commands/session'),
  'domain':       require('./commands/domain'),
  'bus':          require('./commands/bus'),
  'cockpit':      require('./commands/cockpit'),
  'discovery':    require('./commands/discovery'),
  'disagreement': require('./commands/disagreement'),
  'history':      require('./commands/history'),
};

// ─── Dispatch ───────────────────────────────────────────────────────────────

const handler = commands[command];
if (!handler) {
  console.error(`Unknown command: "${command}"`);
  printHelp();
  process.exit(1);
}

const opts = parseOptions(args);
handler({ args, filePath, opts, dryRun });

// ─── Help ───────────────────────────────────────────────────────────────────

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
  discovery   <project-dir> start                            Generate discovery questionnaire from idea.md
  discovery   <project-dir> answer --id <id> --answer "..."  Capture an answer and route to requirements
  discovery   <project-dir> status                           Show discovery progress and blockers

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
