// 'use strict';

// const { extractTextFromFile, extractTextFromBuffer, cleanText } = require('../utils/textExtractor');
// const { extractName } = require('../extractors/nameExtractor');
// const { extractSalary } = require('../extractors/salaryExtractor');
// const { extractExperience } = require('../extractors/experienceExtractor');
// const { extractSkills } = require('../extractors/skillExtractor');

// /**
//  * Parse a resume file and extract structured information.
//  * @param {string} filePath - Absolute path to resume file
//  * @returns {Promise<ResumeData>}
//  */
// async function parseResumeFile(filePath) {
//   const rawText = await extractTextFromFile(filePath);
//   return parseResumeText(rawText);
// }

// /**
//  * Parse resume from a buffer (for API upload).
//  * @param {Buffer} buffer
//  * @param {string} mimetype
//  * @returns {Promise<ResumeData>}
//  */
// async function parseResumeBuffer(buffer, mimetype) {
//   const rawText = await extractTextFromBuffer(buffer, mimetype);
//   return parseResumeText(rawText);
// }

// /**
//  * Parse resume from raw text string.
//  * @param {string} rawText
//  * @returns {ResumeData}
//  */
// function parseResumeText(rawText) {
//   const text = cleanText(rawText);

//   const name = extractName(text);
//   const salary = extractSalary(text); // resume may have expected salary
//   const yearOfExperience = extractExperience(text);
//   const resumeSkills = extractSkills(text);

//   // Extract additional metadata
//   const email = extractEmail(text);
//   const phone = extractPhone(text);
//   const location = extractLocation(text);
//   const education = extractEducation(text);

//   return {
//     name,
//     email,
//     phone,
//     location,
//     education,
//     salary,
//     yearOfExperience,
//     resumeSkills,
//     rawText: text
//   };
// }

// function extractEmail(text) {
//   const m = /[\w.+-]+@[\w-]+\.[\w.]+/.exec(text);
//   return m ? m[0].toLowerCase() : null;
// }

// function extractPhone(text) {
//   const m = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.exec(text);
//   return m ? m[0].trim() : null;
// }

// function extractLocation(text) {
//   // Look for "City, State" or "City, Country" patterns
//   const m = /\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2}|[A-Z][a-zA-Z]+)\b/.exec(text.slice(0, 500));
//   return m ? m[0].trim() : null;
// }

// function extractEducation(text) {
//   const degrees = [];
//   const degreePattern = /(?:bachelor|master|phd|doctorate|b\.?s\.?|m\.?s\.?|b\.?e\.?|m\.?e\.?|b\.?tech|m\.?tech|mba)[^.\n]{0,80}/gi;
//   let m;
//   while ((m = degreePattern.exec(text)) !== null) {
//     const cleaned = m[0].replace(/\s+/g, ' ').trim();
//     if (!degrees.includes(cleaned)) degrees.push(cleaned);
//     if (degrees.length >= 3) break;
//   }
//   return degrees.length > 0 ? degrees : null;
// }

// module.exports = { parseResumeFile, parseResumeBuffer, parseResumeText };

/**
 * Resume Parser
 * Rule-based extraction of:
 *  - Candidate name
 *  - Email & phone
 *  - Total years of experience (from date ranges or explicit statement)
 *  - Skills
 */

const { extractSkills } = require('../extractors/skillExtractor');
const { cleanText } = require('../utils/textExtractor');

// ─── Name Extraction ─────────────────────────────────────────────────────────

/**
 * Attempt to extract candidate name from resume text.
 * Strategy: name is usually in the first 5 non-empty lines.
 * @param {string} text
 * @returns {string}
 */
function extractName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Skip lines with contact info, URLs, etc.
  const SKIP_PATTERNS = [
    /\b[\w.+-]+@[\w-]+\.\w+\b/,   // email
    /\b\d{10,}\b/,                  // phone
    /https?:\/\//,                   // URL
    /linkedin|github|portfolio/i,
    /curriculum\s*vitae|resume|cv\b/i,
    /^\d/,                           // starts with digit
  ];

  for (const line of lines.slice(0, 10)) {
    const skip = SKIP_PATTERNS.some(p => p.test(line));
    if (skip) continue;

    // Name heuristic: 2-4 words, each capitalized, reasonable length
    const words = line.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 5 &&
      line.length < 60 &&
      words.every(w => /^[A-Z][a-zA-Z'-]*$/.test(w))
    ) {
      return line;
    }
  }

  // Fallback: look for "Name:" pattern
  const nameMatch = text.match(/(?:name\s*[:–-])\s*([A-Z][a-zA-Z\s'-]{2,40})/i);
  if (nameMatch) return nameMatch[1].trim();

  return 'Unknown';
}

// ─── Contact Extraction ───────────────────────────────────────────────────────

function extractEmail(text) {
  const match = text.match(/\b[\w.+-]+@[\w-]+\.\w{2,}\b/);
  return match ? match[0] : null;
}

function extractPhone(text) {
  const match = text.match(/(?:\+?\d[\d\s\-().]{8,15}\d)/);
  return match ? match[0].trim() : null;
}

// ─── Experience Extraction ────────────────────────────────────────────────────

// Month name to number
const MONTH_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/**
 * Parse a date string like "Jan 2020", "2020", "January 2019" into { month, year }.
 */
function parseDate(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase();

  // "present", "current", "now", "till date"
  if (/present|current|now|till\s*date|today/i.test(s)) {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  // "Jan 2020" or "January 2020"
  const monthYear = s.match(/([a-z]+)\s*[',.\-]?\s*(\d{4})/);
  if (monthYear) {
    const month = MONTH_MAP[monthYear[1]] || 1;
    return { month, year: parseInt(monthYear[2]) };
  }

  // "2020" bare year
  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly) {
    return { month: 1, year: parseInt(yearOnly[1]) };
  }

  // "MM/YYYY" or "MM-YYYY"
  const mmYYYY = s.match(/(\d{1,2})[\/\-](\d{4})/);
  if (mmYYYY) {
    return { month: parseInt(mmYYYY[1]), year: parseInt(mmYYYY[2]) };
  }

  return null;
}

/**
 * Calculate difference in years (fractional) between two { month, year } objects.
 */
function diffYears(start, end) {
  const startTotal = start.year * 12 + start.month;
  const endTotal = end.year * 12 + end.month;
  return (endTotal - startTotal) / 12;
}

/**
 * Extract total years of experience from resume text.
 * Priority:
 *  1. Explicit statement: "X years of experience"
 *  2. Sum of date ranges in experience section
 * @param {string} text
 * @returns {number}
 */
function extractYearsOfExperience(text) {
  // 1. Explicit mention
  const explicitPatterns = [
    /(\d+(?:\.\d+)?)\+?\s*years?\s*(?:of\s*)?(?:overall|total|relevant|professional)?\s*(?:work\s*)?experience/gi,
    /(?:total|overall|relevant)\s*experience\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*years?/gi,
    /experience\s*[:–-]\s*(\d+(?:\.\d+)?)\s*years?/gi,
  ];

  for (const pattern of explicitPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (val > 0 && val < 50) return val;
    }
  }

  // 2. Sum date ranges
  // Pattern: "Month Year – Month Year" or "Month Year - Present"
  const DATE_RANGE_PATTERN = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4})\s*[-–—to]+\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4}|present|current|now|till\s*date)/gi;

  const ranges = [];
  let match;
  while ((match = DATE_RANGE_PATTERN.exec(text)) !== null) {
    const start = parseDate(match[1]);
    const end = parseDate(match[2]);
    if (start && end && end.year >= start.year) {
      const years = diffYears(start, end);
      if (years > 0 && years < 40) {
        ranges.push(years);
      }
    }
  }

  if (ranges.length > 0) {
    const total = ranges.reduce((a, b) => a + b, 0);
    return Math.round(total * 10) / 10;
  }

  // 3. Fresher / entry-level
  if (/\b(fresher|entry[\s-]level|no\s*experience)\b/i.test(text)) return 0;

  return null;
}

// ─── Education Extraction ─────────────────────────────────────────────────────

function extractEducation(text) {
  const DEGREES = [
    'PhD', 'Ph.D', 'Doctorate', 'Doctor',
    "Master's", 'Masters', 'M.S.', 'M.Tech', 'MBA', 'M.E.',
    "Bachelor's", 'Bachelors', 'B.S.', 'B.Tech', 'B.E.', 'B.Sc', 'B.A.',
    'Associate Degree',
  ];

  const found = [];
  for (const deg of DEGREES) {
    const escaped = deg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`${escaped}[^\\n]{0,80}`, 'gi');
    const match = text.match(pattern);
    if (match) found.push(...match.map(m => m.trim()));
  }

  return [...new Set(found)].slice(0, 3);
}

// ─── Main Parser ─────────────────────────────────────────────────────────────

/**
 * Parse a resume text and return structured data.
 * @param {string} rawText - Raw resume text
 * @returns {object} Structured resume data
 */
function parseResumeText(rawText) {
  const text = cleanText(rawText);

  const name = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const yearOfExperience = extractYearsOfExperience(text);
  const resumeSkills = extractSkills(text);
  const education = extractEducation(text);

  return {
    name,
    email,
    phone,
    yearOfExperience,
    resumeSkills,
    education,
    rawText: text
  };
}

/**
 * Parse a resume file and return structured data.
 * @param {string} filePath - Absolute path to resume file
 * @returns {Promise<object>} Structured resume data
 */
async function parseResumeFile(filePath) {
  const { extractTextFromFile } = require('../utils/textExtractor');
  const rawText = await extractTextFromFile(filePath);
  return parseResumeText(rawText);
}

/**
 * Parse resume from a buffer (for API upload).
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @returns {Promise<object>}
 */
async function parseResumeBuffer(buffer, mimetype) {
  const { extractTextFromBuffer } = require('../utils/textExtractor');
  const rawText = await extractTextFromBuffer(buffer, mimetype);
  return parseResumeText(rawText);
}

module.exports = { parseResumeFile, parseResumeBuffer, parseResumeText, extractName, extractYearsOfExperience, extractEmail };
