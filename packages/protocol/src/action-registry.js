'use strict';

/**
 * action-registry.js — Static map of every executable SDK action.
 *
 * Extracted from scripts/lib/action-registry.js.
 * Pure data. No execution logic.
 */

const actions = {
  // Document operations
  'doc.append':       { script: 'doc.js', args: ['append'],     requires: ['file', 'section', 'content'],            writes: true,  description: 'Append content to a section in a markdown file' },
  'doc.decision':     { script: 'doc.js', args: ['decision'],   requires: ['file', 'decision', 'context', 'made-by'], writes: true,  description: 'Log a decision to history.md' },
  'doc.log':          { script: 'doc.js', args: ['log'],         requires: ['file', 'role', 'level', 'goal', 'status'], writes: true, description: 'Write a structured area log entry' },
  'doc.pod-update':   { script: 'doc.js', args: ['pod-update'],  requires: ['file', 'mission', 'status', 'next'],     writes: true,  description: 'Update a mission row in current-status.md' },
  'doc.rewrite':      { script: 'doc.js', args: ['rewrite'],     requires: ['file', 'section', 'content'],            writes: true,  description: 'Rewrite a section in a markdown file' },
  'doc.add-item':     { script: 'doc.js', args: ['add-item'],    requires: ['file', 'section', 'item'],               writes: true,  description: 'Add a checklist item to a section' },

  // Read-only document operations
  'doc.status':       { script: 'doc.js', args: ['status'],     requires: ['project-dir'],                            writes: false, description: 'Print current-status.md to stdout' },
  'doc.list':         { script: 'doc.js', args: ['list'],         requires: ['file'],                                  writes: false, description: 'List all headings in a file' },
  'doc.read':         { script: 'doc.js', args: ['read'],         requires: ['file', 'section'],                       writes: false, description: 'Read a specific section from a file' },

  // Context generation
  'doc.manifest':     { script: 'doc.js', args: ['manifest'],   requires: ['project-dir'],                            writes: true,  description: 'Generate context-manifest.json from current-status.md' },
  'doc.index':        { script: 'doc.js', args: ['index'],       requires: ['project-dir'],                            writes: true,  description: 'Generate context-index.json (file catalog + routing)' },

  // Sessions
  'doc.session.save':    { script: 'doc.js', args: ['session', null, 'save'],    requires: ['project-dir', 'title'],    writes: true,  description: 'Save a session summary to sessions/temp/' },
  'doc.session.promote': { script: 'doc.js', args: ['session', null, 'promote'], requires: ['project-dir', 'filename'], writes: true,  description: 'Promote session from temp to permanent (indexed)' },
  'doc.session.list':    { script: 'doc.js', args: ['session', null, 'list'],    requires: ['project-dir'],             writes: false, description: 'List saved sessions' },
  'doc.session.clean':   { script: 'doc.js', args: ['session', null, 'clean'],   requires: ['project-dir'],             writes: true,  description: 'Delete all temp sessions' },

  // Studies
  'doc.study.create': { script: 'doc.js', args: ['study', null, 'create'], requires: ['project-dir', 'title'],         writes: true,  description: 'Create a new study file in research/studies/' },
  'doc.study.list':   { script: 'doc.js', args: ['study', null, 'list'],   requires: ['project-dir'],                  writes: false, description: 'List all studies' },

  // Team management
  'doc.spawn':        { script: 'doc.js', args: ['spawn'],     requires: ['project-dir', 'name', 'role', 'level', 'activated-by', 'profile', 'how', 'fun-fact'], writes: true, description: 'Add an agent to team.md' },
  'doc.dissolve':     { script: 'doc.js', args: ['dissolve'],   requires: ['project-dir', 'name', 'dissolved-by', 'reason'], writes: true, description: 'Move agent from Active to Dissolved in team.md' },

  // Gates
  'gate.check':       { script: 'gate-check.js', args: [],            requires: ['project-dir'],              writes: false, description: 'Run CLO + CISO gate check' },
  'gate.check-all':   { script: 'gate-check.js', args: ['--all'],     requires: ['project-dir'],              writes: false, description: 'Run all gates (advisory)' },
  'gate.mario':       { script: 'gate-check.js', args: ['--mario'],   requires: ['project-dir'],              writes: false, description: 'Run Mario irreversible decision gate' },

  // Quality & health
  'validate':         { script: 'validate.js',   args: [],            requires: ['project-dir'],              writes: false, description: 'Advisory doc health check' },
  'health':           { script: 'health.js',      args: [],            requires: ['project-dir'],              writes: false, description: 'Staleness + validate + manifest check' },
  'pre-tag':          { script: 'pre-tag.js',     args: [],            requires: ['project-dir'],              writes: false, description: 'Full team review before tagging' },
  'pre-tag.fix':      { script: 'pre-tag.js',     args: ['--fix'],     requires: ['project-dir'],              writes: true,  description: 'Pre-tag with auto-fix' },

  // Release lifecycle
  'version.show':     { script: 'version.js',    args: [],             requires: ['project-dir'],              writes: false, description: 'Show current release ID' },
  'version.bump':     { script: 'version.js',    args: ['bump'],       requires: ['project-dir'],              writes: true,  description: 'Bump release ID' },
  'ship':             { script: 'ship.js',         args: [],            requires: ['project-dir', 'release-id'], writes: true, description: 'Validate, tag, push, release notes' },
  'retro':            { script: 'retro.js',        args: [],            requires: ['project-dir'],              writes: true,  description: 'Interactive retrospective → strategy-log.md' },

  // Session lifecycle
  'resume':           { script: 'resume.js',      args: [],            requires: ['project-dir'],              writes: false, description: 'Session start: health + gates + sessions + next agent' },

  // Consultation
  'consult':          { script: 'consult.js',     args: [],            requires: ['role', 'question'],         writes: false, description: 'Consult a role with a question' },
  'consult.suggest':  { script: 'consult.js',     args: ['--suggest'], requires: ['question'],                 writes: false, description: 'Suggest the best role for a question' },
  'consult.list':     { script: 'consult.js',     args: ['--list-roles'], requires: [],                        writes: false, description: 'List all available roles' },
  'consult.info':     { script: 'consult.js',     args: ['--role-info'],  requires: ['role'],                  writes: false, description: 'Get detailed info about a role' },

  // Cross-project memory
  'memory.ingest':    { script: 'memory.js',      args: ['ingest'],      requires: ['project-dir'],             writes: true,  description: 'Ingest decisions/kills from a project into cross-project memory' },
  'memory.query':     { script: 'memory.js',      args: ['query'],       requires: ['question'],                writes: false, description: 'Search the cross-project decision corpus' },
  'memory.stats':     { script: 'memory.js',      args: ['stats'],       requires: [],                          writes: false, description: 'Show cross-project memory corpus statistics' },
  'memory.list':      { script: 'memory.js',      args: ['list'],        requires: [],                          writes: false, description: 'List all projects in the memory corpus' },
};

/**
 * opsMap — maps domain operations to actions.
 * This is what agents see in context-index.json.
 */
const opsMap = {
  'record-decision':  { fields: ['decision', 'rationale', 'reversibility', 'affects'], required: ['decision', 'rationale'],   action: 'doc.decision',       writes: true,  description: 'Log a consequential decision to history.md' },
  'update-mission':   { fields: ['mission', 'status', 'next', 'blockers'],             required: ['mission', 'status'],       action: 'doc.pod-update',     writes: true,  description: 'Update a mission status in current-status.md' },
  'log-work':         { fields: ['goal', 'outcome', 'status'],                         required: ['goal', 'status'],          action: 'doc.log',            writes: true,  description: 'Write an area log entry for completed work' },
  'save-session':     { fields: ['title', 'domains', 'tags', 'participants'],           required: ['title'],                   action: 'doc.session.save',   writes: true,  description: 'Save the current session context to temp' },
  'promote-session':  { fields: ['filename'],                                           required: ['filename'],                action: 'doc.session.promote', writes: true, description: 'Promote a session from temp to permanent (indexed)' },
  'request-study':    { fields: ['title', 'question', 'requested-by'],                  required: ['title'],                   action: 'doc.study.create',   writes: true,  description: 'Create a research study request' },
  'check-gates':      { fields: [],                                                     required: [],                          action: 'gate.check',         writes: false, description: 'Verify CLO + CISO gate status' },
  'check-health':     { fields: [],                                                     required: [],                          action: 'health',             writes: false, description: 'Run full project health check' },
  'refresh-manifest': { fields: [],                                                     required: [],                          action: 'doc.manifest',       writes: true,  description: 'Regenerate context-manifest.json' },
  'refresh-index':    { fields: [],                                                     required: [],                          action: 'doc.index',          writes: true,  description: 'Regenerate context-index.json' },
  'spawn-agent':      { fields: ['name', 'role', 'level', 'activated-by', 'profile'],   required: ['name', 'role', 'level'],   action: 'doc.spawn',          writes: true,  description: 'Activate a new agent on the team' },
  'dissolve-agent':   { fields: ['name', 'dissolved-by', 'reason'],                     required: ['name'],                    action: 'doc.dissolve',       writes: true,  description: 'Deactivate an agent from the team' },
  'consult-role':     { fields: ['role', 'question', 'project'],                       required: ['question'],                action: 'consult',            writes: false, description: 'Consult an agent role with a domain question' },
  'ingest-memory':    { fields: ['project-dir'],                                     required: ['project-dir'],             action: 'memory.ingest',      writes: true,  description: 'Ingest project decisions into cross-project memory' },
  'query-memory':     { fields: ['question', 'project', 'type', 'domain'],           required: ['question'],                action: 'memory.query',       writes: false, description: 'Search the cross-project decision corpus' },
};

module.exports = { actions, opsMap };
