#!/usr/bin/env node

/**
 * test-cap-doc.js — black-box conformance for every `sdk-doc` subcommand
 * (project/context/spec/sdk-doc/claims.yaml, protocol.md §30 "Specs outlive implementations").
 *
 * Every assertion runs `node scripts/doc.js ...` as a child process against a fixture project in
 * an os.tmpdir() mkdtemp directory and checks only the public interface: exit codes, stdout/stderr
 * lines, and the files written. No internals are imported, so the implementation can be rewritten
 * from scratch and this file still says whether every promise holds.
 *
 * `// DEFECT:` marks an assertion that pins CURRENT behaviour which differs from the help/docs; the
 * matching capability carries `status: defect` and a `defect_note`. Flip the assertion when fixed.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const docJs = path.join(root, 'scripts', 'doc.js');
const templateDir = path.join(root, 'project-template');

let passed = 0, failed = 0;
const assert = (c, n) => { if (c) passed++; else { failed++; console.log(`  ✗  ${n}`); } };

const tmpDirs = [];
function mkProject(withTemplate = true) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-cap-doc-'));
  tmpDirs.push(dir);
  if (withTemplate) {
    for (const f of fs.readdirSync(templateDir)) {
      const src = path.join(templateDir, f);
      if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(dir, f));
    }
  }
  return dir;
}
function run(args, cwd) {
  const r = spawnSync('node', [docJs, ...args], { cwd: cwd || os.tmpdir(), encoding: 'utf8' });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '', all: (r.stdout || '') + (r.stderr || '') };
}
const read = (p) => fs.readFileSync(p, 'utf8');
const today = new Date().toISOString().slice(0, 10);

function section(dir, name, content) {
  const f = path.join(dir, name);
  fs.writeFileSync(f, content);
  return f;
}

// ─── dispatcher ──────────────────────────────────────────────────────────────
{
  // @covers cap-doc-dispatch-001
  const none = run([]);
  assert(none.code === 0 && /Usage:/.test(none.out), 'no args prints usage, exit 0');
  const unknown = run(['frobnicate', 'x.md']);
  assert(unknown.code === 1 && /Unknown command: "frobnicate"/.test(unknown.err), 'unknown command exits 1 with a message');
  const noFile = run(['read']);
  assert(noFile.code === 1 && /Usage:/.test(noFile.out), 'file command without a file prints usage, exit 1');
  const help = run(['--help']);
  assert(/Usage:/.test(help.out), '--help prints usage');
}

// ─── list / read ─────────────────────────────────────────────────────────────
{
  const dir = mkProject(false);
  const f = section(dir, 'a.md', '# Title\n\nintro\n\n## One\n\nbody one\n\n### Sub\n\nsub body\n\n## Two\n\nbody two\n');

  // @covers cap-doc-list-001
  const l = run(['list', f]);
  assert(l.code === 0 && /\n# Title\n/.test(l.out) && /\n  ## One\n/.test(l.out) && /\n    ### Sub\n/.test(l.out), 'list prints every heading indented by level');

  // @covers cap-doc-read-001
  const r = run(['read', f, '--section', '## One']);
  assert(r.code === 0 && /body one/.test(r.out) && /sub body/.test(r.out) && !/body two/.test(r.out), 'read prints the section including subsections, stops at the next same-level heading');
  assert(/body one/.test(run(['read', f, '--section', 'one']).out), 'read heading match is case-insensitive');

  // @covers cap-doc-read-002
  const miss = run(['read', f, '--section', '## Nope']);
  assert(miss.code === 1 && /Section not found: "## Nope"/.test(miss.err), 'read of a missing section exits 1');
  const noOpt = run(['read', f]);
  assert(noOpt.code === 1 && /Missing --section/.test(noOpt.err), 'read without --section exits 1');
  const noFile = run(['read', path.join(dir, 'missing.md'), '--section', 'x']);
  assert(noFile.code === 1 && /File not found:/.test(noFile.err), 'read of a missing file exits 1 with File not found');
}

// ─── append / rewrite ────────────────────────────────────────────────────────
{
  const dir = mkProject(false);
  const f = section(dir, 'a.md', '# T\n\n## One\n\nfirst\n\n## Two\n\nsecond\n');

  // @covers cap-doc-append-001
  const a = run(['append', f, '--section', '## One', '--content', 'added line']);
  const after = read(f);
  assert(a.code === 0 && /Appended to section "## One"/.test(a.out), 'append reports the section');
  assert(after.indexOf('first') < after.indexOf('added line') && after.indexOf('added line') < after.indexOf('## Two'), 'append inserts at the end of the section, before the next heading');
  assert(/second/.test(after), 'append leaves other sections intact');

  // @covers cap-doc-append-002
  const c = run(['append', f, '--section', '## Three', '--content', 'third']);
  assert(c.code === 0 && /Created section "## Three"/.test(c.out) && /## Two\n\nsecond\n\n## Three\n\nthird\n$/.test(read(f)), 'append to a missing plain section creates it at the end of the file');
  const m = run(['append', f, '--section', '## One']);
  assert(m.code === 1 && /Missing --section or --content/.test(m.err), 'append without --content exits 1');

  // @covers cap-doc-append-003
  const before = read(f);
  const d = run(['append', f, '--section', '## One', '--content', 'dry', '--dry-run']);
  assert(d.code === 0 && /DRY RUN — no files modified/.test(d.out) && read(f) === before, 'append --dry-run previews and writes nothing');

  // @covers cap-doc-rewrite-001
  const rw = run(['rewrite', f, '--section', '## One', '--content', 'replaced']);
  const r1 = read(f);
  assert(rw.code === 0 && /Rewrote section "## One"/.test(rw.out), 'rewrite reports the section');
  assert(/## One\n\nreplaced\n\n## Two/.test(r1) && !/first/.test(r1) && !/added line/.test(r1), 'rewrite replaces the body, keeps the heading and the next section');

  // @covers cap-doc-rewrite-002
  const rn = run(['rewrite', f, '--section', '## Four', '--content', 'fourth']);
  assert(rn.code === 0 && /## Four\n\nfourth/.test(read(f)), 'rewrite of a missing section creates it');
  assert(run(['rewrite', f, '--content', 'x']).code === 1, 'rewrite without --section exits 1');
}

// ─── add-item ────────────────────────────────────────────────────────────────
{
  const dir = mkProject(false);
  const f = section(dir, 'r.md', '# R\n\n## Pending\n\n- [ ] existing\n\n## Done\n');

  // @covers cap-doc-add-item-001
  run(['add-item', f, '--section', '## Pending', '--item', 'p1']);
  run(['add-item', f, '--section', '## Pending', '--item', 'd1', '--status', 'done']);
  run(['add-item', f, '--section', '## Pending', '--item', 'b1', '--status', 'blocked']);
  const t = read(f);
  assert(/- \[ \] existing\n- \[ \] p1\n- \[x\] d1\n- \[!\] b1\n\n## Done/.test(t), 'add-item appends [ ] / [x] / [!] items at the end of the section');
  assert(run(['add-item', f, '--section', '## Pending']).code === 1, 'add-item without --item exits 1');

  // @covers cap-doc-add-item-002
  const bare = run(['add-item', f, '--section', 'Notes', '--item', 'n1']);
  assert(bare.code === 0 && /### Notes\n\n- \[ \] n1\n$/.test(read(f)), 'add-item to a missing bare-name section creates it as an H3 at the end');
  run(['add-item', f, '--section', '## Risks', '--item', 'r1']);
  assert(/\n\n## Risks\n\n- \[ \] r1\n$/.test(read(f)) && !/### ## Risks/.test(read(f)), 'add-item to a missing "## X" section creates "## X" as given (like append)');
  // @covers cap-doc-dispatch-002  (dry-run assertions also sit under pod-update, study, session, domain, disagreement)
  const dryItem = read(f);
  const di = run(['add-item', f, '--section', '## Risks', '--item', 'dry', '--dry-run']);
  assert(/DRY RUN/.test(di.out) && read(f) === dryItem, 'add-item --dry-run previews and writes nothing');
}

// ─── decision ────────────────────────────────────────────────────────────────
{
  const dir = mkProject();
  const h = path.join(dir, 'history.md');

  // @covers cap-doc-decision-001
  const d = run(['decision', h, '--decision', 'Use Postgres for ledger storage', '--context', 'ACID needed', '--made-by', 'CTO']);
  const t = read(h);
  assert(d.code === 0 && /Decision logged to/.test(d.out), 'decision exits 0 and reports');
  assert(/## Decision History\n\n### Decision: Use Postgres for ledger storage/.test(t), 'decision creates "## Decision History" when no decisions section exists');
  assert(/<!--\ndecision: "Use Postgres for ledger storage"\ndate: "\d{4}-\d{2}-\d{2}"\nrelease: "current"\nmade_by: "CTO"\ndomain: "engineering"\nreversible: unknown\naffects: "—"\n-->/.test(t), 'decision writes the structured comment block with defaults (release current, reversible unknown, domain inferred)');
  assert(/\| Context \| ACID needed \|/.test(t) && /\| Rationale \| — \|/.test(t), 'decision writes the human table');
  run(['decision', h, '--decision', 'Adopt Stripe billing', '--context', 'c', '--made-by', 'CFO', '--release', 'v2026.Q4.1', '--reversible', 'yes', '--rationale', 'speed', '--domain', 'billing']);
  const t2 = read(h);
  assert(/release: "v2026.Q4.1"/.test(t2) && /reversible: yes/.test(t2) && /domain: "billing"/.test(t2) && /\| Rationale \| speed \|/.test(t2), 'decision honours --release/--reversible/--rationale/--domain');
  assert((t2.match(/## Decision History/g) || []).length === 1, 'a second decision lands in the existing section');

  // @covers cap-doc-decision-002
  const c = run(['decision', h, '--decision', 'Use Postgres replicas for ledger reads', '--context', 'scale', '--made-by', 'Mario']);
  assert(/Potential conflicts with existing decisions/.test(c.out) && /Use Postgres for ledger storage/.test(c.out), 'decision warns on ≥2 shared words with a same-domain decision');
  const nc = run(['decision', h, '--decision', 'Hire designer', '--context', 'x', '--made-by', 'CTO']);
  assert(!/Potential conflicts/.test(nc.out), 'no warning without overlap');

  // @covers cap-doc-decision-003
  const m = run(['decision', h, '--decision', 'x', '--context', 'y']);
  assert(m.code === 1 && /Missing required options: --decision, --context, --made-by/.test(m.err), 'decision without --made-by exits 1');
}

// ─── log ─────────────────────────────────────────────────────────────────────
{
  const dir = mkProject();
  const f = path.join(dir, 'engineering-log.md');
  // @covers cap-doc-log-001
  const l = run(['log', f, '--role', 'EM', '--level', 'M1', '--goal', 'Pod-A done', '--status', 'completed']);
  const t = read(f);
  assert(l.code === 0 && /Area log entry written/.test(l.out), 'log exits 0 and reports');
  assert(new RegExp(`\\n\\n---\\n\\n## ${today} EM M1\\nGoal/Change: Pod-A done\\nExpected outcome: —\\nRequirements discovered: None\\nStatus: COMPLETED\\n$`).test(t), 'log appends a dated entry with defaults and an upper-cased status');
  run(['log', f, '--role', 'CTO', '--level', 'L5', '--goal', 'g', '--outcome', 'o', '--reqs', 'r']);
  assert(/Expected outcome: o\nRequirements discovered: r\nStatus: ACTIVE\n$/.test(read(f)), 'log status defaults to ACTIVE; --outcome/--reqs written');
  // @covers cap-doc-log-002
  const m = run(['log', f, '--role', 'EM', '--level', 'M1']);
  assert(m.code === 1 && /Missing required options: --role, --level, --goal/.test(m.err), 'log without --goal exits 1');
}

// ─── status ──────────────────────────────────────────────────────────────────
{
  const dir = mkProject();
  // @covers cap-doc-status-001
  const s = run(['status', dir]);
  assert(s.code === 0 && s.out.includes(read(path.join(dir, 'current-status.md')).split('\n')[0]) && /## Active Missions/.test(s.out), 'status prints current-status.md');
  // @covers cap-doc-status-003
  const cwd = run(['status'], dir);
  assert(cwd.code === 0 && /## Active Missions/.test(cwd.out), 'status without a dir reads current-status.md from cwd');
  // @covers cap-doc-status-002
  const empty = mkProject(false);
  const e = run(['status', empty]);
  assert(e.code === 1 && /current-status.md not found in:/.test(e.err), 'status without current-status.md exits 1');
}

// ─── pod-update ──────────────────────────────────────────────────────────────
{
  const dir = mkProject();
  const f = path.join(dir, 'current-status.md');
  // @covers cap-doc-pod-update-001
  const a = run(['pod-update', f, '--mission', 'Auth Service', '--status', 'Active', '--next', 'EM: wire API']);
  let t = read(f);
  assert(a.code === 0 && /Added mission "Auth Service"/.test(a.out), 'pod-update adds an unknown mission');
  assert(/\| \[Mission name\][^\n]*\n\| Auth Service \| — \| — \| Active \| EM: wire API \|\n/.test(t), 'new mission row lands under the template row');
  assert(/\*\*Last updated:\*\* \d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(t), 'pod-update stamps Last updated');
  // @covers cap-doc-pod-update-002
  const u = run(['pod-update', f, '--mission', 'Auth Service', '--status', 'Blocked', '--next', 'CISO: review']);
  t = read(f);
  assert(u.code === 0 && /Updated mission "Auth Service"/.test(u.out), 'pod-update reports an update for a known mission');
  assert(/\| Auth Service \| — \| — \| Blocked \| CISO: review \|/.test(t) && (t.match(/Auth Service/g) || []).length === 1, 'pod-update rewrites Status and Next action in place');
  assert(run(['pod-update', f, '--mission', 'X']).code === 1, 'pod-update without --status/--next exits 1');
  // @covers cap-doc-pod-update-003
  run(['pod-update', f, '--mission', 'Billing (v2)', '--status', 'Active', '--next', 'n1']);
  run(['pod-update', f, '--mission', 'Billing (v2)', '--status', 'Blocked', '--next', 'n2']);
  const bt = read(f);
  assert((bt.match(/\| Billing \(v2\) \|/g) || []).length === 1 && /\| Billing \(v2\) \| — \| — \| Blocked \| n2 \|/.test(bt), 'pod-update treats the mission name literally (regex metacharacters update their own row)');
  const pd = run(['pod-update', f, '--mission', 'Billing (v2)', '--status', 'Done', '--next', 'x', '--dry-run']);
  assert(/DRY RUN/.test(pd.out) && read(f) === bt, 'pod-update --dry-run writes nothing');
}

// ─── spawn / dissolve ────────────────────────────────────────────────────────
{
  const dir = mkProject();
  const team = path.join(dir, 'team.md');
  const spawnArgs = (name, role) => ['spawn', dir, '--name', name, '--role', role, '--level', 'M3', '--activated-by', 'Soren Aarhus (Coordinator)', '--profile', 'prof', '--how', 'async', '--fun-fact', 'ff'];
  const metric = (t, m) => Number((t.match(new RegExp(`\\| ${m} \\| (\\d+) \\|`)) || [])[1]);

  // @covers cap-doc-spawn-001
  const s = run(spawnArgs('Fatima Nairobi', 'CLO'));
  let t = read(team);
  assert(s.code === 0 && /Agent Fatima Nairobi \(CLO\) added to team.md/.test(s.out), 'spawn reports the agent');
  assert(new RegExp(`\\| Fatima Nairobi \\| CLO \\| M3 \\| prof \\| async \\| ff \\| Soren Aarhus \\(Coordinator\\) \\| ${today} \\|`).test(t), 'spawn writes the Active Agents row');
  assert(!/\| \| \| \| \| \| \| \| \|/.test(t), 'spawn replaces the empty placeholder row');
  assert(metric(t, 'Current active agents') === 1 && metric(t, 'Total agents ever activated') === 1, 'spawn increments both metrics');
  assert(new RegExp(`### ${today} — Fatima Nairobi \\(CLO, M3\\)\\n- \\*\\*Activated by:\\*\\* Soren Aarhus`).test(t), 'spawn appends an onboarding log entry');
  run(spawnArgs('Kenji Osaka', 'CFO'));
  t = read(team);
  const active = t.slice(t.indexOf('## Active Agents'), t.indexOf('## Dissolved Agents'));
  assert(/Fatima Nairobi/.test(active) && /Kenji Osaka/.test(active) && metric(t, 'Current active agents') === 2, 'second spawn appends to the Active table');

  // @covers cap-doc-spawn-002
  const m = run(['spawn', dir, '--name', 'X', '--role', 'CTO']);
  assert(m.code === 1 && /Missing required options: --level, --activated-by, --profile, --how, --fun-fact/.test(m.err), 'spawn lists every missing option, exit 1');
  const noTeam = run(spawnArgs('Y Z', 'PM').map((a, i) => (i === 1 ? mkProject(false) : a)));
  assert(noTeam.code === 1 && /team.md not found in:/.test(noTeam.err), 'spawn without team.md exits 1');

  // @covers cap-doc-dissolve-001
  const d = run(['dissolve', dir, '--name', 'Fatima Nairobi', '--dissolved-by', 'Lena Tbilisi (EM)', '--reason', 'Mission complete']);
  t = read(team);
  const act2 = t.slice(t.indexOf('## Active Agents'), t.indexOf('## Dissolved Agents'));
  const dis = t.slice(t.indexOf('## Dissolved Agents'), t.indexOf('## Onboarding log'));
  assert(d.code === 0 && /dissolved and logged/.test(d.out), 'dissolve reports');
  assert(!/Fatima Nairobi/.test(act2) && /Kenji Osaka/.test(act2), 'dissolve removes only that agent from Active');
  assert(new RegExp(`\\| Fatima Nairobi \\| CLO \\| M3 \\| Lena Tbilisi \\(EM\\) \\| ${today} \\| Mission complete \\|`).test(dis), 'dissolve writes the Dissolved row with role and level carried over');
  assert(metric(t, 'Current active agents') === 1 && metric(t, 'Total agents ever activated') === 2, 'dissolve decrements current, keeps total');
  assert(/### \d{4}-\d{2}-\d{2} — Fatima Nairobi/.test(t), 'onboarding entry is kept (rows never deleted)');

  // @covers cap-doc-dissolve-002
  const u = run(['dissolve', dir, '--name', 'Nobody Here', '--dissolved-by', 'x', '--reason', 'y']);
  assert(u.code === 1 && /Agent "Nobody Here" not found in Active Agents table/.test(u.err), 'dissolve of an unknown agent exits 1');
  assert(run(['dissolve', dir, '--name', 'Kenji Osaka']).code === 1, 'dissolve without --dissolved-by/--reason exits 1');
}

// ─── manifest / index ────────────────────────────────────────────────────────
{
  const dir = mkProject();
  // @covers cap-doc-manifest-001
  const m1 = run(['manifest', dir]);
  const mf = path.join(dir, 'context-manifest.json');
  assert(m1.code === 0 && /context-manifest.json written \(v1, schema/.test(m1.out) && fs.existsSync(mf), 'manifest writes context-manifest.json v1');
  const j = JSON.parse(read(mf));
  assert(j.manifestVersion === 1 && ['string', 'number'].includes(typeof j.schemaVersion), 'manifest JSON carries manifestVersion + schemaVersion');
  run(['manifest', dir]);
  assert(JSON.parse(read(mf)).manifestVersion === 2, 'manifestVersion increments on regeneration');
  // @covers cap-doc-manifest-002
  const empty = mkProject(false);
  const w = run(['manifest', empty]);
  assert(w.code === 0 && /Warning: current-status.md not found/.test(w.out) && fs.existsSync(path.join(empty, 'context-manifest.json')), 'manifest without current-status.md warns and writes a minimal manifest');

  // @covers cap-doc-index-001
  fs.mkdirSync(path.join(dir, 'sessions', 'permanent'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'sessions', 'permanent', '2026-01-01-kickoff.md'), '---\ntitle: "Kickoff"\ndate: "2026-01-01"\n---\n# Kickoff\n');
  run(['domain', dir, 'add', '--name', 'Payments', '--lead', 'CTO', '--summary', 'Card rails.']);
  const i1 = run(['index', dir]);
  const xf = path.join(dir, 'context-index.json');
  assert(i1.code === 0 && /context-index.json written \(v1, \d+ files indexed\)/.test(i1.out), 'index writes context-index.json v1');
  const x = JSON.parse(read(xf));
  assert(Array.isArray(x.files) && x.files.length > 0 && x.queryMap && x.opsMap, 'index has files, queryMap, opsMap');
  assert(x.projectDomains && x.projectDomains.payments && x.projectDomains.payments.lead === 'CTO', 'index routes project domains with their lead');
  assert((x.sessions || []).some(s => s.path === 'sessions/permanent/2026-01-01-kickoff.md'), 'index lists permanent sessions');
  run(['index', dir]);
  assert(JSON.parse(read(xf)).indexVersion === 2, 'indexVersion increments on regeneration');
}

// ─── study ───────────────────────────────────────────────────────────────────
{
  const dir = mkProject(false);
  // @covers cap-doc-study-002
  assert(/No studies directory found/.test(run(['study', dir, 'list']).out), 'study list before any study says so');
  // @covers cap-doc-study-001
  const c = run(['study', dir, 'create', '--title', 'Onboarding Drop-off!', '--requested-by', 'PM', '--tags', 'a, b', '--method', 'interviews']);
  const f = path.join(dir, 'research', 'studies', `${today}-onboarding-drop-off.md`);
  assert(c.code === 0 && /Study created:/.test(c.out) && fs.existsSync(f), 'study create writes research/studies/<date>-<slug>.md');
  const t = read(f);
  assert(/title: "Onboarding Drop-off!"/.test(t) && /requested_by: "PM"/.test(t) && /method: "interviews"/.test(t) && /tags: \["a", "b"\]/.test(t) && /status: "draft"/.test(t) && /confidence: "TBD"/.test(t) && /team: "Research Chapter"/.test(t), 'study frontmatter carries title/requested_by/method/tags and draft defaults');
  assert(['## Hypothesis', '## Method', '## Data', '## Findings', '### Edge insights', '## Implications', '## Confidence Assessment', '## Open Questions'].every(h => t.includes(h)), 'study body has the scientific sections');
  const l = run(['study', dir, 'list']);
  assert(new RegExp(`${today}\\s+TBD\\s+draft\\s+Onboarding Drop-off!`).test(l.out), 'study list shows date, confidence, status, title');
  // @covers cap-doc-study-003
  assert(run(['study', dir, 'create']).code === 1, 'study create without --title exits 1');
  const bad = run(['study', dir, 'remove']);
  assert(bad.code === 1 && /Usage: sdk-doc study/.test(bad.err), 'unknown study subcommand exits 1');
  // @covers cap-doc-study-004
  const dry = mkProject(false);
  const ds = run(['study', dry, 'create', '--title', 'Dry', '--dry-run']);
  assert(/DRY RUN/.test(ds.out), 'study create --dry-run previews');
  assert(!fs.existsSync(path.join(dry, 'research')), 'study create --dry-run creates no directory or file');
}

// ─── session ─────────────────────────────────────────────────────────────────
{
  const dir = mkProject(false);
  fs.writeFileSync(path.join(dir, '.sdkrc'), JSON.stringify({ releaseId: 'v2026.Q4.2' }));
  // @covers cap-doc-session-001
  const s = run(['session', dir, 'save', '--title', 'Pricing Talk', '--participants', 'CFO,PM', '--domains', 'billing', '--saved-by', 'Greg']);
  const name = `${today}-pricing-talk.md`;
  const tf = path.join(dir, 'sessions', 'temp', name);
  assert(s.code === 0 && /Session saved:/.test(s.out) && fs.existsSync(tf), 'session save writes sessions/temp/<date>-<slug>.md');
  const t = read(tf);
  assert(/release: "v2026.Q4.2"/.test(t) && /status: "temp"/.test(t) && /participants: "CFO,PM"/.test(t) && /saved_by: "Greg"/.test(t) && /## Summary/.test(t) && /## Open Threads/.test(t), 'session file carries release from .sdkrc, temp status, and the summary sections');
  assert(run(['session', dir, 'save']).code === 1, 'session save without --title exits 1');
  // @covers cap-doc-session-002
  const la = run(['session', dir, 'list']);
  assert(/Sessions \(all\)/.test(la.out) && new RegExp(`${today}\\s+temp\\s+billing\\s+Pricing Talk`).test(la.out), 'session list shows temp sessions');
  const lp = run(['session', dir, 'list', '--status', 'permanent']);
  assert(/\(none\)/.test(lp.out), 'session list --status permanent filters');
  // @covers cap-doc-session-003
  const p = run(['session', dir, 'promote', name]);
  const pf = path.join(dir, 'sessions', 'permanent', name);
  assert(p.code === 0 && /Session promoted/.test(p.out) && fs.existsSync(pf) && !fs.existsSync(tf), 'promote moves temp → permanent');
  assert(/status: "permanent"/.test(read(pf)) && /Status: permanent/.test(read(pf)), 'promote flips the status in frontmatter and footer');
  const pm = run(['session', dir, 'promote', 'nope.md']);
  assert(pm.code === 1 && /Session not found:/.test(pm.err), 'promote of a missing file exits 1');
  // @covers cap-doc-session-004
  run(['session', dir, 'save', '--title', 'Scratch']);
  const c0 = run(['session', dir, 'clean']);
  assert(/Re-run with --confirm to delete all 1 temp session/.test(c0.out) && fs.readdirSync(path.join(dir, 'sessions', 'temp')).length === 1, 'clean without --confirm only lists');
  const c1 = run(['session', dir, 'clean', '--confirm']);
  assert(/Deleted 1 temp session/.test(c1.out) && fs.readdirSync(path.join(dir, 'sessions', 'temp')).length === 0 && fs.existsSync(pf), 'clean --confirm deletes temp only, keeps permanent');
  assert(run(['session', dir, 'archive']).code === 1, 'unknown session subcommand exits 1');
  // @covers cap-doc-session-005
  run(['session', dir, 'save', '--title', 'Keep Temp']);
  const kn = `${today}-keep-temp.md`;
  run(['session', dir, 'promote', kn, '--dry-run']);
  assert(!fs.existsSync(path.join(dir, 'sessions', 'permanent', kn)) && fs.existsSync(path.join(dir, 'sessions', 'temp', kn)), 'session promote --dry-run moves nothing');
  run(['session', dir, 'clean', '--confirm', '--dry-run']);
  assert(fs.existsSync(path.join(dir, 'sessions', 'temp', kn)), 'session clean --confirm --dry-run deletes nothing');
  const dsd = mkProject(false);
  run(['session', dsd, 'save', '--title', 'Dry', '--dry-run']);
  assert(!fs.existsSync(path.join(dsd, 'sessions')), 'session save --dry-run creates no directory or file');
}

// ─── domain ──────────────────────────────────────────────────────────────────
{
  const dir = mkProject(false);
  assert(/No domains directory found/.test(run(['domain', dir, 'list']).out), 'domain list before any domain says so');
  // @covers cap-doc-domain-001
  const a = run(['domain', dir, 'add', '--name', 'Card Payments', '--lead', 'CTO', '--spawn-when', 'chargebacks', '--context-provides', 'rails']);
  const sf = path.join(dir, 'domains', 'card-payments', 'summary.md');
  assert(a.code === 0 && /Domain created: card-payments/.test(a.out) && fs.existsSync(sf), 'domain add writes domains/<slug>/summary.md');
  const t = read(sf);
  assert(/lead: "CTO"/.test(t) && /spawn_when: "chargebacks"/.test(t) && /context_provides: "rails"/.test(t) && /\[Describe the Card Payments domain/.test(t), 'domain summary carries frontmatter and a placeholder summary');
  assert(run(['domain', dir, 'add']).code === 1, 'domain add without --name exits 1');
  // @covers cap-doc-domain-002
  const dup = run(['domain', dir, 'add', '--name', 'card payments']);
  assert(dup.code === 1 && /Domain already exists: card-payments/.test(dup.err), 'duplicate domain (same slug) exits 1');
  // @covers cap-doc-domain-003
  fs.writeFileSync(path.join(dir, 'domains', 'card-payments', 'disputes.md'), '# d\n');
  const l = run(['domain', dir, 'list']);
  assert(/Project Domains \(1\)/.test(l.out) && /card-payments\s+CTO\s+1\s+\[Describe/.test(l.out), 'domain list shows slug, lead, L1 file count, summary');
  // @covers cap-doc-domain-004
  const u = run(['domain', dir, 'update', '--name', 'Card Payments', '--lead', 'Mario', '--summary', 'Card rails and disputes.']);
  const t2 = read(sf);
  assert(u.code === 0 && /Domain updated: card-payments/.test(u.out) && /lead: "Mario"/.test(t2) && /spawn_when: "chargebacks"/.test(t2) && /---\n\nCard rails and disputes.\n$/.test(t2), 'domain update rewrites given fields and the summary body only');
  const un = run(['domain', dir, 'update', '--name', 'ghost']);
  assert(un.code === 1 && /Domain not found: ghost/.test(un.err), 'update of an unknown domain exits 1');
  assert(run(['domain', dir, 'remove']).code === 1, 'unknown domain subcommand exits 1');
  // @covers cap-doc-domain-005
  run(['domain', dir, 'add', '--name', 'Dry Domain', '--dry-run']);
  assert(!fs.existsSync(path.join(dir, 'domains', 'dry-domain')), 'domain add --dry-run creates no directory');
  assert(run(['domain', dir, 'add', '--name', 'Dry Domain']).code === 0, 'a real add after a dry run is not blocked as a duplicate');
  run(['domain', dir, 'update', '--name', 'Card Payments', '--lead', 'Nobody', '--dry-run']);
  assert(/lead: "Mario"/.test(read(sf)) && !/Nobody/.test(read(sf)), 'domain update --dry-run writes nothing');
}

// ─── bus ─────────────────────────────────────────────────────────────────────
{
  const dir = mkProject(false);
  fs.writeFileSync(path.join(dir, '.sdkrc'), JSON.stringify({ releaseId: 'v2026.Q4.1' }));
  const log = path.join(dir, 'bus-log.md');
  const bus = (...a) => run(['bus', dir, ...a]);

  // @covers cap-doc-bus-001
  const b = bus('--from', 'PM', '--to', 'Designer', '--message', 'Scope ready');
  assert(b.code === 0 && /Bus message logged to bus-log.md/.test(b.out) && /PM → Designer \[INFO\]/.test(b.out), 'bus logs and echoes route + priority (default INFO)');
  assert(/--- Bus Message ---\nFROM: PM\nTO: Designer\nRELEASE: v2026.Q4.1\nPRIORITY: INFO\nMESSAGE: Scope ready\n---/.test(b.out), 'bus prints the §1 formatted message with RELEASE from .sdkrc');
  const t = read(log);
  assert(/^# Bus Log\n\n> Append-only/.test(t) && /\n---\n\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\] FROM: PM → TO: Designer \| PRIORITY: INFO \| RELEASE: v2026.Q4.1\nScope ready\n/.test(t), 'bus creates bus-log.md with header and a timestamped entry');
  bus('--from', 'CFO', '--to', 'ALL', '--message', 'Budget set');
  assert((read(log).match(/\n---\n\[/g) || []).length === 2 && (read(log).match(/# Bus Log/g) || []).length === 1, 'subsequent messages append');
  const noRc = mkProject(false);
  assert(/RELEASE: unknown/.test(run(['bus', noRc, '--from', 'PM', '--to', 'CTO', '--message', 'x']).out), 'RELEASE is "unknown" without .sdkrc');

  // @covers cap-doc-bus-002
  const before = read(log);
  const missing = bus('--from', 'PM', '--message', 'x');
  assert(missing.code === 1 && /Usage: sdk-doc bus/.test(missing.err), 'bus without --to exits 1 with usage');
  const badP = bus('--from', 'PM', '--to', 'CTO', '--message', 'x', '--priority', 'URGENT');
  assert(badP.code === 1 && /--priority must be INFO, DECISION NEEDED, or BLOCKER/.test(badP.err), 'unknown priority rejected');

  // @covers cap-doc-bus-003
  const noDue = bus('--from', 'PM', '--to', 'CEO', '--message', 'x', '--priority', 'DECISION NEEDED', '--escalation', 'CEO');
  assert(noDue.code === 1 && /DECISION NEEDED requires --decision-by YYYY-MM-DD/.test(noDue.err), 'DECISION NEEDED without --decision-by rejected');
  const badDue = bus('--from', 'PM', '--to', 'CEO', '--message', 'x', '--priority', 'DECISION NEEDED', '--decision-by', 'Friday', '--escalation', 'CEO');
  assert(badDue.code === 1, 'non-ISO --decision-by rejected');
  const noEsc = bus('--from', 'PM', '--to', 'CEO', '--message', 'x', '--priority', 'DECISION NEEDED', '--decision-by', '2026-12-01');
  assert(noEsc.code === 1 && /DECISION NEEDED requires --escalation <role>/.test(noEsc.err), 'DECISION NEEDED without --escalation rejected');
  const blkEsc = bus('--from', 'PM', '--to', 'CEO', '--message', 'x', '--priority', 'BLOCKER');
  assert(blkEsc.code === 1 && /BLOCKER requires --escalation/.test(blkEsc.err), 'BLOCKER without --escalation rejected');
  const ok = bus('--from', 'PM', '--to', 'CEO', '--message', 'Pick a market', '--priority', 'DECISION NEEDED', '--decision-by', '2026-12-01', '--escalation', 'Coordinator');
  assert(ok.code === 0 && /MESSAGE: Pick a market\nDECISION BY: 2026-12-01\nESCALATION: Coordinator/.test(ok.out), 'valid DECISION NEEDED prints DECISION BY and ESCALATION after MESSAGE');
  assert(/PRIORITY: DECISION NEEDED \| RELEASE: v2026.Q4.1\nPick a market\nDECISION BY: 2026-12-01\nESCALATION: Coordinator\n/.test(read(log)), 'bus-log records DECISION BY and ESCALATION');

  // @covers cap-doc-bus-004
  const crBad = bus('--from', 'PM', '--to', 'CLO', '--message', 'x', '--priority', 'BLOCKER', '--tag', 'CONTEXT-REQUEST', '--escalation', 'CEO');
  assert(crBad.code === 1 && /CONTEXT-REQUEST tag requires PRIORITY: INFO/.test(crBad.err), 'CONTEXT-REQUEST on non-INFO rejected');
  const cr = bus('--from', 'PM', '--to', 'CLO', '--message', 'Need GDPR read', '--tag', 'CONTEXT-REQUEST');
  assert(cr.code === 0 && /PRIORITY: INFO\nTAG: CONTEXT-REQUEST\nMESSAGE: Need GDPR read/.test(cr.out) && /\| TAG: CONTEXT-REQUEST \|/.test(read(log)), 'CONTEXT-REQUEST tag on INFO accepted and logged');
  const legacy = bus('--from', 'PM', '--to', 'CLO', '--message', 'legacy ask', '--priority', 'CONTEXT REQUEST');
  assert(legacy.code === 0 && /deprecated; sent as PRIORITY: INFO \+ TAG: CONTEXT-REQUEST/.test(legacy.err) && /PRIORITY: INFO\nTAG: CONTEXT-REQUEST\nMESSAGE: legacy ask/.test(legacy.out), 'legacy "--priority CONTEXT REQUEST" converts to INFO + TAG with a deprecation note');
  const legacyTag = bus('--from', 'PM', '--to', 'CLO', '--message', 'y', '--priority', 'CONTEXT REQUEST', '--tag', 'RESEARCH');
  assert(/TAG: CONTEXT-REQUEST, RESEARCH/.test(legacyTag.out), 'legacy conversion keeps an existing tag');

  // @covers cap-doc-bus-005
  const solMissing = bus('--from', 'CTO', '--to', 'CEO', '--message', 'x', '--priority', 'BLOCKER', '--escalation', 'CEO');
  assert(solMissing.code === 1 && /SOLUTION_CLASS is required on BLOCKER messages from CTO/.test(solMissing.err), 'technical role non-INFO without --solution-class rejected');
  const solBad = bus('--from', 'PM', '--to', 'CEO', '--message', 'x', '--solution-class', 'MAYBE');
  assert(solBad.code === 1 && /--solution-class must be KNOWN, EXPLORATORY, or HYBRID/.test(solBad.err), 'invalid --solution-class rejected');
  const sol = bus('--from', 'CTO', '--to', 'CEO', '--message', 'DB down', '--priority', 'BLOCKER', '--escalation', 'CEO', '--solution-class', 'KNOWN', '--cost-signal', 'HIGH', '--time-signal', '4h');
  assert(sol.code === 0 && /PRIORITY: BLOCKER\nSOLUTION_CLASS: KNOWN\nCOST_SIGNAL: HIGH\nTIME_SIGNAL: 4h\nMESSAGE: DB down\nESCALATION: CEO/.test(sol.out) && /\| SOL: KNOWN \|/.test(read(log)), 'valid BLOCKER prints SOLUTION_CLASS/COST/TIME and logs SOL');
  assert(bus('--from', 'CTO', '--to', 'PM', '--message', 'fyi').code === 0, 'SOLUTION_CLASS optional on INFO from technical roles');

  // @covers cap-doc-bus-006
  const fc = bus('--from', 'CFO', '--to', 'CEO', '--message', 'x', '--tag', 'FRAMING-CHALLENGE');
  assert(fc.code === 1 && /FRAMING-CHALLENGE tag requires PRIORITY: DECISION NEEDED or BLOCKER/.test(fc.err), 'FRAMING-CHALLENGE on INFO rejected');

  // @covers cap-doc-bus-002
  const logAfter = read(log);
  assert(!/\nx\n/.test(logAfter.slice(before.length)), 'rejected messages never reach bus-log.md');

  // @covers cap-doc-bus-007
  assert(/Intent resolved: |Routing: topic=|No action implied — pure communication/.test(b.out), 'bus reports intent resolution (action, routing, or pure communication)');
}

// ─── cockpit ─────────────────────────────────────────────────────────────────
{
  const bare = mkProject(false);
  // @covers cap-doc-cockpit-001
  const c0 = run(['cockpit', bare]);
  assert(c0.code === 0 && /^COCKPIT: Coordinator\nProject: sdk-cap-doc-\S+ \| Release: unknown \| Phase: unknown/.test(c0.out) && /STATE: No manifest — read current-status.md directly/.test(c0.out), 'cockpit without manifest defaults to Coordinator and points at current-status.md');
  // @covers cap-doc-cockpit-002
  const dir = mkProject();
  run(['domain', dir, 'add', '--name', 'payments', '--lead', 'CTO', '--summary', 'Card rails.']);
  run(['manifest', dir]);
  run(['index', dir]);
  run(['bus', dir, '--from', 'PM', '--to', 'CTO', '--message', 'for cto']);
  run(['bus', dir, '--from', 'PM', '--to', 'CLO', '--message', 'for clo']);
  const c1 = run(['cockpit', dir, '--role', 'CTO']);
  assert(c1.code === 0 && /^COCKPIT: CTO/.test(c1.out) && /STATE: \d+ active mission\(s\), \d+ blocker\(s\), \d+ open decision\(s\)/.test(c1.out), 'cockpit with a manifest prints the STATE line');
  assert(/PROJECT DOMAINS \(L0\):\n  payments \[CTO\]: Card rails./.test(c1.out), 'cockpit lists L0 domain summaries from the index');
  assert(/RECENT BUS MESSAGES \(for CTO\):/.test(c1.out) && /TO: CTO/.test(c1.out) && !/TO: CLO/.test(c1.out), 'cockpit shows only bus messages for the role');
  assert(/AVAILABLE OPERATIONS: /.test(c1.out), 'cockpit lists available operations from the index');
}

// ─── discovery ───────────────────────────────────────────────────────────────
{
  const dir = mkProject(false);
  // @covers cap-doc-discovery-003
  const pre = run(['discovery', dir, 'status']);
  assert(pre.code === 1 && /Discovery not started/.test(pre.err), 'status before start exits 1');
  assert(run(['discovery', dir, 'answer', '--id', 'Q1', '--answer', 'x']).code === 1, 'answer before start exits 1');
  assert(run(['discovery', dir, 'finish']).code === 1, 'unknown discovery subcommand exits 1');

  // @covers cap-doc-discovery-001
  run(['domain', dir, 'add', '--name', 'ledger', '--lead', 'CTO']);
  const s = run(['discovery', dir, 'start']);
  const st = JSON.parse(read(path.join(dir, 'discovery-state.json')));
  assert(s.code === 0 && /Discovery started: 12 questions generated/.test(s.out) && /Blocking: 6 question/.test(s.out) && /Domains: ledger/.test(s.out), 'start generates 10 core + 2 per placeholder domain questions');
  assert(st.totalQuestions === 12 && st.answered === 0 && st.blockers === 6 && st.readyForActivation === false && st.questions[0].id === 'Q1' && st.questions[0].routes_to === 'product-requirements.md', 'discovery-state.json records questions, routes, counters');

  // @covers cap-doc-discovery-002
  const blockingIds = st.questions.filter(q => q.priority === 'blocks-discovery').map(q => q.id);
  const domQ = st.questions.find(q => q.category === 'domain' && q.priority === 'blocks-discovery');
  const a1 = run(['discovery', dir, 'answer', '--id', domQ.id, '--answer', 'Double-entry ledger for wallets.']);
  assert(a1.code === 0 && new RegExp(`Routed to domains/ledger/summary.md \\(summary updated\\)`).test(a1.out) && /Double-entry ledger for wallets./.test(read(path.join(dir, 'domains', 'ledger', 'summary.md'))) && !/\[Describe the/.test(read(path.join(dir, 'domains', 'ledger', 'summary.md'))), 'a domain answer replaces the summary placeholder');
  assert(/Remaining blockers: 5/.test(a1.out), 'answer reports remaining blockers');
  let last;
  for (const id of blockingIds.filter(id => id !== domQ.id)) last = run(['discovery', dir, 'answer', '--id', id, '--answer', `ans ${id}`]);
  assert(/All blocking questions answered. Ready to activate the team./.test(last.out) && JSON.parse(read(path.join(dir, 'discovery-state.json'))).readyForActivation === true, 'answering all blockers sets readyForActivation');
  const nf = run(['discovery', dir, 'answer', '--id', 'Q99', '--answer', 'x']);
  assert(nf.code === 1 && /Question Q99 not found/.test(nf.err), 'unknown question id exits 1');
  // @covers cap-doc-discovery-003
  const stat = run(['discovery', dir, 'status']);
  assert(/Discovery Status: 6\/12 answered/.test(stat.out) && /Ready for activation: .*YES/.test(stat.out) && /Important \(6\):/.test(stat.out) && /Answered \(6\):/.test(stat.out), 'status shows counts, readiness, and grouped questions');
}

// ─── disagreement ────────────────────────────────────────────────────────────
{
  const dir = mkProject(false);
  const h = path.join(dir, 'history.md');
  // @covers cap-doc-disagreement-001
  const o1 = run(['disagreement', dir, 'open', '--topic', 'Build vs buy auth', '--position-a', 'CTO: build it', '--position-b', 'CFO: buy it']);
  assert(o1.code === 0 && /Disagreement opened: DISAGREE-001 — Build vs buy auth/.test(o1.out) && /Positions: CTO vs CFO/.test(o1.out), 'open creates DISAGREE-001');
  const t = read(h);
  assert(/^# History\n/.test(t) && /### \[DISAGREE-001\] Build vs buy auth\nDate opened: \d{4}-\d{2}-\d{2}\nDate resolved: —\nStatus: OPEN/.test(t) && /\| CTO \| build it \| \|/.test(t) && /\| CFO \| buy it \| \|/.test(t) && /\*\*Resolution:\*\* Pending/.test(t), 'open writes the §29 entry (creating history.md if absent)');
  const o2 = run(['disagreement', dir, 'open', '--topic', 'Region', '--position-a', 'just one view', '--position-b', 'CLO: EU first']);
  assert(/DISAGREE-002/.test(o2.out) && /\| Unknown \| just one view \| \|/.test(read(h)), 'ids auto-increment; a position without "Role:" gets role Unknown');
  assert(run(['disagreement', dir, 'open', '--topic', 'x']).code === 1, 'open without both positions exits 1');

  // @covers cap-doc-disagreement-002
  const r = run(['disagreement', dir, 'resolve', '--id', 'DISAGREE-001', '--decision', 'Buy Auth0', '--decided-by', 'CEO', '--reasoning', 'time to market', '--dissent', 'CTO: lock-in']);
  const t2 = read(h);
  assert(r.code === 0 && /Disagreement resolved: DISAGREE-001/.test(r.out) && /Dissent: CTO: lock-in/.test(r.out), 'resolve reports');
  assert(/\[DISAGREE-001\][\s\S]*?Date resolved: \d{4}-\d{2}-\d{2}\nStatus: RESOLVED[\s\S]*?\*\*Resolution:\*\* Buy Auth0\n\*\*Decided by:\*\* CEO\n\*\*Reasoning:\*\* time to market\n\*\*Dissent on record:\*\* CTO: lock-in/.test(t2), 'resolve fills status, date, resolution, decider, reasoning, dissent');
  assert(/\[DISAGREE-002\] Region\nDate opened: \S+\nDate resolved: —\nStatus: OPEN/.test(t2), 'resolve leaves other disagreements untouched');
  const ghost = run(['disagreement', dir, 'resolve', '--id', 'DISAGREE-404', '--decision', 'x', '--decided-by', 'CEO']);
  assert(ghost.code === 1 && /DISAGREE-404 not found or not OPEN/.test(ghost.err), 'resolving an unknown id exits 1');
  assert(run(['disagreement', dir, 'resolve', '--id', 'DISAGREE-002']).code === 1, 'resolve without --decision/--decided-by exits 1');

  // @covers cap-doc-disagreement-003
  const l = run(['disagreement', dir, 'list']);
  assert(/Disagreements \(2\):/.test(l.out) && /- DISAGREE-001\s+RESOLVED\s+Build vs buy auth/.test(l.out) && /! DISAGREE-002\s+OPEN\s+Region/.test(l.out), 'list shows id, status, topic with an OPEN marker');
  assert(/No history.md found/.test(run(['disagreement', mkProject(false), 'list']).out), 'list without history.md says so');

  // @covers cap-doc-disagreement-005
  const again = run(['disagreement', dir, 'resolve', '--id', 'DISAGREE-001', '--decision', 'second ruling', '--decided-by', 'CEO']);
  assert(again.code === 1 && /DISAGREE-001 not found or not OPEN/.test(again.err), 're-resolving an already-resolved id exits 1');
  assert(read(h) === t2, 're-resolving a resolved id changes nothing (never touches another entry)');
  const dryRes = run(['disagreement', dir, 'resolve', '--id', 'DISAGREE-002', '--decision', 'd', '--decided-by', 'CEO', '--dry-run']);
  assert(dryRes.code === 0 && /DRY RUN/.test(dryRes.out) && read(h) === t2, 'resolve --dry-run writes nothing');

  // @covers cap-doc-disagreement-004
  const help = run(['--help']).out;
  const docForm = run(['disagreement', dir, 'open', '--topic', 'Pricing', '--positions', 'CFO:raise,CRO:hold']);
  assert(/--positions "A:\.\.\.,B:\.\.\."/.test(help) && docForm.code === 0 && /DISAGREE-003 — Pricing/.test(docForm.out) && /Positions: CFO vs CRO/.test(docForm.out), 'documented --positions "A:...,B:..." form opens a disagreement');
  assert(/\[DISAGREE-003\] Pricing[\s\S]*?\| CFO \| raise \| \|\n\| CRO \| hold \| \|/.test(read(h)), '--positions writes both positions');
  assert(run(['disagreement', dir, 'open', '--topic', 'T', '--positions', 'CFO:only one']).code === 1, '--positions with one entry exits 1');
  const before = read(h);
  const dryOpen = run(['disagreement', dir, 'open', '--topic', 'Dry', '--position-a', 'A: x', '--position-b', 'B: y', '--dry-run']);
  assert(/DRY RUN/.test(dryOpen.out) && read(h) === before, 'open --dry-run writes nothing');
}

// ─── history ─────────────────────────────────────────────────────────────────
{
  const dir = mkProject();
  const h = path.join(dir, 'history.md');
  // @covers cap-doc-history-002
  assert(/No structured decisions found in history.md/.test(run(['history', dir]).out), 'history with no decisions says so');
  const none = run(['history', mkProject(false)]);
  assert(none.code === 1 && /history.md not found/.test(none.err), 'history without history.md exits 1');

  // @covers cap-doc-history-001
  run(['decision', h, '--decision', 'Use Postgres', '--context', 'c', '--made-by', 'CTO', '--reversible', 'no']);
  run(['decision', h, '--decision', 'Launch in Brazil', '--context', 'c', '--made-by', 'CEO', '--reversible', 'yes']);
  fs.appendFileSync(h, '\n### Decision: Legacy pick\n\n| Field | Value |\n|-------|-------|\n| Date | 2025-01-01 |\n| Made by | PM |\n');
  const all = run(['history', dir]);
  assert(all.code === 0 && /Decisions \(3\/3\):/.test(all.out) && /engineering\s+Use Postgres/.test(all.out) && /by CTO/.test(all.out) && /2025-01-01\s+unknown\s+Legacy pick/.test(all.out), 'history lists structured and legacy table-format decisions');
  assert(/Decisions \(1\/3\):[\s\S]*Launch in Brazil/.test(run(['history', dir, '--domain', 'strategy']).out), '--domain filters');
  assert(/Decisions \(1\/3\):[\s\S]*Use Postgres/.test(run(['history', dir, '--search', 'postgres']).out), '--search filters case-insensitively');
  assert(/Decisions \(1\/3\):[\s\S]*Use Postgres/.test(run(['history', dir, '--reversible', 'no']).out), '--reversible filters on the logged value');

  // @covers cap-doc-history-003
  const upper = run(['history', dir, '--reversible', 'NO']);
  assert(/Decisions \(1\/3\):[\s\S]*Use Postgres/.test(upper.out), '--reversible NO is case-insensitive');
  assert(/Decisions \(1\/3\):[\s\S]*Use Postgres/.test(run(['history', dir, '--reversible', 'false']).out), '--reversible false is treated as no');
  assert(/Use Postgres \[IRREVERSIBLE\]/.test(all.out) && !/Launch in Brazil \[IRREVERSIBLE\]/.test(all.out), 'a decision logged with --reversible no is marked [IRREVERSIBLE]');
}

// ─── iteration (gaps beyond cap-sdk-iteration-001) ───────────────────────────
{
  const dir = mkProject(false);
  // @covers cap-doc-iteration-001
  assert(/No iterations directory found/.test(run(['iteration', dir, 'list']).out), 'list before any iteration says so');
  run(['iteration', dir, 'create', '--loop', 'discovery', '--guardian', 'Ana Quito']);
  run(['iteration', dir, 'create', '--loop', 'discovery']);
  run(['iteration', dir, 'create', '--loop', 'implementation', '--pod', 'Pod A']);
  run(['iteration', dir, 'graduate', '--loop', 'discovery', '--cycle', '1']);
  const l = run(['iteration', dir, 'list']);
  assert(/discovery\s+1\s+graduated\s+Ana Quito/.test(l.out) && /discovery\s+2\s+draft\s+unassigned/.test(l.out) && /implementation\s+1\s+draft\s+unassigned\s+Pod A/.test(l.out), 'list shows loop, cycle, status, guardian, pod across loops');
  const lf = run(['iteration', dir, 'list', '--status', 'graduated']);
  assert(/discovery\s+1\s+graduated/.test(lf.out) && !/draft/.test(lf.out), 'list --status filters');
  const ll = run(['iteration', dir, 'list', '--loop', 'implementation']);
  assert(/implementation/.test(ll.out) && !/discovery\s+1/.test(ll.out), 'list --loop filters');
  assert(run(['iteration', dir, 'list', '--loop', 'bogus']).code === 1, 'list with an unknown loop exits 1');

  // @covers cap-doc-iteration-002
  const dry = run(['iteration', dir, 'create', '--loop', 'architecture', '--dry-run']);
  assert(dry.code === 0 && /\[DRY RUN\] Would create: .*iter-001.md/.test(dry.out) && /Architecture serves at 10x/.test(dry.out) && !fs.existsSync(path.join(dir, 'iterations', 'architecture')), 'create --dry-run previews the file and writes nothing');

  // @covers cap-doc-iteration-003
  const noFb = run(['iteration', dir, 'review', '--loop', 'discovery', '--cycle', '2', '--verdict', 'iterate']);
  assert(noFb.code === 1 && /--feedback is required when --verdict iterate/.test(noFb.err), 'iterate verdict without feedback exits 1');
  const badV = run(['iteration', dir, 'review', '--loop', 'discovery', '--cycle', '2', '--verdict', 'maybe']);
  assert(badV.code === 1 && /--verdict graduate\|iterate is required/.test(badV.err), 'unknown verdict exits 1');
  const noCyc = run(['iteration', dir, 'graduate', '--loop', 'discovery', '--cycle', '9']);
  assert(noCyc.code === 1 && /Iteration file not found:/.test(noCyc.err), 'missing cycle exits 1');
  assert(run(['iteration', dir, 'create', '--loop', 'bogus']).code === 1 && run(['iteration', dir, 'frob']).code === 1, 'unknown loop / subcommand exits 1');
  const g = run(['iteration', dir, 'review', '--loop', 'discovery', '--cycle', '2', '--verdict', 'graduate']);
  const g2 = read(path.join(dir, 'iterations', 'discovery', 'iter-002.md'));
  assert(g.code === 0 && /status: "graduated"/.test(g2) && new RegExp(`graduated: "${today}"`).test(g2) && /## Verdict\n\nGRADUATE — All exit criteria passed/.test(g2), 'review --verdict graduate sets status, date, and verdict text');

  // @covers cap-doc-iteration-004
  for (let i = 0; i < 2; i++) run(['iteration', dir, 'create', '--loop', 'architecture']);
  const c3 = run(['iteration', dir, 'create', '--loop', 'architecture']);
  const c4 = run(['iteration', dir, 'create', '--loop', 'architecture']);
  assert(!/escalates to CEO/.test(c3.out) && /Cycle 4: past 3 cycles without graduation — Guardian escalates to CEO/.test(c4.out), 'create warns past guardianCyclesBeforeEscalation (default 3)');
  const r3 = run(['iteration', dir, 'review', '--loop', 'architecture', '--cycle', '3', '--verdict', 'iterate', '--feedback', 'contracts thin']);
  assert(/Cycle 3 did not graduate — Guardian escalates to CEO before cycle 4/.test(r3.out), 'iterate verdict at the limit warns of escalation');
}

for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
console.log(`  sdk-doc capabilities: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
