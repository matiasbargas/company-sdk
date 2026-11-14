#!/usr/bin/env node
'use strict';

/**
 * fake-claude.js — test double for `claude -p ... --output-format stream-json --verbose`.
 * No network, no tokens. Shapes come from the recorded 2026-11-13 spike streams (run-a, run-b).
 *
 * Flags honoured: --version, -p <prompt>, --output-format stream-json, --verbose, --max-turns N,
 * --settings <file> (its PreToolUse hooks are executed for every tool_use, like Claude Code).
 *
 * Env:
 *   FAKE_CLAUDE_SCENARIO   ok | budget | tools | killed | unknown | sleep   (default ok)
 *     ok       one text turn, subtype success
 *     budget   the spike's run-a stream verbatim (error_max_budget_usd: $0.05 cap ended at $0.084)
 *     tools    one turn per FAKE_CLAUDE_TOOLS entry (tool_use → hooks → tool_result), then a text turn;
 *              stops with error_max_turns when that exceeds --max-turns
 *     killed   init + one assistant turn, then SIGKILLs itself (no result line)
 *     unknown  a result whose modelUsage uses an unknown field schema
 *     sleep    init + one assistant turn, sleeps FAKE_CLAUDE_SLEEP_MS (default 1500), then success
 *   FAKE_CLAUDE_TOOLS        JSON [{ name, input }] for the tools scenario
 *   FAKE_CLAUDE_TURN_DELAY_MS  pause before each tool's hooks run (lets the runner see the turn's usage)
 *   FAKE_CLAUDE_VERSION      version reported by --version and the init message (default 2.1.292)
 *   FAKE_CLAUDE_INIT_MODEL   model the session "resolves" to (init.model, modelUsage key); default --model,
 *                            else claude-opus-5-5. Simulates spike 2: ANTHROPIC_MODEL overriding --model.
 *   FAKE_CLAUDE_LOG          JSONL file: {event:'start', argv, cwd, pid, t, envKeys} and {event:'end', pid, t}
 *   FAKE_CLAUDE_HOOK_OUT     JSONL file: one line per hook decision {tool, decision, reason}
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const env = process.env;
const VERSION = env.FAKE_CLAUDE_VERSION || '2.1.292';

if (args.includes('--version')) {
  process.stdout.write(`${VERSION} (Claude Code)\n`);
  process.exit(0);
}

const prompt = flag('-p');
const maxTurns = Number.parseInt(flag('--max-turns'), 10);
if (typeof prompt !== 'string' || flag('--output-format') !== 'stream-json' || !args.includes('--verbose') || !Number.isInteger(maxTurns)) {
  process.stderr.write('fake-claude: expected -p <prompt> --output-format stream-json --verbose --max-turns N\n');
  process.exit(2);
}

const log = (rec) => { if (env.FAKE_CLAUDE_LOG) fs.appendFileSync(env.FAKE_CLAUDE_LOG, JSON.stringify(rec) + '\n'); };
log({ event: 'start', argv: args, cwd: process.cwd(), pid: process.pid, t: Date.now(), envKeys: Object.keys(env).sort(),
  anthropicApiKey: env.ANTHROPIC_API_KEY });
process.on('exit', () => log({ event: 'end', pid: process.pid, t: Date.now() }));

function writeLine(obj) {
  const buf = Buffer.from((typeof obj === 'string' ? obj : JSON.stringify(obj)) + '\n');
  let off = 0;
  while (off < buf.length) {
    try { off += fs.writeSync(1, buf, off); } catch (err) { if (err.code !== 'EAGAIN') throw err; }
  }
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const fixture = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8').split('\n').filter(Boolean);
const spike = fixture('run-b.stream.jsonl').map(l => JSON.parse(l));
const initTpl = spike.find(m => m.type === 'system' && m.subtype === 'init');
const resultTpl = spike.find(m => m.type === 'result');
const MODEL = env.FAKE_CLAUDE_INIT_MODEL || flag('--model') || 'claude-opus-5-5';
const sessionId = crypto.randomUUID();

// Turn 1 pays the session floor (~16.7k cache creation, as in the spike); later turns read the cache.
const turnUsage = (i) => (i === 1 ? { in: 3, out: 50, cw: 16706, cr: 0 } : { in: 5, out: 40, cw: 200, cr: 16706 });
const total = { in: 0, out: 0, cw: 0, cr: 0 };

function assistant(i, content) {
  const u = turnUsage(i);
  for (const k of Object.keys(total)) total[k] += u[k];
  return {
    type: 'assistant', session_id: sessionId, uuid: crypto.randomUUID(), parent_tool_use_id: null,
    message: {
      model: MODEL, id: `msg_fake_${sessionId.slice(0, 8)}_${i}`, type: 'message', role: 'assistant', content,
      stop_reason: null,
      usage: { input_tokens: u.in, output_tokens: u.out, cache_creation_input_tokens: u.cw, cache_read_input_tokens: u.cr },
    },
  };
}

function result(numTurns, subtype, terminalReason, extra = {}) {
  return {
    ...resultTpl, session_id: sessionId, uuid: crypto.randomUUID(), num_turns: numTurns, subtype,
    is_error: subtype !== 'success', terminal_reason: terminalReason, errors: subtype === 'success' ? [] : [subtype],
    modelUsage: { [MODEL]: { ...resultTpl.modelUsage['claude-opus-5-5'], inputTokens: total.in, outputTokens: total.out,
      cacheCreationInputTokens: total.cw, cacheReadInputTokens: total.cr } },
    ...extra,
  };
}

/** Run the settings file's PreToolUse hooks the way Claude Code does: JSON on stdin, decision on stdout. */
function runHooks(toolName, toolInput) {
  const settingsFile = flag('--settings');
  if (!settingsFile) return { decision: 'allow' };
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  const entries = (settings.hooks && settings.hooks.PreToolUse) || [];
  const payload = JSON.stringify({ session_id: sessionId, transcript_path: '', cwd: process.cwd(),
    hook_event_name: 'PreToolUse', tool_name: toolName, tool_input: toolInput });
  for (const entry of entries) {
    const m = entry.matcher || '*';
    if (m !== '*' && m !== '' && !new RegExp(`^(${m})$`).test(toolName)) continue;
    for (const h of entry.hooks || []) {
      const r = spawnSync('/bin/sh', ['-c', h.command], { input: payload, cwd: process.cwd(), encoding: 'utf8' });
      if (r.status === 2) return { decision: 'deny', reason: r.stderr.trim() };
      if (r.stdout && r.stdout.trim()) {
        const out = JSON.parse(r.stdout);
        const hso = out.hookSpecificOutput || {};
        if (hso.permissionDecision === 'deny') return { decision: 'deny', reason: hso.permissionDecisionReason };
      }
    }
  }
  return { decision: 'allow' };
}

async function main() {
  const scenario = env.FAKE_CLAUDE_SCENARIO || 'ok';
  if (scenario === 'budget') {
    for (const line of fixture('run-a.stream.jsonl')) writeLine(line);
    return;
  }
  writeLine({ ...initTpl, session_id: sessionId, cwd: process.cwd(), model: MODEL, claude_code_version: VERSION });

  if (scenario === 'ok') {
    writeLine(assistant(1, [{ type: 'text', text: 'ok' }]));
    writeLine(result(1, 'success', 'completed'));
  } else if (scenario === 'killed') {
    writeLine(assistant(1, [{ type: 'text', text: 'working' }]));
    process.kill(process.pid, 'SIGKILL');
    await sleep(10000);
  } else if (scenario === 'unknown') {
    writeLine(assistant(1, [{ type: 'text', text: 'ok' }]));
    const r = result(1, 'success', 'completed');
    r.modelUsage = { [MODEL]: { input: 3, output: 50, cache_write: 16706, cache_read: 0 } }; // renamed fields
    writeLine(r);
  } else if (scenario === 'sleep') {
    writeLine(assistant(1, [{ type: 'text', text: 'thinking' }]));
    await sleep(Number(env.FAKE_CLAUDE_SLEEP_MS || 1500));
    writeLine(result(1, 'success', 'completed'));
  } else if (scenario === 'tools') {
    const tools = JSON.parse(env.FAKE_CLAUDE_TOOLS || '[]');
    const denials = [];
    let turn = 0;
    for (const tool of tools) {
      if (turn >= maxTurns) { writeLine(result(turn, 'error_max_turns', 'max_turns', { permission_denials: denials })); return; }
      turn++;
      const id = `toolu_fake_${turn}`;
      writeLine(assistant(turn, [{ type: 'tool_use', id, name: tool.name, input: tool.input }]));
      await sleep(Number(env.FAKE_CLAUDE_TURN_DELAY_MS || 0));
      const d = runHooks(tool.name, tool.input);
      if (env.FAKE_CLAUDE_HOOK_OUT) fs.appendFileSync(env.FAKE_CLAUDE_HOOK_OUT, JSON.stringify({ tool: tool.name, input: tool.input, ...d }) + '\n');
      if (d.decision === 'deny') denials.push({ tool_name: tool.name, tool_use_id: id, tool_input: tool.input });
      writeLine({ type: 'user', session_id: sessionId, uuid: crypto.randomUUID(), parent_tool_use_id: null,
        message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, is_error: d.decision === 'deny',
          content: d.decision === 'deny' ? d.reason : 'ok' }] } });
    }
    if (turn >= maxTurns) { writeLine(result(turn, 'error_max_turns', 'max_turns', { permission_denials: denials })); return; }
    turn++;
    writeLine(assistant(turn, [{ type: 'text', text: 'done' }]));
    writeLine(result(turn, 'success', 'completed', { permission_denials: denials }));
  } else {
    process.stderr.write(`fake-claude: unknown scenario ${scenario}\n`);
    process.exitCode = 3;
  }
}

main().catch((err) => { process.stderr.write(String(err.stack || err) + '\n'); process.exitCode = 1; });
