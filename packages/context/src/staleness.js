'use strict';

/**
 * staleness.js — File age calculation.
 */

const fs = require('fs');

/**
 * Calculate the age of a file in hours.
 * @param {string} filePath - Absolute path to the file
 * @returns {{ ageHours: number, stale: boolean }|null} null if file doesn't exist
 */
function calculateStaleness(filePath, { staleThresholdHours = 48 } = {}) {
  if (!fs.existsSync(filePath)) return null;
  const mtime = fs.statSync(filePath).mtime;
  const ageHours = Math.round((Date.now() - mtime.getTime()) / 1000 / 60 / 60);
  return { ageHours, stale: ageHours > staleThresholdHours };
}

module.exports = { calculateStaleness };
