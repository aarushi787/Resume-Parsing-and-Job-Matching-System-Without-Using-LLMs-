# Resume Parsing & Job Matching System

A **rule-based** system for parsing resumes and matching them against Job Descriptions (JDs).  
**No LLMs or AI APIs are used** — extraction is done entirely with regex, pattern matching, and heuristic NLP.

---

## Architecture

```
src/
├── config/
│   └── skills.js          # Comprehensive tech skills dictionary (~300+ skills)
├── extractors/
│   ├── nameExtractor.js   # Rule-based name detection
│   ├── salaryExtractor.js # Regex-based salary parsing (USD, LPA, ₹)
│   ├── experienceExtractor.js  # Years of experience + date range calculation
│   └── skillExtractor.js  # Longest-match greedy skill extraction
├── parsers/
│   ├── resumeParser.js    # Orchestrates resume extraction
│   └── jdParser.js        # Orchestrates JD extraction + section splitting
├── matchers/
│   └── jobMatcher.js      # Skill mapping + score calculation
├── utils/
│   └── textExtractor.js   # PDF / TXT text extraction (pdf-parse)
├── api/
│   └── routes.js          # Express REST API endpoints
├── index.js               # Server entry point
└── demo.js                # CLI demo
```

---

## Features

- Rule-based extraction of **name**, **contact**, **experience**, **salary** and **skills** from resumes
- Parsing of JD files for **required/optional skills**, **experience ranges**, **salary** and **role summary**
- Skill matching with **comprehensive 300+ skill dictionary** and **exact boundary matching**
- Matching score calculation (0‑100%) and detailed skill-by-skill analysis
- REST API for file or text input, bulk JD parsing, and match requests
- CLI demo with 16 real-world sample JDs included
- Fully unit‑tested (25 passing tests) and Docker‑ready

## Quick Start

### Option 1: Node.js directly

```bash
npm install
npm run demo          # Run demo on sample data (outputs top 10 of 16 jobs)
npm start             # Start API server on port 3000
npm test              # Run test suite (all passing)
```

### Option 2: Docker

```bash
docker build -t resume-matcher .
docker run -p 3000:3000 resume-matcher
# or
docker-compose up
```

The demo script now iterates over **all 16 sample JDs** included under `sample-data/jds/` and prints a ranked summary of the top matches as well as statistical insights about the run.


---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/parse-resume` | Parse a resume (file or text) |
| `POST` | `/api/parse-jd` | Parse a single JD |
| `POST` | `/api/match` | Match resume against JD files |
| `POST` | `/api/match-text` | Match resume & JDs from JSON body |
| `POST` | `/api/parse-jds-bulk` | Parse multiple JDs from combined text |

---

## Example API Usage

### Parse a Resume (file upload)
```bash
curl -X POST http://localhost:3000/api/parse-resume \
  -F "resume=@my_resume.pdf"
```

### Match via JSON body (easiest for testing)
```bash
curl -X POST http://localhost:3000/api/match-text \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "John Doe\njohn@example.com\nSkills: Java, Spring Boot, Docker, Kubernetes, MySQL",
    "jds": [
      {
        "jobId": "JD001",
        "text": "Backend Developer\nSalary: 12 LPA\nRequired: Java, Spring Boot, MySQL, Kafka, Docker"
      }
    ]
  }'
```

### Expected Output
```json
{
  "name": "John Doe",
  "salary": null,
  "yearOfExperience": null,
  "resumeSkills": ["Docker", "Java", "Kubernetes", "MySQL", "Spring Boot"],
  "matchingJobs": [
    {
      "jobId": "JD001",
      "role": "Backend Developer",
      "aboutRole": "Backend Developer Salary: 12 LPA...",
      "salary": "12 LPA",
      "matchingScore": 80,
      "matchedSkillsCount": 4,
      "totalJDSkills": 5,
      "skillsAnalysis": [
        { "skill": "Java", "presentInResume": true },
        { "skill": "Spring Boot", "presentInResume": true },
        { "skill": "MySQL", "presentInResume": true },
        { "skill": "Kafka", "presentInResume": false },
        { "skill": "Docker", "presentInResume": true }
      ]
    }
  ]
}
```

---

## Extraction Methods (Rule-Based Only)

### Salary
- Regex patterns for: `$X - $Y per year`, `X LPA`, `₹X per annum`, `CTC: X`, etc.

### Years of Experience
- Explicit: `"5+ years"`, `"3-7 years of experience"`
- Date ranges: Sums durations from `"Jan 2020 – Present"` style entries
- Entry-level: Detects `"Fresher"`, `"Entry-Level"`, `"0 years"`

### Skills
- Greedy longest-match against a 300+ skill dictionary
- Organized by category: languages, frontend, backend, databases, cloud, DevOps, ML/AI, etc.
- Aliases for common variants (e.g., `nodejs` → `Node.js`, `k8s` → `Kubernetes`)

### Name
- Label-based: `"Name: John Doe"`
- Email prefix: `john.doe@email.com` → `John Doe`
- Heuristic: First title-cased 2-4 word line in the document

### JD Parsing
- Splits required vs. optional/desired sections using header detection
- Extracts role, about role, salary, experience requirements, required skills, optional skills

---

## Matching Score Formula

```
Matching Score = (Matched JD Skills / Total JD Skills) × 100
```
- Score range: **0 – 100**
- Considers both required + optional skills for the overall score
- Required-only score available separately in `requiredSkillsMatched`

---

## Allowed Libraries

| Library | Purpose |
|---------|---------|
| `pdf-parse` | Extract text from PDF resumes/JDs |
| `express` | REST API server |
| `multer` | File upload handling |
| `cors` | Cross-origin requests |
| `natural` | Available for future tokenization extensions |
| `compromise` | Available for future NLP extensions |

---

## Running Tests

```bash
npm test
```
Runs 25 test cases covering:
- Salary extraction (USD, LPA, ranges)
- Experience extraction (explicit, date ranges, fresher)
- Name extraction (labels, email hints, heuristics)
- Skill extraction (greedy match, no false positives)
- Skill mapping and score calculation
- Full end-to-end pipeline integration

---

## Project Structure

```
resume-matcher/
├── src/                    # Source code
├── sample-data/
│   ├── resumes/            # Sample resume files
│   └── jds/                # Sample job description files
├── tests/
│   └── test.js             # Test suite (25 tests)
├── sample-output.json      # Generated sample output
├── Dockerfile
├── docker-compose.yml
└── README.md
```
