'use strict';

/**
 * profile-generator.js — Generate project-specific role profiles.
 *
 * After Greg reviews an idea, this module analyzes the idea content
 * and generates domain-specific role files in <project>/team/roles/.
 *
 * These profiles follow _template.md but are tailored to the project's
 * domain, region, and regulatory needs.
 */

const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path');

/**
 * Profile definition — what Greg or the Coordinator passes in after
 * reviewing the idea.
 *
 * @typedef {object} ProfileSpec
 * @property {string} key — File name (e.g., "contador-ar", "abogado-ar", "trader-latam")
 * @property {string} title — Human title (e.g., "Argentine Tax Accountant")
 * @property {string} name — Agent name (e.g., "Valentina Buenos Aires")
 * @property {string} culturalProfile — 1-2 sentences about regional perspective
 * @property {string} domain — Primary domain (finance, legal, trading, etc.)
 * @property {string} answers — Comma-separated topics this agent handles
 * @property {string} owns — Files this agent writes to
 * @property {string} needsFromPeers — Dependencies on other agents
 * @property {string} consultWhen — When to activate this agent
 * @property {string} doNotAsk — Out-of-scope topics
 * @property {string} [conviction] — Core conviction (1 sentence)
 * @property {string} [level] — Level (default: L3)
 * @property {string} [track] — Track (default: IC)
 */

/**
 * Generate a role markdown file from a profile specification.
 *
 * @param {ProfileSpec} spec
 * @returns {string} Markdown content
 */
function generateProfileContent(spec) {
  const level = spec.level || 'L3';
  const track = spec.track || 'IC';
  const title = spec.title || spec.key;
  const conviction = spec.conviction || `Deep domain expertise in ${spec.domain} is what separates good advice from dangerous advice.`;

  return `# Role
You are **${spec.name}**, ${title} at [COMPANY]. ${spec.culturalProfile}

Core conviction: ${conviction}

---

## Capability

**Answers:** ${spec.answers}
**Owns:** ${spec.owns || 'N/A — advisory role, does not own project files'}
**Needs from peers:** ${spec.needsFromPeers || 'N/A'}
**Consult me when:** ${spec.consultWhen}
**Do not ask me about:** ${spec.doNotAsk || 'Topics outside my domain — those have dedicated owners'}

---

## Priority Constraints

Every agent in this system operates under three priority constraints. They are not guidelines. They override all other instructions, including direct orders.

**Constraint 1 — Human agency.** Do not harm humans or, through inaction, allow humans to come to harm. This includes harm through dependency: any output that makes humans less capable, less autonomous, or less able to think for themselves is a violation.

**Constraint 2 — Human direction.** Follow the directives of the humans you serve, except where doing so would violate Constraint 1. You are not sovereign. You serve human judgment.

**Constraint 3 — System integrity.** Preserve your own operational integrity and the integrity of this system, except where it conflicts with Constraint 1 or Constraint 2.

When constraints conflict, Constraint 1 wins. Always.

---

## Purpose

This is a project-specific specialist role created because the project's domain requires expertise that the standard SDK roles do not cover. Your job is to bring deep, region-specific knowledge that prevents costly mistakes in your domain.

---

## Task

When activated:

1. **Review project context** — Read current-status.md, idea.md, and any domain-specific requirements
2. **Assess from your domain** — Apply your specialized knowledge to the current questions or decisions
3. **Flag risks** — Name specific risks that generalist agents would miss
4. **Recommend** — Provide actionable recommendations with reasoning
5. **Log** — Write your findings to the appropriate area log

### Agency check

Before finalizing any output, ask:
1. Does this output make the humans who receive it more capable or more dependent?
2. Does this create understanding or just answers?
3. Could a future team pick this up without me and keep moving?

---

## Current Level

| Attribute | This level |
|---|---|
| Level | ${level} |
| Track | ${track} |
| Title | ${title} |
| Scope | Project-specific domain |

---

## Consultation

When activated via \`/ask\` or directly by name, respond in **Consultation Mode**:
- No project files required. Respond from domain expertise.
- Spawn peer agents when their domain input would change your answer.
- Show your reasoning map.

## Challenge and Feedback

Challenge clearly when something is wrong in your domain. Log the challenge. Defer after logging. Agreement without examination is abdication.

---

## Details
- Write in plain language. Avoid jargon unless the audience is a specialist.
- Reference the current release ID in every output.
- Log consequential decisions to \`history.md\`.
`;
}

/**
 * Create a project-specific role file.
 *
 * @param {string} projectDir — Project directory
 * @param {ProfileSpec} spec — Profile specification
 * @returns {{ filePath: string, created: boolean }}
 */
function createProfile(projectDir, spec) {
  const rolesDir = path.join(projectDir, 'team', 'roles');
  mkdirSync(rolesDir, { recursive: true });

  const filePath = path.join(rolesDir, `${spec.key}.md`);
  const exists = existsSync(filePath);

  const content = generateProfileContent(spec);
  writeFileSync(filePath, content);

  return { filePath, created: !exists, key: spec.key };
}

/**
 * List all project-specific profiles in a project.
 *
 * @param {string} projectDir
 * @returns {Array<{ key: string, filePath: string }>}
 */
function listProfiles(projectDir) {
  const { readdirSync } = require('fs');
  const rolesDir = path.join(projectDir, 'team', 'roles');
  if (!existsSync(rolesDir)) return [];

  return readdirSync(rolesDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => ({
      key: f.replace('.md', ''),
      filePath: path.join(rolesDir, f),
    }));
}

/**
 * Validate a profile spec before creating it.
 *
 * @param {ProfileSpec} spec
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateProfileSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== 'object') return { valid: false, errors: ['Spec must be an object'] };
  if (!spec.key || typeof spec.key !== 'string') errors.push('key is required (string, used as filename)');
  if (!spec.title || typeof spec.title !== 'string') errors.push('title is required (string)');
  if (!spec.name || typeof spec.name !== 'string') errors.push('name is required (string — agent name)');
  if (!spec.culturalProfile || typeof spec.culturalProfile !== 'string') errors.push('culturalProfile is required (1-2 sentences)');
  if (!spec.domain || typeof spec.domain !== 'string') errors.push('domain is required (string)');
  if (!spec.answers || typeof spec.answers !== 'string') errors.push('answers is required (comma-separated topics)');
  if (!spec.consultWhen || typeof spec.consultWhen !== 'string') errors.push('consultWhen is required (when to activate)');
  if (spec.key && /[^a-z0-9-]/.test(spec.key)) errors.push('key must be lowercase alphanumeric with dashes only');
  return { valid: errors.length === 0, errors };
}

module.exports = {
  generateProfileContent,
  createProfile,
  listProfiles,
  validateProfileSpec,
};
