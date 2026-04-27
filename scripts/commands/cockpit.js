'use strict';

const fs = require('fs');
const path = require('path');

/**
 * cmdCockpit — Generate a role-specific session start briefing.
 */
module.exports = function cmdCockpit({ filePath, opts }) {
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

  // -- Build output --
  const lines = [];
  const projectName = (index && index.project && index.project.name) || path.basename(projectDir);
  const release = (manifest && manifest.release) || (index && index.release) || 'unknown';
  const phase = (manifest && manifest.phase) || 'unknown';

  lines.push(`COCKPIT: ${role}`);
  lines.push(`Project: ${projectName} | Release: ${release} | Phase: ${phase}`);
  lines.push('');

  // -- Project state --
  if (manifest) {
    const missions = (manifest.activeMissions || []);
    const active = missions.filter(m => m.status && !m.status.includes('Paused')).length;
    const blocked = (manifest.waitingOn || []).length;
    const decisions = (manifest.openDecisions || []).length;
    lines.push(`STATE: ${active} active mission(s), ${blocked} blocker(s), ${decisions} open decision(s)`);
    if (manifest.staleness && manifest.staleness.flag === 'stale') {
      lines.push(`  \u26a0 current-status.md is stale (${manifest.staleness.currentStatusAge}h old)`);
    }
  } else {
    lines.push('STATE: No manifest \u2014 read current-status.md directly');
  }
  lines.push('');

  // -- L0 domain summaries --
  if (index && index.projectDomains && Object.keys(index.projectDomains).length > 0) {
    lines.push('PROJECT DOMAINS (L0):');
    for (const [name, dom] of Object.entries(index.projectDomains)) {
      const summary = dom.summary ? dom.summary.slice(0, 120) : '(no summary)';
      lines.push(`  ${name} [${dom.lead}]: ${summary}`);
    }
    lines.push('');
  }

  // -- Active missions --
  if (manifest && manifest.activeMissions && manifest.activeMissions.length > 0) {
    lines.push('ACTIVE MISSIONS:');
    for (const m of manifest.activeMissions) {
      lines.push(`  ${m.status || '?'} \u2014 ${m.name}`);
      if (m.nextAction) lines.push(`    Next: ${m.nextAction.slice(0, 100)}`);
    }
    lines.push('');
  }

  // -- Waiting on --
  if (manifest && manifest.waitingOn && manifest.waitingOn.length > 0) {
    lines.push('WAITING ON:');
    for (const w of manifest.waitingOn) {
      lines.push(`  - ${w.item}${w.blocks ? ` [blocks: ${w.blocks}]` : ''}`);
    }
    lines.push('');
  }

  // -- Context gap analysis --
  if (index && index.projectDomains && manifest && manifest.activeMissions) {
    const roleLower = role.toLowerCase();
    const touchedDomains = new Set();

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
          lines.push(`  ${dName} \u2014 you are the lead. L1: ${l1Files.length} file(s) available.`);
        } else if (dom.cross_loadable) {
          lines.push(`  ${dName} \u2014 cross-loadable. Read: ${l1Files.join(', ') || '(no L1 files yet)'}`);
        }
        const triggers = dom.spawn_when || [];
        if (triggers.length > 0 && !isLead) {
          lines.push(`    Spawn ${dom.lead} for: ${triggers.join(', ')}`);
        }
      }
      lines.push('');
    }
  }

  // -- Recent Bus activity (relevant to this role) --
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

  // -- Available operations --
  if (index && index.opsMap) {
    const opNames = Object.keys(index.opsMap);
    lines.push(`AVAILABLE OPERATIONS: ${opNames.join(', ')}`);
    lines.push('');
  }

  // -- Next agent --
  if (manifest && manifest.nextAgentToActivate) {
    lines.push(`NEXT AGENT: ${manifest.nextAgentToActivate.role}`);
    if (manifest.nextAgentToActivate.activationPrompt) {
      lines.push(`  ${manifest.nextAgentToActivate.activationPrompt.slice(0, 200)}`);
    }
    lines.push('');
  }

  console.log(lines.join('\n'));
};
