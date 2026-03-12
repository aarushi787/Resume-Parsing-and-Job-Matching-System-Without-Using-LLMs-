'use strict';

/**
 * Rule-based name extraction from resume text.
 * Strategy:
 * 1. Look for name label patterns ("Name: John Doe")
 * 2. Look for email and use prefix as hint
 * 3. Heuristic: first line with 2-4 capitalized words (typical resume header)
 */

const COMMON_RESUME_HEADERS = new Set([
  'resume', 'curriculum vitae', 'cv', 'profile', 'summary', 'objective',
  'experience', 'education', 'skills', 'contact', 'references', 'projects',
  'certifications', 'achievements', 'publications', 'awards', 'languages',
  'interests', 'hobbies', 'about', 'overview', 'professional', 'technical'
]);

const COMMON_NON_NAMES = new Set([
  'software', 'engineer', 'developer', 'manager', 'director', 'analyst',
  'consultant', 'specialist', 'architect', 'designer', 'senior', 'junior',
  'lead', 'principal', 'associate', 'intern', 'full', 'stack', 'backend',
  'frontend', 'mobile', 'data', 'devops', 'cloud', 'machine', 'learning',
  'artificial', 'intelligence', 'computer', 'science', 'information', 'technology'
]);

/**
 * Extract candidate name from resume text.
 * @param {string} text - Raw resume text
 * @returns {string|null}
 */
function extractName(text) {
  if (!text) return null;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Strategy 1: Explicit label
  const labelPattern = /^(?:name|candidate|applicant)\s*[:\-]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i;
  for (const line of lines.slice(0, 20)) {
    const m = labelPattern.exec(line);
    if (m) return m[1].trim();
  }

  // Strategy 2: Email-based hint ("john.doe@email.com" → "John Doe")
  const emailMatch = /([a-zA-Z]+)[.\-_]([a-zA-Z]+)@/i.exec(text);
  if (emailMatch) {
    const candidate = capitalize(emailMatch[1]) + ' ' + capitalize(emailMatch[2]);
    // Verify this appears near the top in a name-like line
    const firstBlock = text.slice(0, 500).toLowerCase();
    const lastName = emailMatch[2].toLowerCase();
    if (firstBlock.includes(lastName)) {
      // Find the actual line with this last name in title case
      for (const line of lines.slice(0, 15)) {
        if (line.toLowerCase().includes(lastName) && isNameLike(line)) {
          const cleaned = cleanNameLine(line);
          if (cleaned) return cleaned;
        }
      }
      return candidate;
    }
  }

  // Strategy 3: First non-header line with 2-4 capitalized words
  for (const line of lines.slice(0, 10)) {
    if (isNameLike(line)) {
      const cleaned = cleanNameLine(line);
      if (cleaned) return cleaned;
    }
  }

  return null;
}

function isNameLike(line) {
  // Should be 2-4 words, each starting with capital, not too long
  if (line.length > 60 || line.length < 4) return false;

  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return false;

  // Reject lines with numbers, emails, phones, or URLs
  if (/[\d@|/\\()\[\]{}]/.test(line)) return false;

  // All words should be title-cased (or all caps)
  const titleCased = words.every(w => /^[A-Z]/.test(w));
  if (!titleCased) return false;

  // None of the words should be common resume section headers or job titles
  const lowerWords = words.map(w => w.toLowerCase());
  if (lowerWords.some(w => COMMON_RESUME_HEADERS.has(w) || COMMON_NON_NAMES.has(w))) {
    return false;
  }

  // Should look like a human name pattern
  return words.every(w => /^[A-Z][a-z'-]+$/.test(w) || /^[A-Z]{2,}$/.test(w));
}

function cleanNameLine(line) {
  // Remove phone, email fragments
  const cleaned = line
    .replace(/[\d\-()+#@]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(w => w.length > 1 && /^[A-Z]/.test(w));
  if (words.length < 2 || words.length > 5) return null;

  return words.join(' ');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

module.exports = { extractName };
