'use strict';

// D7 for one company: `sandbox setup` (ledger event + generated, never-run script), `sandbox doctor`
// (read-only checks through an injected exec), `key set` (0600, never echoed), and the RUN_CONTEXT
// tripwire on Owner commands. No sudo, dscl or network: exec is a stub, paths are temp dirs.
// This suite is async; run.js awaits the exported promise.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { main } = require('../bin/sdk-holding');
const { openLedger } = require('../src/ledger');
const { generateSetupScript } = require('../src/cli/sandbox');
const { createSuite, tmpDir } = require('./_helpers');

const t = createSuite('sandbox');
const CLAUDE = '/opt/claude/bin/claude';
const KEY = 'sk-ant-test-0123456789abcdefghijklmnop';

async function cli(args, deps = {}) {
  const out = []; const err = [];
  const code = await main(args, { stdout: (s) => out.push(s), stderr: (s) => err.push(s), env: {}, ...deps });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

function companyRepo() {
  const repo = tmpDir('sbx-co-');
  execFileSync('git', ['-C', repo, 'init', '-q']);
  fs.writeFileSync(path.join(repo, 'CHARTER.md'), '# Charter\n\n- **Ratified by: Ada (Owner) on 2026-11-15**\n');
  return repo;
}

/** A stub exec: `id -u <user>` and `sudo -n -l` answer from the fixture; everything else fails. */
function stubExec({ userUid = process.getuid(), sudoOut = null } = {}) {
  const calls = [];
  const exec = (cmd, args) => {
    calls.push([cmd, ...args]);
    if (cmd === 'id' && args[0] === '-u') return userUid === null ? { status: 1, stdout: '', stderr: 'no such user' } : { status: 0, stdout: `${userUid}\n`, stderr: '' };
    if (cmd === 'id' && args[0] === '-G') return userUid === null ? { status: 1, stdout: '', stderr: 'no such user' } : { status: 0, stdout: '401\n', stderr: '' };
    if (cmd === 'sudo' && args.join(' ') === '-n -l') return sudoOut === null ? { status: 1, stdout: '', stderr: 'sudo: a password is required' } : { status: 0, stdout: sudoOut, stderr: '' };
    return { status: 1, stdout: '', stderr: `unexpected ${cmd}` };
  };
  return { exec, calls };
}
// Synthetic stat for paths that do not exist on the test machine (the script is never run):
// claude under /opt/claude and the runtime under /Users/Shared/sdkco-runtime, all world-traversable.
const dir = (mode, uid = 0, gid = 0) => ({ mode: 0o040000 | mode, uid, gid, isDirectory: () => true });
const file = (mode, uid = 0, gid = 0) => ({ mode: 0o100000 | mode, uid, gid, isDirectory: () => false });
const RUNTIME = '/Users/Shared/sdkco-runtime';
const SYN = {
  '/': dir(0o755), '/opt': dir(0o755), '/opt/claude': dir(0o755), '/opt/claude/bin': dir(0o755), [CLAUDE]: file(0o755),
  '/Users': dir(0o755), '/Users/Shared': dir(0o1777), [RUNTIME]: dir(0o755, 501), [`${RUNTIME}/landing-hook.js`]: file(0o644, 501),
  [`${RUNTIME}/node`]: file(0o755, 501),
};
const layeredStat = (p) => {
  if (SYN[p]) return SYN[p];
  const st = fs.statSync(p);
  return { mode: st.mode, uid: st.uid, gid: st.gid, isDirectory: () => st.isDirectory() };
};
const ACCESS = { accessStat: layeredStat, realpath: (p) => p, execPath: '/Users/ada/.local/node/bin/node' };
const SUDO_OK = (user) => `Matching Defaults entries for ada on host:\n    env_keep+="ANTHROPIC_API_KEY HOLDING_RUN_ID"\n\nUser ada may run the following commands on host:\n    (${user}) NOPASSWD: ${CLAUDE}\n`;

async function run() {
  const base = tmpDir('sbx-');
  const root = path.join(base, 'h');
  const H = ['--holding', root];
  const repo = companyRepo();
  await cli(['init', root, '--owner', 'Ada']);
  t.eq((await cli(['add-company', repo, '--id', 'acme', '--owner', 'Ada', ...H])).code, 0, 'company registered');
  const home = path.join(base, 'Shared', 'sdkco');
  const sessionDir = path.join(base, 'Shared', 'sdkco-sessions');

  // @covers cap-po-sandbox-001 — setup records the sandbox event and generates (never runs) a reviewed script
  {
    const { exec, calls } = stubExec();
    const r = await cli(['sandbox', 'setup', '--user', '_sdkco', '--home', home, '--session-dir', sessionDir, '--claude-bin', CLAUDE, ...H], { exec, ownerName: 'ada', ...ACCESS });
    t.eq(r.code, 0, `sandbox setup (${r.err})`);
    t.deepEq(calls, [], 'setup runs nothing (no sudo, no dscl)');
    const sb = openLedger(path.join(root, 'holding/fuel/ledger.jsonl'), {}).fold().sandbox;
    t.deepEq([sb.user, sb.home, sb.sessionDir], ['_sdkco', home, sessionDir], 'state.sandbox {user, home, sessionDir} from the `sandbox` ledger event');
    const file = path.join(root, 'holding/sandbox/setup-_sdkco.sh');
    t.assert(r.out.includes(file) && /NOT run/.test(r.out), 'output names the script and says it was not run');
    t.eq(fs.statSync(file).mode & 0o777, 0o600, 'script is 0600 (Owner reviews, then runs with sudo sh)');
    const s = fs.readFileSync(file, 'utf8');
    t.assert(/REVIEW EVERY LINE/.test(s), 'script asks for review');
    t.assert(s.includes("SANDBOX_USER='_sdkco'") && s.includes('IsHidden 1') && s.includes('UserShell /usr/bin/false'), 'hidden user, no login shell');
    t.assert(s.includes(`COMPANY_DIR='${repo}'`) && /chown -R "\$SANDBOX_USER:\$SANDBOX_GROUP" "\$COMPANY_DIR"/.test(s), 'company clone chowned to the sandbox user');
    t.assert(/chmod 700 "\$HOLDING_DIR"/.test(s) && s.includes(`HOLDING_DIR='${path.join(root, 'holding')}'`), 'holding/ 0700 owned by the Owner');
    t.assert(s.includes(`SESSIONS_DIR='${sessionDir}'`) && /chmod 755 "\$SESSIONS_DIR"/.test(s)
      && /chown "\$OWNER" "\$SESSIONS_DIR"/.test(s), 'the recorded session dir is created Owner-owned 0755');
    t.assert(s.includes('Defaults!$CLAUDE_BIN env_keep += "ANTHROPIC_API_KEY HOLDING_RUN_ID"'), 'sudoers keeps only the key and run id');
    t.assert(s.includes('$OWNER ALL=($SANDBOX_USER) NOPASSWD: $CLAUDE_BIN'), 'sudoers allows only the claude path as the sandbox user');
    t.assert(!/SETENV|ALL\s*$|\*/m.test(s.split('cat > "$TMP" <<EOF')[1].split('EOF')[0]), 'no SETENV, no wildcard, no ALL command');
    t.assert(s.indexOf('visudo -cf "$TMP"') < s.indexOf('install -m 0440') && s.indexOf('visudo -cf') > 0, 'drop-in validated with visudo -cf before install');
    t.assert(s.includes("CLAUDE_BIN='/opt/claude/bin/claude'"), 'absolute claude path pinned');
    let threw = null;
    try { generateSetupScript({ user: '_sdkco', home, sessionDir, owner: 'ada', holdingDir: '/h', companyDir: '/c; rm -rf /', claudeBin: CLAUDE }); } catch (e) { threw = e; }
    t.assert(threw && /must be an absolute path/.test(threw.message), 'shell or sudoers metacharacters in a path are refused');
    threw = null;
    try {
      generateSetupScript({ user: 'root ALL', home, sessionDir, owner: 'ada', holdingDir: '/h', companyDir: '/c', claudeBin: CLAUDE,
        runtimeDir: RUNTIME, hookSrc: '/repo/landing-hook.js', nodePath: `${RUNTIME}/node` });
    } catch (e) { threw = e; }
    t.assert(threw && /account name/.test(threw.message), 'a malformed user name is refused');
    t.eq((await cli(['sandbox', 'setup', '--user', 'Bad User', '--home', home, '--claude-bin', CLAUDE, ...H], { exec })).code, 1, 'invalid user refused');
  }

  // @covers cap-po-sandbox-001 — key set: 0600 under holding/keys, read from stdin, never echoed, never from argv
  {
    const r = await cli(['key', 'set', 'acme', '--from-stdin', ...H], { stdin: `${KEY}\n` });
    t.eq(r.code, 0, `key set (${r.err})`);
    const file = path.join(root, 'holding/keys/acme.key');
    t.eq(fs.readFileSync(file, 'utf8'), KEY, 'key stored without the trailing newline');
    t.eq(fs.statSync(file).mode & 0o777, 0o600, 'key file 0600');
    t.eq(fs.statSync(path.dirname(file)).mode & 0o777, 0o700, 'keys dir 0700');
    t.assert(!r.out.includes(KEY) && !r.err.includes(KEY), 'the key is never echoed');
    const argv = await cli(['key', 'set', 'acme', '--key', KEY, ...H]);
    t.eq(argv.code, 1, 'a key on argv is refused');
    t.assert(!argv.err.includes(KEY), 'and not echoed back');
    t.eq((await cli(['key', 'set', 'acme', ...H], { stdin: KEY })).code, 2, '--from-stdin is required');
    t.eq((await cli(['key', 'set', 'acme', '--from-stdin', ...H], { stdin: 'not a key' })).code, 1, 'whitespace / short input refused');
    t.eq((await cli(['key', 'set', 'nope', '--from-stdin', ...H], { stdin: KEY })).code, 1, 'unknown company refused');
  }

  // @covers cap-po-sandbox-001 — doctor: every check passes on a configured sandbox, read-only
  {
    fs.mkdirSync(home, { recursive: true });
    fs.mkdirSync(sessionDir, { mode: 0o755 }); fs.chmodSync(sessionDir, 0o755);
    const { exec, calls } = stubExec({ sudoOut: SUDO_OK('_sdkco') });
    const r = await cli(['sandbox', 'doctor', ...H], { exec, ownerUid: process.getuid(), ...ACCESS });
    t.eq(r.code, 0, `doctor passes (${r.out}\n${r.err})`);
    for (const name of ['sandbox recorded', 'sandbox user exists', 'holding/ is 0700', 'company clone writable', 'session dir', 'company key file is 0600', 'sudo rule']) {
      t.assert(new RegExp(`ok\\s+${name.replace(/[/.]/g, '\\$&')}`).test(r.out), `check passes: ${name}`);
    }
    for (const name of ['node \\(hook runtime\\)', 'landing hook', 'claude binary', 'company clone', 'session dir']) {
      t.assert(new RegExp(`ok\\s+_sdkco can reach the ${name}`).test(r.out), `access check passes: ${name}`);
    }
    t.assert(calls.every(c => (c[0] === 'id' && ['-u', '-G'].includes(c[1])) || (c[0] === 'sudo' && c.slice(1).join(' ') === '-n -l')),
      'doctor only runs read-only commands (id -u, id -G, sudo -n -l)');
  }

  // @covers cap-po-sandbox-001 — doctor: each failing check names its fix
  {
    const { exec } = stubExec({ userUid: null, sudoOut: null });
    fs.chmodSync(path.join(root, 'holding'), 0o755);
    fs.chmodSync(path.join(root, 'holding/keys/acme.key'), 0o644);
    fs.chmodSync(sessionDir, 0o777);
    const r = await cli(['sandbox', 'doctor', ...H], { exec, ownerUid: process.getuid(), ...ACCESS });
    t.eq(r.code, 1, 'doctor fails');
    const script = path.join(root, 'holding/sandbox/setup-_sdkco.sh');
    t.assert(/FAIL sandbox user exists/.test(r.out) && r.out.includes(`fix: review and run: sudo sh ${script}`), 'missing user → run the script');
    t.assert(/FAIL holding\/ is 0700/.test(r.out) && /fix: chmod 700/.test(r.out), 'holding mode → chmod 700');
    t.assert(/FAIL company clone writable/.test(r.out) && /fix: sudo chown -R _sdkco:_sdkco/.test(r.out), 'company ownership → chown to the sandbox user');
    t.assert(/FAIL company key file is 0600/.test(r.out) && /fix: sdk-holding key set acme --from-stdin/.test(r.out), 'key mode → key set');
    t.assert(/FAIL sudo rule/.test(r.out) && /a password is required/.test(r.out), 'sudo rule → names what sudo said and the script');
    t.assert(/FAIL session dir is Owner-owned, not group\/other-writable/.test(r.out) && /fix: sudo mkdir -p .* && sudo chmod 755/.test(r.out),
      'a group/other-writable session dir fails (the runner refuses SESSION_DIR_INSECURE on the same rule)');
    t.assert(/\d+ check\(s\) failed/.test(r.err), 'summary counts the failures');
    fs.chmodSync(sessionDir, 0o755);
    fs.chmodSync(path.join(root, 'holding'), 0o700);
    fs.chmodSync(path.join(root, 'holding/keys/acme.key'), 0o600);
    const fresh = path.join(tmpDir('sbx-none-'), 'h');
    await cli(['init', fresh, '--owner', 'Ada']);
    const none = await cli(['sandbox', 'doctor', '--holding', fresh], { exec, ownerUid: process.getuid(), ...ACCESS });
    t.assert(none.code === 1 && /fix: sdk-holding sandbox setup/.test(none.out), 'no sandbox event → names sandbox setup');
  }

  // @covers cap-po-sandbox-001 — RUN_CONTEXT: every Owner command refuses inside a session (HOLDING_RUN_ID set); a tripwire, not a barrier
  {
    const env = { HOLDING_RUN_ID: 'run-abc' };
    const owner = [
      ['ratify', 'G1'], ['fund', '10', '--by', 'holding-owner'], ['limits', 'set', '--concurrency', '2'], ['price-table', 'set', '/tmp/x.json'],
      ['runner-pin', 'set', '--claude-version', '2.1.292', '--session-floor', 'm=1'], ['sandbox', 'setup', '--user', '_x', '--home', '/x'],
      ['unfreeze'], ['judge', 'G1', 'advanced'], ['kill', 'G1', '--reason', 'x'], ['reconcile', '--company', 'acme', '--provider-usd', '1', '--period', '1'],
      ['key', 'set', 'acme', '--from-stdin'], ['config', 'import-settings'], ['cycle', 'close'], ['close', 'G1'], ['add-company', '/x', '--id', 'x', '--owner', 'x'],
      ['init', '/tmp/never', '--owner', 'x'],
    ];
    const n = fs.readFileSync(path.join(root, 'holding/fuel/ledger.jsonl'), 'utf8').length;
    for (const args of owner) {
      const r = await cli([...args, ...H], { env, stdin: KEY });
      t.assert(r.code === 1 && /RUN_CONTEXT/.test(r.err) && /run-abc/.test(r.err), `${args.slice(0, 2).join(' ')} refused with RUN_CONTEXT`);
    }
    t.eq(fs.readFileSync(path.join(root, 'holding/fuel/ledger.jsonl'), 'utf8').length, n, 'nothing was written');
    t.assert(/tripwire, not a barrier/.test((await cli(['ratify', 'G1', ...H], { env })).err), 'the refusal says it is a tripwire');
    for (const args of [['report', '--json'], ['verify'], ['sandbox', 'show'], ['limits', 'show']]) {
      t.eq((await cli([...args, ...H], { env })).code, 0, `${args.join(' ')} still works inside a session (read-only)`);
    }
    const fz = await cli(['freeze', '--reason', 'self-halt', ...H], { env });
    t.eq(fz.code, 0, 'freeze (halting) stays available inside a session');
    t.eq((await cli(['unfreeze', ...H], { env })).code, 1, 'but unfreeze does not');
    t.eq((await cli(['unfreeze', ...H])).code, 0, 'the Owner unfreezes from outside');
  }

  return t.done();
}

module.exports = run();
