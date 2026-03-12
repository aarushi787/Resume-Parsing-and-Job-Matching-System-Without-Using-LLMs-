'use strict';

const { ALL_SKILLS, normalizeSkill } = require('../config/skills');

// Skills that need stricter boundaries (to avoid "C" matching "CI/CD", "go" matching "good", etc.)
const STRICT_BOUNDARY_SKILLS = new Set(['c', 'go', 'r', 'c#', 'c++']);

/**
 * Extract skills from raw text using rule-based matching.
 * Uses longest-match-first greedy strategy.
 */
function extractSkills(text) {
  if (!text || typeof text !== 'string') return [];

  const lowerText = ' ' + text.toLowerCase() + ' ';
  const foundSkills = new Set();
  let maskedText = lowerText;

  for (const skill of ALL_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let pattern;
    if (STRICT_BOUNDARY_SKILLS.has(skill)) {
      // Strict word boundaries for single-letter or common-word skills
      pattern = new RegExp('(?<![a-zA-Z0-9+#])' + escaped + '(?![a-zA-Z0-9+#])', 'gi');
    } else {
      pattern = new RegExp('(?<![a-zA-Z0-9])' + escaped + '(?![a-zA-Z0-9])', 'gi');
    }

    if (pattern.test(maskedText)) {
      const normalized = normalizeSkill(skill);
      // Don't add clearly non-skill common words unless they are in the skills list deliberately
      if (!isNonSkillFalsePositive(skill, maskedText)) {
        foundSkills.add(normalized);
        maskedText = maskedText.replace(pattern, (m) => '~'.repeat(m.length));
      }
    }
  }

  return [...foundSkills].sort();
}

/**
 * Filter out false positives: words that appear in our list but are generic in context.
 */
function isNonSkillFalsePositive(skill, text) {
  const lowerSkill = skill.toLowerCase();
  // "teams" = Microsoft Teams but also generic word
  if (lowerSkill === 'teams') {
    return !/(microsoft\s+teams|ms\s+teams)/.test(text);
  }
  // "rest" is a skill but very generic; only count if REST API also not already present
  // We allow it through — REST API is important
  return false;
}

/**
 * Check whether a specific skill exists in text.
 */
function hasSkill(text, skill) {
  if (!text || !skill) return false;
  const lowerText = ' ' + text.toLowerCase() + ' ';
  const lowerSkill = skill.toLowerCase().trim();
  const escaped = lowerSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let pattern;
  if (STRICT_BOUNDARY_SKILLS.has(lowerSkill)) {
    pattern = new RegExp('(?<![a-zA-Z0-9+#])' + escaped + '(?![a-zA-Z0-9+#])', 'i');
  } else {
    pattern = new RegExp('(?<![a-zA-Z0-9])' + escaped + '(?![a-zA-Z0-9])', 'i');
  }
  return pattern.test(lowerText);
}

/**
 * Map JD skills against resume text and extracted skills.
 */
function mapSkills(jdSkills, resumeText, resumeSkills) {
  const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());
  return jdSkills.map(skill => {
    const skillLower = skill.toLowerCase().trim();
    const inList = resumeSkillsLower.some(rs =>
      rs === skillLower || rs.includes(skillLower) || skillLower.includes(rs)
    );
    const inText = inList || hasSkill(resumeText, skillLower);
    return { skill, presentInResume: inText };
  });
}

/**
 * Calculate matching score (0-100).
 */
function calculateMatchingScore(skillsAnalysis) {
  if (!skillsAnalysis || skillsAnalysis.length === 0) return 0;
  const matched = skillsAnalysis.filter(s => s.presentInResume).length;
  return Math.round((matched / skillsAnalysis.length) * 1000) / 10;
}

module.exports = { extractSkills, hasSkill, mapSkills, calculateMatchingScore };
