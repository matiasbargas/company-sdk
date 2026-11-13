'use strict';

/**
 * role-loader.js — Load and parse role .md files into structured objects.
 *
 * Parses the standard role file sections: Role, Capability, Priority Constraints,
 * Purpose, Soul, Task, Consultation, Challenge, Details, Dump.
 *
 * Uses file-resolver for path safety.
 */

const fs = require('fs');
const path = require('path');

/**
 * Known sections in a role file, in order of appearance.
 */
const ROLE_SECTIONS = [
  'Role', 'Capability', 'Priority Constraints', 'Purpose', 'Soul',
  'Task', 'Details', 'Current Level', 'Consultation', 'Challenge and Feedback',
  'Dump',
];

/**
 * Load and parse a role file into a structured object.
 *
 * @param {string} filePath - Absolute path to the role .md file
 * @param {object} [options]
 * @param {string} [options.agentName] - Name to substitute for {{name}} placeholders
 * @param {string} [options.city] - City for {{city}} (naming formula, protocol §14)
 * @param {string} [options.culturalProfile] - 1-2 sentence profile for {{cultural_profile}}
 * @param {string} [options.company] - Company/project name for {{company}}
 * @returns {object} Parsed role with sections
 */
function loadRole(filePath, options = {}) {
  if (!fs.existsSync(filePath)) {
    return { error: `Role file not found: ${filePath}`, sections: {} };
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Resolve spawn-time placeholders. [PERSONA_NAME] is the legacy spelling of {{name}}.
  const fills = {
    name: options.agentName,
    city: options.city,
    cultural_profile: options.culturalProfile,
    company: options.company,
  };
  for (const [key, value] of Object.entries(fills)) {
    if (value) content = content.split(`{{${key}}}`).join(value);
  }
  if (options.agentName) content = content.split('[PERSONA_NAME]').join(options.agentName);

  const sections = parseSections(content);
  const capability = parseCapability(sections['Capability'] || '');

  return {
    filePath,
    fileName: path.basename(filePath, '.md'),
    raw: content,
    sections,
    capability,
    hasConsultation: !!(sections['Consultation'] || sections['Consultation Mode']),
    hasChallenge: !!(sections['Challenge and Feedback'] || sections['Challenge']),
  };
}

/**
 * Parse markdown content into named sections.
 * @param {string} content
 * @returns {Record<string, string>}
 */
function parseSections(content) {
  const lines = content.split('\n');
  const sections = {};
  let currentSection = '_preamble';
  let currentLines = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,2}\s+(.+)/);
    if (headingMatch) {
      // Save previous section
      if (currentLines.length > 0) {
        sections[currentSection] = currentLines.join('\n').trim();
      }
      currentSection = headingMatch[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  // Save last section
  if (currentLines.length > 0) {
    sections[currentSection] = currentLines.join('\n').trim();
  }

  return sections;
}

/**
 * Parse the Capability section into structured fields.
 * @param {string} capabilityText
 * @returns {object}
 */
function parseCapability(capabilityText) {
  const result = { answers: '', owns: '', needsFromPeers: '', consultWhen: '', doNotAsk: '' };

  const answersMatch = capabilityText.match(/\*\*Answers:\*\*\s*(.+)/);
  const ownsMatch = capabilityText.match(/\*\*Owns:\*\*\s*(.+)/);
  const needsMatch = capabilityText.match(/\*\*Needs from peers:\*\*\s*(.+)/);
  const consultMatch = capabilityText.match(/\*\*Consult me when:\*\*\s*(.+)/);
  const doNotMatch = capabilityText.match(/\*\*Do not ask me about:\*\*\s*(.+)/);

  if (answersMatch) result.answers = answersMatch[1].trim();
  if (ownsMatch) result.owns = ownsMatch[1].trim();
  if (needsMatch) result.needsFromPeers = needsMatch[1].trim();
  if (consultMatch) result.consultWhen = consultMatch[1].trim();
  if (doNotMatch) result.doNotAsk = doNotMatch[1].trim();

  return result;
}

module.exports = { loadRole, parseSections, parseCapability, ROLE_SECTIONS };
