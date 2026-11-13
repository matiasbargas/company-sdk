'use strict';

/**
 * overdue.js — find `DECISION BY: YYYY-MM-DD` deadlines that have passed (protocol.md §2,
 * "Timing for session-bound agents"). Agents do not feel time pass between sessions, so
 * sdk-status and sdk-resume surface these at session start as the calendar backstop.
 *
 * Sources: current-status.md (live open decisions) and bus-log.md entries whose deadline
 * fell in the last 30 days (older Bus history is assumed settled or already escalated).
 */

const fs = require('fs');
const path = require('path');

const DEADLINE = /DECISION BY:\s*(\d{4}-\d{2}-\d{2})/g;
const BUS_WINDOW_DAYS = 30;

function scan(file, today, minDate) {
  if (!fs.existsSync(file)) return [];
  const out = [];
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(DEADLINE)) {
      const due = m[1];
      if (due < today && (!minDate || due >= minDate)) {
        // Nearest preceding MESSAGE/heading line gives the reader something to search for.
        let ctx = '';
        for (let j = i; j >= Math.max(0, i - 12); j--) {
          if (/^(MESSAGE:|\[\d{4}-|#+ |- )/.test(lines[j].trim())) { ctx = lines[j].trim().replace(/^MESSAGE:\s*/, ''); break; }
        }
        out.push({ file: path.basename(file), line: i + 1, due, context: ctx.slice(0, 90) });
      }
    }
  });
  return out;
}

function findOverdue(projectDir, today = new Date().toISOString().slice(0, 10)) {
  const min = new Date(Date.parse(today) - BUS_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
  return [
    ...scan(path.join(projectDir, 'current-status.md'), today, null),
    ...scan(path.join(projectDir, 'bus-log.md'), today, min),
  ];
}

module.exports = { findOverdue };
