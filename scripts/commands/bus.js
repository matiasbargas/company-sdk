'use strict';

const fs = require('fs');
const path = require('path');

/**
 * cmdBus — Send a Bus message: logs to bus-log.md + runs intent resolver.
 */
module.exports = function cmdBus({ args, filePath }) {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const busOpts = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1]) {
      busOpts[args[i].slice(2)] = args[++i];
    }
  }

  const from           = busOpts.from;
  const to             = busOpts.to;
  let priority         = busOpts.priority || 'INFO';
  const message        = busOpts.message;
  let tag              = busOpts.tag || '';
  // Legacy spelling: CONTEXT REQUEST used to be a priority. It is now INFO + TAG (protocol.md §19, §25).
  if (priority === 'CONTEXT REQUEST') {
    priority = 'INFO';
    tag = tag ? `CONTEXT-REQUEST, ${tag}` : 'CONTEXT-REQUEST';
    console.error('Note: "--priority CONTEXT REQUEST" is deprecated; sent as PRIORITY: INFO + TAG: CONTEXT-REQUEST.');
  }
  const solutionClass  = busOpts['solution-class'] || '';
  const costSignal     = busOpts['cost-signal'] || '';
  const timeSignal     = busOpts['time-signal'] || '';
  const decisionBy     = busOpts['decision-by'] || '';
  const escalation     = busOpts.escalation || '';

  if (!from || !to || !message) {
    console.error('Usage: sdk-doc bus <project-dir> --from <role> --to <role> --message "..." [--priority ...] [--tag ...] [--solution-class KNOWN|EXPLORATORY|HYBRID] [--cost-signal LOW|MEDIUM|HIGH] [--time-signal "Nh"] [--decision-by YYYY-MM-DD] [--escalation <role>]');
    process.exit(1);
  }

  // Validate TAG + PRIORITY combinations
  if (tag === 'FRAMING-CHALLENGE' && priority === 'INFO') {
    console.error('Error: FRAMING-CHALLENGE tag requires PRIORITY: DECISION NEEDED or BLOCKER, not INFO.');
    process.exit(1);
  }

  // protocol.md §1 — the field rules, enforced here so bus-log.md never holds a malformed message.
  if (!['INFO', 'DECISION NEEDED', 'BLOCKER'].includes(priority)) {
    console.error('Error: --priority must be INFO, DECISION NEEDED, or BLOCKER (CONTEXT-REQUEST is a --tag on INFO).');
    process.exit(1);
  }
  if (/\bCONTEXT-REQUEST\b/.test(tag) && priority !== 'INFO') {
    console.error('Error: CONTEXT-REQUEST tag requires PRIORITY: INFO.');
    process.exit(1);
  }
  if (priority === 'DECISION NEEDED' && !/^\d{4}-\d{2}-\d{2}$/.test(decisionBy)) {
    console.error('Error: DECISION NEEDED requires --decision-by YYYY-MM-DD.');
    process.exit(1);
  }
  if (priority !== 'INFO' && !escalation) {
    console.error(`Error: ${priority} requires --escalation <role> (who gets it if there is no response by the deadline).`);
    process.exit(1);
  }

  // SOLUTION_CLASS: required on DECISION NEEDED / BLOCKER from technical roles; optional on INFO.
  const technicalRoles = ['cto', 'mario', 'chief engineer', 'em', 'staff engineer', 'coordinator'];
  const fromLower = (from || '').toLowerCase();
  const isTechnicalRole = technicalRoles.some(r => fromLower.includes(r));

  if (isTechnicalRole && priority !== 'INFO' && !solutionClass) {
    console.error(`Error: SOLUTION_CLASS is required on ${priority} messages from ${from}.`);
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
  const dueLine  = decisionBy ? `\nDECISION BY: ${decisionBy}` : '';
  const escLine  = escalation ? `\nESCALATION: ${escalation}` : '';
  const formatted = `FROM: ${from}\nTO: ${to}\nRELEASE: ${release}\nPRIORITY: ${priority}${solLine}${tagLine}${costLine}${timeLine}\nMESSAGE: ${message}${dueLine}${escLine}`;

  // Append to bus-log.md
  const logPath = path.join(projectDir, 'bus-log.md');
  const tagSuffix = tag ? ` | TAG: ${tag}` : '';
  const solSuffix = solutionClass ? ` | SOL: ${solutionClass}` : '';
  const logEntry = `\n---\n[${timestamp}] FROM: ${from} \u2192 TO: ${to} | PRIORITY: ${priority}${solSuffix}${tagSuffix} | RELEASE: ${release}\n${message}\n${decisionBy ? `DECISION BY: ${decisionBy}\n` : ''}${escalation ? `ESCALATION: ${escalation}\n` : ''}`;

  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, `# Bus Log\n\n> Append-only record of all inter-agent communication. Do not edit \u2014 only append.\n${logEntry}`, 'utf8');
  } else {
    fs.appendFileSync(logPath, logEntry, 'utf8');
  }

  console.log(`\u2713 Bus message logged to bus-log.md`);
  console.log(`  ${from} \u2192 ${to} [${priority}]${tag ? ` TAG: ${tag}` : ''}`);

  // Run intent resolver
  const { resolve: resolveIntent } = require('../lib/intent-resolver');
  const resolution = resolveIntent(formatted);

  if (resolution && resolution.action) {
    console.log(`  Intent resolved: ${resolution.action}`);
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
    console.log(`  Routing: topic="${resolution.routing.topic}" \u2192 consult ${resolution.routing.consult}`);
  } else {
    console.log(`  No action implied \u2014 pure communication`);
  }

  // Output the formatted message for the agent to paste
  console.log(`\n--- Bus Message ---`);
  console.log(formatted);
  console.log(`---`);
};
