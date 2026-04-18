'use strict';

/**
 * intent-resolver.js — Maps Bus message patterns to optional SDK actions.
 *
 * Extracted from scripts/lib/intent-resolver.js.
 * Conservative: most messages return null (pure communication).
 * Only structured patterns with clear script equivalents fire.
 */

const { actions } = require('./action-registry');
const { inferLogFile } = require('./roles');

// Pattern matchers — ordered by specificity.
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

  // CONTEXT REQUEST → queryMap lookup (routing only)
  {
    match: (bus) => bus.priority === 'CONTEXT REQUEST' || /CONTEXT REQUEST/i.test(bus.message),
    resolve: (bus) => {
      const topicMatch = bus.message.match(/CONTEXT REQUEST\s*[—–-]\s*(.+)/i);
      const topic = topicMatch ? topicMatch[1].trim().toLowerCase() : '';
      return {
        action: null,
        routing: { topic, consult: bus.to },
        params: {}
      };
    }
  },

  // FRAMING-CHALLENGE tag → log disagreement + surface in status
  {
    match: (bus) => bus.tags && bus.tags.includes('FRAMING-CHALLENGE'),
    resolve: (bus) => ({
      action: 'doc.decision',
      params: {
        file: 'history.md',
        decision: `Framing challenge: ${bus.message.split('\n')[0].slice(0, 100)}`,
        context: bus.message.slice(0, 300),
        'made-by': bus.from,
      },
      side_effects: [{
        action: 'doc.log',
        params: {
          file: inferLogFile(bus.from),
          role: bus.from,
          level: 'L4',
          goal: `FRAMING-CHALLENGE: ${bus.message.split('\n')[0].slice(0, 100)}`,
          status: 'blocked',
        }
      }],
      tag: 'FRAMING-CHALLENGE',
    })
  },

  // RATCHET-CANDIDATE tag → log ratchet flag
  {
    match: (bus) => bus.tags && bus.tags.includes('RATCHET-CANDIDATE'),
    resolve: (bus) => ({
      action: 'doc.log',
      params: {
        file: inferLogFile(bus.from),
        role: bus.from,
        level: 'L3',
        goal: `RATCHET-CANDIDATE: ${bus.message.split('\n')[0].slice(0, 100)}`,
        status: 'active',
      },
      tag: 'RATCHET-CANDIDATE',
    })
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
 * @param {string|object} busMessageRaw - Raw Bus message text or parsed object
 * @returns {object|null} { action, params, side_effects?, routing?, definition, bus } or null
 */
function resolve(busMessageRaw) {
  const { parseBusMessage } = require('./bus-parser');
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
  return null;
}

function extractMissionFromMessage(msg) {
  const missionMatch = msg.match(/mission[:\s]+["']?([^"'\n]+)/i);
  if (missionMatch) return missionMatch[1].trim();
  return msg.split('\n')[0].slice(0, 80);
}

module.exports = { resolve, PATTERNS };
