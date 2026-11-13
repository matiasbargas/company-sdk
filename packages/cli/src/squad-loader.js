'use strict';

/**
 * squad-loader.js — Load squad definitions from local, npm, or built-in sources.
 *
 * Resolution order:
 *   1. Local: <projectDir>/team/squads/<name>.md
 *   2. npm:   <projectDir>/node_modules/@team-sdk-squad/<name>/
 *   3. Built-in: <sdkRoot>/team/squads/<name>.md
 */

const { readFileSync, existsSync, readdirSync } = require('fs');
const path = require('path');
const { parseFrontmatter } = require('../../context/src/frontmatter');

/**
 * Parse a squad markdown file into a structured definition.
 */
function parseSquadFile(content, filePath) {
  const lines = content.split('\n');

  // Extract title
  const titleMatch = lines[0] && lines[0].match(/^#\s+Squad:\s*(.+)/);
  const name = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.md');

  // Extract metadata from blockquote header
  const metadata = {};
  for (const line of lines.slice(0, 10)) {
    const useMatch = line.match(/\*\*Use this squad when:\*\*\s*(.+)/);
    if (useMatch) metadata.useWhen = useMatch[1].trim();
    const sizeMatch = line.match(/\*\*Size:\*\*\s*(.+)/);
    if (sizeMatch) metadata.size = sizeMatch[1].trim();
    const rolesMatch = line.match(/\*\*Roles:\*\*\s*(.+)/);
    if (rolesMatch) metadata.rolesDescription = rolesMatch[1].trim();
    const durMatch = line.match(/\*\*Duration:\*\*\s*(.+)/);
    if (durMatch) metadata.duration = durMatch[1].trim();
  }

  // Extract role roster (header-aware: columns are located by name, so
  // `Role | Level | Required | Owns` and `Role | Level | Layer | Owns` both work)
  const roles = [];
  let inRoster = false;
  let header = null;
  let headerPassed = false;
  const splitRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  for (const line of lines) {
    if (/^##\s+Role Roster/.test(line)) { inRoster = true; continue; }
    if (inRoster && /^##\s/.test(line) && !/Role Roster/.test(line)) break;
    if (inRoster && line.startsWith('|')) {
      if (!headerPassed) {
        if (/^\|[\s|:-]+\|?\s*$/.test(line)) { headerPassed = true; continue; }
        header = splitRow(line).map(h => h.toLowerCase());
        continue;
      }
      const cells = splitRow(line);
      if (cells.filter(Boolean).length < 2) continue;
      const col = (name, fallback) => {
        const i = header ? header.indexOf(name) : -1;
        return (i >= 0 ? cells[i] : cells[fallback]) || '';
      };
      const requiredCell = header && header.includes('required') ? col('required', -1) : '';
      // ✅ (or "yes"/"required") = required; ⚡ / anything else = optional/conditional.
      // No Required column → every listed role is required.
      const required = !requiredCell || /✅|^yes\b|^required\b/i.test(requiredCell);
      const condition = required ? '' : requiredCell.replace(/^⚡\s*/, '').trim();
      roles.push({
        role: col('role', 0),
        level: col('level', 1),
        layer: header && header.includes('layer') ? col('layer', -1) : '',
        required,
        condition,
        owns: col('owns', header && header.length >= 4 ? 3 : 2),
      });
    }
  }

  // Extract activation sequence: one step per `### Phase …` heading, listing its roles
  const sequence = [];
  let inSeq = false;
  let current = null;
  let seqHeaderPassed = false;
  for (const line of lines) {
    if (/^##\s+Activation Sequence/.test(line)) { inSeq = true; continue; }
    if (!inSeq) continue;
    if (/^##\s/.test(line)) break;
    const phase = line.match(/^###\s+(.+)/);
    if (phase) {
      current = { phase: phase[1].trim(), roles: [] };
      sequence.push(current);
      seqHeaderPassed = false;
      continue;
    }
    if (current && line.startsWith('|')) {
      if (!seqHeaderPassed) { if (/^\|[\s|:-]+\|?\s*$/.test(line)) seqHeaderPassed = true; continue; }
      const cells = splitRow(line);
      const role = (cells[1] || '').replace(/\s+/g, ' ').trim();
      if (role && !current.roles.includes(role)) current.roles.push(role);
    }
  }

  // Extract purpose
  let purpose = '';
  let inPurpose = false;
  for (const line of lines) {
    if (/^##\s+Purpose/.test(line)) { inPurpose = true; continue; }
    if (inPurpose && /^##\s/.test(line)) break;
    if (inPurpose && line.trim()) purpose += line.trim() + ' ';
  }

  return {
    name,
    filePath,
    size: metadata.size || 'Unknown',
    duration: metadata.duration || '',
    useWhen: metadata.useWhen || '',
    purpose: purpose.trim(),
    roles,
    roleCount: roles.length,
    sequence: sequence.filter(p => p.roles.length > 0),
    raw: content,
  };
}

/**
 * Parse an npm squad package (reads package.json + squad.md or index.md).
 */
function parseNpmSquad(packageDir) {
  const pkgJsonPath = path.join(packageDir, 'package.json');
  if (!existsSync(pkgJsonPath)) return null;

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  const teamSdk = pkgJson['team-sdk'] || {};
  if (teamSdk.type !== 'squad') return null;

  // Look for squad file
  const squadFile = path.join(packageDir, 'squad.md') ||
    path.join(packageDir, 'index.md');
  let definition = null;
  for (const candidate of ['squad.md', 'index.md', 'README.md']) {
    const fp = path.join(packageDir, candidate);
    if (existsSync(fp)) {
      definition = parseSquadFile(readFileSync(fp, 'utf8'), fp);
      break;
    }
  }

  return {
    name: pkgJson.name,
    version: pkgJson.version || '0.0.0',
    source: 'npm',
    teamSdk,
    definition,
    roles: teamSdk.roles || [],
    customRoles: teamSdk.customRoles || [],
    packageDir,
  };
}

/**
 * Load a squad by name with resolution order: local → npm → built-in.
 *
 * @param {string} name — Squad name (e.g., "startup", "fintech")
 * @param {object} [options]
 * @param {string} [options.projectDir] — Project directory (for local squads)
 * @param {string} [options.sdkRoot] — SDK root directory (for built-in squads)
 * @returns {{ squad: object, source: string } | null}
 */
function loadSquad(name, options = {}) {
  // Skip template/internal files
  if (name.startsWith('_')) return null;

  const { projectDir, sdkRoot } = options;

  // 1. Local project override
  if (projectDir) {
    const localPath = path.join(projectDir, 'team', 'squads', `${name}.md`);
    if (existsSync(localPath)) {
      const content = readFileSync(localPath, 'utf8');
      return {
        squad: parseSquadFile(content, localPath),
        source: 'local',
      };
    }
  }

  // 2. npm package
  if (projectDir) {
    const npmDir = path.join(projectDir, 'node_modules', '@team-sdk-squad', name);
    if (existsSync(npmDir)) {
      const npmSquad = parseNpmSquad(npmDir);
      if (npmSquad) {
        return { squad: npmSquad, source: 'npm' };
      }
    }
  }

  // 3. Built-in SDK squad
  if (sdkRoot) {
    const builtInPath = path.join(sdkRoot, 'team', 'squads', `${name}.md`);
    if (existsSync(builtInPath)) {
      const content = readFileSync(builtInPath, 'utf8');
      return {
        squad: parseSquadFile(content, builtInPath),
        source: 'built-in',
      };
    }
  }

  return null;
}

/**
 * List all available squads from all sources.
 *
 * @param {object} [options]
 * @param {string} [options.projectDir]
 * @param {string} [options.sdkRoot]
 * @returns {object[]}
 */
function listSquads(options = {}) {
  const { projectDir, sdkRoot } = options;
  const squads = [];
  const seen = new Set();

  // Local squads
  if (projectDir) {
    const localDir = path.join(projectDir, 'team', 'squads');
    if (existsSync(localDir)) {
      for (const file of readdirSync(localDir)) {
        if (file.startsWith('_') || !file.endsWith('.md')) continue;
        const name = file.replace('.md', '');
        if (seen.has(name)) continue;
        seen.add(name);
        const content = readFileSync(path.join(localDir, file), 'utf8');
        squads.push({
          ...parseSquadFile(content, path.join(localDir, file)),
          source: 'local',
        });
      }
    }
  }

  // npm squads
  if (projectDir) {
    const npmScope = path.join(projectDir, 'node_modules', '@team-sdk-squad');
    if (existsSync(npmScope)) {
      for (const dir of readdirSync(npmScope)) {
        if (seen.has(dir)) continue;
        const npmSquad = parseNpmSquad(path.join(npmScope, dir));
        if (npmSquad) {
          seen.add(dir);
          squads.push({ ...npmSquad, source: 'npm' });
        }
      }
    }
  }

  // Built-in squads
  if (sdkRoot) {
    const builtInDir = path.join(sdkRoot, 'team', 'squads');
    if (existsSync(builtInDir)) {
      for (const file of readdirSync(builtInDir)) {
        if (file.startsWith('_') || !file.endsWith('.md')) continue;
        const name = file.replace('.md', '');
        if (seen.has(name)) continue;
        seen.add(name);
        const content = readFileSync(path.join(builtInDir, file), 'utf8');
        squads.push({
          ...parseSquadFile(content, path.join(builtInDir, file)),
          source: 'built-in',
        });
      }
    }
  }

  return squads;
}

module.exports = {
  loadSquad,
  listSquads,
  parseSquadFile,
  parseNpmSquad,
};
