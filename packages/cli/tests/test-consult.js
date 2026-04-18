'use strict';

const { consult, suggestRole } = require('../src/consult');
const { createConsultant } = require('../src/consultant');
const { findSdkRoot } = require('../src/role-resolver');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

console.log('\n  test-consult.js');

const sdkRoot = findSdkRoot();

// ── consult with role ──────────────────────────────────────────────────
{
  const result = consult('What database should we use?', { role: 'cto', sdkRoot });
  assert(result.question === 'What database should we use?', 'Question preserved');
  assert(result.role !== null, 'Role resolved');
  assert(result.role.key === 'cto', 'Role key is cto');
  assert(result.roleData !== null, 'Role data loaded');
  assert(result.roleData.hasConsultation === true, 'Role has consultation');
  assert(result.rolePrompt !== null, 'Role prompt loaded');
  assert(result.rolePrompt.length > 100, 'Role prompt has content');
  assert(result.roleError === null, 'No role error');
}

// ── consult without role → defaults to coordinator ──────────────────────
{
  const result = consult('Where are we?', { sdkRoot });
  assert(result.role !== null, 'Default role resolved');
  assert(result.role.key === 'coordinator', 'Default role is coordinator');
}

// ── consult with unknown role ───────────────────────────────────────────
{
  const result = consult('Hello?', { role: 'janitor', sdkRoot });
  assert(result.role === null, 'Unknown role is null');
  assert(result.roleError !== null, 'Unknown role has error');
  assert(result.roleError.includes('Unknown role'), 'Error mentions unknown role');
}

// ── consult without project → context not available ─────────────────────
{
  const result = consult('What is our budget?', { role: 'cfo', sdkRoot });
  assert(result.context.available === false, 'No project: context not available');
  assert(result.context.projectDir === null, 'No project: projectDir is null');
  assert(result.relevantFiles.length === 0, 'No project: no relevant files');
}

// ── consult with project dir ────────────────────────────────────────────
{
  const projectDir = sdkRoot + '/project';
  const result = consult('What decisions were made?', { role: 'coordinator', projectDir, sdkRoot });
  // Project may or may not have context-index.json — test the structure
  assert(result.context.projectDir !== null, 'Project dir set');
}

// ── suggestRole ─────────────────────────────────────────────────────────
{
  assert(suggestRole('What database should we use?') === 'cto', 'suggestRole: database → cto');
  assert(suggestRole('Is this GDPR compliant?') === 'clo', 'suggestRole: GDPR → clo');
  assert(suggestRole('What is the threat model?') === 'ciso', 'suggestRole: threat → ciso');
  assert(suggestRole('How much does this cost?') === 'cfo', 'suggestRole: cost → cfo');
  assert(suggestRole('What features should we build?') === 'pm', 'suggestRole: feature → pm');
  assert(suggestRole('How should we design the interface?') === 'designer', 'suggestRole: design → designer');
  assert(suggestRole('What is the vision for the company?') === 'ceo', 'suggestRole: vision → ceo');
  assert(suggestRole('Random unrelated question') === 'coordinator', 'suggestRole: unknown → coordinator');
}

// ── createConsultant factory ────────────────────────────────────────────
{
  const consultant = createConsultant({ sdkRoot });

  // Interface check
  assert(typeof consultant.consult === 'function', 'Factory: has consult()');
  assert(typeof consultant.suggestRole === 'function', 'Factory: has suggestRole()');
  assert(typeof consultant.listRoles === 'function', 'Factory: has listRoles()');
  assert(typeof consultant.getRole === 'function', 'Factory: has getRole()');
  assert(typeof consultant.loadContext === 'function', 'Factory: has loadContext()');
  assert(typeof consultant.getSdkRoot === 'function', 'Factory: has getSdkRoot()');

  // consult via factory
  const result = consultant.consult('What is the architecture?', { role: 'cto' });
  assert(result.role.key === 'cto', 'Factory consult: role resolved');

  // listRoles via factory
  const roles = consultant.listRoles();
  assert(roles.length >= 25, `Factory listRoles: >= 25 (got ${roles.length})`);

  // getRole via factory
  const cto = consultant.getRole('cto');
  assert(cto !== null, 'Factory getRole: CTO loaded');
  assert(cto.title === 'CTO', 'Factory getRole: CTO title');

  // getRole unknown
  const nope = consultant.getRole('janitor');
  assert(nope === null, 'Factory getRole: unknown returns null');

  // getSdkRoot
  assert(consultant.getSdkRoot() !== null, 'Factory getSdkRoot: returns path');

  // loadContext without project
  const ctx = consultant.loadContext();
  assert(ctx.available === false, 'Factory loadContext: no project = not available');
}

// ── createConsultant with default projectDir ────────────────────────────
{
  const consultant = createConsultant({ sdkRoot, projectDir: sdkRoot + '/project' });
  const result = consultant.consult('Where are we?');
  assert(result.context.projectDir !== null, 'Factory with projectDir: context has projectDir');
}

console.log(`  ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
