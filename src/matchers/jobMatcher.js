'use strict';

const { mapSkills, calculateMatchingScore } = require('../extractors/skillExtractor');

/**
 * Match a parsed resume against one or more parsed JDs.
 * Produces the final output JSON as specified in the assignment.
 *
 * @param {ResumeData} resume - Parsed resume object
 * @param {JDData[]} jdList - Array of parsed JD objects
 * @returns {MatchResult}
 */
function matchResumeToJobs(resume, jdList) {
  const matchingJobs = jdList.map(jd => matchSingleJob(resume, jd));

  // Sort by matching score descending
  matchingJobs.sort((a, b) => b.matchingScore - a.matchingScore);

  return {
    name: resume.name || 'Unknown',
    email: resume.email || null,
    phone: resume.phone || null,
    location: resume.location || null,
    education: resume.education || null,
    salary: resume.salary || null,
    yearOfExperience: resume.yearOfExperience || null,
    resumeSkills: resume.resumeSkills || [],
    matchingJobs
  };
}

/**
 * Match resume against a single JD.
 */
function matchSingleJob(resume, jd) {
  // Use all JD skills for matching
  const jdSkills = jd.allSkills && jd.allSkills.length > 0
    ? jd.allSkills
    : [...(jd.requiredSkills || []), ...(jd.optionalSkills || [])];

  // Deduplicate
  const uniqueJdSkills = [...new Set(jdSkills)];

  // Map skills
  const skillsAnalysis = mapSkills(
    uniqueJdSkills,
    resume.rawText || '',
    resume.resumeSkills || []
  );

  const matchingScore = calculateMatchingScore(skillsAnalysis);

  // Determine if candidate meets experience requirement
  const expAnalysis = analyzeExperience(resume.yearOfExperience, jd.experienceRequired);

  return {
    jobId: jd.jobId,
    role: jd.role,
    company: jd.company || null,
    aboutRole: jd.aboutRole,
    salary: jd.salary || null,
    experienceRequired: jd.experienceRequired || null,
    experienceMatch: expAnalysis,
    skillsAnalysis,
    matchingScore,
    matchedSkillsCount: skillsAnalysis.filter(s => s.presentInResume).length,
    totalJDSkills: skillsAnalysis.length,
    requiredSkillsMatched: analyzeRequiredSkills(resume, jd)
  };
}

/**
 * Analyze required skills specifically.
 */
function analyzeRequiredSkills(resume, jd) {
  if (!jd.requiredSkills || jd.requiredSkills.length === 0) return null;

  const analysis = mapSkills(jd.requiredSkills, resume.rawText || '', resume.resumeSkills || []);
  const matched = analysis.filter(s => s.presentInResume).length;
  return {
    matched,
    total: jd.requiredSkills.length,
    score: Math.round((matched / jd.requiredSkills.length) * 1000) / 10
  };
}

/**
 * Check if candidate meets experience requirements.
 */
function analyzeExperience(candidateExp, jdExpReq) {
  if (candidateExp === null || !jdExpReq || jdExpReq.min === null) {
    return { status: 'unknown', message: 'Could not determine experience match' };
  }

  const candidateYears = typeof candidateExp === 'string'
    ? (candidateExp.toLowerCase().includes('fresher') ? 0 : null)
    : candidateExp;

  if (candidateYears === null) {
    return { status: 'unknown', message: 'Could not parse candidate experience' };
  }

  const required = jdExpReq.min;
  const diff = candidateYears - required;

  if (diff >= 0) {
    return {
      status: 'meets',
      message: `Candidate has ${candidateYears} years; JD requires ${required}+ years`,
      candidateYears,
      requiredMin: required
    };
  } else {
    return {
      status: 'below',
      message: `Candidate has ${candidateYears} years; JD requires ${required}+ years (gap: ${Math.abs(diff).toFixed(1)} years)`,
      candidateYears,
      requiredMin: required
    };
  }
}

module.exports = { matchResumeToJobs, matchSingleJob };
