'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { generateProfileContent, createProfile, listProfiles, validateProfileSpec } = require('../src/profile-generator');
const { resolveRoleToFile, listRoles } = require('../src/role-resolver');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

function eq(a, b, label) {
  assert(a === b, `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

const sdkRoot = path.resolve(__dirname, '../../../');
const tmpDir = path.join(os.tmpdir(), `team-sdk-profiles-test-${Date.now()}`);

function cleanup() {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
}
cleanup();

// --- validateProfileSpec ---

// Valid spec
{
  const result = validateProfileSpec({
    key: 'contador-ar',
    title: 'Argentine Tax Accountant',
    name: 'Valentina Buenos Aires',
    culturalProfile: 'Brings Argentine financial regulation intuition shaped by decades of economic volatility.',
    domain: 'finance',
    answers: 'Argentine tax law, bienes personales, ganancias, REIBP, fiscal domicile',
    consultWhen: 'Any tax, accounting, or fiscal question specific to Argentina',
  });
  eq(result.valid, true, 'valid spec passes');
  eq(result.errors.length, 0, 'no errors on valid spec');
}

// Missing fields
{
  const result = validateProfileSpec({});
  assert(result.errors.length > 0, 'empty spec has errors');
  assert(result.errors.some(e => e.includes('key')), 'missing key error');
  assert(result.errors.some(e => e.includes('title')), 'missing title error');
  assert(result.errors.some(e => e.includes('name')), 'missing name error');
  assert(result.errors.some(e => e.includes('culturalProfile')), 'missing culturalProfile error');
  assert(result.errors.some(e => e.includes('domain')), 'missing domain error');
  assert(result.errors.some(e => e.includes('answers')), 'missing answers error');
  assert(result.errors.some(e => e.includes('consultWhen')), 'missing consultWhen error');
}

// Invalid key format
{
  const result = validateProfileSpec({
    key: 'Bad Key!',
    title: 'T', name: 'N', culturalProfile: 'C',
    domain: 'd', answers: 'a', consultWhen: 'c',
  });
  assert(result.errors.some(e => e.includes('lowercase')), 'invalid key format error');
}

// Null spec
{
  const result = validateProfileSpec(null);
  eq(result.valid, false, 'null spec is invalid');
}

// --- generateProfileContent ---
{
  const content = generateProfileContent({
    key: 'contador-ar',
    title: 'Argentine Tax Accountant',
    name: 'Valentina Buenos Aires',
    culturalProfile: 'Brings Argentine financial regulation intuition.',
    domain: 'finance',
    answers: 'Argentine tax, bienes personales, ganancias',
    owns: 'N/A',
    needsFromPeers: 'CLO for legal interpretation',
    consultWhen: 'Any Argentine tax question',
    doNotAsk: 'US tax law',
    conviction: 'In Argentina, tax planning is survival, not optimization.',
    level: 'L4',
    track: 'IC',
  });

  assert(content.includes('Valentina Buenos Aires'), 'content includes name');
  assert(content.includes('Argentine Tax Accountant'), 'content includes title');
  assert(content.includes('Argentine financial regulation'), 'content includes cultural profile');
  assert(content.includes('bienes personales'), 'content includes answers');
  assert(content.includes('tax planning is survival'), 'content includes conviction');
  assert(content.includes('L4'), 'content includes level');
  assert(content.includes('CLO'), 'content includes peers');
  assert(content.includes('US tax law'), 'content includes doNotAsk');
  assert(content.includes('Consultation Mode'), 'content includes consultation section');
  assert(content.includes('Challenge'), 'content includes challenge section');
  assert(content.includes('Priority Constraints'), 'content includes constraints');
}

// Default conviction and level
{
  const content = generateProfileContent({
    key: 'test', title: 'Test', name: 'Test Name',
    culturalProfile: 'Profile.', domain: 'testing',
    answers: 'testing', consultWhen: 'testing',
  });
  assert(content.includes('L3'), 'default level is L3');
  assert(content.includes('Deep domain expertise'), 'default conviction present');
}

// --- createProfile ---
{
  fs.mkdirSync(tmpDir, { recursive: true });
  const result = createProfile(tmpDir, {
    key: 'contador-ar',
    title: 'Argentine Tax Accountant',
    name: 'Valentina Buenos Aires',
    culturalProfile: 'Argentine financial regulation.',
    domain: 'finance',
    answers: 'Argentine tax',
    consultWhen: 'Argentine tax questions',
  });

  assert(result.filePath.includes('contador-ar.md'), 'creates file with correct name');
  eq(result.created, true, 'reports as newly created');
  assert(fs.existsSync(result.filePath), 'file exists on disk');

  const content = fs.readFileSync(result.filePath, 'utf8');
  assert(content.includes('Valentina Buenos Aires'), 'file content has name');
}

// Create another profile
{
  const result = createProfile(tmpDir, {
    key: 'abogado-ar',
    title: 'Argentine Corporate Lawyer',
    name: 'Santiago Córdoba',
    culturalProfile: 'Argentine legal system perspective.',
    domain: 'legal',
    answers: 'Argentine corporate law',
    consultWhen: 'Argentine legal questions',
  });
  eq(result.created, true, 'second profile created');
}

// Overwrite existing
{
  const result = createProfile(tmpDir, {
    key: 'contador-ar',
    title: 'Argentine Tax Accountant (Updated)',
    name: 'Valentina Buenos Aires',
    culturalProfile: 'Updated profile.',
    domain: 'finance',
    answers: 'Argentine tax',
    consultWhen: 'Argentine tax questions',
  });
  eq(result.created, false, 'overwrite reports as not newly created');
}

// --- listProfiles ---
{
  const profiles = listProfiles(tmpDir);
  assert(profiles.length >= 2, `lists at least 2 profiles (got ${profiles.length})`);
  assert(profiles.some(p => p.key === 'contador-ar'), 'lists contador-ar');
  assert(profiles.some(p => p.key === 'abogado-ar'), 'lists abogado-ar');
}

// Empty project
{
  const emptyDir = path.join(tmpDir, 'empty-project');
  fs.mkdirSync(emptyDir, { recursive: true });
  const profiles = listProfiles(emptyDir);
  eq(profiles.length, 0, 'empty project has no profiles');
}

// --- resolveRoleToFile with project roles ---

// Resolve project-level role
{
  const result = resolveRoleToFile('contador-ar', { sdkRoot, projectDir: tmpDir });
  assert(result !== null, 'resolves project role');
  eq(result.key, 'contador-ar', 'project role key correct');
  eq(result.source, 'project', 'source is project');
  assert(result.filePath.includes(tmpDir), 'file path is in project dir');
}

// SDK role still resolves
{
  const result = resolveRoleToFile('cto', { sdkRoot, projectDir: tmpDir });
  assert(result !== null, 'SDK role still resolves');
  eq(result.key, 'cto', 'SDK role key correct');
  eq(result.source, 'sdk', 'source is sdk');
}

// Project role without projectDir falls through to SDK
{
  const result = resolveRoleToFile('contador-ar', { sdkRoot });
  eq(result, null, 'project role not found without projectDir');
}

// --- listRoles with project roles ---
{
  const roles = listRoles({ sdkRoot, projectDir: tmpDir });
  assert(roles.length > 20, `lists SDK + project roles (got ${roles.length})`);
  assert(roles.some(r => r.key === 'contador-ar' && r.source === 'project'), 'includes project role');
  assert(roles.some(r => r.key === 'cto' && r.source === 'sdk'), 'includes SDK role');
}

// Filter by project group
{
  const roles = listRoles({ sdkRoot, projectDir: tmpDir, group: 'project' });
  assert(roles.length >= 2, 'project group filter returns project roles');
  assert(roles.every(r => r.source === 'project'), 'all are project roles');
}

// --- Test with real project (axecap) ---
{
  const axecapDir = '/Users/matias.bargas/dev/ai-repos/axecap';
  if (fs.existsSync(path.join(axecapDir, 'team', 'roles'))) {
    const profiles = listProfiles(axecapDir);
    assert(profiles.length > 0, `axecap has project profiles (got ${profiles.length})`);

    const roles = listRoles({ sdkRoot, projectDir: axecapDir });
    assert(roles.some(r => r.source === 'project'), 'axecap has project-source roles in listing');
  }
}

cleanup();

console.log(`  test-profiles: ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
