'use strict';

/**
 * intent-resolver.js — Maps Bus message patterns to optional SDK actions.
 *
 * Conservative: most messages return null (pure communication).
 * Only structured patterns with clear script equivalents fire.
 * The Bus format does NOT change — this reads messages post-hoc.
 */

const { actions } = require('./action-registry');

/**
 * Parse a Bus message string into structured fields.
 * Accepts the standard format:
 *   FROM: [Role]
 *   TO: [Role]
 *   RELEASE: [release]
 *   PRIORITY: [priority]
 *   MESSAGE: [body...]
 */
function parseBusMessage(raw) {
  const result = { from: '', to: '', release: '', priority: '', message: '' };
  const fromMatch = raw.match(/FROM:\s*(.+)/);
  const toMatch   = raw.match(/TO:\s*(.+)/);
  const relMatch  = raw.match(/RELEASE:\s*(.+)/);
  const priMatch  = raw.match(/PRIORITY:\s*(.+)/);
  const msgMatch  = raw.match(/MESSAGE:\s*([\s\S]*?)$/);

  if (fromMatch) result.from = fromMatch[1].trim();
  if (toMatch)   result.to   = toMatch[1].trim();
  if (relMatch)  result.release = relMatch[1].trim();
  if (priMatch)  result.priority = priMatch[1].trim();
  if (msgMatch)  result.message = msgMatch[1].trim();

  return result;
}

// ─── Pattern matchers ────────────────────────────────────────────────────────
// Ordered by specificity. Each returns { action, params } or null.

const PATTERNS = [
  // BLOCKER → log + status update
  {
    match: (bus) => bus.priority === 'BLOCKER',
    resolve: (bus) => ({
      action: 'doc.pod-update',
      params: {
        file: 'current-status.md',
        mission: extractMissionFromMessage(bus.message),
        status: 'Blocked',
        next: `${bus.to}: ${bus.message.split('\n')[0].slice(0, 100)}`,
      },
      side_effects: [{
        action: 'doc.log',
        params: {
          file: inferLogFile(bus.from),
          role: bus.from,
          level: 'L4',
          goal: bus.message.split('\n')[0].slice(0, 120),
          status: 'blocked',
        }
      }]
    })
  },

  // DOMAIN CLOSE → area log entry
  {
    match: (bus) => /DOMAIN CLOSE/i.test(bus.message),
    resolve: (bus) => ({
      action: 'doc.log',
      params: {
        file: inferLogFile(bus.from),
        role: bus.from,
        level: 'L3',
        goal: bus.message.replace(/DOMAIN CLOSE[:\s]*/i, '').split('\n')[0].slice(0, 120),
        status: 'completed',
      }
    })
  },

  // CONTEXT REQUEST → queryMap lookup (no script execution, returns routing info)
  {
    match: (bus) => bus.priority === 'CONTEXT REQUEST' || /CONTEXT REQUEST/i.test(bus.message),
    resolve: (bus) => {
      const topicMatch = bus.message.match(/CONTEXT REQUEST\s*[—–-]\s*(.+)/i);
      const topic = topicMatch ? topicMatch[1].trim().toLowerCase() : '';
      return {
        action: null, // no script — routing only
        routing: { topic, consult: bus.to },
        params: {}
      };
    }
  },

  // DECISION NEEDED → log as pending decision
  {
    match: (bus) => bus.priority === 'DECISION NEEDED',
    resolve: (bus) => ({
      action: 'doc.log',
      params: {
        file: inferLogFile(bus.from),
        role: bus.from,
        level: 'L3',
        goal: `Decision needed: ${bus.message.split('\n')[0].slice(0, 100)}`,
        status: 'blocked',
      }
    })
  },
];

/**
 * Resolve a Bus message to an optional action + params.
 * Returns { action, params, side_effects?, routing? } or null.
 */
function resolve(busMessageRaw) {
  const bus = typeof busMessageRaw === 'string' ? parseBusMessage(busMessageRaw) : busMessageRaw;

  for (const pattern of PATTERNS) {
    if (pattern.match(bus)) {
      const resolution = pattern.resolve(bus);
      if (resolution) {
        const definition = resolution.action ? actions[resolution.action] : null;
        return { ...resolution, definition, bus };
      }
    }
  }
  return null; // Pure communication — no action implied
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inferLogFile(role) {
  const r = (role || '').toLowerCase();
  if (['cto', 'mario', 'chief engineer', 'staff engineer', 'em', 'engineer'].some(k => r.includes(k))) return 'engineering-log.md';
  if (['pm', 'designer', 'liaison', 'cmo', 'cro'].some(k => r.includes(k))) return 'product-log.md';
  if (['clo', 'ciso', 'cfo', 'coo'].some(k => r.includes(k))) return 'operations-log.md';
  if (['chro'].some(k => r.includes(k))) return 'people-log.md';
  if (['ux researcher'].some(k => r.includes(k))) return 'design-log.md';
  if (['ceo', 'coordinator'].some(k => r.includes(k))) return 'strategy-log.md';
  return 'engineering-log.md'; // safe default
}

function extractMissionFromMessage(msg) {
  // Try to find a mission reference in the message
  const missionMatch = msg.match(/mission[:\s]+["']?([^"'\n]+)/i);
  if (missionMatch) return missionMatch[1].trim();
  // Fallback: first sentence
  return msg.split('\n')[0].slice(0, 80);
}

module.exports = { resolve, parseBusMessage, inferLogFile };
