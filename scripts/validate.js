#!/usr/bin/env node

/**
 * validate.js — sdk-validate: advisory-mode project health check (VS-01 + VS-02)
 *
 * Checks a project directory against SDK required structure.
 * Advisory mode (default): reports all issues as warnings, exits 0.
 * Strict mode (--strict): exits 1 if any issues found.
 *
 * Usage:
 *   node scripts/validate.js <project-dir>           # advisory mode
 *   node scripts/validate.js <project-dir> --strict  # strict mode (exit 1 on any failure)
 *   node scripts/validate.js --help
 *
 * Exit codes:
 *   0 — clean (advisory mode always), or clean in strict mode
 *   1 — issues found in strict mode
 *   2 — usage error
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const {
  REQUIRED_FILES,
  REQUIRED_SECTIONS,
  PLACEHOLDER_PATTERNS,
  ALLOWED_EMPTY_SECTIONS,
} = require('./lib/validate-config');

// ─── Core validation logic (exported for sdk-ship integration) ────────────────

/**
 * validate(projectDir) → { warnings: string[], clean: boolean }
 *
 * Runs all checks and returns the full list of warning strings.
 * Does NOT exit — callers decide what to do with the result.
 */
function validate(projectDir) {
  const warnings = [];

  // ── Check 1: Required files exist ─────────────────────────────────────────
  for (const relPath of REQUIRED_FILES) {
    const fullPath = path.join(projectDir, relPath);
    if (!fs.existsSync(fullPath)) {
      warnings.push(
        `WARN  ${relPath} is missing — create it with: sdk-doc append ${relPath} --section "# ${relPath}" --content "..."`
      );
    }
  }

  // ── Check 2: Placeholder detection ────────────────────────────────────────
  for (const relPath of REQUIRED_FILES) {
    const fullPath = path.join(projectDir, relPath);
    if (!fs.existsSync(fullPath)) continue; // already warned above

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines   = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Strip inline code spans (e.g. `[PLACEHOLDER]`) before checking — ticket
      // descriptions that document the placeholder syntax should not self-trigger.
      const checkable = line.replace(/`[^`]*`/g, '');
      for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(checkable)) {
          const section    = nearestSection(lines, i);
          const sectionHint = section ? ` in section '${section}'` : '';
          warnings.push(
            `WARN  ${relPath}${sectionHint} has unfilled placeholder on line ${i + 1}: "${line.trim()}" — run: sdk-doc append ${relPath} --section "${section || '##'}" --content "..."`
          );
          break; // one warning per line
        }
      }
    }
  }

  // ── Check 3: Required sections present and non-empty ──────────────────────
  for (const relPath of REQUIRED_FILES) {
    const requiredSections = REQUIRED_SECTIONS[relPath];
    if (!requiredSections || requiredSections.length === 0) continue;

    const fullPath = path.join(projectDir, relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content  = fs.readFileSync(fullPath, 'utf8');
    const sections = parseSections(content);

    for (const heading of requiredSections) {
      if (ALLOWED_EMPTY_SECTIONS.has(heading)) continue;

      const body = sections.get(heading);
      if (body === undefined) {
        warnings.push(
          `WARN  ${relPath} is missing required section '${heading}' — run: sdk-doc append ${relPath} --section "${heading}" --content "..."`
        );
      } else if (body.trim() === '') {
        warnings.push(
          `WARN  ${relPath} section '${heading}' is empty — fill it in: sdk-doc append ${relPath} --section "${heading}" --content "..."`
        );
      }
    }
  }

  return { warnings, clean: warnings.length === 0 };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nearestSection(lines, lineIndex) {
  for (let i = lineIndex; i >= 0; i--) {
    if (/^#{1,3} /.test(lines[i])) return lines[i].replace(/^#+\s*/, '').trim();
  }
  return null;
}

function parseSections(content) {
  const map   = new Map();
  const lines = content.split('\n');
  let current = null;
  let body    = [];

  for (const line of lines) {
    if (/^#{1,3} /.test(line)) {
      if (current !== null) map.set(current, body.join('\n'));
      current = line.replace(/^#+\s*/, '').trim();
      body    = [];
    } else if (current !== null) {
      body.push(line);
    }
  }
  if (current !== null) map.set(current, body.join('\n'));
  return map;
}

module.exports = { validate };

// ─── CLI entrypoint ───────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  node scripts/validate.js <project-dir>           # advisory mode (always exits 0)
  node scripts/validate.js <project-dir> --strict  # strict mode (exits 1 on failure)

Checks:
  1. Required files exist
  2. No unfilled placeholder tokens in required files
  3. Required sections present and non-empty (per validate-config.js)

All warnings name the exact file, the exact issue, and the exact command to fix it.
`);
    process.exit(0);
  }

  const strictMode = args.includes('--strict');
  const projectArg = args.find(a => !a.startsWith('--'));

  if (!projectArg) {
    console.error('Error: project directory argument required.');
    console.error('Usage: node scripts/validate.js <project-dir>');
    process.exit(2);
  }

  const dir = path.resolve(projectArg);

  if (!fs.existsSync(dir)) {
    console.error(`Error: project directory not found: ${dir}`);
    process.exit(2);
  }

  const { warnings, clean } = validate(dir);

  if (clean) {
    console.log(`sdk-validate: ${dir}`);
    console.log('  All required files present. No placeholder issues detected.');
    console.log('  Project is clean.');
  } else {
    console.log(`sdk-validate: ${dir}\n`);
    for (const w of warnings) {
      console.warn(`  ${w}`);
    }
    console.log(`\n  ${warnings.length} issue${warnings.length === 1 ? '' : 's'} found.`);
    if (strictMode) {
      console.log('  Strict mode — exiting 1.');
      process.exit(1);
    } else {
      console.log('  Advisory mode — run with --strict to enforce as a gate.');
    }
  }
}
