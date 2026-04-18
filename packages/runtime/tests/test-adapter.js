'use strict';

const { ADAPTER_INTERFACE, CAPABILITIES, validateAdapter, hasCapability } = require('../src/adapter');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

function eq(a, b, label) {
  assert(a === b, `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// --- ADAPTER_INTERFACE ---
assert(Object.isFrozen(ADAPTER_INTERFACE), 'ADAPTER_INTERFACE is frozen');
assert(ADAPTER_INTERFACE.name.required === true, 'name is required');
assert(ADAPTER_INTERFACE.provider.required === true, 'provider is required');
assert(ADAPTER_INTERFACE.capabilities.required === true, 'capabilities is required');
assert(ADAPTER_INTERFACE.spawnAgent.required === true, 'spawnAgent is required');
assert(ADAPTER_INTERFACE.sendMessage.required === true, 'sendMessage is required');
assert(ADAPTER_INTERFACE.readFile.required === true, 'readFile is required');
assert(ADAPTER_INTERFACE.writeFile.required === true, 'writeFile is required');
assert(ADAPTER_INTERFACE.listFiles.required === true, 'listFiles is required');
assert(ADAPTER_INTERFACE.initialize.required === false, 'initialize is optional');
assert(ADAPTER_INTERFACE.shutdown.required === false, 'shutdown is optional');

// --- CAPABILITIES ---
assert(Object.isFrozen(CAPABILITIES), 'CAPABILITIES is frozen');
assert(CAPABILITIES.includes('agent-spawn'), 'includes agent-spawn');
assert(CAPABILITIES.includes('file-read'), 'includes file-read');
assert(CAPABILITIES.includes('file-write'), 'includes file-write');
assert(CAPABILITIES.includes('tool-use'), 'includes tool-use');
assert(CAPABILITIES.includes('streaming'), 'includes streaming');
assert(CAPABILITIES.includes('mcp-server'), 'includes mcp-server');

// --- validateAdapter ---

// Valid minimal adapter
{
  const adapter = {
    name: 'test',
    provider: 'test-provider',
    capabilities: ['file-read'],
    spawnAgent: () => {},
    sendMessage: () => {},
    readFile: () => {},
    writeFile: () => {},
    listFiles: () => {},
  };
  const result = validateAdapter(adapter);
  eq(result.valid, true, 'valid minimal adapter');
  eq(result.errors.length, 0, 'no errors on valid adapter');
}

// Null adapter
{
  const result = validateAdapter(null);
  eq(result.valid, false, 'null adapter is invalid');
  assert(result.errors[0].includes('object'), 'null error message');
}

// Missing required fields
{
  const result = validateAdapter({});
  eq(result.valid, false, 'empty object is invalid');
  assert(result.errors.some(e => e.includes('name')), 'missing name error');
  assert(result.errors.some(e => e.includes('provider')), 'missing provider error');
  assert(result.errors.some(e => e.includes('capabilities')), 'missing capabilities error');
  assert(result.errors.some(e => e.includes('spawnAgent')), 'missing spawnAgent error');
  assert(result.errors.some(e => e.includes('sendMessage')), 'missing sendMessage error');
  assert(result.errors.some(e => e.includes('readFile')), 'missing readFile error');
  assert(result.errors.some(e => e.includes('writeFile')), 'missing writeFile error');
  assert(result.errors.some(e => e.includes('listFiles')), 'missing listFiles error');
}

// Wrong types
{
  const result = validateAdapter({
    name: 123,
    provider: 456,
    capabilities: 'not-array',
    spawnAgent: 'not-function',
    sendMessage: 'not-function',
    readFile: 'not-function',
    writeFile: 'not-function',
    listFiles: 'not-function',
  });
  eq(result.valid, false, 'wrong types invalid');
  assert(result.errors.some(e => e.includes('name') && e.includes('string')), 'name type error');
  assert(result.errors.some(e => e.includes('capabilities') && e.includes('array')), 'capabilities type error');
  assert(result.errors.some(e => e.includes('spawnAgent') && e.includes('function')), 'spawnAgent type error');
}

// Unknown capability warning
{
  const adapter = {
    name: 'test', provider: 'test', capabilities: ['custom-cap'],
    spawnAgent: () => {}, sendMessage: () => {},
    readFile: () => {}, writeFile: () => {}, listFiles: () => {},
  };
  const result = validateAdapter(adapter);
  eq(result.valid, true, 'unknown capability still valid');
  assert(result.warnings.length > 0, 'unknown capability produces warning');
  assert(result.warnings[0].includes('custom-cap'), 'warning mentions the capability');
}

// Optional fields present but wrong type
{
  const adapter = {
    name: 'test', provider: 'test', capabilities: [],
    spawnAgent: () => {}, sendMessage: () => {},
    readFile: () => {}, writeFile: () => {}, listFiles: () => {},
    initialize: 'not-a-function',
  };
  const result = validateAdapter(adapter);
  eq(result.valid, false, 'optional field with wrong type is invalid');
  assert(result.errors.some(e => e.includes('initialize')), 'initialize type error');
}

// Valid adapter with optional fields
{
  const adapter = {
    name: 'full', provider: 'test', capabilities: ['agent-spawn', 'file-read'],
    spawnAgent: () => {}, sendMessage: () => {},
    readFile: () => {}, writeFile: () => {}, listFiles: () => {},
    initialize: () => {}, shutdown: () => {},
  };
  const result = validateAdapter(adapter);
  eq(result.valid, true, 'full adapter with optionals is valid');
  eq(result.warnings.length, 0, 'no warnings on known capabilities');
}

// --- hasCapability ---
{
  const adapter = { capabilities: ['agent-spawn', 'file-read'] };
  eq(hasCapability(adapter, 'agent-spawn'), true, 'has agent-spawn');
  eq(hasCapability(adapter, 'file-read'), true, 'has file-read');
  eq(hasCapability(adapter, 'file-write'), false, 'does not have file-write');
}

{
  const adapter = { capabilities: null };
  eq(hasCapability(adapter, 'anything'), false, 'null capabilities returns false');
}

{
  const adapter = {};
  eq(hasCapability(adapter, 'anything'), false, 'missing capabilities returns false');
}

console.log(`  test-adapter: ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
