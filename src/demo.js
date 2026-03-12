'use strict';

/**
 * Demo script: runs the full pipeline on sample data and prints results.
 * Usage: node src/demo.js
 */

const path = require('path');
const fs = require('fs');
const { parseResumeFile } = require('./parsers/resumeParser');
const { parseJDFile, parseMultipleJDs } = require('./parsers/jdParser');
const { matchResumeToJobs } = require('./matchers/jobMatcher');
const { cleanText } = require('./utils/textExtractor');

const SAMPLE_RESUME = path.join(__dirname, '../sample-data/resumes/sample_resume.txt');
const JDS_DIR = path.join(__dirname, '../sample-data/jds');

async function runDemo() {
  console.log('='.repeat(70));
  console.log('  Resume Parsing & Job Matching System — Demo');
  console.log('  (Rule-based | No LLMs)');
  console.log('='.repeat(70));

  // ── Step 1: Parse Resume ──────────────────────────────────────────────
  console.log('\n📄 Parsing Resume...');
  const resume = await parseResumeFile(SAMPLE_RESUME);
  const { rawText: _r, ...resumeDisplay } = resume;
  console.log('\nExtracted Resume Data:');
  console.log(JSON.stringify(resumeDisplay, null, 2));

  // ── Step 2: Parse ALL JDs from sample-data/jds ────────────────────────
  console.log('\n\n📋 Parsing ALL Job Descriptions...');
  const jdFiles = fs.readdirSync(JDS_DIR).filter(f => f.endsWith('.txt')).sort();
  const jdList = [];
  
  for (let i = 0; i < jdFiles.length; i++) {
    const filePath = path.join(JDS_DIR, jdFiles[i]);
    const jobId = `JD${String(i + 1).padStart(3, '0')}`;
    const jd = await parseJDFile(filePath, jobId);
    jdList.push(jd);
    
    const { rawText: _t, ...jdDisplay } = jd;
    console.log(`\n[${jobId}] ${jd.role}`);
    console.log(`  📁 File:     ${jdFiles[i]}`);
    console.log(`  💼 Salary:   ${jd.salary || 'Not specified'}`);
    console.log(`  📅 Exp Req:  ${jd.experienceRequired.min ? jd.experienceRequired.min + '+' : 'Not specified'} years`);
    console.log(`  🔧 Skills:   ${jd.allSkills.length} total`);
  }

  // ── Step 3: Match ─────────────────────────────────────────────────────
  console.log('\n\n🔍 Matching Resume to All Jobs...');
  const result = matchResumeToJobs(resume, jdList);

  // ── Step 4: Display Results ───────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log('  TOP 5 MATCHING JOBS (Ranked by Score)');
  console.log('='.repeat(70));

  const topJobs = result.matchingJobs.slice(0, 5);
  for (let i = 0; i < topJobs.length; i++) {
    const job = topJobs[i];
    const bar = '█'.repeat(Math.round(job.matchingScore / 5)) + '░'.repeat(20 - Math.round(job.matchingScore / 5));
    console.log(`\n  ${i + 1}. [${job.jobId}] ${job.role}`);
    console.log(`     Score: [${bar}] ${job.matchingScore}%`);
    console.log(`     Skills: ${job.matchedSkillsCount}/${job.totalJDSkills} matched`);
    console.log(`     Salary: ${job.salary || 'Not specified'}`);
    console.log(`     Experience: ${job.experienceMatch.status.toUpperCase()} (${job.experienceMatch.message})`);
  }

  // Save full output
  console.log('\n' + '='.repeat(70));
  console.log('  SAVING FULL OUTPUT JSON');
  console.log('='.repeat(70));

  // Build clean output (matching assignment format)
  const output = {
    name: result.name,
    email: result.email,
    salary: result.salary,
    yearOfExperience: result.yearOfExperience,
    resumeSkills: result.resumeSkills,
    totalJDsProcessed: result.matchingJobs.length,
    matchingJobs: result.matchingJobs.map(j => ({
      jobId: j.jobId,
      role: j.role,
      aboutRole: j.aboutRole.substring(0, 200) + (j.aboutRole.length > 200 ? '...' : ''),
      salary: j.salary,
      matchingScore: j.matchingScore,
      matchedSkillsCount: j.matchedSkillsCount,
      totalJDSkills: j.totalJDSkills,
      experienceMatch: j.experienceMatch,
      skillsAnalysis: j.skillsAnalysis
    }))
  };

  console.log('\n📊 Summary Statistics:');
  console.log(`   Total JDs Processed: ${output.totalJDsProcessed}`);
  console.log(`   Candidate Skills: ${output.resumeSkills.length}`);
  console.log(`   Candidate Experience: ${output.yearOfExperience} years`);
  console.log(`   Average Match Score: ${(result.matchingJobs.reduce((sum, j) => sum + j.matchingScore, 0) / result.matchingJobs.length).toFixed(1)}%`);
  console.log(`   Best Match: ${result.matchingJobs[0].jobId} (${result.matchingJobs[0].matchingScore}%)`);
  console.log(`   Jobs Meeting Experience: ${result.matchingJobs.filter(j => j.experienceMatch.status === 'meets' || j.experienceMatch.status === 'exceeds').length}/${output.totalJDsProcessed}`);

  // Save full output (first 10 jobs to keep file manageable)
  const topTenOutput = {
    ...output,
    matchingJobs: output.matchingJobs.slice(0, 10)
  };

  const outputPath = path.join(__dirname, '../sample-output.json');
  fs.writeFileSync(outputPath, JSON.stringify(topTenOutput, null, 2));
  console.log(`\n✅ Output saved to: ${outputPath}`);
  console.log(`   Showing top 10 of ${output.totalJDsProcessed} jobs`);

  // ── Step 5: Final Summary ──────────────────────────────────────────────
  console.log('\n\n' + '='.repeat(70));
  console.log('  ALL JOBS RANKED BY MATCHING SCORE');
  console.log('='.repeat(70));
  console.log('\n  Rank │ ID      │ Score │ Skills │ Experience │ Role');
  console.log('  ─────┼─────────┼───────┼────────┼─────────────┼─────────────────────────');
  
  for (let i = 0; i < Math.min(result.matchingJobs.length, 16); i++) {
    const job = result.matchingJobs[i];
    const expStatus = job.experienceMatch.status === 'meets' || job.experienceMatch.status === 'exceeds' ? '✅' : '❌';
    const roleShort = job.role.substring(0, 25).padEnd(25);
    console.log(`  ${String(i + 1).padStart(4)} │ ${job.jobId} │ ${String(job.matchingScore).padStart(5)}% │ ${String(job.matchedSkillsCount + '/' + job.totalJDSkills).padEnd(6)} │ ${expStatus}        │ ${roleShort}`);
  }
  
  console.log('\n');
}

runDemo().catch(err => {
  console.error('Demo failed:', err);
  process.exit(1);
});
