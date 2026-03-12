// 'use strict';

// const { extractTextFromFile, extractTextFromBuffer, cleanText } = require('../utils/textExtractor');
// const { extractSalary } = require('../extractors/salaryExtractor');
// const { extractJDExperienceRequirement } = require('../extractors/experienceExtractor');
// const { extractSkills } = require('../extractors/skillExtractor');

// /**
//  * Parse a Job Description from file or text.
//  */

// const OPTIONAL_SECTION_HEADERS = [
//   /desired\s+(?:qualifications?|skills?|experience)/i,
//   /preferred\s+(?:qualifications?|skills?|experience)/i,
//   /nice\s+to\s+have/i,
//   /good\s+to\s+have/i,
//   /bonus\s+(?:points?|skills?)/i,
//   /plus(?:es)?(?:\s+include)?/i,
//   /optional/i,
//   /would\s+be\s+(?:a\s+)?(?:plus|bonus)/i
// ];

// const REQUIRED_SECTION_HEADERS = [
//   /required\s+(?:qualifications?|skills?|experience)/i,
//   /minimum\s+qualifications?/i,
//   /must\s+have/i,
//   /basic\s+qualifications?/i,
//   /mandatory/i,
//   /what\s+you(?:'ll)?\s+need/i,
//   /key\s+(?:requirements?|skills?|responsibilities)/i
// ];

// /**
//  * Extract the "About Role" summary from JD text.
//  */
// function extractAboutRole(text) {
//   // Try to find overview/position overview section
//   const overviewPattern = /(?:position\s+overview|job\s+(?:description|overview|summary)|about\s+(?:the\s+)?role|opportunity|the\s+opportunity|overview)[:\s]*\n+([\s\S]{50,500}?)(?:\n\n|\n[A-Z])/i;
//   const m = overviewPattern.exec(text);
//   if (m) {
//     return m[1].replace(/\s+/g, ' ').trim().slice(0, 400);
//   }

//   // Fallback: take first meaningful paragraph (50-400 chars)
//   const paragraphs = text.split(/\n\n+/);
//   for (const para of paragraphs) {
//     const cleaned = para.replace(/\s+/g, ' ').trim();
//     if (cleaned.length >= 80 && cleaned.length <= 500 && !cleaned.match(/^(•|-|\*)/)) {
//       return cleaned.slice(0, 400);
//     }
//   }

//   return text.slice(0, 300).replace(/\s+/g, ' ').trim();
// }

// /**
//  * Split JD text into required and optional sections.
//  */
// function splitSections(text) {
//   const lines = text.split('\n');
//   let optionalStart = -1;
//   let requiredEnd = text.length;

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (optionalStart === -1 && OPTIONAL_SECTION_HEADERS.some(p => p.test(line))) {
//       // Find character position of this line
//       optionalStart = text.indexOf(lines[i]);
//       requiredEnd = optionalStart;
//     }
//   }

//   const requiredText = optionalStart !== -1 ? text.slice(0, requiredEnd) : text;
//   const optionalText = optionalStart !== -1 ? text.slice(optionalStart) : '';

//   return { requiredText, optionalText };
// }

// /**
//  * Extract role/job title from JD.
//  */
// function extractRole(text) {
//   const patterns = [
//     /position\s*:\s*(.+)/i,
//     /job\s+title\s*:\s*(.+)/i,
//     /role\s*:\s*(.+)/i,
//     /(?:seeking|hiring|looking\s+for)\s+(?:a|an)\s+([A-Z][^\n.]{5,60})/i,
//     /^([A-Z][A-Za-z\s/-]{5,60})$/m,  // All-caps or title case line at start
//   ];

//   for (const p of patterns) {
//     const m = p.exec(text.slice(0, 1000));
//     if (m) {
//       const candidate = m[1].trim().replace(/[()[\]{}<>]/g, '').trim();
//       if (candidate.length >= 5 && candidate.length <= 80) return candidate;
//     }
//   }

//   // Fallback: first meaningful capitalized line
//   const lines = text.split('\n').slice(0, 15);
//   for (const line of lines) {
//     const t = line.trim();
//     if (t.length >= 10 && t.length <= 80 && /[A-Z]/.test(t[0]) && !/^(About|At |Join |Our |We )/.test(t)) {
//       return t;
//     }
//   }

//   return 'Software Engineer';
// }

// /**
//  * Parse a JD from file path.
//  */
// async function parseJDFile(filePath, jobId = null) {
//   const rawText = await extractTextFromFile(filePath);
//   return parseJDText(rawText, jobId);
// }

// /**
//  * Parse a JD from buffer.
//  */
// async function parseJDBuffer(buffer, mimetype, jobId = null) {
//   const rawText = await extractTextFromBuffer(buffer, mimetype);
//   return parseJDText(rawText, jobId);
// }

// /**
//  * Parse a JD from raw text.
//  */
// function parseJDText(rawText, jobId = null) {
//   const text = cleanText(rawText);
//   const { requiredText, optionalText } = splitSections(text);

//   const role = extractRole(text);
//   const aboutRole = extractAboutRole(text);
//   const salary = extractSalary(text);
//   const experienceReq = extractJDExperienceRequirement(text);

//   // Extract skills from required and optional sections separately
//   const requiredSkills = extractSkills(requiredText);
//   const optionalSkillsCandidates = optionalText ? extractSkills(optionalText) : [];

//   // Optional skills = those found only in optional section, not in required
//   const requiredSkillsLower = requiredSkills.map(s => s.toLowerCase());
//   const optionalSkills = optionalSkillsCandidates.filter(
//     s => !requiredSkillsLower.includes(s.toLowerCase())
//   );

//   // All JD skills (required + optional, deduplicated)
//   const allSkillsSet = new Set([...requiredSkills, ...optionalSkills]);
//   const allSkills = [...allSkillsSet];

//   return {
//     jobId: jobId || generateJobId(role),
//     role,
//     aboutRole,
//     salary,
//     experienceRequired: experienceReq,
//     requiredSkills,
//     optionalSkills,
//     allSkills,
//     rawText: text
//   };
// }

// function generateJobId(role) {
//   const slug = role
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, '-')
//     .slice(0, 20);
//   return `JD-${slug}-${Date.now().toString(36).toUpperCase()}`;
// }

// /**
//  * Parse multiple JDs from a single large text (like the assignment PDF).
//  * Splits by "Sample N:" markers.
//  */
// function parseMultipleJDs(combinedText) {
//   const samplePattern = /Sample\s+\d+\s*:/gi;
//   const parts = combinedText.split(samplePattern).filter(p => p.trim().length > 100);

//   return parts.map((part, idx) => {
//     const jobId = `JD${String(idx + 1).padStart(3, '0')}`;
//     return parseJDText(part.trim(), jobId);
//   });
// }

// module.exports = { parseJDFile, parseJDBuffer, parseJDText, parseMultipleJDs };
/**
 * Job Description (JD) Parser
 * Rule-based extraction of:
 *  - Salary / compensation
 *  - Years of experience
 *  - Required skills
 *  - Optional/nice-to-have skills
 *  - Role summary
 */

const { extractSkills } = require('../extractors/skillExtractor');
const { cleanText } = require('../utils/textExtractor');

// ─── Salary Patterns ────────────────────────────────────────────────────────

const SALARY_PATTERNS = [
  // "$180,000 - $220,000" or "$180,000–$220,000"
  /\$[\d,]+(?:\.\d+)?\s*[-–—to]+\s*\$[\d,]+(?:\.\d+)?(?:\s*(?:per\s*year|\/year|\/yr|annually|per\s*annum|\/hour|\/hr|per\s*hour))?/gi,
  // "$58.65/hour to $181,000/year"
  /\$[\d,]+(?:\.\d+)?\s*(?:\/hour|\/hr|per\s*hour)\s*to\s*\$[\d,]+(?:\.\d+)?(?:\s*(?:per\s*year|\/year|\/yr|annually))?/gi,
  // "61087 - 104364" bare numbers (compensation context)
  /(?:compensation|salary|pay|ctc|base\s*pay|base\s*salary)[^\n]*?[\$₹]?\s*[\d,]+(?:\.\d+)?\s*[-–—to]+\s*[\$₹]?\s*[\d,]+(?:\.\d+)?/gi,
  // "12 LPA" / "₹10,00,000 per annum"
  /(?:salary|ctc|compensation)[^\n]*?[\d.,]+\s*(?:LPA|lpa|lac|lakh|lakhs)?(?:\s*per\s*annum)?/gi,
  // "₹10,00,000"
  /₹\s*[\d,]+(?:\.\d+)?(?:\s*per\s*annum)?/gi,
  // Standalone "$130,000 - $160,000 per year"
  /\$\s*[\d,]+(?:\.\d+)?\s*[-–—]\s*\$\s*[\d,]+(?:\.\d+)?(?:\s*(?:per\s*year|\/year|annually|\/hr|per\s*hour))?/gi,
];

// ─── Experience Patterns ─────────────────────────────────────────────────────

const EXPERIENCE_PATTERNS = [
  // "5+ years of experience", "3-5 years", "at least 4 years"
  /(\d+)\+?\s*(?:to|-|–)?\s*(\d+)?\s*(?:\+)?\s*years?\s*(?:of\s*)?(?:relevant\s*)?(?:experience|exp|work\s*experience|professional\s*experience)/gi,
  // "minimum 7 years", "at least 2 years"
  /(?:minimum|at\s*least|minimum\s*of|at\s*least)\s*(\d+)\s*years?/gi,
  // Bare "3+ years" or "5 years" without keywords
  /(?:required|required:)?\s*(\d+)\+?\s*(?:to|-|–)?\s*(\d+)?\s*(?:\+)?\s*years?\b/gi,
  // "Bachelor's with 5+ years"
  /(?:bachelor|master|phd|bs|ms|ba|ma)[^\n]*?(\d+)\+?\s*years?/gi,
  // "7-10 years of related experience"
  /(\d+)\s*[-–]\s*(\d+)\s*years?\s*(?:of\s*)?(?:related\s*)?experience/gi,
  // "fresher" / "entry-level" / "entry level"
  /\b(fresher|entry[\s-]level|0\s*years?)\b/gi,
];

// ─── Section Header Patterns ─────────────────────────────────────────────────

const REQUIRED_SECTION_PATTERNS = [
  /required\s*(?:qualifications?|skills?|experience|technologies?)[:\s]*/gi,
  /must\s*have[:\s]*/gi,
  /minimum\s*qualifications?[:\s]*/gi,
  /basic\s*qualifications?[:\s]*/gi,
  /mandatory\s*requirements?[:\s]*/gi,
];

const OPTIONAL_SECTION_PATTERNS = [
  /(?:desired|preferred|nice[\s-]to[\s-]have|optional|bonus|good\s*to\s*have|additional)[:\s]*(?:qualifications?|skills?|experience|technologies?)?[:\s]*/gi,
  /desired\s*(?:multipliers?|qualifications?|skills?)[:\s]*/gi,
  /preferred\s*(?:qualifications?|skills?|experience)[:\s]*/gi,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract the best salary string from JD text.
 * @param {string} text
 * @returns {string|null}
 */
function extractSalary(text) {
  // Priority 1: dollar range "$X - $Y"
  const dollarRange = text.match(/\$\s*[\d,]+(?:\.\d+)?\s*[-–—to]+\s*\$\s*[\d,]+(?:\.\d+)?(?:\s*(?:per\s*year|\/year|\/yr|annually|per\s*annum|\/hour|\/hr|per\s*hour))?/i);
  if (dollarRange) return dollarRange[0].replace(/\s+/g, ' ').trim();

  // Priority 2: mixed rate "$X/hour to $Y/year"
  const mixedRate = text.match(/\$[\d,]+(?:\.\d+)?\s*(?:\/hour|\/hr|per\s*hour)\s*to\s*\$[\d,]+(?:\.\d+)?(?:\s*(?:per\s*year|\/year|annually))?/i);
  if (mixedRate) return mixedRate[0].replace(/\s+/g, ' ').trim();

  // Priority 3: INR / LPA formats
  const inr = text.match(/(?:salary|ctc)\s*[:–]?\s*[\d.,]+\s*(?:LPA|lpa|lac|lakh|lakhs)?(?:\s*per\s*annum)?/i);
  if (inr) return inr[0].replace(/\s+/g, ' ').trim();
  const rupee = text.match(/₹\s*[\d,]+(?:\.\d+)?(?:\s*per\s*annum)?/);
  if (rupee) return rupee[0].replace(/\s+/g, ' ').trim();

  // Priority 4: bare numeric range in compensation context - return just the numbers
  const bareNum = text.match(/(?:compensation|salary|pay\s*range|base\s*pay)[^\n]{0,80}?([\d,]{4,})\s*[-–—]\s*([\d,]{4,})/i);
  if (bareNum) return `${bareNum[1]} - ${bareNum[2]}`;

  return null;
}

/**
 * Extract years of experience from JD text.
 * Returns a number (lowest mentioned) or null.
 * @param {string} text
 * @returns {number|null}
 */
function extractYearsOfExperience(text) {
  // Check for fresher first
  if (/\b(fresher|entry[\s-]level)\b/i.test(text)) return 0;

  const found = [];

  for (const pattern of EXPERIENCE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const nums = match.slice(1)
        .filter(Boolean)
        .map(Number)
        .filter(n => !isNaN(n) && n >= 0 && n <= 40);
      if (nums.length > 0) found.push(...nums);
    }
  }

  if (found.length === 0) return null;

  // Return the most common / minimum asked for
  found.sort((a, b) => a - b);
  return found[0];
}

/**
 * Split JD text into sections by heading keywords.
 * Returns { requiredSection, optionalSection, fullText }
 * @param {string} text
 * @returns {{ required: string, optional: string }}
 */
function splitJDSections(text) {
  const lines = text.split('\n');

  let requiredLines = [];
  let optionalLines = [];
  let inRequired = false;
  let inOptional = false;

  const isRequiredHeader = line =>
    REQUIRED_SECTION_PATTERNS.some(p => { p.lastIndex = 0; return p.test(line); });
  const isOptionalHeader = line =>
    OPTIONAL_SECTION_PATTERNS.some(p => { p.lastIndex = 0; return p.test(line); });

  // Section terminators
  const SECTION_END = /^(responsibilities|about\s*(the\s*)?role|overview|description|company|equal\s*opportunity|benefits|compensation|salary|pay\s*range|closing)/i;

  for (const line of lines) {
    const trimmed = line.trim();

    if (isRequiredHeader(trimmed)) {
      inRequired = true;
      inOptional = false;
      continue;
    }
    if (isOptionalHeader(trimmed)) {
      inOptional = true;
      inRequired = false;
      continue;
    }
    if (SECTION_END.test(trimmed) && trimmed.length < 60) {
      inRequired = false;
      inOptional = false;
    }

    if (inRequired) requiredLines.push(trimmed);
    if (inOptional) optionalLines.push(trimmed);
  }

  return {
    required: requiredLines.join('\n'),
    optional: optionalLines.join('\n'),
  };
}

/**
 * Extract a short "about role" summary from JD text.
 * Takes the first meaningful paragraph after the role title section.
 * @param {string} text
 * @returns {string}
 */
function extractAboutRole(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Try to find a description-like paragraph (3+ sentences or 100+ chars)
  const SUMMARY_START = /(?:job\s*description|position\s*overview|the\s*opportunity|about\s*(?:the\s*)?role|overview|summary|responsibilities)/i;

  let capturing = false;
  const summaryLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (SUMMARY_START.test(line) && line.length < 80) {
      capturing = true;
      continue;
    }

    if (capturing) {
      // Stop at next heading-like short line
      if (line.length < 60 && /^[A-Z]/.test(line) && !/[a-z]{4,}/.test(line.slice(1))) {
        if (summaryLines.length > 0) break;
      }
      summaryLines.push(line);
      if (summaryLines.join(' ').length > 500) break;
    }
  }

  if (summaryLines.length === 0) {
    // Fallback: first 2 long paragraphs
    const paras = lines.filter(l => l.length > 80).slice(0, 2);
    return paras.join(' ').slice(0, 400) + (paras.join(' ').length > 400 ? '...' : '');
  }

  const summary = summaryLines.join(' ').trim();
  return summary.slice(0, 500) + (summary.length > 500 ? '...' : '');
}

/**
 * Detect role/job title from JD text.
 * @param {string} text
 * @returns {string}
 */
function extractRole(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const TITLE_KW = /(?:engineer|developer|architect|analyst|manager|lead|scientist|programmer|software|full[\s-]?stack|backend|frontend|devops|sre)/i;
  const SENTENCE = /[.,!?]\s*[a-z]|\b(we|our|you|the|this|join|help|build|develop|work|is|are|will|have|has|with|for|and|but|at|by|in|of|to|a|an)\b/i;
  const BOILERPLATE_LINE = /our company|about us|who we are|choosing|changing the world|mission is|was founded|is a global|is proud|participates in|we give everyone|we are seeking|connect billions|at [A-Z][a-z]+ (Federal|Materials|Research)/i;
  const COMPANY_INTRO = /^(Riverside|Capgemini|Adobe|Astra|Lockheed|Applied Materials|Meta|Accenture|SpaceX|Bcore|FishEye|BigBear|Altamira)/i;

  // Strategy 1: Explicit label
  const labeled = text.match(/(?:position|title|job\s*title)\s*:\s*(.{5,80})/i);
  if (labeled) return labeled[1].trim().replace(/[*•]/g, '').slice(0, 80);

  // Strategy 2: ALL-CAPS heading line
  for (const line of lines.slice(0, 35)) {
    if (line === line.toUpperCase() && line.length > 8 && line.length < 100 && TITLE_KW.test(line) && !BOILERPLATE_LINE.test(line)) {
      return line.replace(/[*•\-]/g, '').trim().slice(0, 80);
    }
  }

  // Strategy 3: "<Company> is seeking a <Role>" pattern
  const seekingFull = text.match(/([A-Z][A-Za-z\s.]+?)\s+(?:is\s+)?seeking\s+(?:a|an)?\s*([A-Z][A-Za-z\s\/\-]{5,60}?)(?:\s+to\b|\s+who\b|\s+across\b|\.|\n)/i);
  if (seekingFull && seekingFull[2] && TITLE_KW.test(seekingFull[2])) return seekingFull[2].trim();

  // Strategy 4: "This position is for a <Role>" pattern
  const positionFor = text.match(/(?:this\s+)?position\s+is\s+(?:for\s+)?(?:a|an)?\s*([A-Z][A-Za-z\s\/\-]{5,60}?)(?:\s+on\b|\s+who\b|\s+supporting\b|\.|\n)/i);
  if (positionFor && positionFor[1] && TITLE_KW.test(positionFor[1])) return positionFor[1].trim().slice(0, 80);

  // Strategy 5: Non-sentence title lines
  for (const line of lines) {
    if (COMPANY_INTRO.test(line) || BOILERPLATE_LINE.test(line)) continue;
    if (!TITLE_KW.test(line)) continue;
    if (line.length < 5 || line.length > 80) continue;
    if (SENTENCE.test(line)) continue;
    if (line.startsWith('-') || line.startsWith('•')) continue;
    return line.replace(/[*•\-–]/g, '').trim();
  }

  return 'Software Engineer';
}

// ─── Main Parser ─────────────────────────────────────────────────────────────

/**
 * Parse a Job Description text and return structured data.
 * @param {string} rawText - Raw JD text
 * @param {string} jobId - Optional identifier for this JD
 * @returns {object} Structured JD data
 */
function parseJDText(rawText, jobId = null) {
  const text = cleanText(rawText);

  const salary = extractSalary(text);
  const experienceRequired = { min: extractYearsOfExperience(text) };
  const role = extractRole(text);
  const aboutRole = extractAboutRole(text);

  const sections = splitJDSections(text);

  // Extract skills from required section, optional section, and full text
  const requiredSkills = sections.required
    ? extractSkills(sections.required)
    : extractSkills(text);

  const optionalSkills = sections.optional
    ? extractSkills(sections.optional).filter(s => !requiredSkills.includes(s))
    : [];

  // If no section breakdown found, all skills from full text are "required"
  const allSkills = sections.required
    ? [...new Set([...requiredSkills, ...optionalSkills])]
    : extractSkills(text);

  return {
    jobId: jobId || generateJobId(role),
    role,
    salary,
    experienceRequired,
    aboutRole,
    requiredSkills,
    optionalSkills,
    allSkills,
    rawText: text
  };
}

/**
 * Parse a JD from file path.
 * @param {string} filePath - Absolute path to JD file
 * @param {string} jobId - Optional job ID
 * @returns {Promise<object>} Structured JD data
 */
async function parseJDFile(filePath, jobId = null) {
  const { extractTextFromFile } = require('../utils/textExtractor');
  const rawText = await extractTextFromFile(filePath);
  return parseJDText(rawText, jobId);
}

/**
 * Parse a JD from buffer.
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {string} jobId - Optional job ID
 * @returns {Promise<object>}
 */
async function parseJDBuffer(buffer, mimetype, jobId = null) {
  const { extractTextFromBuffer } = require('../utils/textExtractor');
  const rawText = await extractTextFromBuffer(buffer, mimetype);
  return parseJDText(rawText, jobId);
}

/**
 * Parse multiple JDs from a single large text (like the assignment PDF).
 * Splits by "Sample N:" markers.
 */
function parseMultipleJDs(combinedText) {
  const samplePattern = /Sample\s+\d+\s*:/gi;
  const parts = combinedText.split(samplePattern).filter(p => p.trim().length > 100);

  return parts.map((part, idx) => {
    const jobId = `JD${String(idx + 1).padStart(3, '0')}`;
    return parseJDText(part.trim(), jobId);
  });
}

/**
 * Generate a unique job ID from job title
 * @param {string} role
 * @returns {string}
 */
function generateJobId(role) {
  const slug = role
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 20);
  return `JD-${slug}-${Date.now().toString(36).toUpperCase()}`;
}

module.exports = { parseJDFile, parseJDBuffer, parseJDText, parseMultipleJDs, extractSalary, extractYearsOfExperience, extractRole };
