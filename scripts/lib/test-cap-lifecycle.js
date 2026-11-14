#!/usr/bin/env node

/**
 * test-cap-lifecycle.js — black-box conformance tests for the project lifecycle bins
 * (sdk-init, sdk-bootstrap, sdk-update, sdk-squad, sdk-install-hooks, sdk-kill, sdk-version,
 * sdk-ship, sdk-github, sdk-retro). Spec: project/context/spec/sdk-lifecycle/claims.yaml.
 *
 * Every test drives the CLI through child_process against fresh mkdtemp dirs and asserts only
 * public interface: args, exit codes, files written, stdout lines. Nothing is written outside
 * os.tmpdir(): HOME and the git global config are redirected into the sandbox, no GitHub token
 * is passed, and sdk-ship never reaches a real remote (origin is a nonexistent local path).
 *
 * `// DEFECT:` marks an assertion that pins CURRENT (wrong) behaviour of a `status: defect`
 * capability, so the suite stays green while the bug is tracked in the spec.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const SDK = path.resolve(__dirname, '..', '..');
const SCRIPTS = path.join(SDK, 'scripts');

let passed = 0, failed = 0;
const assert = (c, n) => { if (c) passed++; else { failed++; console.log(`  ✗  ${n}`); } };

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-cap-life-'));
const HOME = path.join(sandbox, 'home');
fs.mkdirSync(HOME);
const gitconfig = path.join(sandbox, 'gitconfig');
fs.writeFileSync(gitconfig, '[user]\n\tname = t\n\temail = t@t\n[init]\n\tdefaultBranch = main\n');

const baseEnv = { ...process.env, HOME, USERPROFILE: HOME, GIT_CONFIG_GLOBAL: gitconfig, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' };
delete baseEnv.TEAM_SDK_GITHUB_TOKEN;
delete baseEnv.GITHUB_TOKEN;
delete baseEnv.GIT_DIR;
delete baseEnv.GIT_WORK_TREE;

function run(script, args, opts = {}) {
  const r = spawnSync(process.execPath, [path.join(opts.scriptsDir || SCRIPTS, script), ...args], {
    cwd: opts.cwd || sandbox,
    env: { ...baseEnv, ...(opts.env || {}) },
    input: opts.input,
    encoding: 'utf8',
    timeout: 60000,
  });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '', all: (r.stdout || '') + (r.stderr || '') };
}
const git = (cwd, ...a) => execFileSync('git', a, { cwd, env: baseEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const tmp = (name) => fs.mkdtempSync(path.join(sandbox, `${name}-`));
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);
const listRec = (dir) => {
  const out = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : out.push(path.relative(dir, p)); } };
  if (exists(dir)) walk(dir);
  return out.sort();
};
const sameTree = (a, b) => {
  const fa = listRec(a), fb = listRec(b);
  return fa.length > 0 && fa.join('\n') === fb.join('\n') && fa.every(f => read(path.join(a, f)) === read(path.join(b, f)));
};

const now = new Date();
const RELEASE = `v${now.getFullYear()}.Q${Math.ceil((now.getMonth() + 1) / 3)}.1`;
const TODAY = now.toISOString().slice(0, 10);

try {
  // ════════════════════════════════════════════════════════════════════ sdk-init

  // @covers cap-life-init-001
  {
    const r = run('init.js', ['--help']);
    const r0 = run('init.js', []);
    assert(r.code === 0 && /Usage:/.test(r.out) && /--squad/.test(r.out) && /--idea/.test(r.out), 'init --help prints usage, exit 0');
    assert(r0.code === 0 && /Usage:/.test(r0.out), 'init with no args prints usage, exit 0');
  }

  // @covers cap-life-init-002
  {
    const d = tmp('init-bad');
    const bad = run('init.js', ['x', '--output', path.join(d, 'p'), '--squad', 'research']);
    assert(bad.code === 1 && /Invalid squad type: "research"/.test(bad.err) && /website, mvp, feature, startup/.test(bad.err), 'init rejects an unknown squad (exit 1, lists valid squads)');
    assert(!exists(path.join(d, 'p')), 'rejected squad creates no output dir');
    const badType = run('init.js', ['x', '--output', path.join(d, 'q'), '--type', 'nope']);
    assert(badType.code === 1 && /Unknown project type: "nope"/.test(badType.err) && /Available types: .*product/.test(badType.err), 'init rejects an unknown --type (exit 1, lists available types)');
    assert(!exists(path.join(d, 'q')), 'rejected type creates no output dir');
    const badSrc = run('init.js', ['x', '--output', path.join(d, 's'), '--source', path.join(d, 'missing.pdf')]);
    assert(badSrc.code === 1 && /Source file not found/.test(badSrc.err) && !exists(path.join(d, 's')), 'init rejects a missing --source file (exit 1, nothing written)');
    fs.mkdirSync(path.join(d, 'exists'));
    fs.writeFileSync(path.join(d, 'exists', 'keep.txt'), 'keep');
    const clash = run('init.js', ['x', '--output', path.join(d, 'exists'), '--no-git']);
    assert(clash.code === 1 && /Directory already exists/.test(clash.err), 'init refuses an existing output dir (exit 1)');
    assert(listRec(path.join(d, 'exists')).join() === 'keep.txt', 'existing output dir is left untouched');
  }

  // Shared fixture: product project with idea, domains, source, git.
  const initRoot = tmp('init');
  const P = path.join(initRoot, 'proj');
  const srcDoc = path.join(initRoot, 'vision.md');
  fs.writeFileSync(srcDoc, '# Vision\nA vision.\n');
  const longIdea = 'A tool that helps solo founders track burn rate in real time, ' + 'with very long detail '.repeat(8);
  const initRun = run('init.js', ['demo-proj', '--output', P, '--squad', 'startup', '--idea', longIdea, '--domains', 'Platform Core:CTO, lending', '--source', srcDoc]);
  assert(initRun.code === 0, `init (product, startup) exits 0 — ${initRun.err.slice(0, 200)}`);

  // @covers cap-life-init-018
  {
    for (const f of ['protocol.md', 'protocol-core.md', 'SDK.md', 'AGENTS.md', 'CHARTER.md']) {
      const sdkCopy = path.join(SCRIPTS, '..', f);
      if (!exists(sdkCopy)) continue;
      assert(fs.readFileSync(path.join(P, f), 'utf8') === fs.readFileSync(sdkCopy, 'utf8'), `init copies ${f} verbatim`);
    }
    assert(/v\[YEAR\]\.Q\[QUARTER\]/.test(fs.readFileSync(path.join(P, 'protocol.md'), 'utf8')), 'protocol.md keeps its v[YEAR].Q[QUARTER] format template');
  }

  // @covers cap-life-init-003
  {
    for (const f of ['idea.md', 'current-status.md', 'history.md', 'project-map.md', 'CLAUDE.md', 'DISCLAIMER.md', '.gitignore', 'team.md', 'project.md', 'START_HERE.md', 'liaison-log.md', 'SQUAD.md']) {
      assert(exists(path.join(P, f)), `init scaffolds ${f}`);
    }
    assert(exists(path.join(P, 'sessions', 'temp')) && exists(path.join(P, 'sessions', 'permanent')), 'init creates sessions/temp and sessions/permanent');
    assert(read(path.join(P, 'SQUAD.md')).startsWith(read(path.join(SDK, 'team/squads/startup.md')).split('\n')[0]), 'SQUAD.md comes from team/squads/<squad>.md');
    for (const f of ['SDK.md', 'protocol.md', 'protocol-core.md', 'protocol-reference.md', 'AGENTS.md', 'STRATEGY.md', 'CHARTER.md']) {
      if (exists(path.join(SDK, f))) assert(exists(path.join(P, f)), `init copies SDK doc ${f}`);
    }
    assert(sameTree(path.join(SDK, 'team'), path.join(P, 'team')), 'init copies team/ verbatim (roles, levels, squads, types)');
    const claudeMd = read(path.join(P, 'CLAUDE.md'));
    assert(!/\{\{(PROJECT_NAME|PROJECT NAME|RELEASE|SQUAD|DATE|DOMAIN_CONTEXT)\}\}/.test(claudeMd) && claudeMd.includes('demo-proj'), 'template placeholders are substituted (project name lands in CLAUDE.md)');
    assert(/demo-proj\s+ready/.test(initRun.out) && /sdk-resume /.test(initRun.out), 'init prints a ready banner with the sdk-resume next step');
  }

  // @covers cap-life-init-004
  {
    // product type: all seven requirements files + all five logs, including research.
    for (const f of ['compliance', 'engineering', 'product', 'design', 'business', 'general', 'research']) {
      assert(exists(path.join(P, `${f}-requirements.md`)), `product type gets ${f}-requirements.md`);
    }
    for (const f of ['engineering', 'product', 'design', 'strategy', 'research']) assert(exists(path.join(P, `${f}-log.md`)), `product type gets ${f}-log.md`);
    const d = tmp('init-api');
    const A = path.join(d, 'api');
    const r = run('init.js', ['api-proj', '--output', A, '--type', 'api', '--no-git']);
    const apiCfg = JSON.parse(read(path.join(SDK, 'team/types/api.json')));
    assert(r.code === 0 && /Type:\s+api/.test(r.out), 'init --type api exits 0 and reports the type');
    assert(apiCfg.requirements_files.every(k => exists(path.join(A, `${k}-requirements.md`))), 'api type gets every requirements file its type config lists (incl. research)');
    assert(apiCfg.logs.every(k => exists(path.join(A, `${k}-log.md`))), 'api type gets every log its type config lists (incl. research-log)');
    assert(!exists(path.join(A, 'design-requirements.md')) && !exists(path.join(A, 'design-log.md')) && !exists(path.join(A, 'business-requirements.md')), 'files outside the type config are skipped');
    assert(/design-requirements\.md\s+\(skipped — not in type "api"\)/.test(r.out), 'skipped files are reported on stdout');
    assert(JSON.parse(read(path.join(A, '.sdkrc'))).type === 'api', '.sdkrc records the type');
    for (const t of fs.readdirSync(path.join(SDK, 'team/types')).filter(f => f.endsWith('.json') && !f.startsWith('_'))) {
      const cfg = JSON.parse(read(path.join(SDK, 'team/types', t)));
      assert(cfg.requirements_files.includes('research') && cfg.logs.includes('research'), `type ${t} maps research requirements + research log`);
    }
    // default squad + type
    const D = path.join(d, 'dflt');
    const rd = run('init.js', ['dflt', '--output', D, '--no-git']);
    const rc = JSON.parse(read(path.join(D, '.sdkrc')));
    assert(rd.code === 0 && rc.squad === 'mvp' && rc.type === 'product', 'defaults: --squad mvp, --type product');
  }

  // @covers cap-life-init-005
  {
    for (const sub of ['skills', 'agents', 'output-styles']) {
      if (exists(path.join(SDK, '.claude', sub))) assert(sameTree(path.join(SDK, '.claude', sub), path.join(P, '.claude', sub)), `init copies .claude/${sub}/ from the SDK verbatim`);
    }
    assert(exists(path.join(P, '.claude', 'skills', 'ask')), 'the /ask skill ships with the project');
  }

  // @covers cap-life-init-006
  {
    const views = fs.readdirSync(path.join(SDK, 'protocol')).filter(n => n.endsWith('.md'));
    assert(views.length > 0 && views.every(v => read(path.join(SDK, 'protocol', v)) === read(path.join(P, 'protocol', v))), 'init copies every protocol/ per-section view byte-for-byte');
  }

  // @covers cap-life-init-007
  {
    const rc = JSON.parse(read(path.join(P, '.sdkrc')));
    assert(rc.releaseId === RELEASE && /^v\d{4}\.Q[1-4]\.1$/.test(rc.releaseId), `.sdkrc releaseId is the current quarter's first increment (${RELEASE})`);
    assert(rc.squad === 'startup' && rc.projectName === 'demo-proj' && rc.type === 'product', '.sdkrc records squad, projectName, type');
    assert(path.resolve(rc.sdkPath) === SDK, '.sdkrc sdkPath points at the SDK that ran init');
    const L = rc.limits || {};
    assert(L.peerSpawns === null && L.discoveryRounds === null && L.loopIterations === null, '.sdkrc limits: spawn/round/iteration caps default to null (no cap)');
    for (const k of ['guardianCyclesBeforeEscalation', 'surfaceStaleCommits', 'statusStaleCommits', 'charterReviewEvery', 'refactorReviewLines', 'refactorReviewGrowthPct']) {
      assert(Number.isInteger(L[k]) && L[k] > 0, `.sdkrc limits.${k} is a positive integer`);
    }
    assert(!Object.keys(L).some(k => /Days$/.test(k)), '.sdkrc limits carry no day-based keys');
  }

  // @covers cap-life-init-008
  {
    const s = JSON.parse(read(path.join(P, '.claude', 'settings.json')));
    const allow = (s.permissions && s.permissions.allow) || [];
    assert(s.projectName === 'demo-proj' && s.releaseId === RELEASE && s.squad === 'startup' && s.createdAt === TODAY, 'settings.json records project, release, squad, createdAt');
    assert(allow.length > 0 && !allow.some(a => /^Bash\(node:\*\)$/.test(a) || /Bash\(\*\)/.test(a)), 'settings.json never grants blanket Bash(node:*)');
    const scoped = allow.map(a => a.match(/^Bash\(node (.+\.js):\*\)$/));
    assert(scoped.every(Boolean), 'every allow entry is Bash(node <absolute script>:*)');
    assert(scoped.every(m => m && path.isAbsolute(m[1]) && m[1].startsWith(path.join(SDK, 'scripts')) && exists(m[1])), 'every allowed script is an existing SDK script by absolute path');
    for (const name of ['doc', 'status', 'gate-check', 'validate', 'health', 'next', 'resume', 'consult']) {
      assert(allow.includes(`Bash(node ${path.join(SDK, 'scripts', name + '.js')}:*)`), `settings.json allows sdk ${name}`);
    }
    assert(s.outputStyle === 'Greg', 'settings.json outputStyle is Greg');
    const styles = listRec(path.join(P, '.claude', 'output-styles')).map(f => read(path.join(P, '.claude', 'output-styles', f)));
    assert(styles.some(c => /^name:\s*Greg\s*$/m.test(c)), 'an output style named Greg ships with the project');
    const ss = s.hooks && s.hooks.SessionStart && s.hooks.SessionStart[0];
    const pt = s.hooks && s.hooks.PreToolUse && s.hooks.PreToolUse[0];
    assert(ss && /startup/.test(ss.matcher) && /resume/.test(ss.matcher) && /compact/.test(ss.matcher), 'SessionStart hook matches startup|resume|clear|compact');
    assert(pt && pt.matcher === 'Edit|Write|NotebookEdit', 'PreToolUse hook guards Edit|Write|NotebookEdit');
    for (const h of [ss, pt]) {
      const m = h && h.hooks[0].command.match(/^node "(.+)"$/);
      assert(m && path.isAbsolute(m[1]) && exists(m[1]), `hook command runs an existing SDK script by absolute path (${h && h.hooks[0].command})`);
    }
  }

  // @covers cap-life-init-009
  {
    const idea = read(path.join(P, 'idea.md'));
    assert(idea.includes(longIdea), '--idea text is written into idea.md');
    assert(idea.includes('**Status:** Raw idea — being shaped') && !idea.includes('[Describe the idea in plain language.'), 'idea.md status flips to "being shaped" and the Section 1 placeholder is replaced');
    assert(read(path.join(P, 'CLAUDE.md')).includes(`**Idea:** ${longIdea}`), 'CLAUDE.md domain context quotes the idea');
    const h = read(path.join(P, 'history.md'));
    assert(h.includes(longIdea.slice(0, 120) + '...') && !h.includes(longIdea.slice(0, 121)), 'history Project Start quotes the idea truncated to 120 chars + "..."');
    assert(/idea\.md\s+← seeded with your idea/.test(initRun.out), 'stdout confirms the seeding');
  }

  // @covers cap-life-init-010
  {
    const st = read(path.join(P, 'current-status.md'));
    assert(st.includes('| Discovery | — | — | Pending | Owner to fill idea.md Section 4 and activate Greg |'), 'current-status Active Missions holds the Day 0 Discovery row');
    assert(st.includes(`- [ ] idea.md Section 4 brief complete | From: Owner | Since: ${TODAY} | Blocks: Greg activation`), 'current-status Waiting On names the idea.md Section 4 brief');
    assert(st.includes(`- Project scaffolded | By: init.js | Completed: ${TODAY}`), 'current-status records the scaffold as completed');
    assert(/\*\*Updated by:\*\*\s*init\.js/.test(st) && new RegExp(`\\*\\*Release:\\*\\*\\s*${RELEASE.replace(/\./g, '\\.')}`).test(st), 'current-status header: Updated by init.js, Release set');
    assert(st.includes('Day 0 — project just bootstrapped.'), 'current-status Session Notes mark Day 0');
    const v = run('validate.js', [P, '--strict']);
    assert(v.code === 0 && /Project is clean/.test(v.out), 'a fresh init passes sdk-validate --strict');
  }

  // @covers cap-life-init-011
  {
    const st = read(path.join(P, 'current-status.md'));
    const section = (st.split('## Next Agent To Activate')[1] || '').split('\n## ')[0];
    assert(!/\[Role name\]/.test(section) && /^\| Greg \(CEO\) \| "[^"]*Greg[^"]*idea\.md Section 4[^"]*" \| idea\.md \|$/m.test(section), 'Next Agent To Activate table row names Greg (CEO) with the idea.md Section 4 activation phrase');
    const phrase = (section.match(/^\| Greg \(CEO\) \| "([^"]+)"/m) || [])[1];
    const nx = run('next.js', [P]);
    assert(phrase && nx.out.includes(phrase) && !/\| Role \| Activation phrase \| Read first \|/.test(nx.out), 'sdk-next on a fresh init prints the Greg activation phrase, not the table header');
  }

  // @covers cap-life-init-012
  {
    const h = read(path.join(P, 'history.md'));
    assert(/## Project Start\n\*\*Date:\*\* \d{4}-\d{2}-\d{2}\n\*\*Status:\*\* Initiated/.test(h) && !h.includes('## [Project Start]'), 'history.md placeholder Project Start becomes a dated entry');
    assert(h.includes('- Squad type: startup') && h.includes('- Project type: product') && h.includes(`- Release: ${RELEASE}`), 'Project Start lists squad, type, release');
    const d = tmp('init-nosrc');
    run('init.js', ['plain', '--output', path.join(d, 'p'), '--no-git']);
    assert(read(path.join(d, 'p', 'history.md')).includes('Project scaffolded. Idea to be shaped during Discovery.'), 'without --idea/--source, Project Start says the idea is to be shaped');
  }

  // @covers cap-life-init-013
  {
    assert(exists(path.join(P, '.git')) && git(P, 'rev-parse', '--abbrev-ref', 'HEAD') === 'main', 'init creates a git repo on branch main');
    const log = git(P, 'log', '--format=%s%n%b');
    assert(git(P, 'rev-list', '--count', 'HEAD') === '1' && log.startsWith('feat: initialize demo-proj with team-sdk'), 'exactly one initial commit "feat: initialize <name> with team-sdk"');
    assert(log.includes(`Squad: startup | Type: product | Release: ${RELEASE}`) && log.includes('Source: vision.md'), 'commit body records squad, type, release, source');
    assert(git(P, 'status', '--porcelain') === '', 'working tree is clean after init (generated files are committed)');
    const d = tmp('init-nogit');
    run('init.js', ['ng', '--output', path.join(d, 'p'), '--no-git']);
    assert(!exists(path.join(d, 'p', '.git')), '--no-git skips git init');
  }

  // @covers cap-life-init-014
  {
    assert(exists(path.join(P, 'surfaces', '_template.md')), 'init writes surfaces/_template.md');
    assert(!exists(path.join(P, 'surface-template.md')), 'the surface template is not left at the project root');
    assert(read(path.join(P, 'surfaces', '_template.md')).length > 0, 'surfaces/_template.md is non-empty');
  }

  // @covers cap-life-init-015
  {
    const pc = path.join(P, 'domains', 'platform-core', 'summary.md');
    const ln = path.join(P, 'domains', 'lending', 'summary.md');
    assert(exists(pc) && /lead: "CTO"/.test(read(pc)), '--domains "Platform Core:CTO" → domains/platform-core/summary.md with lead CTO');
    assert(exists(ln) && /lead: "Coordinator"/.test(read(ln)), 'a domain without a lead defaults to Coordinator');
    assert(/spawn_when: ""/.test(read(pc)) && /context_provides: ""/.test(read(pc)), 'domain summary carries spawn_when + context_provides frontmatter');
  }

  // @covers cap-life-init-016
  {
    assert(exists(path.join(P, 'vision.md')) && read(path.join(P, 'vision.md')) === read(srcDoc), '--source file is copied into the project root');
    const d = tmp('init-src');
    const S = path.join(d, 'p');
    run('init.js', ['s', '--output', S, '--source', srcDoc, '--no-git']);
    assert(read(path.join(S, 'CLAUDE.md')).includes('**Source document:** `vision.md`'), 'with --source only, CLAUDE.md points at the source document');
    assert(read(path.join(S, 'history.md')).includes('Vision document provided: vision.md'), 'with --source only, Project Start names the vision document');
  }

  // @covers cap-life-init-017
  {
    for (const f of ['context-manifest.json', 'context-index.json']) {
      let ok = false;
      try { ok = typeof JSON.parse(read(path.join(P, f))) === 'object'; } catch (_) {}
      assert(ok, `init generates ${f} as valid JSON`);
    }
  }

  // ════════════════════════════════════════════════════════════════════ sdk-bootstrap

  // @covers cap-life-bootstrap-001
  {
    const d = tmp('boot');
    const B = path.join(d, 'b');
    const r = run('bootstrap.js', ['boot-proj', '--output', B]);
    assert(r.code === 0 && /bootstrapped/.test(r.out), 'bootstrap exits 0');
    const tpl = fs.readdirSync(path.join(SDK, 'project-template')).filter(f => fs.statSync(path.join(SDK, 'project-template', f)).isFile() && f !== 'surface-template.md');
    assert(tpl.every(f => exists(path.join(B, f))), 'bootstrap copies every project-template file unfiltered (no type map)');
    assert(exists(path.join(B, 'surfaces', '_template.md')) && !exists(path.join(B, 'surface-template.md')), 'bootstrap moves the surface template to surfaces/_template.md (as init does)');
    assert(exists(path.join(B, 'SQUAD.md')) && read(path.join(B, 'SQUAD.md')).split('\n')[0] === read(path.join(SDK, 'team/squads/startup.md')).split('\n')[0], 'bootstrap writes SQUAD.md from the default squad (startup)');
    assert(/Squad:\s+startup/.test(r.out), 'bootstrap default squad is startup');
    for (const f of ['SDK.md', 'protocol.md', 'protocol-core.md', 'protocol-reference.md', 'AGENTS.md', 'STRATEGY.md', 'CHARTER.md']) {
      if (exists(path.join(SDK, f))) assert(exists(path.join(B, f)), `bootstrap copies SDK doc ${f}`);
    }
    const views = fs.readdirSync(path.join(SDK, 'protocol')).filter(n => n.endsWith('.md'));
    assert(views.length > 0 && views.every(f => read(path.join(B, 'protocol', f)) === read(path.join(SDK, 'protocol', f))), 'bootstrap copies the protocol/ per-section views');
    assert(sameTree(path.join(SDK, 'team'), path.join(B, 'team')), 'bootstrap copies team/');
    assert(exists(path.join(B, '.claude', 'skills')) && exists(path.join(B, '.claude', 'agents')), 'bootstrap copies the .claude harness');
    const rc = JSON.parse(read(path.join(B, '.sdkrc')));
    assert(path.resolve(rc.sdkPath) === SDK && rc.limits && 'peerSpawns' in rc.limits, '.sdkrc records sdkPath + limits');
    const bs = JSON.parse(read(path.join(B, '.claude', 'settings.json')));
    const is = JSON.parse(read(path.join(P, '.claude', 'settings.json')));
    assert(JSON.stringify(bs.permissions) === JSON.stringify(is.permissions) && JSON.stringify(bs.hooks) === JSON.stringify(is.hooks) && bs.outputStyle === 'Greg', 'bootstrap writes settings.json with the same scoped permissions, hooks and output style as init');
    assert(bs.projectName === 'boot-proj' && bs.squad === 'startup' && bs.releaseId === RELEASE, 'bootstrap settings.json records project, squad, release');
    assert(!exists(path.join(B, '.git')), 'bootstrap does not git-init (init does)');
  }

  // @covers cap-life-bootstrap-002
  {
    const d = tmp('boot-bad');
    const r = run('bootstrap.js', ['x', '--squad', 'nope', '--output', path.join(d, 'b')]);
    assert(r.code === 1 && /Invalid squad type: "nope"/.test(r.err) && !exists(path.join(d, 'b')), 'bootstrap rejects an unknown squad (exit 1, nothing written)');
    fs.mkdirSync(path.join(d, 'e'));
    const e = run('bootstrap.js', ['x', '--output', path.join(d, 'e')]);
    assert(e.code === 1 && /already exists/.test(e.err) && fs.readdirSync(path.join(d, 'e')).length === 0, 'bootstrap refuses an existing output dir');
    const h = run('bootstrap.js', ['--help']);
    assert(h.code === 0 && /Usage:/.test(h.out), 'bootstrap --help exits 0');
  }

  // ════════════════════════════════════════════════════════════════════ sdk-update

  // Deployment layout the script documents: <project>/team-sdk/scripts/update.js
  function vendoredProject() {
    const d = tmp('upd');
    const proj = path.join(d, 'proj');
    const vend = path.join(proj, 'team-sdk');
    for (const rel of ['scripts/update.js', 'scripts/lib/next-stub.js']) {
      fs.mkdirSync(path.dirname(path.join(vend, rel)), { recursive: true });
      fs.copyFileSync(path.join(SDK, rel), path.join(vend, rel));
    }
    fs.cpSync(path.join(SDK, 'packages'), path.join(vend, 'packages'), { recursive: true, filter: (f) => !f.includes('node_modules') });
    fs.writeFileSync(path.join(vend, 'team-old.md'), 'x');
    fs.mkdirSync(path.join(vend, 'team', 'roles'), { recursive: true });
    fs.writeFileSync(path.join(vend, 'team', 'roles', 'obsolete.md'), 'gone');
    fs.writeFileSync(path.join(vend, 'team', 'roles', 'cto.md'), 'old cto');
    fs.writeFileSync(path.join(proj, 'history.md'), '# project history\n');
    // Fake SDK source
    const src = path.join(d, 'src');
    const w = (rel, c) => { fs.mkdirSync(path.dirname(path.join(src, rel)), { recursive: true }); fs.writeFileSync(path.join(src, rel), c); };
    w('AGENTS.md', '# agents'); w('protocol.md', '**Version:** 9.9\n'); w('team/roles/cto.md', 'new cto'); w('team/roles/pm.md', 'pm');
    w('protocol/01-x.md', 'view'); w('.claude/skills/ask/SKILL.md', 'ask'); w('.claude/agents/cto.md', 'agent'); w('history.md', 'SDK history must not land');
    for (const rel of ['scripts/update.js', 'scripts/lib/next-stub.js']) w(rel, read(path.join(vend, rel)));
    return { proj, vend, src };
  }

  // @covers cap-life-update-001
  {
    const h = run('update.js', ['--help']);
    assert(h.code === 0 && /Usage:/.test(h.out) && /\.sdkrc/.test(h.out), 'update --help exits 0 and documents the .sdkrc fallback');
    const d = tmp('upd-noarg');
    const r = run('update.js', [], { cwd: d });
    assert(r.code === 1 && /\.sdkrc not found/.test(r.err), 'update with no path and no .sdkrc exits 1');
    const bad = run('update.js', [d], { cwd: d });
    assert(bad.code === 1 && /does not look like a team-sdk directory/.test(bad.err), 'update rejects a source without AGENTS.md');
    const miss = run('update.js', [path.join(d, 'nope')], { cwd: d });
    assert(miss.code === 1 && /Source path not found/.test(miss.err), 'update rejects a missing source path');
  }

  // @covers cap-life-update-002
  {
    const { proj, vend, src } = vendoredProject();
    const scriptsDir = path.join(vend, 'scripts');
    const dry = run('update.js', [src, '--dry-run'], { cwd: proj, scriptsDir });
    assert(dry.code === 0 && /DRY RUN/.test(dry.out) && /Would change/.test(dry.out), 'update --dry-run reports what would change');
    assert(read(path.join(vend, 'team', 'roles', 'cto.md')) === 'old cto' && exists(path.join(vend, 'team', 'roles', 'obsolete.md')) && !exists(path.join(proj, '.claude')), '--dry-run writes and removes nothing');
    const r = run('update.js', [src], { cwd: proj, scriptsDir });
    assert(r.code === 0 && /✅ Done:/.test(r.out), `update exits 0 and reports Done — ${r.err.slice(0, 200)}`);
    assert(read(path.join(vend, 'team', 'roles', 'cto.md')) === 'new cto' && read(path.join(vend, 'team', 'roles', 'pm.md')) === 'pm' && exists(path.join(vend, 'protocol', '01-x.md')), 'tracked SDK files are added/updated inside <project>/team-sdk/');
    assert(!exists(path.join(vend, 'team', 'roles', 'obsolete.md')) && /- team\/roles\/obsolete\.md/.test(r.out), 'files missing from the source are removed from tracked dirs and listed');
    assert(read(path.join(proj, '.claude', 'skills', 'ask', 'SKILL.md')) === 'ask' && exists(path.join(proj, '.claude', 'agents', 'cto.md')), 'the .claude harness syncs into the project root');
    assert(read(path.join(proj, 'history.md')) === '# project history\n', 'project-level history.md is never touched');
    assert(/Protocol version: 9\.9/.test(r.out), 'update reports the protocol version');
    const again = run('update.js', [src], { cwd: proj, scriptsDir });
    assert(again.code === 0 && /Already up to date/.test(again.out), 'a second update is a no-op ("Already up to date")');
    fs.writeFileSync(path.join(proj, '.sdkrc'), JSON.stringify({ sdkPath: src }));
    const viaRc = run('update.js', [], { cwd: proj, scriptsDir });
    assert(viaRc.code === 0 && viaRc.out.includes(`Source: ${src}`), 'with no path, update reads sdkPath from ./.sdkrc');
  }

  // @covers cap-life-update-003
  {
    // An sdk-init project has .sdkrc sdkPath = the SDK and no team-sdk/ copy: zero-arg
    // sdk-update syncs the harness files init copied into the project root.
    const d = tmp('upd-init');
    const I = path.join(d, 'p');
    run('init.js', ['u', '--output', I, '--no-git']);
    fs.writeFileSync(path.join(I, 'team', 'roles', 'cto.md'), 'stale');
    fs.writeFileSync(path.join(I, 'protocol', 'zz-obsolete.md'), 'gone');
    fs.rmSync(path.join(I, '.claude', 'skills'), { recursive: true, force: true });
    const keepClaude = read(path.join(I, 'CLAUDE.md'));
    const keepSettings = read(path.join(I, '.claude', 'settings.json'));
    const keepStatus = read(path.join(I, 'current-status.md'));
    const r = run('update.js', [], { cwd: I });
    assert(r.code === 0 && /linked project/.test(r.out) && /✅ Done:/.test(r.out), `zero-arg sdk-update in an sdk-init project exits 0 (linked mode) — ${r.err.slice(0, 200)}`);
    assert(read(path.join(I, 'team', 'roles', 'cto.md')) === read(path.join(SDK, 'team', 'roles', 'cto.md')), 'linked update restores team/ from sdkPath');
    assert(!exists(path.join(I, 'protocol', 'zz-obsolete.md')) && sameTree(path.join(SDK, '.claude', 'skills'), path.join(I, '.claude', 'skills')), 'linked update prunes stale protocol/ views and re-syncs .claude/skills');
    assert(read(path.join(I, 'CLAUDE.md')) === keepClaude && read(path.join(I, '.claude', 'settings.json')) === keepSettings && read(path.join(I, 'current-status.md')) === keepStatus, 'project-owned files (CLAUDE.md, settings.json, current-status.md) are untouched');
    assert(!exists(path.join(I, 'team-sdk')) && !exists(path.join(I, 'scripts')), 'linked update creates no team-sdk/ or scripts/ copy');
    const again = run('update.js', [], { cwd: I });
    assert(again.code === 0 && /Already up to date/.test(again.out), 'a second linked update is a no-op');
    const self = run('update.js', [SDK], { cwd: tmp('upd-self') });
    assert(self.code === 1 && /Source and target are the same directory/.test(self.err), 'outside a linked project, source == SDK still refuses');
  }

  // ════════════════════════════════════════════════════════════════════ sdk-squad

  // @covers cap-life-squad-001
  {
    const r = run('squad.js', ['list']);
    const squads = fs.readdirSync(path.join(SDK, 'team/squads')).filter(f => f.endsWith('.md') && !f.startsWith('_')).map(f => f.replace('.md', ''));
    assert(r.code === 0 && squads.length >= 4 && squads.every(s => new RegExp(`^  ${s}\\s`, 'm').test(r.out)), 'squad list shows every team/squads/*.md (excluding _template)');
    assert(!/_template/.test(r.out) && /\d+ required/.test(r.out), 'squad list shows required counts and hides _template');
    const h = run('squad.js', ['--help']);
    assert(h.code === 0 && squads.every(s => h.out.includes(s)), 'squad --help lists squads from the .md files');
  }

  // @covers cap-life-squad-002
  {
    const r = run('squad.js', ['feature']);
    assert(r.code === 0 && /Squad: Feature/.test(r.out) && /── Required Roles/.test(r.out) && /── Activation Sequence/.test(r.out), 'squad <type> prints roster + activation sequence');
    assert(/^\s+PM\s+\[L\d\]/m.test(r.out) && /^\s+1\. Phase 0/m.test(r.out), 'roles carry levels; sequence is numbered by phase');
    assert(r.out.includes('--squad feature'), 'squad <type> prints the bootstrap command for that squad');
    const bad = run('squad.js', ['zzz']);
    assert(bad.code === 1 && /Unknown squad: "zzz"/.test(bad.err), 'unknown squad exits 1');
  }

  // ════════════════════════════════════════════════════════════════════ sdk-install-hooks

  // @covers cap-life-hooks-001
  {
    const d = tmp('hooks-nogit');
    const r = run('install-hooks.js', [], { cwd: d });
    assert(r.code === 1 && /not a git repository/.test(r.err), 'install-hooks outside a git repo exits 1');
    const g = tmp('hooks-bare');
    git(g, 'init', '-q');
    const r2 = run('install-hooks.js', [], { cwd: g });
    assert(r2.code === 1 && /commit-msg not found/.test(r2.err), 'install-hooks in a repo without scripts/hooks/commit-msg exits 1');
    let hp = ''; try { hp = git(g, 'config', '--local', 'core.hooksPath'); } catch (_) {}
    assert(hp === '', 'failed install leaves core.hooksPath unset');
  }

  // @covers cap-life-hooks-002
  {
    const g = tmp('hooks-ok');
    git(g, 'init', '-q');
    fs.mkdirSync(path.join(g, 'scripts', 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(g, 'scripts', 'hooks', 'commit-msg'), '#!/bin/sh\nexit 0\n', { mode: 0o644 });
    fs.writeFileSync(path.join(g, 'scripts', 'hooks', 'map-gate.js'), '', { mode: 0o644 });
    fs.mkdirSync(path.join(g, 'sub'));
    const r = run('install-hooks.js', [], { cwd: path.join(g, 'sub') });
    assert(r.code === 0 && /Document-First Gate installed/.test(r.out), 'install-hooks exits 0 from anywhere inside the repo');
    assert(git(g, 'config', '--local', 'core.hooksPath') === 'scripts/hooks', 'core.hooksPath → scripts/hooks');
    assert((fs.statSync(path.join(g, 'scripts', 'hooks', 'commit-msg')).mode & 0o111) !== 0, 'commit-msg hook is made executable');
    const r2 = run('install-hooks.js', [], { cwd: g });
    assert(r2.code === 0, 'install-hooks is idempotent');
  }

  // ════════════════════════════════════════════════════════════════════ sdk-kill

  // @covers cap-life-kill-001
  {
    const d = tmp('kill-bad');
    const cases = [
      [[d], 0, /Usage:/],
      [[d, 'pod'], 1, /--reason is required/],
      [[d, 'pod', '--class', 'PRIORITY_SHIFT'], 1, /--reason is required/],
      [[d, 'pod', '--reason', 'r', '--class', 'NOPE'], 1, /--class is required/],
      [[d, 'pod', '--reason', 'r', '--class', 'FRAMING_WRONG'], 1, /--assumption is required/],
      [[path.join(d, 'missing'), 'pod', '--reason', 'r', '--class', 'PRIORITY_SHIFT'], 1, /Project directory not found/],
    ];
    for (const [a, code, re] of cases) {
      const r = run('kill.js', a);
      assert(r.code === code && re.test(r.all), `kill ${a.slice(1).join(' ')} → exit ${code} ${re}`);
    }
    assert(!exists(path.join(HOME, '.claude', 'kill-log.json')) && fs.readdirSync(d).length === 0, 'rejected kills write nothing');
  }

  // @covers cap-life-kill-002
  {
    const d = tmp('kill');
    const K = path.join(d, 'proj');
    fs.mkdirSync(K);
    fs.writeFileSync(path.join(K, '.sdkrc'), JSON.stringify({ releaseId: 'v2026.Q2.3' }));
    fs.writeFileSync(path.join(K, 'history.md'), '# History\n');
    const r = run('kill.js', [K, 'auth-v2', '--reason', 'No SSO demand', '--class', 'FRAMING_WRONG', '--assumption', 'Enterprise needs SSO', '--killed-by', 'PM']);
    assert(r.code === 0 && /POD KILLED: auth-v2/.test(r.out) && /feeds judgment corpus/.test(r.out), 'kill exits 0 and confirms; FRAMING_WRONG is flagged as corpus-feeding');
    const log = JSON.parse(read(path.join(HOME, '.claude', 'kill-log.json')));
    const e = log[log.length - 1];
    assert(e.id === `KILL-${TODAY}-1` && e.pod === 'auth-v2' && e.project === 'proj' && e.release === 'v2026.Q2.3' && e.killClass === 'FRAMING_WRONG' && e.assumption === 'Enterprise needs SSO' && e.killedBy === 'PM', 'kill appends a structured entry to ~/.claude/kill-log.json (release from .sdkrc)');
    assert(/# Kill Log/.test(read(path.join(HOME, '.claude', 'kill-log.md'))) && read(path.join(HOME, '.claude', 'kill-log.md')).includes(`### KILL-${TODAY}-1`), 'kill writes the human-readable ~/.claude/kill-log.md');
    const h = read(path.join(K, 'history.md'));
    assert(h.includes('## Pod Kill: auth-v2') && h.includes('**Assumption that failed:** Enterprise needs SSO') && h.includes('**Coverage:**'), 'kill appends a Pod Kill entry to history.md');
    const bus = read(path.join(K, 'bus-log.md'));
    assert(/FROM: PM → TO: ALL \| PRIORITY: INFO \| TAG: POD-KILL \| RELEASE: v2026\.Q2\.3/.test(bus), 'kill posts a POD-KILL INFO Bus message to bus-log.md');
    const r2 = run('kill.js', [K, 'notif', '--reason', 'Payments first', '--class', 'PRIORITY_SHIFT']);
    const log2 = JSON.parse(read(path.join(HOME, '.claude', 'kill-log.json')));
    assert(r2.code === 0 && log2.length === 2 && log2[1].id === `KILL-${TODAY}-2` && log2[1].killedBy === 'Owner' && log2[1].assumption === null, 'kill ids are sequential per day; killed-by defaults to Owner');
  }

  // ════════════════════════════════════════════════════════════════════ sdk-version

  function versionFixture(rel) {
    const d = tmp('ver');
    fs.writeFileSync(path.join(d, '.sdkrc'), JSON.stringify({ releaseId: rel, keep: 'me' }));
    fs.writeFileSync(path.join(d, 'current-status.md'), `# Status\n**Release:** ${rel}\n`);
    fs.writeFileSync(path.join(d, 'history.md'), '# History\n');
    return d;
  }

  // @covers cap-life-version-001
  {
    const d = versionFixture('v2026.Q4.3');
    const r = run('version.js', [d]);
    assert(r.code === 0 && r.out.trim() === 'v2026.Q4.3', 'version prints the .sdkrc releaseId as a single stdout line');
    const s = tmp('ver-status');
    fs.writeFileSync(path.join(s, 'current-status.md'), '# S\n**Release:** v2025.Q3.2\n');
    assert(run('version.js', [s]).out.trim() === 'v2025.Q3.2', 'without .sdkrc, version falls back to current-status **Release:**');
    const n = run('version.js', [tmp('ver-none')]);
    assert(n.code === 0 && /No version set/.test(n.out), 'no version anywhere → hint, exit 0');
    const m = run('version.js', [path.join(s, 'missing')]);
    assert(m.code === 2 && /not found/.test(m.err), 'missing project dir → exit 2');
    assert(run('version.js', ['--help']).code === 0, 'version --help exits 0');
  }

  // @covers cap-life-version-002
  {
    const cases = [['v2026.Q4.3', 'patch', 'v2026.Q4.4'], ['v2026.Q2.3', 'minor', 'v2026.Q3.1'], ['v2026.Q4.3', 'minor', 'v2027.Q1.1'], ['v2026.Q2.3', 'major', 'v2027.Q1.1']];
    for (const [from, kind, to] of cases) {
      const d = versionFixture(from);
      const r = run('version.js', [d, 'bump', kind]);
      assert(r.code === 0 && r.out.split('\n')[0] === `${from} → ${to}`, `bump ${kind}: ${from} → ${to}`);
      const rc = JSON.parse(read(path.join(d, '.sdkrc')));
      assert(rc.releaseId === to && rc.keep === 'me', `bump ${kind} writes .sdkrc releaseId and keeps other keys`);
      assert(read(path.join(d, 'current-status.md')).includes(`**Release:** ${to}`), `bump ${kind} updates current-status **Release:**`);
      assert(read(path.join(d, 'history.md')).includes(`## Version Bump — ${from} → ${to}`) && read(path.join(d, 'history.md')).includes(`(sdk-version ${kind})`), `bump ${kind} appends a Version Bump entry to history.md`);
    }
  }

  // @covers cap-life-version-003
  {
    const d = versionFixture('v2026.Q2.1');
    const r = run('version.js', [d, 'set', 'v2026.Q3.5']);
    assert(r.code === 0 && r.out.startsWith('v2026.Q2.1 → v2026.Q3.5') && JSON.parse(read(path.join(d, '.sdkrc'))).releaseId === 'v2026.Q3.5', 'set writes the given release');
    assert(read(path.join(d, 'history.md')).includes('## Version Bump — v2026.Q2.1 → v2026.Q3.5'), 'set over an existing version logs to history');
    const bad = run('version.js', [d, 'set', '2026.Q3.5']);
    assert(bad.code === 2 && /invalid version format/.test(bad.err) && JSON.parse(read(path.join(d, '.sdkrc'))).releaseId === 'v2026.Q3.5', 'set rejects a malformed id (exit 2, unchanged)');
    assert(run('version.js', [d, 'set', 'v2026.Q5.1']).code === 2, 'set rejects quarter 5');
    assert(run('version.js', [d, 'set']).code === 2, 'set without an id → exit 2');
    const fresh = tmp('ver-fresh');
    fs.writeFileSync(path.join(fresh, 'history.md'), '# H\n');
    const f = run('version.js', [fresh, 'set', 'v2026.Q1.1']);
    assert(f.code === 0 && f.out.startsWith('(none) → v2026.Q1.1') && read(path.join(fresh, 'history.md')) === '# H\n', 'first set from nothing writes .sdkrc but no history entry');
  }

  // @covers cap-life-version-004
  {
    const d = versionFixture('v2026.Q2.1');
    assert(run('version.js', [d, 'bump']).code === 2, 'bump without kind → exit 2');
    assert(run('version.js', [d, 'bump', 'huge']).code === 2, 'bump with unknown kind → exit 2');
    assert(run('version.js', [d, 'frobnicate']).code === 2, 'unknown subcommand → exit 2');
    const n = run('version.js', [tmp('ver-nobump'), 'bump', 'patch']);
    assert(n.code === 1 && /no version found/.test(n.err), 'bump with no current version → exit 1');
    assert(JSON.parse(read(path.join(d, '.sdkrc'))).releaseId === 'v2026.Q2.1', 'failed commands leave .sdkrc unchanged');
  }

  // ════════════════════════════════════════════════════════════════════ sdk-ship

  function shipFixture(historyBody) {
    const d = tmp('ship');
    fs.writeFileSync(path.join(d, 'current-status.md'), '# Status\n**Release:** v2026.Q2.1\n\n## Active Missions\n| M | Active |\n\n## Next Agent To Activate\nGreg\n');
    fs.writeFileSync(path.join(d, 'history.md'), historyBody);
    for (const f of ['product', 'engineering', 'general']) fs.writeFileSync(path.join(d, `${f}-requirements.md`), `# ${f}\nok\n`);
    git(d, 'init', '-q');
    git(d, 'remote', 'add', 'origin', path.join(d, '..', 'no-such-remote-' + path.basename(d)));
    git(d, 'add', '-A'); git(d, 'commit', '-qm', 'init');
    return d;
  }
  const HIST = '# History\n\n## [v2026.Q2.1] Release\n- Mission A COMPLETED\n**Decision:** Use Postgres\n\n## [v2026.Q1.1] Older\n- old\n';

  // @covers cap-life-ship-001
  {
    const d = shipFixture(HIST);
    const h = run('ship.js', ['--help']);
    assert(h.code === 0 && /--dry-run/.test(h.out), 'ship --help exits 0');
    const one = run('ship.js', [d]);
    assert(one.code === 1 && /Both <project-dir> and <release-id> are required/.test(one.err), 'ship with one positional → exit 1');
    const bad = run('ship.js', [d, '2026.Q2.1']);
    assert(bad.code === 1 && /Invalid release ID format/.test(bad.err), 'ship rejects a malformed release id');
    const miss = run('ship.js', [path.join(d, 'nope'), 'v2026.Q2.1']);
    assert(miss.code === 1 && /Project directory not found/.test(miss.err), 'ship rejects a missing project dir');
    const none = run('ship.js', [d, 'v2026.Q3.9']);
    assert(none.code === 1 && /SHIP BLOCKED/.test(none.err) && /No history\.md entry found for v2026\.Q3\.9/.test(none.err), 'ship blocks when history.md has no entry for the release');
    const nh = tmp('ship-nohist');
    const r = run('ship.js', [nh, 'v2026.Q2.1']);
    assert(r.code === 1 && /history\.md not found/.test(r.err), 'ship blocks when history.md is missing');
    assert(git(d, 'tag', '-l') === '', 'blocked ships create no tag');
  }

  // @covers cap-life-ship-002
  {
    const d = shipFixture(HIST);
    fs.writeFileSync(path.join(d, 'dirty.txt'), 'x'); // dry-run does not require a clean tree
    const r = run('ship.js', [d, 'v2026.Q2.1', '--dry-run']);
    assert(r.code === 0 && /\(dry run\) sdk-ship/.test(r.out) && /history\.md: entry found ✓/.test(r.out) && /sdk-validate: clean ✓/.test(r.out), 'ship --dry-run exits 0 and reports the checks');
    assert(/## v2026\.Q2\.1/.test(r.out) && /### What shipped\n\n- Mission A COMPLETED/.test(r.out) && /### Decisions made\n\n- Use Postgres/.test(r.out) && /### Full log/.test(r.out), 'dry-run previews release notes: What shipped / Decisions made / Full log');
    assert(!/old/.test(r.out.split('### Full log')[1] || ''), 'release notes stop at the next ## heading');
    assert(git(d, 'tag', '-l') === '', '--dry-run creates no tag');
  }

  // @covers cap-life-ship-003
  {
    const d = shipFixture(HIST);
    fs.unlinkSync(path.join(d, 'general-requirements.md'));
    git(d, 'add', '-A'); git(d, 'commit', '-qm', 'drop req');
    const r = run('ship.js', [d, 'v2026.Q2.1']);
    assert(r.code === 1 && /SHIP BLOCKED — documentation issues found/.test(r.err) && /general-requirements\.md is missing/.test(r.err), 'ship blocks on sdk-validate warnings');
    const dr = run('ship.js', [d, 'v2026.Q2.1', '--dry-run']);
    assert(dr.code === 0 && /would block without --dry-run/.test(dr.out) && /1 warning\(s\) — would block/.test(dr.out), 'dry-run shows validate warnings without blocking');
    assert(git(d, 'tag', '-l') === '', 'no tag after a validate block');
  }

  // @covers cap-life-ship-004
  {
    const d = shipFixture(HIST);
    fs.writeFileSync(path.join(d, 'dirty.txt'), 'x');
    const r = run('ship.js', [d, 'v2026.Q2.1']);
    assert(r.code === 1 && /Working tree is not clean/.test(r.err) && /dirty\.txt/.test(r.err), 'ship blocks on a dirty working tree and names the files');
    assert(git(d, 'tag', '-l') === '', 'no tag after a dirty-tree block');
  }

  // @covers cap-life-ship-005
  {
    // origin points at a nonexistent local path: the push fails offline, exercising rollback.
    const d = shipFixture(HIST);
    const r = run('ship.js', [d, 'v2026.Q2.1']);
    assert(r.code === 1 && /SHIP FAILED/.test(r.err) && /local tag rolled back/.test(r.err), 'failed push → exit 1, "local tag rolled back"');
    assert(git(d, 'tag', '-l') === '', 'no local tag remains after a failed push (atomic)');
    git(d, 'tag', '-a', 'v2026.Q2.1', '-m', 'pre');
    const t = run('ship.js', [d, 'v2026.Q2.1']);
    assert(t.code === 1 && /already exists/.test(t.err), 'an existing tag blocks ship with a delete hint');
  }

  // @covers cap-life-ship-006
  {
    // The remediation ship prints writes "### Decision: Release vX"; ship accepts that form.
    const d = shipFixture('# History\n');
    const hint = run('ship.js', [d, 'v2026.Q2.1', '--dry-run']);
    assert(/sdk-doc decision history\.md --decision "Release v2026\.Q2\.1"/.test(hint.err), 'ship prints the sdk-doc decision remediation');
    run('doc.js', ['decision', path.join(d, 'history.md'), '--decision', 'Release v2026.Q2.1', '--context', 'ctx', '--made-by', 'Coordinator']);
    assert(read(path.join(d, 'history.md')).includes('Release v2026.Q2.1'), 'the remediation command wrote an entry naming the release');
    const after = run('ship.js', [d, 'v2026.Q2.1', '--dry-run']);
    assert(after.code === 0 && /history\.md: entry found/.test(after.out) && /### Full log/.test(after.out) && /Release v2026\.Q2\.1/.test(after.out), `after following its own remediation, ship finds the entry — ${after.err.slice(0, 200)}`);
    const other = run('ship.js', [d, 'v2026.Q2.10', '--dry-run']);
    assert(other.code === 1 && /No history\.md entry found for v2026\.Q2\.10/.test(other.err), 'a decision for v2026.Q2.1 does not satisfy v2026.Q2.10');
    const env = { TEAM_SDK_GITHUB_TOKEN: 'dummy-offline' };
    fs.writeFileSync(path.join(d, '.sdkrc'), JSON.stringify({ github: { repo: 'acme/x' } }));
    const gh = run('github.js', ['release', d, '--release-id', 'v2026.Q2.10'], { env });
    assert(gh.code === 1 && /No history\.md entry found for v2026\.Q2\.10/.test(gh.err), 'sdk-github release applies the same decision-form matcher (no false match on a prefix id)');
  }

  // ════════════════════════════════════════════════════════════════════ sdk-github (offline only)

  // @covers cap-life-github-001
  {
    const d = tmp('gh');
    const h = run('github.js', ['--help']);
    assert(h.code === 0 && /TEAM_SDK_GITHUB_TOKEN/.test(h.out) && /sync-issues/.test(h.out), 'github --help exits 0 and names the auth variable');
    assert(run('github.js', ['status']).code === 2, 'missing project dir → exit 2');
    assert(run('github.js', ['status', path.join(d, 'nope')]).code === 2, 'nonexistent project dir → exit 2');
    const u = run('github.js', ['frob', d]);
    assert(u.code === 2 && /Unknown command: "frob"/.test(u.err), 'unknown subcommand → exit 2');
    const l = run('github.js', ['link', d, '--repo', 'no-slash'], { env: { TEAM_SDK_GITHUB_TOKEN: 'dummy-offline' } });
    assert(l.code === 2 && /owner\/repo/.test(l.err) && !exists(path.join(d, '.sdkrc')), 'link validates --repo owner/repo before any network call');
  }

  // @covers cap-life-github-002
  {
    const d = tmp('gh-auth');
    for (const cmd of ['sync-issues', 'release', 'status']) {
      const r = run('github.js', [cmd, d]);
      assert(r.code === 1 && /TEAM_SDK_GITHUB_TOKEN is not set/.test(r.err), `${cmd} without TEAM_SDK_GITHUB_TOKEN → exit 1`);
    }
    const c = run('github.js', ['status', d], { env: { GITHUB_TOKEN: 'actions-token' } });
    assert(c.code === 1 && /GITHUB_TOKEN is set but TEAM_SDK_GITHUB_TOKEN is not/.test(c.err), 'GITHUB_TOKEN alone is refused with a collision explanation');
  }

  // @covers cap-life-github-003
  {
    const env = { TEAM_SDK_GITHUB_TOKEN: 'dummy-offline' };
    const d = tmp('gh-nolink');
    for (const cmd of ['sync-issues', 'release']) {
      const r = run('github.js', [cmd, d], { env });
      assert(r.code === 1 && /No GitHub repo linked/.test(r.err), `${cmd} with no linked repo → exit 1 before any network call`);
    }
    const s = run('github.js', ['status', d], { env });
    assert(s.code === 0 && /No GitHub repo linked/.test(s.out), 'status with no linked repo prints the link hint, exit 0');
    const l = tmp('gh-linked');
    fs.writeFileSync(path.join(l, '.sdkrc'), JSON.stringify({ github: { repo: 'acme/x' } }));
    const nr = run('github.js', ['release', l], { env });
    assert(nr.code === 1 && /No release ID found in \.sdkrc/.test(nr.err), 'release with no id in .sdkrc and no --release-id → exit 1');
    for (const bad of ['2026.Q2.1', 'v2026.Q5.1', '../x']) {
      const b = run('github.js', ['release', l, '--release-id', bad], { env });
      assert(b.code === 2 && /invalid --release-id/.test(b.err), `release rejects malformed --release-id "${bad}" (exit 2) before any network call`);
    }
    const missing = run('github.js', ['release', l, '--release-id'], { env });
    assert(missing.code === 2 && /invalid --release-id/.test(missing.err), 'release rejects a valueless --release-id (exit 2)');
    fs.writeFileSync(path.join(l, 'history.md'), '# H\n## v2026.Q2.1\n- shipped\n');
    const nh = run('github.js', ['release', l, '--release-id', 'v2026.Q2.1'], { env });
    assert(nh.code === 1 && /No history\.md entry found for v2026\.Q2\.1/.test(nh.err), 'release requires a "## [vX]" history entry (bracketed) before any network call');
  }

  // ════════════════════════════════════════════════════════════════════ sdk-retro

  // @covers cap-life-retro-001
  {
    const d = tmp('retro');
    assert(run('retro.js', ['--help']).code === 0, 'retro --help exits 0');
    assert(run('retro.js', [path.join(d, 'nope')]).code === 2, 'retro on a missing dir → exit 2');
    const r = run('retro.js', [d, '--release', 'v2026.Q2.1', '--what-worked', 'W', '--what-slowed', 'S', '--change', 'C']);
    assert(r.code === 0 && /Retrospective appended to strategy-log\.md/.test(r.out), 'flag mode exits 0');
    const log = read(path.join(d, 'strategy-log.md'));
    assert(log.startsWith(`# Strategy Log\n**Project:** ${path.basename(d)}`), 'a missing strategy-log.md is created with a header');
    assert(log.includes('## Retrospective — v2026.Q2.1') && log.includes(`Date: ${TODAY}`) && /### What worked\nW/.test(log) && /### What slowed us down\nS/.test(log) && /### One thing to change next cycle\nC/.test(log), 'entry carries release, date, and the three sections');
    assert(!log.includes('### Additional notes'), '--note is optional');
    run('retro.js', [d, '--release', 'v2026.Q2.2', '--what-worked', 'W2', '--what-slowed', 'S2', '--change', 'C2', '--note', 'N2']);
    const log2 = read(path.join(d, 'strategy-log.md'));
    assert(log2.startsWith(log) && /### Additional notes\nN2/.test(log2) && (log2.match(/# Strategy Log/g) || []).length === 1, 'subsequent retros append (header once) and include --note');
  }

  // @covers cap-life-retro-002
  {
    const d = tmp('retro-int');
    fs.writeFileSync(path.join(d, '.sdkrc'), JSON.stringify({ releaseId: 'v2026.Q2.1' }));
    const r = run('retro.js', [d], { input: '\nworked\nslowed\nchange\n\n' });
    assert(/Release ID \[v2026\.Q2\.1\]/.test(r.out), 'interactive mode suggests the .sdkrc release');
    assert(r.code === 0 && /Retrospective written to strategy-log\.md/.test(r.out), `piped interactive answers exit 0 — ${r.err.slice(0, 200)}`);
    const log = exists(path.join(d, 'strategy-log.md')) ? read(path.join(d, 'strategy-log.md')) : '';
    assert(log.includes('## Retrospective — v2026.Q2.1') && /### What worked\nworked/.test(log) && /### What slowed us down\nslowed/.test(log) && /### One thing to change next cycle\nchange/.test(log) && !log.includes('### Additional notes'), 'every piped answer lands in its section (empty first line takes the suggested release)');
    const short = run('retro.js', [tmp('retro-eof')], { input: 'v2026.Q2.1\nworked\n' });
    assert(short.code === 1 && /Required\./.test(short.err), 'stdin ending before a required answer exits 1');
  }
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}

console.log(`  lifecycle capabilities: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
