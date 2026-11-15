'use strict';

/**
 * cli/sandbox.js — D7 for one company (cap-po-sandbox-001): `sandbox setup`, `sandbox doctor`,
 * `key set`.
 *
 * `sandbox setup` records the `sandbox` ledger event {user, home} (the runner reads state.sandbox)
 * and GENERATES — never runs — a macOS shell script the Owner reviews and runs with sudo:
 * a hidden user and group, its home, the Owner-owned 0755 session dir (sessionDir, default
 * /Users/Shared/sdkco-sessions: per-run settings the sandbox user may read but not write), the company
 * clone chowned to the sandbox user (the Owner keeps read access through the group), holding/
 * 0700 owned by the Owner, and a sudoers drop-in validated with `visudo -cf` before install that
 * lets the Owner run ONLY the absolute claude path as the sandbox user, NOPASSWD, keeping only
 * ANTHROPIC_API_KEY and HOLDING_RUN_ID from the environment (no SETENV).
 *
 * The script ends by running the installed hook as the sandbox user on a synthetic landing state and
 * aborts unless it denies a Write (Guardian N1).
 *
 * `sandbox doctor` makes read-only checks and names the fix for each, including the runner's hook
 * pre-flight (runner/sandbox.js: HOOK_STALE, HOOK_WRITABLE). All commands go through an
 * injectable exec (deps.exec(cmd, args) → { status, stdout, stderr }) so tests never touch sudo.
 * `key set <company> --from-stdin` stores the company key at holding/keys/<company>.key, 0600,
 * never echoed and never accepted on argv.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { refuse, usage, need, writeJson } = require('./common');
const { generateSetupScript } = require('./sandbox-script');
const { checkSandboxAccess, resolveUserGroups } = require('../sandbox-access');
const { hookStaleProblem, hookWritableProblem } = require('../runner/sandbox');

const KEY_RE = /^\S{20,}$/;

function defaultExec(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 15000 });
  return { status: r.status === null ? 1 : r.status, stdout: r.stdout || '', stderr: r.stderr || (r.error ? r.error.message : '') };
}

const DEFAULT_SESSION_DIR = '/Users/Shared/sdkco-sessions';
const DEFAULT_RUNTIME_DIR = '/Users/Shared/sdkco-runtime';
const HOOK_SRC = path.resolve(__dirname, '..', 'landing-hook.js');
const NODE_CANDIDATES = ['/opt/homebrew/bin/node', '/usr/local/bin/node'];
const { builtinModules } = require('module');
const SETUP_USAGE = 'sandbox setup --user <name> --home <abs> [--session-dir <abs>] [--runtime-dir <abs>] [--node <abs>] [--company <id>] '
  + '[--claude-bin <abs>] [--owner <name>]';
const SANDBOX_USAGE = `sandbox supports: ${SETUP_USAGE} | sandbox doctor [--company <id>] [--claude-bin <abs>] | sandbox show | sandbox help
  --session-dir  Owner-owned 0755 dir for per-run settings/state (default ${DEFAULT_SESSION_DIR})
  --runtime-dir  Owner-owned 0755 dir the hook runtime is installed in (default ${DEFAULT_RUNTIME_DIR})
  --node         the node the sandbox user runs the hook with (default: a world-traversable node, else a copy into --runtime-dir)`;

/** landing-hook.js must run from a copy outside the repo: node built-ins only, no relative requires. */
function assertHookSelfContained(src) {
  const text = fs.readFileSync(src, 'utf8');
  const bad = [...text.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m => m[1])
    .filter(m => !builtinModules.includes(m.replace(/^node:/, '')));
  if (bad.length) refuse(`${src} requires ${bad.join(', ')}; the installed hook must be self-contained (node built-ins only)`);
}

/** A node the sandbox user can exec as "other" (it is in none of the Owner's groups): the path and its real path. */
function worldExecutable(p, { stat, realpath }) {
  let real = p;
  try { real = realpath(p); } catch { return false; }
  const targets = [...new Set([p, real])].map(x => ({ path: x, need: 'x' }));
  return checkSandboxAccess({ user: 'other', uid: null, userGroups: [], checks: targets, stat }).every(r => r.ok);
}

/** Pick a world-traversable node, or plan a copy of this one into the runtime dir. */
function chooseNode(flags, runtimeDir, deps) {
  const io = { stat: deps.accessStat, realpath: deps.realpath || fs.realpathSync };
  const candidates = flags.node ? [flags.node] : [...NODE_CANDIDATES, deps.execPath || process.execPath];
  for (const c of candidates) if (worldExecutable(c, io)) return { nodePath: c, nodeSrc: null };
  const src = flags.node || deps.execPath || process.execPath;
  let real = src;
  try { real = io.realpath(src); } catch { /* the script's install fails loudly if it is missing */ }
  return { nodePath: path.join(runtimeDir, 'node'), nodeSrc: real };
}

function pickCompany(h, id) {
  const cos = h.portfolio.companies || [];
  if (id) return cos.find(c => c.id === id) || refuse(`company ${id} is not registered`);
  if (cos.length === 1) return cos[0];
  return refuse(cos.length ? 'more than one company: pass --company <id>' : 'no company registered yet (sdk-holding add-company)');
}

function resolveClaudeBin(h, flags, exec) {
  const fromFlag = flags['claude-bin'];
  const fromSettings = h.settings.runner && typeof h.settings.runner.claudeBin === 'string' ? h.settings.runner.claudeBin : null;
  if (fromFlag || fromSettings) return fromFlag || fromSettings;
  const r = exec('/usr/bin/which', ['claude']);
  return r.status === 0 ? r.stdout.trim() : null;
}


/** Read-only checks. Returns [{ name, ok, detail, fix }]. */
function runDoctor(h, { company, claudeBin, exec, ownerUid, accessStat, realpath, readFile, hookSrc }) {
  const out = [];
  const check = (name, ok, detail, fix) => out.push({ name, ok: !!ok, detail, fix: ok ? null : fix });
  const sb = h.ledger().fold().sandbox;
  check('sandbox recorded', sb, sb ? `${sb.user} (home ${sb.home}) in ledger seq ${sb.seq}` : 'no `sandbox` ledger event',
    'sdk-holding sandbox setup --user _sdkco --home /Users/Shared/sdkco');
  if (!sb) return out;
  const script = path.join(h.files.dir, 'sandbox', `setup-${sb.user}.sh`);

  const idr = exec('id', ['-u', sb.user]);
  const sandboxUid = idr.status === 0 ? Number(idr.stdout.trim()) : null;
  check('sandbox user exists', sandboxUid !== null && Number.isSafeInteger(sandboxUid),
    sandboxUid !== null ? `${sb.user} uid ${sandboxUid}` : `no account ${sb.user}`, `review and run: sudo sh ${script}`);

  let st = null; try { st = fs.statSync(h.files.dir); } catch { /* reported below */ }
  const hMode = st ? st.mode & 0o777 : null;
  check('holding/ is 0700 and owned by the Owner', st && hMode === 0o700 && st.uid === ownerUid,
    st ? `mode ${hMode.toString(8)}, uid ${st.uid} (Owner uid ${ownerUid})` : `${h.files.dir} missing`,
    `chmod 700 ${h.files.dir} && sudo chown -R $(id -un) ${h.files.dir}`);

  let cs = null; try { cs = fs.statSync(company.path); } catch { /* reported below */ }
  check('company clone writable by the sandbox user', cs && sandboxUid !== null && cs.uid === sandboxUid && (cs.mode & 0o200),
    cs ? `${company.path} uid ${cs.uid}, mode ${(cs.mode & 0o777).toString(8)}` : `${company.path} missing`,
    `sudo chown -R ${sb.user}:${sb.user} ${company.path} && sudo chmod -R u+rwX ${company.path}`);

  const sessions = sb.sessionDir;
  let ss = null; try { ss = fs.statSync(sessions); } catch { /* reported below */ }
  // The runner refuses SESSION_DIR_INSECURE on the same rule: Owner-owned, not group/other-writable.
  check('session dir is Owner-owned, not group/other-writable', ss && ss.isDirectory() && ss.uid === ownerUid && (ss.mode & 0o022) === 0,
    ss ? `${sessions} uid ${ss.uid}, mode ${(ss.mode & 0o777).toString(8)}` : `${sessions} missing`,
    `sudo mkdir -p ${sessions} && sudo chown $(id -un) ${sessions} && sudo chmod 755 ${sessions}`);

  const keyFile = path.join(h.files.dir, 'keys', `${company.id}.key`);
  let ks = null; try { ks = fs.statSync(keyFile); } catch { /* reported below */ }
  check('company key file is 0600 and Owner-owned', ks && (ks.mode & 0o777) === 0o600 && ks.uid === ownerUid,
    ks ? `${keyFile} mode ${(ks.mode & 0o777).toString(8)}, uid ${ks.uid}` : `${keyFile} missing`,
    `sdk-holding key set ${company.id} --from-stdin < <file with the key>   (then shred the file)`);

  // Reachability as the sandbox user (sandbox-access.js): every parent traversable, the target
  // with the bits it needs. A hook the user cannot exec fails OPEN, so these are not cosmetic.
  const groups = resolveUserGroups(sb.user, exec) || [];
  const real = (p) => { try { return realpath(p); } catch { return p; } };
  const access = [];
  if (!sb.nodePath || !sb.hookPath) {
    check('hook runtime recorded', false, 'the sandbox event has no nodePath/hookPath (recorded before the runtime step existed)',
      'sdk-holding sandbox setup ... again, then review and run the new script');
  } else {
    access.push({ label: 'node (hook runtime)', path: sb.nodePath, need: 'x', fix: `review and run: sudo sh ${script} (step 7 installs the runtime)` });
    access.push({ label: 'landing hook', path: sb.hookPath, need: 'r', fix: `review and run: sudo sh ${script} (step 7 installs the runtime)` });
  }
  if (claudeBin) access.push({ label: 'claude binary', path: claudeBin, need: 'x', fix: 'install claude under a world-traversable path (e.g. /usr/local/bin or /opt/homebrew/bin), then rerun sandbox setup' });
  access.push({ label: 'company clone', path: company.path, need: 'rwx', fix: `move the clone under a traversable path (e.g. /Users/Shared/<company>), or: sudo chown -R ${sb.user}:${sb.user} ${company.path}` });
  if (sb.sessionDir) access.push({ label: 'session dir', path: sb.sessionDir, need: 'rx', fix: `sudo mkdir -p ${sb.sessionDir} && sudo chown $(id -un) ${sb.sessionDir} && sudo chmod 755 ${sb.sessionDir}` });
  for (const a of access) {
    const paths = a.need === 'x' ? [...new Set([a.path, real(a.path)])] : [a.path];
    const results = checkSandboxAccess({ user: sb.user, uid: sandboxUid, userGroups: groups, stat: accessStat, checks: paths.map(p => ({ path: p, need: a.need })) });
    const bad = results.find(r => !r.ok);
    const fix = bad && bad.dir ? `grant traverse only: chmod o+x ${bad.dir}   — or — ${a.fix}` : a.fix;
    check(`${sb.user} can reach the ${a.label} (${a.need})`, !bad, bad ? bad.reason : results.map(r => r.reason).join('; '), fix);
  }

  // The runner's hook pre-flight (runner/sandbox.js), asked ahead of a run.
  if (sb.hookPath) {
    const repoHook = hookSrc || HOOK_SRC;
    const stale = hookStaleProblem({ hookPath: sb.hookPath, repoHook, readFile: readFile || fs.readFileSync });
    check('installed landing hook matches the repo copy', !stale, stale ? `HOOK_STALE: ${stale.detail}` : `${sb.hookPath} sha256 = ${repoHook}`, stale && stale.fix);
    const writable = hookWritableProblem({ hookPath: sb.hookPath, ownerUid, stat: accessStat || fs.statSync, realpath });
    check(`${sb.user} cannot write the landing hook or its folder`, !writable,
      writable ? `HOOK_WRITABLE: ${writable.detail}` : 'hook, folder and parents Owner/root-owned and not group/other-writable (sticky parents allowed)', writable && writable.fix);
  }

  const sr = exec('sudo', ['-n', '-l']);
  const rule = claudeBin && new RegExp(`\\(${sb.user}\\)\\s+NOPASSWD:\\s+${claudeBin.replace(/[.+]/g, '\\$&')}(\\s|$)`, 'm');
  const ruleOk = sr.status === 0 && rule && rule.test(sr.stdout);
  const envOk = sr.status === 0 && /ANTHROPIC_API_KEY/.test(sr.stdout) && /HOLDING_RUN_ID/.test(sr.stdout);
  check('sudo rule: Owner may run only claude as the sandbox user', ruleOk && envOk,
    sr.status !== 0 ? `sudo -n -l failed: ${(sr.stderr || '').trim().split('\n')[0]}`
      : !claudeBin ? 'claude path unknown (pass --claude-bin)'
        : `${ruleOk ? 'rule present' : `no "(${sb.user}) NOPASSWD: ${claudeBin}" rule`}; ${envOk ? 'env_keep present' : 'env_keep ANTHROPIC_API_KEY HOLDING_RUN_ID missing'}`,
    `review and run: sudo sh ${script}`);
  return out;
}

const commands = {
  sandbox({ pos, flags }, io, h, deps) {
    const exec = deps.exec || defaultExec;
    const sub = pos[0];
    if (flags.help !== undefined) { io.out(SANDBOX_USAGE); return; } // `--help` once the parser treats it as boolean
    if (sub === 'setup') {
      const user = need(flags, 'user', 'sandbox setup');
      const home = need(flags, 'home', 'sandbox setup');
      const sessionDir = flags['session-dir'] || DEFAULT_SESSION_DIR;
      const runtimeDir = flags['runtime-dir'] || DEFAULT_RUNTIME_DIR;
      const hookSrc = deps.hookSrc || HOOK_SRC;
      assertHookSelfContained(hookSrc);
      const { nodePath, nodeSrc } = chooseNode(flags, runtimeDir, deps);
      const hookPath = path.join(runtimeDir, 'landing-hook.js');
      const company = pickCompany(h, flags.company);
      const claudeBin = resolveClaudeBin(h, flags, exec) || refuse('cannot find claude; pass --claude-bin <absolute path>');
      const owner = flags.owner || (deps.ownerName || os.userInfo().username);
      const script = generateSetupScript({ user, home, sessionDir, owner, holdingDir: h.files.dir, companyDir: company.path, claudeBin,
        runtimeDir, hookSrc, nodePath, nodeSrc });
      const L = h.ledger();
      L.append({ type: 'sandbox', actor: 'holding-owner', idem_key: `sandbox:${user}:${(L.fold().counts.sandbox || 0) + 1}`, user, home, sessionDir, runtimeDir, nodePath, hookPath });
      const dir = path.join(h.files.dir, 'sandbox');
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      const file = path.join(dir, `setup-${user}.sh`);
      fs.writeFileSync(file, script, { mode: 0o600 });
      fs.chmodSync(file, 0o600);
      if (typeof h.settings.runner !== 'object' || h.settings.runner === null) h.settings.runner = {};
      if (!h.settings.runner.claudeBin) { h.settings.runner.claudeBin = claudeBin; writeJson(h.files.settings, h.settings); }
      io.out(`sandbox ${user} (home ${home}, session dir ${sessionDir}) recorded in the ledger for company ${company.id}`);
      io.out(`hook runtime: ${runtimeDir} (node ${nodePath}${nodeSrc ? `, copied from ${nodeSrc}` : ', already world-traversable'}; hook ${hookPath})`);
      io.out(`setup script written, NOT run: ${file}`);
      io.out(`review it, then: sudo sh ${file}    and afterwards: sdk-holding sandbox doctor`);
      return;
    }
    if (sub === 'doctor') {
      const company = h.ledger().fold().sandbox ? pickCompany(h, flags.company) : null; // no sandbox: say that first
      const ownerUid = deps.ownerUid ?? process.getuid();
      const checks = runDoctor(h, { company, claudeBin: resolveClaudeBin(h, flags, exec), exec, ownerUid,
        accessStat: deps.accessStat, realpath: deps.realpath || fs.realpathSync, readFile: deps.readFile, hookSrc: deps.hookSrc });
      for (const c of checks) {
        io.out(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}: ${c.detail}`);
        if (!c.ok) io.out(`     fix: ${c.fix}`);
      }
      const failed = checks.filter(c => !c.ok).length;
      if (failed) refuse(`sandbox doctor: ${failed} check(s) failed`);
      io.out('sandbox doctor: all checks pass');
      return;
    }
    if (sub === 'show' || sub === undefined) { io.out(JSON.stringify(h.ledger().fold().sandbox, null, 2)); return; }
    if (sub === 'help') { io.out(SANDBOX_USAGE); return; }
    usage(SANDBOX_USAGE);
  },

  key({ pos, flags }, io, h, deps) {
    if (pos[0] !== 'set' || !pos[1]) usage('key set <company> --from-stdin');
    if (flags.key !== undefined || flags.value !== undefined) refuse('never pass a key on the command line (it lands in shell history); use --from-stdin');
    if (!flags['from-stdin']) usage('key set <company> --from-stdin   (the key is read from standard input and never echoed)');
    const company = pickCompany(h, pos[1]);
    const raw = deps.stdin !== undefined ? deps.stdin : fs.readFileSync(0, 'utf8');
    const key = String(raw).replace(/\r?\n$/, '');
    if (!KEY_RE.test(key)) refuse('the input does not look like an API key (one token, no whitespace, at least 20 characters); nothing stored');
    const dir = path.join(h.files.dir, 'keys');
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.chmodSync(dir, 0o700);
    const file = path.join(dir, `${company.id}.key`);
    const tmp = `${file}.${process.pid}.tmp`;
    const fd = fs.openSync(tmp, 'wx', 0o600);
    try { fs.writeSync(fd, key); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.chmodSync(tmp, 0o600);
    fs.renameSync(tmp, file);
    io.out(`key stored for ${company.id} at ${file} (0600, not echoed); the runner injects it per session`);
  },
};

module.exports = { commands, generateSetupScript, runDoctor, chooseNode, assertHookSelfContained, DEFAULT_SESSION_DIR, DEFAULT_RUNTIME_DIR, SANDBOX_USAGE };
