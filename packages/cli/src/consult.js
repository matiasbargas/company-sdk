'use strict';

/**
 * consult.js — Core consultation function.
 *
 * Resolves a role, loads role context, loads project context (if available),
 * and returns a structured consultation payload for the agentic environment.
 *
 * This package does NOT call any LLM. It prepares context and role data.
 * The agentic environment (Claude Code, etc.) handles the actual inference.
 */

const { resolveRoleToFile, listRoles } = require('./role-resolver');
const { loadRole } = require('./role-loader');
const { loadProjectContext } = require('./context-loader');
const { ROLES, buildBusMessage, TAGS } = require('../../protocol/src');

/**
 * Prepare a consultation payload.
 *
 * @param {string} question - The question being asked
 * @param {object} [options]
 * @param {string} [options.role] - Target role (e.g., 'cto', 'CTO', 'Chief Engineer')
 * @param {string} [options.projectDir] - Project directory for context loading
 * @param {string} [options.sdkRoot] - SDK root directory
 * @param {string} [options.agentName] - Agent name for placeholder resolution
 * @returns {object} Structured consultation payload
 */
function consult(question, options = {}) {
  const { role: roleInput, projectDir, sdkRoot, agentName } = options;

  // Resolve role
  let roleFile = null;
  let roleData = null;
  let roleError = null;

  if (roleInput) {
    roleFile = resolveRoleToFile(roleInput, { sdkRoot });
    if (!roleFile) {
      roleError = `Unknown role: '${roleInput}'. Use listRoles() to see available roles.`;
    }
  } else {
    // No role specified — route to Coordinator for triage
    roleFile = resolveRoleToFile('coordinator', { sdkRoot });
  }

  // Load role file
  if (roleFile) {
    roleData = loadRole(roleFile.filePath, { agentName });
    if (roleData.error) {
      roleError = roleData.error;
      roleData = null;
    }
  }

  // Load project context (optional — works without it)
  const context = loadProjectContext(projectDir);

  // Build consultation payload
  return {
    question,
    role: roleFile ? {
      key: roleFile.key,
      title: roleFile.title,
      domain: roleFile.domain,
      group: roleFile.group,
      filePath: roleFile.filePath,
    } : null,
    roleData: roleData ? {
      capability: roleData.capability,
      hasConsultation: roleData.hasConsultation,
      hasChallenge: roleData.hasChallenge,
      sections: roleData.sections,
    } : null,
    roleError,
    context: {
      available: context.available,
      projectDir: context.projectDir,
      release: context.release,
      phase: context.phase,
      activeMissions: context.activeMissions,
      indexError: context.indexError,
      manifestError: context.manifestError,
    },
    // The full role file content — the agentic environment passes this to the LLM
    rolePrompt: roleData ? roleData.raw : null,
    // Relevant project files for the role's domain
    relevantFiles: context.available && roleFile
      ? context.query({ domain: roleFile.domain })
      : [],
    // Bus trace for consultation logging
    busTrace: roleFile ? buildConsultationTrace({
      from: 'Owner',
      to: roleFile.title,
      release: context.release || 'N/A',
      question,
    }) : null,
  };
}

/**
 * Build a Bus message trace for a consultation request.
 * This is appended to bus-log.md when consultation spawns peers.
 */
function buildConsultationTrace({ from, to, release, question }) {
  return buildBusMessage({
    from,
    to,
    release,
    priority: 'INFO',
    tags: [TAGS.CONSULTATION],
    solutionClass: 'EXPLORATORY',
    message: `Consultation request: ${question}`,
  });
}

/**
 * Route a question to the best role based on keywords.
 * Simple keyword matching — not AI-powered. Returns a role key suggestion.
 *
 * @param {string} question
 * @returns {string} Suggested role key
 */
function suggestRole(question) {
  const q = question.toLowerCase();

  const keywords = {
    cto: [
      'architecture', 'technical', 'stack', 'framework', 'database', 'api',
      'infrastructure', 'build vs buy', 'scalab', 'backend', 'frontend',
      'microservice', 'monolith', 'deploy', 'ci/cd', 'pipeline', 'docker',
      'kubernetes', 'cloud', 'aws', 'gcp', 'azure', 'serverless', 'lambda',
      'postgres', 'dynamodb', 'redis', 'mongo', 'sql', 'nosql', 'graphql',
      'rest', 'grpc', 'websocket', 'caching', 'queue', 'kafka', 'rabbit',
      'cdn', 'dns', 'load balanc', 'latency', 'throughput', 'migration',
      'refactor', 'tech debt', 'platform', 'sdk', 'library', 'package',
      'typescript', 'node', 'python', 'react', 'next.js', 'supabase',
      'firebase', 'vercel', 'terraform', 'infra',
    ],
    clo: [
      'legal', 'gdpr', 'compliance', 'regulation', 'privacy', 'terms',
      'license', 'contract', 'liability', 'intellectual property', 'ip ',
      'copyright', 'trademark', 'data protection', 'consent', 'tos',
      'cookie', 'ccpa', 'hipaa', 'sox', 'pci', 'jurisdiction', 'lawsuit',
      'indemnif', 'nda', 'dmca', 'regulatory',
    ],
    ciso: [
      'security', 'threat', 'auth', 'encryption', 'vulnerability', 'pentest',
      'sso', 'oauth', 'jwt', 'token', 'firewall', 'rbac', 'permission',
      'access control', 'xss', 'csrf', 'injection', 'breach', 'incident',
      'zero trust', 'mfa', '2fa', 'certificate', 'ssl', 'tls', 'secret',
      'vault', 'attack', 'exploit', 'penetration', 'audit log',
    ],
    cfo: [
      'budget', 'cost', 'revenue', 'financial', 'runway', 'unit economics',
      'pricing', 'margin', 'burn rate', 'invoice', 'payment', 'subscription',
      'arr', 'mrr', 'churn', 'ltv', 'cac', 'roi', 'forecast', 'p&l',
      'profit', 'expense', 'funding', 'investor', 'valuation', 'cash flow',
      'billing', 'stripe', 'tax',
    ],
    pm: [
      'product', 'feature', 'user story', 'scope', 'mission', 'roadmap',
      'priorit', 'backlog', 'requirement', 'acceptance criteria', 'epic',
      'milestone', 'release plan', 'mvp', 'beta', 'dogfood', 'spec',
      'prd', 'stakeholder', 'user need', 'use case', 'workflow',
    ],
    cmo: [
      'market', 'positioning', 'launch', 'brand', 'competitor', 'gtm',
      'campaign', 'seo', 'content', 'funnel', 'acquisition', 'retention',
      'growth', 'viral', 'messaging', 'audience', 'segment', 'landing page',
      'conversion', 'organic', 'paid', 'social media',
    ],
    designer: [
      'design', 'ux', 'ui', 'interface', 'layout', 'wireframe', 'prototype',
      'figma', 'component', 'design system', 'typography', 'color',
      'responsive', 'mobile', 'accessibility', 'a11y', 'interaction',
      'animation', 'icon', 'visual', 'mockup',
    ],
    'ux-researcher': [
      'research', 'user interview', 'survey', 'usability', 'study',
      'persona', 'journey map', 'pain point', 'discovery', 'validation',
      'a/b test', 'heuristic', 'ethnograph', 'diary study', 'behavioral',
    ],
    ceo: [
      'strategy', 'vision', 'direction', 'pivot', 'what to build', 'kill',
      'bet', 'tradeoff', 'opportunity', 'risk vs reward', 'moat',
      'differentiator', 'north star', 'what should we', 'should we build',
      'company', 'org', 'culture', 'hiring plan',
    ],
    caio: [
      'ai', 'ml', 'model', 'llm', 'fine-tun', 'prompt', 'embedding',
      'vector', 'rag', 'agent', 'gpt', 'claude', 'openai', 'anthropic',
      'training', 'inference', 'neural', 'transformer', 'diffusion',
    ],
    cao: [
      'analytics', 'metric', 'dashboard', 'experiment', 'a/b',
      'data pipeline', 'etl', 'warehouse', 'bigquery', 'looker',
      'attribution', 'cohort', 'funnel analys', 'event track',
    ],
    chro: [
      'hiring', 'recruit', 'onboard', 'culture', 'compensation', 'salary',
      'benefits', 'performance review', 'team health', 'burnout', 'retention',
      'career', 'promotion', 'diversity', 'remote work',
    ],
    em: [
      'sprint', 'pod', 'team', 'velocity', 'capacity', 'delivery',
      'standup', 'retro', 'blocker', 'estimate', 'story point',
      'kanban', 'scrum', 'jira', 'ticket', 'assign', 'workload',
    ],
    'chief-engineer': [
      'irreversible', 'mario', 'review', 'scale', 'reliability',
      'outage', 'incident', 'postmortem', 'sla', 'uptime', 'failover',
      'disaster recovery', 'rollback', 'breaking change', 'deprecat',
      'tech review', 'rfc',
    ],
  };

  let bestRole = 'coordinator'; // default
  let bestScore = 0;

  for (const [role, terms] of Object.entries(keywords)) {
    const score = terms.filter(t => q.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      bestRole = role;
    }
  }

  return bestRole;
}

module.exports = { consult, suggestRole };
