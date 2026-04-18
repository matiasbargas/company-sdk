'use strict';

const { createRuntime, BUILT_IN_ADAPTERS } = require('../src/runtime');
const { createClaudeCodeAdapter } = require('../src/adapters/claude-code');
const { createStandaloneAdapter } = require('../src/adapters/standalone');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

function eq(a, b, label) {
  assert(a === b, `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// --- BUILT_IN_ADAPTERS ---
assert(Object.isFrozen(BUILT_IN_ADAPTERS), 'BUILT_IN_ADAPTERS is frozen');
assert(typeof BUILT_IN_ADAPTERS['claude-code'] === 'function', 'claude-code factory exists');
assert(typeof BUILT_IN_ADAPTERS['standalone'] === 'function', 'standalone factory exists');

// --- createRuntime defaults to claude-code ---
{
  const rt = createRuntime();
  eq(rt.getName(), 'claude-code', 'default adapter is claude-code');
  eq(rt.getProvider(), 'anthropic', 'default provider is anthropic');
  assert(rt.hasCapability('agent-spawn'), 'default has agent-spawn');
  assert(rt.hasCapability('file-read'), 'default has file-read');
  assert(rt.hasCapability('file-write'), 'default has file-write');
}

// --- createRuntime with string adapter name ---
{
  const rt = createRuntime({ adapter: 'standalone' });
  eq(rt.getName(), 'standalone', 'string adapter resolved');
  eq(rt.getProvider(), 'none', 'standalone default provider is none');
}

// --- createRuntime with custom adapter object ---
{
  const custom = {
    name: 'custom', provider: 'openai', capabilities: ['agent-spawn'],
    spawnAgent: () => ({ response: 'test' }),
    sendMessage: () => ({}),
    readFile: () => '',
    writeFile: () => {},
    listFiles: () => [],
  };
  const rt = createRuntime({ adapter: custom });
  eq(rt.getName(), 'custom', 'custom adapter name');
  eq(rt.getProvider(), 'openai', 'custom adapter provider');
}

// --- createRuntime with unknown adapter name ---
{
  let threw = false;
  try { createRuntime({ adapter: 'nonexistent' }); } catch (e) {
    threw = true;
    assert(e.message.includes('Unknown adapter'), 'error mentions unknown adapter');
  }
  assert(threw, 'unknown adapter name throws');
}

// --- createRuntime with invalid adapter object ---
{
  let threw = false;
  try { createRuntime({ adapter: { name: 123 } }); } catch (e) {
    threw = true;
    assert(e.message.includes('Invalid adapter'), 'error mentions invalid adapter');
  }
  assert(threw, 'invalid adapter throws');
}

// --- getCapabilities ---
{
  const rt = createRuntime();
  const caps = rt.getCapabilities();
  assert(Array.isArray(caps), 'getCapabilities returns array');
  assert(caps.includes('agent-spawn'), 'capabilities include agent-spawn');
  // Verify it's a copy
  caps.push('custom');
  assert(!rt.getCapabilities().includes('custom'), 'getCapabilities returns copy');
}

// --- hasCapability ---
{
  const rt = createRuntime();
  eq(rt.hasCapability('agent-spawn'), true, 'runtime hasCapability agent-spawn');
  eq(rt.hasCapability('nonexistent'), false, 'runtime does not have nonexistent');
}

// --- spawnAgent ---
{
  const rt = createRuntime();
  const result = rt.spawnAgent({
    role: 'CTO',
    persona: 'You are the CTO.',
    question: 'Should we use Postgres?',
  });
  eq(result.type, 'agent-spawn', 'spawnAgent returns agent-spawn type');
  eq(result.role, 'CTO', 'spawnAgent preserves role');
  assert(result.prompt.includes('CTO'), 'spawn prompt includes role');
  assert(result.prompt.includes('Postgres'), 'spawn prompt includes question');
  assert(result.description.includes('CTO'), 'spawn description includes role');
}

// --- spawnAgent with context ---
{
  const rt = createRuntime();
  const result = rt.spawnAgent({
    role: 'CLO',
    context: 'We are building a fintech product.',
    question: 'What are our GDPR obligations?',
  });
  assert(result.prompt.includes('fintech'), 'spawn prompt includes context');
  assert(result.prompt.includes('GDPR'), 'spawn prompt includes question');
}

// --- spawnAgent capability check ---
{
  const noSpawn = {
    name: 'limited', provider: 'test', capabilities: ['file-read'],
    spawnAgent: () => {}, sendMessage: () => {},
    readFile: () => '', writeFile: () => {}, listFiles: () => [],
  };
  const rt = createRuntime({ adapter: noSpawn });
  let threw = false;
  try { rt.spawnAgent({ role: 'CTO', question: 'test' }); } catch (e) {
    threw = true;
    assert(e.message.includes('agent-spawn'), 'error mentions missing capability');
  }
  assert(threw, 'spawnAgent without capability throws');
}

// --- sendMessage ---
{
  const rt = createRuntime();
  const result = rt.sendMessage('Hello', { temperature: 0.5 });
  eq(result.type, 'message', 'sendMessage returns message type');
  eq(result.prompt, 'Hello', 'sendMessage preserves prompt');
}

// --- readFile / writeFile capability checks ---
{
  const noFiles = {
    name: 'no-files', provider: 'test', capabilities: [],
    spawnAgent: () => {}, sendMessage: () => {},
    readFile: () => '', writeFile: () => {}, listFiles: () => [],
  };
  const rt = createRuntime({ adapter: noFiles });

  let readThrew = false;
  try { rt.readFile('/test'); } catch { readThrew = true; }
  assert(readThrew, 'readFile without capability throws');

  let writeThrew = false;
  try { rt.writeFile('/test', ''); } catch { writeThrew = true; }
  assert(writeThrew, 'writeFile without capability throws');
}

// --- initialize / shutdown lifecycle ---
{
  const rt = createRuntime();
  eq(rt.isInitialized(), false, 'not initialized initially');

  const initResult = rt.initialize('/sdk');
  eq(rt.isInitialized(), true, 'initialized after initialize()');
  assert(initResult.initialized === true, 'initialize returns success');
  assert(initResult.adapter === 'claude-code', 'initialize returns adapter name');

  const shutResult = rt.shutdown();
  eq(rt.isInitialized(), false, 'not initialized after shutdown');
  assert(shutResult.shutdown === true, 'shutdown returns success');
}

// --- Claude Code adapter specifics ---
{
  const adapter = createClaudeCodeAdapter({ sdkRoot: '/test/sdk' });
  eq(adapter.name, 'claude-code', 'claude-code adapter name');
  eq(adapter.provider, 'anthropic', 'claude-code provider');
  assert(adapter.capabilities.includes('agent-spawn'), 'claude-code has agent-spawn');
  assert(adapter.capabilities.includes('tool-use'), 'claude-code has tool-use');
  assert(adapter.capabilities.includes('mcp-server'), 'claude-code has mcp-server');
  assert(adapter.capabilities.includes('streaming'), 'claude-code has streaming');

  // readFile returns instruction payload
  const readResult = adapter.readFile('/test/file.md');
  eq(readResult.type, 'file-read', 'readFile returns file-read type');
  eq(readResult.path, '/test/file.md', 'readFile preserves path');

  // writeFile returns instruction payload
  const writeResult = adapter.writeFile('/test/file.md', 'content');
  eq(writeResult.type, 'file-write', 'writeFile returns file-write type');

  // listFiles returns instruction payload
  const listResult = adapter.listFiles('**/*.md');
  eq(listResult.type, 'file-list', 'listFiles returns file-list type');
  eq(listResult.pattern, '**/*.md', 'listFiles preserves pattern');
}

// --- Standalone adapter specifics ---
{
  const adapter = createStandaloneAdapter();
  eq(adapter.name, 'standalone', 'standalone adapter name');
  eq(adapter.provider, 'none', 'standalone default provider');
  assert(adapter.capabilities.includes('file-read'), 'standalone has file-read');
  assert(adapter.capabilities.includes('file-write'), 'standalone has file-write');
  assert(!adapter.capabilities.includes('agent-spawn'), 'standalone without llmCall has no agent-spawn');
}

// --- Standalone adapter with llmCall ---
{
  const adapter = createStandaloneAdapter({
    provider: 'anthropic',
    llmCall: async (prompt) => `Response to: ${prompt}`,
  });
  eq(adapter.provider, 'anthropic', 'standalone with custom provider');
  assert(adapter.capabilities.includes('agent-spawn'), 'standalone with llmCall has agent-spawn');
}

// --- Standalone adapter file operations ---
{
  const path = require('path');
  const os = require('os');
  const fs = require('fs');
  const tmpFile = path.join(os.tmpdir(), `team-sdk-rt-test-${Date.now()}.txt`);

  const adapter = createStandaloneAdapter();
  adapter.writeFile(tmpFile, 'test content');
  const content = adapter.readFile(tmpFile);
  eq(content, 'test content', 'standalone read/write works');
  fs.unlinkSync(tmpFile);
}

console.log(`  test-runtime: ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
