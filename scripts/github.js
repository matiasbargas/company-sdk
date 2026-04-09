#!/usr/bin/env node

/**
 * github.js — sdk-github: GitHub native integration (Iteration 3)
 *
 * Usage:
 *   sdk-github link <project-dir> --repo owner/repo
 *   sdk-github sync-issues <project-dir>
 *   sdk-github release <project-dir> [--release-id v2026.Q2.1]
 *   sdk-github status <project-dir>
 *
 * Auth: TEAM_SDK_GITHUB_TOKEN environment variable (PAT with repo scope).
 * Never uses GITHUB_TOKEN — avoids collision with Actions-injected token.
 *
 * No octokit. Direct Node.js https calls. Pagination and rate-limit
 * backoff centralized here. All GitHub I/O goes through this file.
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const RELEASE_RE = /^v\d{4}\.Q[1-4]\.\d+$/;

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getToken() {
  const token = process.env.TEAM_SDK_GITHUB_TOKEN;
  if (!token) {
    // Warn if GITHUB_TOKEN is set but TEAM_SDK_GITHUB_TOKEN is not
    if (process.env.GITHUB_TOKEN) {
      console.error(`\nError: GITHUB_TOKEN is set but TEAM_SDK_GITHUB_TOKEN is not.`);
      console.error(`sdk-github uses TEAM_SDK_GITHUB_TOKEN to avoid conflicts with`);
      console.error(`Actions-injected tokens. Set TEAM_SDK_GITHUB_TOKEN and retry.\n`);
    } else {
      console.error(`\nError: TEAM_SDK_GITHUB_TOKEN is not set.`);
      console.error(`Export a GitHub PAT with "repo" scope:`);
      console.error(`  export TEAM_SDK_GITHUB_TOKEN=ghp_...\n`);
    }
    process.exit(1);
  }
  return token;
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

function apiRequest(method, endpoint, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path:     endpoint,
      method,
      headers: {
        'Authorization':        `Bearer ${token}`,
        'Accept':               'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent':           'company-sdk/3',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 204) return resolve(null);
        if (res.statusCode === 429) {
          const retry = parseInt(res.headers['retry-after'] || '60', 10);
          return reject(new Error(`GitHub rate limit hit. Retry after ${retry}s.`));
        }
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            return reject(new Error(`GitHub API ${res.statusCode}: ${parsed.message || data}`));
          }
          resolve(parsed);
        } catch (_) {
          if (res.statusCode >= 400) return reject(new Error(`GitHub API ${res.statusCode}: ${data}`));
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Paginate through a GET endpoint returning arrays
async function paginatedGet(endpoint, token) {
  const results = [];
  let page = 1;
  while (true) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const data = await apiRequest('GET', `${endpoint}${sep}per_page=100&page=${page}`, null, token);
    if (!data || !data.length) break;
    results.push(...data);
    if (data.length < 100) break;
    page++;
  }
  return results;
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

function getRepo(projectDir) {
  const sdkrc = readSdkrc(projectDir);
  return sdkrc.github && sdkrc.github.repo ? sdkrc.github.repo : null;
}

// ─── Requirements parser ─────────────────────────────────────────────────────

function parsePendingItems(projectDir) {
  const files = [
    'product-requirements.md',
    'engineering-requirements.md',
    'general-requirements.md',
  ];

  const items = [];
  for (const file of files) {
    const fullPath = path.join(projectDir, file);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines   = content.split('\n');
    let currentSection = null;

    for (const line of lines) {
      if (/^##+ /.test(line)) {
        currentSection = line.replace(/^##+ /, '').trim();
      }
      const m = line.match(/^- \[ \] (.+)$/);
      if (m) {
        items.push({
          text:    m[1].trim(),
          file,
          section: currentSection || 'General',
          label:   labelFor(file),
        });
      }
    }
  }
  return items;
}

function labelFor(file) {
  if (file.startsWith('product'))     return 'sdk:product';
  if (file.startsWith('engineering')) return 'sdk:engineering';
  return 'sdk:general';
}

// ─── Release notes parser ────────────────────────────────────────────────────

function parseLatestHistoryEntry(projectDir, releaseId) {
  const historyFile = path.join(projectDir, 'history.md');
  if (!fs.existsSync(historyFile)) return null;

  const content   = fs.readFileSync(historyFile, 'utf8');
  const headingRe = new RegExp(`## \\[${releaseId.replace(/\./g, '\\.')}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`);
  const m         = content.match(headingRe);
  return m ? m[0].trim() : null;
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function cmdLink(projectDir, repo) {
  if (!repo || !repo.includes('/')) {
    console.error('Error: --repo must be in owner/repo format (e.g. acme/my-saas)');
    process.exit(2);
  }

  const token = getToken();

  // Verify repo exists
  await apiRequest('GET', `/repos/${repo}`, null, token);
  console.log(`✓ Repo ${repo} found`);

  const sdkrc = readSdkrc(projectDir);
  sdkrc.github = { ...(sdkrc.github || {}), repo };
  writeSdkrc(projectDir, sdkrc);
  console.log(`Linked: ${projectDir} → github.com/${repo}`);
  console.log(`\nNext: sdk-github sync-issues ${path.basename(projectDir)}`);
}

async function cmdSyncIssues(projectDir) {
  const token = getToken();
  const repo  = getRepo(projectDir);
  if (!repo) {
    console.error(`No GitHub repo linked. Run: sdk-github link ${projectDir} --repo owner/repo`);
    process.exit(1);
  }

  const sdkrc    = readSdkrc(projectDir);
  const releaseId = sdkrc.releaseId || 'current';
  const milestone = releaseId;

  // Get or create milestone
  let milestoneNumber = null;
  const milestones = await paginatedGet(`/repos/${repo}/milestones`, token);
  const existing   = milestones.find(m => m.title === milestone);
  if (existing) {
    milestoneNumber = existing.number;
    console.log(`Milestone "${milestone}" exists (#${milestoneNumber})`);
  } else {
    const created = await apiRequest('POST', `/repos/${repo}/milestones`, { title: milestone }, token);
    milestoneNumber = created.number;
    console.log(`Created milestone "${milestone}" (#${milestoneNumber})`);
  }

  // Get existing issues to avoid duplicates
  const existingIssues = await paginatedGet(`/repos/${repo}/issues?state=all`, token);
  const existingTitles = new Set(existingIssues.map(i => i.title.trim()));

  const items   = parsePendingItems(projectDir);
  let created   = 0;
  let skipped   = 0;

  console.log(`\nSyncing ${items.length} pending items...\n`);

  for (const item of items) {
    if (existingTitles.has(item.text)) {
      console.log(`  skip  ${item.text}`);
      skipped++;
      continue;
    }

    await apiRequest('POST', `/repos/${repo}/issues`, {
      title:     item.text,
      body:      `From SDK requirements: \`${item.file}\` — section: ${item.section}\n\nSynced by sdk-github sync-issues.`,
      labels:    [item.label, 'sdk'],
      milestone: milestoneNumber,
    }, token);

    console.log(`  +     ${item.text}`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped (already exist)`);
}

async function cmdRelease(projectDir, releaseId) {
  const token = getToken();
  const repo  = getRepo(projectDir);
  if (!repo) {
    console.error(`No GitHub repo linked. Run: sdk-github link ${projectDir} --repo owner/repo`);
    process.exit(1);
  }

  if (!releaseId) {
    const sdkrc = readSdkrc(projectDir);
    releaseId = sdkrc.releaseId;
    if (!releaseId) {
      console.error('No release ID found in .sdkrc. Pass --release-id v2026.Q2.1');
      process.exit(1);
    }
  }

  const body = parseLatestHistoryEntry(projectDir, releaseId);
  if (!body) {
    console.error(`No history.md entry found for ${releaseId}.`);
    console.error(`Add one with: sdk-doc decision history.md --decision "Release ${releaseId}" ...`);
    process.exit(1);
  }

  const release = await apiRequest('POST', `/repos/${repo}/releases`, {
    tag_name: releaseId,
    name:     releaseId,
    body,
    draft:    false,
    prerelease: false,
  }, token);

  console.log(`✅  GitHub release created: ${release.html_url}`);
}

async function cmdStatus(projectDir) {
  const token = getToken();
  const repo  = getRepo(projectDir);

  if (!repo) {
    console.log(`No GitHub repo linked.`);
    console.log(`Run: sdk-github link ${projectDir} --repo owner/repo`);
    return;
  }

  const repoData = await apiRequest('GET', `/repos/${repo}`, null, token);
  const issues   = await paginatedGet(`/repos/${repo}/issues?state=open`, token);
  const sdkIssues = issues.filter(i => i.labels && i.labels.some(l => l.name === 'sdk'));

  console.log(`\n  GitHub: ${repo}`);
  console.log(`  Stars:  ${repoData.stargazers_count}`);
  console.log(`  Open SDK issues: ${sdkIssues.length}`);
  if (sdkIssues.length > 0) {
    console.log('');
    for (const i of sdkIssues.slice(0, 10)) {
      console.log(`    #${i.number}  ${i.title}`);
    }
    if (sdkIssues.length > 10) console.log(`    ... and ${sdkIssues.length - 10} more`);
  }
  console.log('');
}

// ─── CLI entrypoint ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (!args.length || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  sdk-github link <project-dir> --repo owner/repo   # link to GitHub repo
  sdk-github sync-issues <project-dir>              # create issues from pending requirements
  sdk-github release <project-dir> [--release-id v2026.Q2.1]  # create GitHub release
  sdk-github status <project-dir>                   # show sync state

Auth: set TEAM_SDK_GITHUB_TOKEN (PAT with repo scope).
`);
  process.exit(0);
}

const command    = args[0];
const projectArg = args[1];

if (!projectArg) {
  console.error(`Error: project directory required.`);
  console.error(`Usage: sdk-github <command> <project-dir> [options]`);
  process.exit(2);
}

const projectDir = path.resolve(projectArg);

if (!fs.existsSync(projectDir)) {
  console.error(`Error: project directory not found: ${projectDir}`);
  process.exit(2);
}

function getFlag(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

(async () => {
  try {
    switch (command) {
      case 'link':
        await cmdLink(projectDir, getFlag('--repo'));
        break;
      case 'sync-issues':
        await cmdSyncIssues(projectDir);
        break;
      case 'release':
        await cmdRelease(projectDir, getFlag('--release-id'));
        break;
      case 'status':
        await cmdStatus(projectDir);
        break;
      default:
        console.error(`Unknown command: "${command}". Use link, sync-issues, release, or status.`);
        process.exit(2);
    }
  } catch (e) {
    console.error(`\nError: ${e.message}\n`);
    process.exit(1);
  }
})();
