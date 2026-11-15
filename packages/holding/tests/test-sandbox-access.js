'use strict';

// Can the D7 sandbox user reach node, the landing hook, claude, the company clone and the session
// dir? (Guardian cycle 2: a hook it cannot exec fails OPEN.) Pure checks on synthetic stat data,
// plus the runtime step of `sandbox setup` and the access checks of `sandbox doctor`.
// Async; run.js awaits the exported promise. No sudo, no dscl.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { checkSandboxAccess, resolveUserGroups, resolveUserUid } = require('../src/sandbox-access');
const { main } = require('../bin/sdk-holding');
const { openLedger } = require('../src/ledger');
const { createSuite, tmpDir } = require('./_helpers');

const t = createSuite('sandbox-access');
const STAFF = 20; const SBX_GID = 401; const SBX_UID = 401; const OWNER_UID = 501;
const dir = (mode, uid = 0, gid = 0) => ({ mode: 0o040000 | mode, uid, gid, isDirectory: () => true });
const file = (mode, uid = 0, gid = 0) => ({ mode: 0o100000 | mode, uid, gid, isDirectory: () => false });
const statFrom = (map) => (p) => { if (!map[p]) { const e = new Error(`ENOENT ${p}`); e.code = 'ENOENT'; throw e; } return map[p]; };

// A macOS-like tree: the Owner's home is drwxr-x--- staff; /Users/Shared is world-writable sticky.
const TREE = {
  '/': dir(0o755), '/Users': dir(0o755), '/Users/ada': dir(0o750, OWNER_UID, STAFF), '/Users/ada/.local': dir(0o755, OWNER_UID, STAFF),
  '/Users/ada/.local/node': dir(0o755, OWNER_UID, STAFF), '/Users/ada/.local/node/bin': dir(0o755, OWNER_UID, STAFF),
  '/Users/ada/.local/node/bin/node': file(0o755, OWNER_UID, STAFF),
  '/Users/ada/dev': dir(0o755, OWNER_UID, STAFF), '/Users/ada/dev/acme': dir(0o750, SBX_UID, SBX_GID),
  '/Users/Shared': dir(0o1777), '/Users/Shared/acme': dir(0o750, SBX_UID, SBX_GID),
  '/Users/Shared/sdkco-runtime': dir(0o755, OWNER_UID, STAFF), '/Users/Shared/sdkco-runtime/node': file(0o755, OWNER_UID, STAFF),
  '/Users/Shared/sdkco-runtime/landing-hook.js': file(0o644, OWNER_UID, STAFF),
  '/Users/Shared/sdkco-sessions': dir(0o755, OWNER_UID, STAFF),
  '/opt': dir(0o755), '/opt/homebrew': dir(0o755, OWNER_UID, 80), '/opt/homebrew/bin': dir(0o755, OWNER_UID, 80),
  '/opt/homebrew/bin/node': file(0o755, OWNER_UID, 80), '/opt/homebrew/bin/claude': file(0o755, OWNER_UID, 80),
  '/opt/locked': dir(0o700, OWNER_UID, STAFF), '/opt/locked/node': file(0o755, OWNER_UID, STAFF),
  '/opt/ownerless': dir(0o005, SBX_UID, STAFF), '/opt/ownerless/x': file(0o644),
};
const stat = statFrom(TREE);
const sbx = (checks, groups = [SBX_GID]) => checkSandboxAccess({ user: '_sdkco', uid: SBX_UID, userGroups: groups, checks, stat });

// @covers cap-po-sandbox-001 — every ancestor needs x for the sandbox user; a 0750 staff home blocks a user not in staff
{
  const [r] = sbx([{ path: '/Users/ada/.local/node/bin/node', need: 'x' }]);
  t.eq(r.ok, false, 'node under a 0750 staff home is unreachable');
  t.eq(r.dir, '/Users/ada', 'the result names the blocking directory');
  t.assert(/cannot traverse \/Users\/ada \(mode 750, uid 501, gid 20/.test(r.reason) && /"other" class/.test(r.reason), 'reason names mode, owner, group and class');
  t.eq(sbx([{ path: '/Users/ada/.local/node/bin/node', need: 'x' }], [SBX_GID, STAFF])[0].ok, true, 'in staff (group x on the home): reachable');
  t.eq(sbx([{ path: '/Users/ada/dev/acme', need: 'rwx' }])[0].ok, false, 'a clone under the Owner home is unreachable even if the user owns it');
  t.eq(sbx([{ path: '/Users/Shared/acme', need: 'rwx' }])[0].ok, true, 'the same clone under /Users/Shared is reachable (owner class rwx)');
  t.eq(sbx([{ path: '/opt/homebrew/bin/node', need: 'x' }])[0].ok, true, 'a world-traversable node');
  t.eq(sbx([{ path: '/Users/Shared/sdkco-runtime/landing-hook.js', need: 'r' }])[0].ok, true, 'the installed hook is readable');
  t.eq(sbx([{ path: '/Users/Shared/sdkco-sessions', need: 'rx' }])[0].ok, true, 'the session dir is rx');
}

// @covers cap-po-sandbox-001 — target bits, the first matching class decides, missing paths, bad input
{
  const [w] = sbx([{ path: '/Users/Shared/sdkco-runtime/landing-hook.js', need: 'rwx' }]);
  t.assert(!w.ok && /lacks wx/.test(w.reason), 'missing target bits named');
  const [o] = sbx([{ path: '/opt/ownerless/x', need: 'r' }]);
  t.assert(!o.ok && o.dir === '/opt/ownerless' && /"owner" class/.test(o.reason), 'owner class with 0 bits is refused even though "other" has x (the kernel picks the first class)');
  t.eq(sbx([{ path: '/opt/locked/node', need: 'x' }])[0].dir, '/opt/locked', 'a 0700 parent blocks');
  t.assert(/does not exist/.test(sbx([{ path: '/nope/node', need: 'x' }])[0].reason), 'a missing ancestor is named');
  t.assert(/does not exist/.test(sbx([{ path: '/opt/homebrew/bin/missing', need: 'x' }])[0].reason), 'a missing target is named');
  t.eq(sbx([{ path: 'relative/node', need: 'x' }])[0].ok, false, 'relative paths refused');
  t.eq(sbx([{ path: '/opt/homebrew/bin/node', need: 'w' }])[0].ok, false, 'unknown need refused');
  const statDir = (p) => (p === '/opt/homebrew' ? dir(0o700, OWNER_UID, 80) : stat(p));
  const [d] = checkSandboxAccess({ user: '_sdkco', uid: SBX_UID, userGroups: [], checks: [{ path: '/opt/homebrew/bin/node', need: 'x' }], stat, statDir });
  t.eq(d.dir, '/opt/homebrew', 'statDir is used for ancestors (injectable separately)');
}

// @covers cap-po-sandbox-001 — resolveUserGroups / resolveUserUid through an injected exec
{
  const exec = (cmd, args) => (cmd === 'id' && args[0] === '-G' && args[1] === '_sdkco' ? { status: 0, stdout: '401 12 61\n', stderr: '' }
    : cmd === 'id' && args[0] === '-u' && args[1] === '_sdkco' ? { status: 0, stdout: '401\n', stderr: '' } : { status: 1, stdout: '', stderr: 'no such user' });
  t.deepEq(resolveUserGroups('_sdkco', exec), [401, 12, 61], 'id -G parsed to gids');
  t.eq(resolveUserGroups('ghost', exec), null, 'unknown user → null');
  t.eq(resolveUserUid('_sdkco', exec), 401, 'id -u parsed');
}

async function cli(args, deps = {}) {
  const out = []; const err = [];
  const code = await main(args, { stdout: (s) => out.push(s), stderr: (s) => err.push(s), env: {}, ...deps });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

async function run() {
  const base = tmpDir('sbxa-');
  const root = path.join(base, 'h');
  const H = ['--holding', root];
  const repo = tmpDir('sbxa-co-');
  execFileSync('git', ['-C', repo, 'init', '-q']);
  fs.writeFileSync(path.join(repo, 'CHARTER.md'), '- **Ratified by: Ada (Owner) on 2026-11-15**\n');
  await cli(['init', root, '--owner', 'Ada']);
  await cli(['add-company', repo, '--id', 'acme', '--owner', 'Ada', ...H]);
  const noExec = () => ({ status: 1, stdout: '', stderr: 'not run' });
  const SETUP = ['sandbox', 'setup', '--user', '_sdkco', '--home', '/Users/Shared/sdkco', '--claude-bin', '/opt/homebrew/bin/claude', ...H];
  const sbEvent = () => openLedger(path.join(root, 'holding/fuel/ledger.jsonl'), {}).fold().sandbox;
  const script = () => fs.readFileSync(path.join(root, 'holding/sandbox/setup-_sdkco.sh'), 'utf8');

  // @covers cap-po-sandbox-001 — setup: a world-traversable node is used in place; the hook is installed in the 0755 runtime dir
  {
    const r = await cli(SETUP, { exec: noExec, ownerName: 'ada', accessStat: stat, realpath: (p) => p, execPath: '/Users/ada/.local/node/bin/node' });
    t.eq(r.code, 0, `setup (${r.err})`);
    const sb = sbEvent();
    t.deepEq([sb.runtimeDir, sb.nodePath, sb.hookPath], ['/Users/Shared/sdkco-runtime', '/opt/homebrew/bin/node', '/Users/Shared/sdkco-runtime/landing-hook.js'],
      'sandbox event records runtimeDir, nodePath, hookPath');
    t.eq(sb.sessionDir, '/Users/Shared/sdkco-sessions', 'alongside sessionDir');
    const s = script();
    t.assert(s.includes("RUNTIME_DIR='/Users/Shared/sdkco-runtime'") && /chown "\$OWNER" "\$RUNTIME_DIR"/.test(s) && /chmod 755 "\$RUNTIME_DIR"/.test(s), 'runtime dir Owner-owned 0755');
    t.assert(s.includes(`HOOK_SRC='${path.resolve(__dirname, '..', 'src', 'landing-hook.js')}'`) && s.includes('install -m 0644 -o "$OWNER" "$HOOK_SRC" "$RUNTIME_DIR/landing-hook.js"'), 'hook copied from the repo');
    t.assert(!/install -m 0755 -o "\$OWNER" "\$NODE_SRC"/.test(s) && /already world-traversable/.test(s), 'no node copy when one is reachable');
    t.assert(/sudo -u "\$SANDBOX_USER" \/bin\/test -x "\$NODE_PATH"/.test(s) && /\/bin\/test -w "\$COMPANY_DIR"/.test(s), 'the script proves reachability as the sandbox user');
  }

  // @covers cap-po-sandbox-001 — setup: no reachable node → the Owner's node is copied into the runtime dir
  {
    const unreachable = statFrom({ ...TREE, '/opt/homebrew': dir(0o700, OWNER_UID, 80) });
    const r = await cli(SETUP, { exec: noExec, ownerName: 'ada', accessStat: unreachable, realpath: (p) => p, execPath: '/Users/ada/.local/node/bin/node' });
    t.eq(r.code, 0, `setup (${r.err})`);
    t.eq(sbEvent().nodePath, '/Users/Shared/sdkco-runtime/node', 'nodePath is the runtime copy');
    const s = script();
    t.assert(s.includes("NODE_SRC='/Users/ada/.local/node/bin/node'") && s.includes('install -m 0755 -o "$OWNER" "$NODE_SRC" "$NODE_PATH"'), 'node copied from the Owner\'s node');
    t.assert(/copied from \/Users\/ada\/\.local\/node\/bin\/node/.test(r.out), 'output says the node is copied');
  }

  // @covers cap-po-sandbox-001 — setup refuses a hook that is not self-contained
  {
    const bad = path.join(base, 'hook.js');
    fs.writeFileSync(bad, "const x = require('./meter');\n");
    const r = await cli(SETUP, { exec: noExec, ownerName: 'ada', accessStat: stat, realpath: (p) => p, hookSrc: bad });
    t.assert(r.code === 1 && /self-contained/.test(r.err) && /\.\/meter/.test(r.err), 'a hook requiring repo modules is refused');
    t.assert(/require\('fs'\)/.test(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'landing-hook.js'), 'utf8')), '(the real hook uses built-ins)');
  }

  // @covers cap-po-sandbox-001 — doctor: access checks for node, hook, claude, clone, session dir; each failure names the dir and the fix
  {
    const exec = (cmd, args) => (cmd === 'id' && args[0] === '-u' ? { status: 0, stdout: `${SBX_UID}\n`, stderr: '' }
      : cmd === 'id' && args[0] === '-G' ? { status: 0, stdout: `${SBX_GID}\n`, stderr: '' } : { status: 1, stdout: '', stderr: 'sudo: a password is required' });
    // nodePath is the runtime copy (last setup); the clone lives under a 0750 Owner home; claude under a 0700 dir.
    const tree = statFrom({ ...TREE, [repo]: dir(0o700, SBX_UID, SBX_GID), '/opt/homebrew': dir(0o700, OWNER_UID, 80),
      ...Object.fromEntries(path.dirname(repo).split('/').map((_, i, a) => a.slice(0, i + 1).join('/') || '/').map((p, i) => [p, i === 1 ? dir(0o750, OWNER_UID, STAFF) : dir(0o755)])) });
    const r = await cli(['sandbox', 'doctor', ...H], { exec, ownerUid: process.getuid(), accessStat: tree, realpath: (p) => p });
    t.eq(r.code, 1, 'doctor fails');
    t.assert(/ok\s+_sdkco can reach the node \(hook runtime\) \(x\)/.test(r.out), 'runtime node reachable');
    t.assert(/ok\s+_sdkco can reach the landing hook \(r\)/.test(r.out), 'hook reachable');
    t.assert(/FAIL _sdkco can reach the claude binary \(x\): _sdkco cannot traverse \/opt\/homebrew/.test(r.out), 'claude blocked: names the dir');
    t.assert(/fix: grant traverse only: chmod o\+x \/opt\/homebrew/.test(r.out), 'fix names chmod o+x on that dir');
    const top = `/${repo.split('/')[1]}`;
    t.assert(new RegExp(`FAIL _sdkco can reach the company clone \\(rwx\\): _sdkco cannot traverse ${top.replace(/\//g, '\\/')}`).test(r.out), 'clone blocked by its parent');
    t.assert(/move the clone under a traversable path/.test(r.out), 'fix offers moving the clone');
    t.assert(/ok\s+_sdkco can reach the session dir \(rx\)/.test(r.out), 'session dir reachable');
  }

  // @covers cap-po-sandbox-001 — doctor: a sandbox event without the runtime (pre-runtime setup) fails with the fix
  {
    const L = openLedger(path.join(root, 'holding/fuel/ledger.jsonl'), {});
    L.append({ type: 'sandbox', actor: 'holding-owner', idem_key: 'sandbox:old', user: '_sdkco', home: '/Users/Shared/sdkco', sessionDir: '/Users/Shared/sdkco-sessions' });
    const exec = (cmd, args) => (cmd === 'id' ? { status: 0, stdout: `${SBX_UID}\n`, stderr: '' } : { status: 1, stdout: '', stderr: 'x' });
    const r = await cli(['sandbox', 'doctor', ...H], { exec, ownerUid: process.getuid(), accessStat: stat, realpath: (p) => p });
    t.assert(/FAIL hook runtime recorded/.test(r.out) && /fix: sdk-holding sandbox setup/.test(r.out), 'missing runtime fields → rerun setup');
    t.throwsCode(() => L.append({ type: 'sandbox', actor: 'holding-owner', idem_key: 'sandbox:bad', user: '_sdkco', home: '/x', sessionDir: '/y', nodePath: 'node' }),
      'SANDBOX_INVALID', 'runtime paths must be absolute');
  }

  return t.done();
}

module.exports = run();
