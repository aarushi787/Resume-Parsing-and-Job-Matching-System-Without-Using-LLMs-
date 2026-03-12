# Resume Parsing & Job Matching System

> **SD Intern Assignment — Hidani Tech**
> Rule-based resume parsing and job matching system built with **Node.js**.
> ⚠️ No LLMs, no AI APIs, no generative models — pure regex, pattern matching, and heuristic NLP.

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Features](#features)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Extraction Methods](#extraction-methods)
- [Matching Score Formula](#matching-score-formula)
- [Sample Output](#sample-output)
- [Tech Stack](#tech-stack)
- [Docker](#docker)
- [Evaluation Criteria Coverage](#evaluation-criteria-coverage)

---

## Overview

This system takes a **resume** (PDF, DOCX, or plain text) and one or more **Job Descriptions**, and produces a structured JSON output showing:

- Extracted candidate profile (name, contact, experience, skills)
- Parsed JD data (role, salary, required skills, optional skills, summary)
- Per-JD skill mapping — which skills match and which are missing
- A **matching score (0–100%)** for each JD, ranked by best fit

Tested against **15 real-world JDs** from companies including SpaceX, Meta, Adobe, Capgemini, Lockheed Martin, Astra, BigBear.ai, Applied Materials, and more.

---

## Project Structure

```
resume-matcher/
├── src/
│   ├── parsers/
│   │   ├── resumeParser.js       # Orchestrates all resume extraction
│   │   └── jdParser.js           # JD extraction + required/optional section split
│   ├── matchers/
│   │   └── resumeMatcher.js      # Skill mapping + score calculation
│   └── utils/
│       ├── skillsDictionary.js   # 200+ skills, 15 categories, 100+ aliases
│       ├── skillExtractor.js     # Regex + unigram/bigram/trigram matching
│       └── textExtractor.js      # PDF (pdf-parse) / DOCX (mammoth) / TXT
├── data/
│   ├── resumes/
│   │   └── sample_resume.txt     # Sample candidate resume
│   └── jds/                      # 15 real-world sample JD files
│       ├── jd001_riverside.txt
│       ├── jd002_capgemini.txt
│       ├── jd003_adobe.txt
│       ├── jd004_astra.txt
│       ├── jd005_lockheed.txt
│       ├── jd006_applied_materials.txt
│       ├── jd007_meta.txt
│       ├── jd008_accenture.txt
│       ├── jd009_spacex.txt
│       ├── jd010_bcore.txt
│       ├── jd011_fisheye.txt
│       ├── jd012_lockheed_fullstack.txt
│       ├── jd013_bigbear.txt
│       ├── jd014_altamira.txt
│       └── jd015_software_engineer.txt
├── output/
│   └── result.json               # Generated sample output (all 15 JDs)
├── index.js                      # CLI entry point
├── server.js                     # Express REST API server
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Features

| Feature | Details |
|---------|---------|
| **Resume Parsing** | Name, email, phone, years of experience, skills, education |
| **JD Parsing** | Role, salary, required/optional skills, about-role summary, required experience |
| **Skill Extraction** | 200+ skills across 15 categories with 100+ aliases (e.g. `k8s → Kubernetes`, `node → Node.js`) |
| **Experience Extraction** | Explicit statements (`5+ years`) or summed date ranges (`Jan 2020 – Present`) |
| **Salary Extraction** | Handles `$X – $Y/year`, `X LPA`, `₹X per annum`, bare numeric ranges in compensation context |
| **Skill Mapping** | Every JD skill flagged as `presentInResume: true/false` |
| **Matching Score** | `(matched / total) × 100`, results sorted by score descending |
| **REST API** | File upload (PDF/DOCX/TXT) + raw text input, supports bulk JD matching |
| **CLI Demo** | `node index.js --demo` runs all 15 JDs and prints ranked results with progress bar |
| **Docker** | `Dockerfile` + `docker-compose.yml` included |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
# 1. Clone the repository
git clone https://github.com/aarushi787/Resume-Parsing-and-Job-Matching-System-Without-Using-LLMs-
cd Resume-Parsing-and-Job-Matching-System-Without-Using-LLMs-

# 2. Install dependencies
npm install

# 3. Run the CLI demo (parses sample resume against all 15 JDs)
node index.js --demo

# 4. Start the API server
node server.js
# → API running at http://localhost:3000
```

---

## API Reference

### `GET /api/health`

Returns server status.

```json
{ "status": "ok", "service": "Resume Matcher API", "timestamp": "2026-03-12T10:00:00.000Z" }
```

---

### `POST /api/match`

Match a resume against one or more JDs. Accepts **multipart form-data** (file upload) or **JSON body** (raw text).

#### Option A — File Upload

```bash
curl -X POST http://localhost:3000/api/match \
  -F "resume=@resume.pdf" \
  -F "jd=@jd1.txt" \
  -F "jd=@jd2.pdf"
```

#### Option B — Raw Text (JSON body)

```bash
curl -X POST http://localhost:3000/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "John Doe\njohn@email.com\n5 years experience\nSkills: Java, Spring Boot, Docker, Kubernetes, MySQL",
    "jdTexts": ["Backend Developer\nSalary: 12 LPA\nRequired: Java, Spring Boot, MySQL, Kafka, Docker"],
    "jdIds": ["JD001"]
  }'
```

---

### `POST /api/parse/resume`

Parse a resume only (no JD matching).

```bash
curl -X POST http://localhost:3000/api/parse/resume \
  -F "resume=@resume.pdf"
```

---

### `POST /api/parse/jd`

Parse a single JD only.

```bash
curl -X POST http://localhost:3000/api/parse/jd \
  -H "Content-Type: application/json" \
  -d '{"text": "Software Engineer\n7+ years Java, Spring Boot...", "jobId": "JD001"}'
```

---

## Extraction Methods

### Name
1. Label match: `Name: John Doe`
2. Heuristic: First line with 2–5 title-cased words, no email/URL/digits
3. Fallback: Email prefix (`john.doe@email.com → John Doe`)

### Salary
Multi-pattern regex covering all common formats:

| Format | Example |
|--------|---------|
| USD range | `$180,000 – $220,000 per year` |
| Hourly to annual | `$58.65/hour to $181,000/year` |
| Bare numeric range | `61,087 – 104,364` (near "compensation" keyword) |
| Indian format | `12 LPA`, `CTC: ₹10,00,000 per annum` |

### Years of Experience
1. **Explicit**: `"5+ years of experience"`, `"3–7 years"`, `"minimum 4 years"`
2. **Date ranges**: Sums all `Month Year – Month Year / Present` ranges found in work history
3. **Entry-level**: Detects `"Fresher"`, `"Entry-Level"`, `"0 years"` → returns `0`

### Skills
- Curated dictionary of **200+ skills** across 15 categories:
  - Languages, Frontend, Backend, Databases, Cloud, DevOps, Messaging, ML/AI, Testing, Version Control, Systems, Architecture, Mobile, Security, Methodologies
- **100+ aliases** normalised to canonical names at match time
- **Multi-strategy matching**:
  1. Regex word-boundary scan over all known skills (longest first)
  2. Single-token alias lookup
  3. Bigram (2-word) alias lookup
  4. Trigram (3-word) alias lookup
- Longer skills matched first to avoid partial false matches (e.g. `Spring Boot` before `Spring`)

### JD Section Splitting
Header-detection heuristic splits required vs. optional skills:

| Section Type | Detected Headers |
|-------------|-----------------|
| Required | `Required Qualifications`, `Must Have`, `Minimum Qualifications`, `Basic Qualifications` |
| Optional | `Desired`, `Preferred`, `Nice to Have`, `Good to Have`, `Bonus`, `Desired Multipliers` |

---

## Matching Score Formula

```
Matching Score = (Matched JD Skills / Total JD Skills) × 100
```

- Range: **0 – 100**
- Both required and optional JD skills are counted in the total
- Results sorted by score descending
- Each skill individually mapped: `{ "skill": "Kafka", "presentInResume": false }`

---

## Sample Output

Full output: [`output/result.json`](./output/result.json)

Abbreviated single-job example:

```json
{
  "name": "John Doe",
  "email": "john.doe@email.com",
  "phone": "+1-555-123-4567",
  "yearOfExperience": 6,
  "resumeSkills": [
    "AWS", "Agile", "Angular", "Bash", "CI/CD", "Docker", "Git",
    "Java", "Jenkins", "Kafka", "Kubernetes", "Linux", "MongoDB",
    "MySQL", "Node.js", "PostgreSQL", "Python", "React", "Redis",
    "REST API", "Spring Boot", "Terraform", "TypeScript"
  ],
  "matchingJobs": [
    {
      "jobId": "JD004_ASTRA",
      "role": "Software Engineer",
      "salary": "$130,000 - $160,000 per year",
      "requiredExperience": 3,
      "aboutRole": "As a Software Engineer at Astra, you'll build systems that support rocket testing, manufacturing, and launch operations...",
      "requiredSkills": ["AWS", "Docker", "Kubernetes", "Python", "REST API", "gRPC", "JSON", "YAML"],
      "optionalSkills": ["TypeScript", "Go", "C++"],
      "skillsAnalysis": [
        { "skill": "AWS",        "presentInResume": true  },
        { "skill": "Docker",     "presentInResume": true  },
        { "skill": "Kubernetes", "presentInResume": true  },
        { "skill": "Python",     "presentInResume": true  },
        { "skill": "REST API",   "presentInResume": true  },
        { "skill": "gRPC",       "presentInResume": true  },
        { "skill": "Go",         "presentInResume": false },
        { "skill": "TypeScript", "presentInResume": true  },
        { "skill": "C++",        "presentInResume": true  }
      ],
      "matchingScore": 92.3
    }
  ]
}
```

### Full Demo Results — All 15 JDs

| Rank | Job ID | Company | Score | Salary |
|------|--------|---------|-------|--------|
| 1  | JD005 | Lockheed Martin (MUOS SLE) | **100.0%** | — |
| 2  | JD004 | Astra | **92.3%** | $130K – $160K |
| 3  | JD013 | BigBear.ai | **87.5%** | — |
| 4  | JD007 | Meta (Infrastructure) | **85.7%** | $58/hr – $181K |
| 5  | JD015 | Software Engineer Mid | **85.7%** | — |
| 6  | JD010 | Bcore | **84.6%** | — |
| 7  | JD014 | Altamira Technologies | **76.2%** | — |
| 8  | JD011 | FishEye Software | **70.0%** | $80K – $190K |
| 9  | JD003 | Adobe | **66.7%** | $139K – $257K |
| 10 | JD012 | Lockheed Martin (Full Stack) | **66.7%** | — |
| 11 | JD009 | SpaceX | **63.6%** | $120K – $170K |
| 12 | JD002 | Capgemini | **61.5%** | $61K – $104K |
| 13 | JD001 | Riverside Research | **46.2%** | $180K – $220K |
| 14 | JD006 | Applied Materials | **36.4%** | $176K – $242K |
| 15 | JD008 | Accenture Federal Services | **33.3%** | $75K – $131K |

> Lower scores reflect genuinely missing skills — e.g. Riverside Research requires Fortran/MPI/HPC, Applied Materials requires FPGA/PyTorch/embedded, and Accenture Federal requires TS/SCI clearance, none of which appear in the sample resume.

---

## Tech Stack

| Library | Purpose |
|---------|---------|
| `Node.js 18+` | Runtime |
| `express` | REST API server |
| `multer` | File upload handling |
| `pdf-parse` | Text extraction from PDF resumes/JDs |
| `mammoth` | Text extraction from DOCX files |
| `cors` | Cross-origin request support |
| `helmet` | HTTP security headers |
| `morgan` | Request logging middleware |
| `uuid` | Auto-generate job IDs when not provided |
| `natural` | Available for future NLP/tokenization extensions |
| `compromise` | Available for future NLP extensions |

> ⚠️ No OpenAI, Gemini, Anthropic Claude, or any LLM/generative AI API is used anywhere in this project.

---

## Docker

```bash
# Build image
docker build -t resume-matcher .

# Run container
docker run -p 3000:3000 resume-matcher

# Or with Docker Compose
docker-compose up
```

---

## Evaluation Criteria Coverage

| Criterion | Weight | Implementation |
|-----------|--------|---------------|
| Salary Extraction | 40% | Multi-pattern regex: USD ranges, LPA, ₹, bare numeric in compensation context |
| Experience Extraction | 40% | Explicit statements + date-range summation across work history sections |
| Skills Extraction | 40% | 200+ skill dictionary, 100+ aliases, unigram/bigram/trigram matching |
| Required vs Optional Skills | 25% | Section header heuristics split required from desired/preferred blocks |
| Skill Mapping | 25% | `presentInResume: true/false` for every JD skill |
| Matching Score | 25% | `(matched / total) × 100`, sorted descending |
| Code Quality & Structure | 20% | Modular src/ layout, JSDoc comments, clear separation of concerns |
| API *(Bonus)* | — | REST API: file upload + JSON text input, `/match`, `/parse/resume`, `/parse/jd` |
| Docker *(Bonus)* | — | `Dockerfile` + `docker-compose.yml` |
