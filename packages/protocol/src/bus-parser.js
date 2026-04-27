'use strict';

/**
 * bus-parser.js — Parse raw Bus message text into structured object.
 *
 * Extracted from scripts/lib/intent-resolver.js.
 * The canonical Bus message parser for team-sdk.
 */

/**
 * Parse a raw Bus message string into a structured object.
 * Accepts the standard protocol v4.3 format.
 *
 * @param {string} raw - Raw Bus message text
 * @returns {object} Parsed Bus message with all fields
 */
function parseBusMessage(raw) {
  if (typeof raw !== 'string') {
    return { from: '', to: '', release: '', priority: '', tags: [], solutionClass: '', costSignal: '', timeSignal: '', message: '', decisionBy: '', escalation: '' };
  }

  const result = {
    from: '',
    to: '',
    release: '',
    priority: '',
    tags: [],
    solutionClass: '',
    costSignal: '',
    timeSignal: '',
    message: '',
    decisionBy: '',
    escalation: '',
  };

  const fromMatch     = raw.match(/FROM:\s*(.+)/);
  const toMatch       = raw.match(/TO:\s*(.+)/);
  const relMatch      = raw.match(/RELEASE:\s*(.+)/);
  const priMatch      = raw.match(/PRIORITY:\s*(.+)/);
  const solMatch      = raw.match(/SOLUTION_CLASS:\s*(.+)/);
  const tagMatch      = raw.match(/TAG:\s*(.+)/);
  const costMatch     = raw.match(/COST_SIGNAL:\s*(.+)/);
  const timeMatch     = raw.match(/TIME_SIGNAL:\s*(.+)/);
  const decByMatch    = raw.match(/DECISION BY:\s*(.+)/);
  const escMatch      = raw.match(/ESCALATION:\s*(.+)/);
  // MESSAGE must be captured last — stop at DECISION BY / ESCALATION or end of string
  const msgMatch      = raw.match(/MESSAGE:\s*([\s\S]*?)(?=\nDECISION BY:|\nESCALATION:|\s*$)/);

  if (fromMatch)   result.from = fromMatch[1].trim();
  if (toMatch)     result.to = toMatch[1].trim();
  if (relMatch)    result.release = relMatch[1].trim();
  if (priMatch)    result.priority = priMatch[1].trim();
  if (solMatch)    result.solutionClass = solMatch[1].trim();
  if (tagMatch)    result.tags = tagMatch[1].split(',').map(t => t.trim()).filter(Boolean);
  if (costMatch)   result.costSignal = costMatch[1].trim();
  if (timeMatch)   result.timeSignal = timeMatch[1].trim();
  if (decByMatch)  result.decisionBy = decByMatch[1].trim();
  if (escMatch)    result.escalation = escMatch[1].trim();
  if (msgMatch)    result.message = msgMatch[1].trim();

  return result;
}

/**
 * Build a formatted Bus message string from structured fields.
 *
 * @param {object} fields - Bus message fields
 * @returns {string} Formatted Bus message
 */
function buildBusMessage(fields) {
  const lines = [];
  lines.push(`FROM: ${fields.from}`);
  lines.push(`TO: ${fields.to}`);
  lines.push(`RELEASE: ${fields.release}`);
  lines.push(`PRIORITY: ${fields.priority}`);
  if (fields.solutionClass) lines.push(`SOLUTION_CLASS: ${fields.solutionClass}`);
  if (fields.tags && fields.tags.length > 0) lines.push(`TAG: ${fields.tags.join(', ')}`);
  if (fields.costSignal) lines.push(`COST_SIGNAL: ${fields.costSignal}`);
  if (fields.timeSignal) lines.push(`TIME_SIGNAL: ${fields.timeSignal}`);
  lines.push(`MESSAGE:\n  ${(fields.message || '').replace(/\n/g, '\n  ')}`);
  if (fields.decisionBy) lines.push(`DECISION BY: ${fields.decisionBy}`);
  if (fields.escalation) lines.push(`ESCALATION: ${fields.escalation}`);
  return lines.join('\n');
}

module.exports = { parseBusMessage, buildBusMessage };
