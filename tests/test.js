'use strict';
const { extractSkills, mapSkills, calculateMatchingScore } = require('../src/extractors/skillExtractor');
const { extractSalary } = require('../src/extractors/salaryExtractor');
const { extractExperience, extractJDExperienceRequirement } = require('../src/extractors/experienceExtractor');
const { extractName } = require('../src/extractors/nameExtractor');
const { parseResumeText } = require('../src/parsers/resumeParser');
const { parseJDText } = require('../src/parsers/jdParser');
const { matchResumeToJobs } = require('../src/matchers/jobMatcher');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); passed++; }
  catch(err) { console.log(`  ❌ ${name}: ${err.message}`); failed++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertIn(arr, item) {
  const lower = arr.map(s => s.toLowerCase());
  if (!lower.includes(item.toLowerCase())) throw new Error(`"${item}" not in [${arr.join(', ')}]`);
}

console.log('\n📋 Salary Tests:');
test('USD range', () => { const r = extractSalary('$180,000 - $220,000 per year'); assert(r && r.includes('180'), r); });
test('LPA format', () => { const r = extractSalary('CTC: 12 LPA'); assert(r && r.includes('12'), r); });
test('Base comp range', () => { const r = extractSalary('base compensation range: 61087 - 104364'); assert(r && r.includes('61'), r); });
test('Pay range', () => { const r = extractSalary('Pay Range: $120,000.00 - $145,000.00/per year'); assert(r && r.includes('120'), r); });
test('LPA range', () => { const r = extractSalary('Salary: 10-15 LPA'); assert(r && r.includes('10'), r); });

console.log('\n🗓️  Experience Tests:');
test('Explicit years', () => { assert(extractExperience('5 years of experience') === 5); });
test('5+ pattern', () => { assert(extractExperience('5+ years of experience') === 5); });
test('Range midpoint', () => { const r = extractExperience('5-7 years of experience'); assert(r >= 5 && r <= 7, r); });
test('Fresher', () => { const r = extractExperience('This is a Fresher position'); assert(typeof r === 'string' && r.toLowerCase().includes('fresher'), r); });
test('Date ranges', () => { const r = extractExperience('Jan 2019 - Dec 2020\nFeb 2021 - Present'); assert(typeof r === 'number' && r > 3, r); });
test('JD min exp', () => { const r = extractJDExperienceRequirement('Requires 3+ years of experience'); assert(r.min === 3, JSON.stringify(r)); });

console.log('\n👤 Name Tests:');
test('Name first line', () => { const r = extractName('John Doe\nDeveloper\njohn@email.com'); assert(r && r.includes('John'), r); });
test('Name with label', () => { const r = extractName('Name: Jane Smith\nDeveloper'); assert(r === 'Jane Smith', r); });

console.log('\n🔧 Skill Tests:');
test('Java and Python', () => { const s = extractSkills('Expert in Java and Python'); assertIn(s, 'Java'); assertIn(s, 'Python'); });
test('Spring Boot', () => { assertIn(extractSkills('Built with Spring Boot'), 'Spring Boot'); });
test('Docker and Kubernetes', () => { const s = extractSkills('Docker and Kubernetes'); assertIn(s, 'Docker'); assertIn(s, 'Kubernetes'); });
test('No Java from JavaScript', () => { const s = extractSkills('JavaScript developer'); assert(!s.some(x => x.toLowerCase() === 'java'), `Got: ${s}`); });
test('CI/CD extracted', () => { assertIn(extractSkills('CI/CD pipelines with Jenkins'), 'CI/CD'); });
test('Kafka', () => { assertIn(extractSkills('Kafka event streaming'), 'Kafka'); });

console.log('\n🔍 Mapping & Score Tests:');
test('Maps present/absent', () => {
  const r = mapSkills(['Java', 'Rust'], 'Expert Java developer', ['Java']);
  assert(r.find(x => x.skill === 'Java').presentInResume === true);
  assert(r.find(x => x.skill === 'Rust').presentInResume === false);
});
test('50% score', () => { assert(calculateMatchingScore([{skill:'Java',presentInResume:true},{skill:'Rust',presentInResume:false}]) === 50); });
test('100% score', () => { assert(calculateMatchingScore([{skill:'Java',presentInResume:true}]) === 100); });
test('0% score', () => { assert(calculateMatchingScore([{skill:'Rust',presentInResume:false}]) === 0); });

console.log('\n🔗 Integration Tests:');
test('Full pipeline', () => {
  const resume = parseResumeText('Jane Smith\njane@test.com\nSKILLS: Python, Django, PostgreSQL, Docker, AWS, REST API');
  const jd = parseJDText('Backend Engineer\nSalary: $120,000 - $140,000/year\nRequired: 3+ years\nSkills: Python, Django, Kafka\nNice to have: Docker, AWS', 'TEST-001');
  assert(jd.salary !== null, `salary: ${jd.salary}`);
  assert(jd.experienceRequired.min === 3, `exp: ${jd.experienceRequired.min}`);
  const result = matchResumeToJobs(resume, [jd]);
  assert(result.matchingJobs[0].matchingScore > 0);
  const pySkill = result.matchingJobs[0].skillsAnalysis.find(s => s.skill.toLowerCase() === 'python');
  assert(pySkill && pySkill.presentInResume, 'Python should match');
});
test('Score always 0-100', () => {
  const result = matchResumeToJobs(parseResumeText('John\nSkills: Java'), [parseJDText('Rust, Erlang, Haskell', 'X')]);
  const s = result.matchingJobs[0].matchingScore;
  assert(s >= 0 && s <= 100, `Score: ${s}`);
});

console.log('\n' + '='.repeat(50));
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed > 0) { console.log(''); process.exit(1); }
else console.log('  All tests passed! ✅\n');
