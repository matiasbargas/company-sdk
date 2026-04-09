#!/usr/bin/env node

/**
 * cloud.js — sdk-cloud: CLI bridge to the company-sdk Pro cloud (Iteration 6)
 *
 * Commands:
 *   sdk-cloud login                         # device-code auth → ~/.sdk-credentials
 *   sdk-cloud logout                        # revoke and delete credentials
 *   sdk-cloud link <project-dir> --org <id> # associate project with cloud org
 *   sdk-cloud push <project-dir>            # snapshot project state → cloud
 *   sdk-cloud pull <project-dir>            # fetch latest snapshot → local
 *   sdk-cloud status <project-dir>          # show local vs cloud diff
 *   sdk-cloud projects list                 # list all projects in org
 *
 * Auth: ~/.sdk-credentials (JSON, mode 0600)
 * API:  COMPANY_SDK_API_URL env var, defaults to https://api.company-sdk.com
 *
 * Core constraint: every command fails gracefully if cloud is unreachable.
 * The free CLI must work 100% offline. Cloud is additive — never required.
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const os    = require('os');

const CREDENTIALS_FILE = path.join(os.homedir(), '.sdk-credentials');
const API_BASE = (process.env.COMPANY_SDK_API_URL || 'https://api.company-sdk.com').replace(/\/$/, '');

// Files synced to cloud (relative to project dir)
const SYNC_FILES = [
  'idea.md',
  'history.md',
  'current-status.md',
  'project-map.md',
  'discovery-requirements.md',
  'security-requirements.md',
  'business-requirements.md',
  'engineering-requirements.md',
  'product-requirements.md',
  'design-requirements.md',
  'general-requirements.md',
  'context-manifest.json',
  'team.md',
  'project.md',
];

// ─── Credentials ─────────────────────────────────────────────────────────────

function readCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  } catch (_) {
    return null;
  }
}

function writeCredentials(data) {
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.chmodSync(CREDENTIALS_FILE, 0o600);
}

function requireAuth() {
  const creds = readCredentials();
  if (!creds || !creds.token) {
    console.error('\nNot authenticated. Run: sdk-cloud login\n');
    process.exit(1);
  }
  // Check expiry
  if (creds.expiresAt && Date.now() > creds.expiresAt) {
    console.error('\nSession expired. Run: sdk-cloud login\n');
    process.exit(1);
  }
  return creds;
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

function apiRequest(method, endpoint, body, token) {
  return new Promise((resolve, reject) => {
    const url     = new URL(endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`);
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type':  'application/json',
        'User-Agent':    'company-sdk/3',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const protocol = url.protocol === 'https:' ? https : require('http');
    const req = protocol.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 204) return resolve(null);
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) return reject(new Error(`API ${res.statusCode}: ${parsed.error || parsed.message || data}`));
          resolve(parsed);
        } catch (_) {
          if (res.statusCode >= 400) return reject(new Error(`API ${res.statusCode}: ${data}`));
          resolve(data);
        }
      });
    });

    req.on('error', err => reject(new Error(`Network error: ${err.message}. Is cloud reachable?`)));
    if (payload) req.write(payload);
    req.end();
  });
}

// ─── .sdkrc helpers ──────────────────────────────────────────────────────────

function readSdkrc(projectDir) {
  const p = path.join(projectDir, '.sdkrc');
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return {}; }
}

function writeSdkrc(projectDir, data) {
  fs.writeFileSync(path.join(projectDir, '.sdkrc'), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ─── Snapshot helpers ─────────────────────────────────────────────────────────

function buildSnapshot(projectDir) {
  const files = {};
  for (const rel of SYNC_FILES) {
    const full = path.join(projectDir, rel);
    if (fs.existsSync(full)) {
      files[rel] = fs.readFileSync(full, 'utf8');
    }
  }
  return files;
}

function applySnapshot(projectDir, files, { backup = true } = {}) {
  const conflictsDir = path.join(projectDir, '.sdk-conflicts');
  const overwritten  = [];

  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(projectDir, rel);
    if (fs.existsSync(full)) {
      const local = fs.readFileSync(full, 'utf8');
      if (local !== content) {
        if (backup) {
          if (!fs.existsSync(conflictsDir)) fs.mkdirSync(conflictsDir, { recursive: true });
          fs.writeFileSync(
            path.join(conflictsDir, `${rel.replace(/\//g, '_')}.${Date.now()}.bak`),
            local, 'utf8'
          );
        }
        overwritten.push(rel);
      }
    }
    // Ensure parent dir exists
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }

  return overwritten;
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function cmdLogin() {
  console.log('\nsdk-cloud login\n');
  console.log(`Opening browser to complete authentication...`);
  console.log(`If your browser doesn't open, visit:\n  ${API_BASE}/cli-auth\n`);

  // Generate a device code
  let deviceData;
  try {
    deviceData = await apiRequest('POST', '/api/v1/auth/device-code', {}, null);
  } catch (e) {
    console.error(`\nCloud unavailable: ${e.message}`);
    console.error(`Check COMPANY_SDK_API_URL or try again when connected.\n`);
    process.exit(1);
  }

  const { deviceCode, userCode, verificationUrl, expiresIn = 300 } = deviceData;

  // Open browser
  const open = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start'
    : 'xdg-open';
  try {
    require('child_process').execSync(`${open} "${verificationUrl || `${API_BASE}/cli-auth?code=${userCode}`}"`, { stdio: 'ignore' });
  } catch (_) {}

  console.log(`Your device code: ${userCode}`);
  console.log(`Waiting for approval...`);

  // Poll
  const pollInterval = 2000;
  const deadline     = Date.now() + expiresIn * 1000;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, pollInterval));
    try {
      const result = await apiRequest('GET', `/api/v1/auth/device-status?code=${deviceCode}`, null, null);
      if (result && result.token) {
        writeCredentials({
          token:     result.token,
          orgId:     result.orgId,
          userId:    result.userId,
          expiresAt: Date.now() + (result.expiresIn || 86400) * 1000,
        });
        console.log(`\n✅  Authenticated. Credentials saved to ~/.sdk-credentials\n`);
        return;
      }
    } catch (e) {
      if (!e.message.includes('pending')) throw e;
    }
  }

  console.error('\nAuthentication timed out. Run sdk-cloud login again.\n');
  process.exit(1);
}

function cmdLogout() {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
    console.log('Logged out. Credentials removed.');
  } else {
    console.log('Not logged in.');
  }
}

async function cmdLink(projectDir, orgId) {
  const creds = requireAuth();
  const org   = orgId || creds.orgId;

  if (!org) {
    console.error('Error: --org is required if credentials do not include an orgId');
    process.exit(2);
  }

  const sdkrc       = readSdkrc(projectDir);
  const projectName = path.basename(projectDir);

  const project = await apiRequest('POST', '/api/v1/projects', {
    orgId: org,
    name:  projectName,
    type:  sdkrc.type || 'product',
  }, creds.token);

  sdkrc.cloud = {
    projectId: project.id,
    orgId:     org,
    tier:      project.tier || 'pro',
  };
  writeSdkrc(projectDir, sdkrc);

  console.log(`✓ Linked: ${projectName} → project ${project.id} (org ${org})`);
  console.log(`\nNext: sdk-cloud push ${path.basename(projectDir)}`);
}

async function cmdPush(projectDir) {
  const creds = requireAuth();
  const sdkrc = readSdkrc(projectDir);

  if (!sdkrc.cloud || !sdkrc.cloud.projectId) {
    console.error(`Project not linked. Run: sdk-cloud link ${projectDir}`);
    process.exit(1);
  }

  const files = buildSnapshot(projectDir);
  const count = Object.keys(files).length;

  console.log(`Pushing ${count} file(s)...`);

  const snapshot = await apiRequest(
    'POST',
    `/api/v1/projects/${sdkrc.cloud.projectId}/snapshots`,
    { files },
    creds.token
  );

  sdkrc.cloud.lastPush = new Date().toISOString();
  writeSdkrc(projectDir, sdkrc);

  console.log(`✅  Snapshot ${snapshot.id} pushed (${count} files)`);
}

async function cmdPull(projectDir) {
  const creds = requireAuth();
  const sdkrc = readSdkrc(projectDir);

  if (!sdkrc.cloud || !sdkrc.cloud.projectId) {
    console.error(`Project not linked. Run: sdk-cloud link ${projectDir}`);
    process.exit(1);
  }

  const snapshot = await apiRequest(
    'GET',
    `/api/v1/projects/${sdkrc.cloud.projectId}/snapshots/latest`,
    null,
    creds.token
  );

  if (!snapshot || !snapshot.files) {
    console.log('No remote snapshots found. Push first: sdk-cloud push');
    return;
  }

  const overwritten = applySnapshot(projectDir, snapshot.files, { backup: true });

  const total = Object.keys(snapshot.files).length;
  console.log(`✅  Pulled snapshot ${snapshot.id} (${total} files)`);
  if (overwritten.length > 0) {
    console.log(`\n  Overwrote local versions (backups in .sdk-conflicts/):`);
    for (const f of overwritten) console.log(`    ${f}`);
  }
}

async function cmdStatus(projectDir) {
  const creds = requireAuth();
  const sdkrc = readSdkrc(projectDir);

  if (!sdkrc.cloud || !sdkrc.cloud.projectId) {
    console.log(`Project not linked. Run: sdk-cloud link ${projectDir}`);
    return;
  }

  const snapshot = await apiRequest(
    'GET',
    `/api/v1/projects/${sdkrc.cloud.projectId}/snapshots/latest`,
    null,
    creds.token
  );

  const local  = buildSnapshot(projectDir);
  const remote = (snapshot && snapshot.files) || {};

  console.log(`\n  Cloud status: ${projectDir}\n`);

  let changed = 0;
  for (const f of SYNC_FILES) {
    const localContent  = local[f];
    const remoteContent = remote[f];
    if (!localContent && !remoteContent) continue;
    if (localContent === remoteContent) {
      console.log(`  =  ${f}`);
    } else if (!remoteContent) {
      console.log(`  +  ${f}  (local only — not yet pushed)`);
      changed++;
    } else if (!localContent) {
      console.log(`  -  ${f}  (remote only — run pull)`);
      changed++;
    } else {
      console.log(`  ~  ${f}  (diverged)`);
      changed++;
    }
  }

  if (changed === 0) {
    console.log('\n  In sync with cloud.');
  } else {
    console.log(`\n  ${changed} file(s) out of sync. Run sdk-cloud push or pull.`);
  }

  if (sdkrc.cloud.lastPush) {
    console.log(`  Last push: ${sdkrc.cloud.lastPush}`);
  }
  console.log('');
}

async function cmdProjectsList() {
  const creds = requireAuth();
  const projects = await apiRequest('GET', `/api/v1/orgs/${creds.orgId}/projects`, null, creds.token);

  if (!projects || !projects.length) {
    console.log('No projects found in your org. Run sdk-cloud link <project-dir> to add one.');
    return;
  }

  console.log('');
  for (const p of projects) {
    console.log(`  ${p.name}  [${p.id}]  ${p.type || 'product'}  last push: ${p.lastPushedAt || 'never'}`);
  }
  console.log('');
}

// ─── CLI entrypoint ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (!args.length || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  sdk-cloud login                           # authenticate (opens browser)
  sdk-cloud logout                          # revoke credentials
  sdk-cloud link <project-dir> [--org <id>] # link project to cloud org
  sdk-cloud push <project-dir>              # snapshot current state → cloud
  sdk-cloud pull <project-dir>              # fetch latest snapshot → local
  sdk-cloud status <project-dir>            # show local vs cloud diff
  sdk-cloud projects list                   # list all projects in org

Auth: runs device-code flow in your browser.
Credentials stored at: ~/.sdk-credentials (chmod 600)

The free CLI works 100% offline. Cloud is additive — never required.
`);
  process.exit(0);
}

const command = args[0];

function getFlag(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

(async () => {
  try {
    switch (command) {
      case 'login':
        await cmdLogin();
        break;
      case 'logout':
        cmdLogout();
        break;
      case 'link': {
        const dir = args[1];
        if (!dir) { console.error('Usage: sdk-cloud link <project-dir>'); process.exit(2); }
        await cmdLink(path.resolve(dir), getFlag('--org'));
        break;
      }
      case 'push': {
        const dir = args[1];
        if (!dir) { console.error('Usage: sdk-cloud push <project-dir>'); process.exit(2); }
        await cmdPush(path.resolve(dir));
        break;
      }
      case 'pull': {
        const dir = args[1];
        if (!dir) { console.error('Usage: sdk-cloud pull <project-dir>'); process.exit(2); }
        await cmdPull(path.resolve(dir));
        break;
      }
      case 'status': {
        const dir = args[1];
        if (!dir) { console.error('Usage: sdk-cloud status <project-dir>'); process.exit(2); }
        await cmdStatus(path.resolve(dir));
        break;
      }
      case 'projects':
        if (args[1] === 'list') {
          await cmdProjectsList();
        } else {
          console.error(`Unknown subcommand: sdk-cloud projects ${args[1] || ''}`);
          process.exit(2);
        }
        break;
      default:
        console.error(`Unknown command: "${command}". Run sdk-cloud --help.`);
        process.exit(2);
    }
  } catch (e) {
    console.error(`\nError: ${e.message}\n`);
    process.exit(1);
  }
})();
