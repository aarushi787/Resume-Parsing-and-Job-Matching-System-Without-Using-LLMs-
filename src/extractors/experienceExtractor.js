'use strict';

/**
 * Rule-based experience extraction.
 * Supports:
 * - "5+ years of experience"
 * - "Bachelor's with 5+ years"
 * - "3-5 years"
 * - "Fresher / Entry-Level"
 * - Date ranges: Jan 2020 - Present (sum durations)
 */

const MONTHS = {
  jan:1, january:1, feb:2, february:2, mar:3, march:3,
  apr:4, april:4, may:5, jun:6, june:6, jul:7, july:7,
  aug:8, august:8, sep:9, sept:9, september:9,
  oct:10, october:10, nov:11, november:11, dec:12, december:12
};

// Patterns for explicit experience mentions
const EXPLICIT_PATTERNS = [
  // "7+ years", "5-7 years", "at least 3 years"
  /(\d+(?:\.\d+)?)\s*\+?\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*\+?\s*years?(?:\s+of)?\s+(?:relevant\s+)?experience/gi,
  /(\d+(?:\.\d+)?)\s*\+\s*years?(?:\s+of)?\s+(?:relevant\s+|related\s+|strong\s+)?(?:hands.on\s+)?experience/gi,
  /(\d+(?:\.\d+)?)\s*years?(?:\s+of)?\s+(?:relevant\s+|related\s+|strong\s+)?(?:hands.on\s+)?experience/gi,
  /experience\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*\+?\s*years?/gi,
  /minimum\s+(?:of\s+)?(\d+)\s*\+?\s*years?/gi,
  /at\s+least\s+(\d+)\s+years?/gi,
  // "Bachelor's with 5+ years of experience"
  /(?:bachelor|master|phd|degree)[^\n]*?(\d+)\s*\+\s*years?/gi,
];

// Patterns for fresher / entry-level
const FRESHER_PATTERNS = [
  /\b(?:fresher|entry.level|0\s*years?|no\s+experience\s+required|new\s+graduate)\b/i
];

// Date range patterns for calculating experience from employment history
const DATE_RANGE_PATTERN = /(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(\d{4})\s*[-–to]+\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(\d{4}|present|current|now)/gi;

/**
 * Extract years of experience from text.
 * @param {string} text
 * @returns {number|string|null}
 */
function extractExperience(text) {
  if (!text) return null;

  // Check for fresher first
  for (const p of FRESHER_PATTERNS) {
    if (p.test(text)) return 'Fresher/Entry-Level';
  }

  // Try explicit patterns - return first match
  for (const pattern of EXPLICIT_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      // Get first capture group that's a number
      const nums = match.slice(1).filter(v => v && /^\d/.test(v)).map(Number);
      if (nums.length >= 2) {
        // Range: return midpoint
        return Math.round(((nums[0] + nums[1]) / 2) * 10) / 10;
      }
      if (nums.length === 1) return nums[0];
    }
  }

  // Fall back to date range calculation
  const dateExp = calculateFromDateRanges(text);
  if (dateExp !== null) return dateExp;

  return null;
}

/**
 * Parse employment date ranges and sum total years.
 * @param {string} text
 * @returns {number|null}
 */
function calculateFromDateRanges(text) {
  DATE_RANGE_PATTERN.lastIndex = 0;
  const now = new Date();
  let totalMonths = 0;
  let found = false;
  const seen = new Set(); // avoid double-counting same range

  let match;
  while ((match = DATE_RANGE_PATTERN.exec(text)) !== null) {
    const [, startMonStr, startYearStr, endMonStr, endStr] = match;
    const startYear = parseInt(startYearStr, 10);
    if (startYear < 1970 || startYear > now.getFullYear() + 2) continue;

    const startMon = startMonStr ? (MONTHS[startMonStr.toLowerCase().slice(0,3)] || 1) : 1;

    let endYear, endMon;
    const endLower = (endStr || '').toLowerCase();
    if (['present', 'current', 'now'].includes(endLower)) {
      endYear = now.getFullYear();
      endMon = now.getMonth() + 1;
    } else {
      endYear = parseInt(endStr, 10);
      endMon = endMonStr ? (MONTHS[endMonStr.toLowerCase().slice(0,3)] || 12) : 12;
    }

    if (endYear < startYear) continue;

    const key = `${startYear}-${startMon}-${endYear}-${endMon}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const months = (endYear - startYear) * 12 + (endMon - startMon);
    if (months > 0 && months < 600) { // sanity check < 50 years
      totalMonths += months;
      found = true;
    }
  }

  if (found) {
    return Math.round((totalMonths / 12) * 10) / 10;
  }
  return null;
}

/**
 * Extract experience requirements from a JD (may differ from resume).
 * @param {string} text
 * @returns {{ min: number|null, max: number|null, raw: string|null }}
 */
function extractJDExperienceRequirement(text) {
  if (!text) return { min: null, max: null, raw: null };

  // Range: "5-7 years"
  const rangeMatch = /(\d+(?:\.\d+)?)\s*[-\u2013]+\s*(\d+(?:\.\d+)?)\s*\+?\s*years?(?:\s+of)?\s*(?:relevant\s+)?(?:experience)?/i.exec(text);
  if (rangeMatch) {
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2]),
      raw: rangeMatch[0].trim()
    };
  }

  // "5+ years"
  const minMatch = /(\d+(?:\.\d+)?)\s*\+\s*years?(?:\s+of)?\s*(?:relevant\s+)?(?:experience)?/i.exec(text);
  if (minMatch) {
    return { min: parseFloat(minMatch[1]), max: null, raw: minMatch[0].trim() };
  }

  // Single year mention
  const singleMatch = /(\d+(?:\.\d+)?)\s*years?(?:\s+of)?\s+(?:relevant\s+|related\s+)?experience/i.exec(text);
  if (singleMatch) {
    return { min: parseFloat(singleMatch[1]), max: null, raw: singleMatch[0].trim() };
  }

  // Fallback: any 'N years' mention
  const anyYearsMatch = /(\d+(?:\.\d+)?)\s+years?/i.exec(text);
  if (anyYearsMatch) {
    return { min: parseFloat(anyYearsMatch[1]), max: null, raw: anyYearsMatch[0].trim() };
  }

  if (FRESHER_PATTERNS.some(p => p.test(text))) {
    return { min: 0, max: null, raw: 'Fresher/Entry-Level' };
  }

  return { min: null, max: null, raw: null };
}

module.exports = { extractExperience, calculateFromDateRanges, extractJDExperienceRequirement };
