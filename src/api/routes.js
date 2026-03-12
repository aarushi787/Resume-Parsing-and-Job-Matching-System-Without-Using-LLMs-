'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();

const { parseResumeBuffer, parseResumeText } = require('../parsers/resumeParser');
const { parseJDBuffer, parseJDText, parseMultipleJDs } = require('../parsers/jdParser');
const { matchResumeToJobs } = require('../matchers/jobMatcher');

// Configure multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Use PDF or TXT.`));
    }
  }
});

// ─── Health Check ────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Resume Matcher API', version: '1.0.0' });
});

// ─── Parse Resume ─────────────────────────────────────────────────────────────
/**
 * POST /api/parse-resume
 * Upload a resume file (PDF or TXT) and get structured extraction.
 * Body: multipart/form-data with field "resume"
 */
router.post('/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: 'Provide a resume file (field: "resume") or raw text (field: "text")' });
    }

    let parsed;
    if (req.file) {
      parsed = await parseResumeBuffer(req.file.buffer, req.file.mimetype);
    } else {
      parsed = parseResumeText(req.body.text);
    }

    // Remove rawText from API response (too large)
    const { rawText, ...response } = parsed;
    res.json({ success: true, data: response });

  } catch (err) {
    console.error('Parse resume error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Parse JD ─────────────────────────────────────────────────────────────────
/**
 * POST /api/parse-jd
 * Upload a JD file or provide raw text. Returns structured JD data.
 */
router.post('/parse-jd', upload.single('jd'), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: 'Provide a JD file (field: "jd") or raw text (field: "text")' });
    }

    const jobId = req.body.jobId || null;
    let parsed;

    if (req.file) {
      parsed = await parseJDBuffer(req.file.buffer, req.file.mimetype, jobId);
    } else {
      parsed = parseJDText(req.body.text, jobId);
    }

    const { rawText, ...response } = parsed;
    res.json({ success: true, data: response });

  } catch (err) {
    console.error('Parse JD error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Match Resume to Jobs ─────────────────────────────────────────────────────
/**
 * POST /api/match
 * Upload resume + one or more JDs. Returns full matching result JSON.
 *
 * Form fields:
 *   resume: File (PDF/TXT)  OR  resumeText: string
 *   jd[]: File(s)           OR  jdTexts[]: string(s) (JSON array)
 *   jobIds[]: optional job IDs (JSON array)
 */
router.post('/match', upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jd', maxCount: 20 }
]), async (req, res) => {
  try {
    // --- Parse Resume ---
    let resumeData;
    if (req.files && req.files['resume'] && req.files['resume'][0]) {
      const f = req.files['resume'][0];
      resumeData = await parseResumeBuffer(f.buffer, f.mimetype);
    } else if (req.body.resumeText) {
      resumeData = parseResumeText(req.body.resumeText);
    } else {
      return res.status(400).json({ error: 'Provide resume file or resumeText' });
    }

    // --- Parse JDs ---
    let jdList = [];
    if (req.files && req.files['jd'] && req.files['jd'].length > 0) {
      for (let i = 0; i < req.files['jd'].length; i++) {
        const f = req.files['jd'][i];
        const jobId = req.body.jobIds ? JSON.parse(req.body.jobIds)[i] : null;
        const jd = await parseJDBuffer(f.buffer, f.mimetype, jobId);
        jdList.push(jd);
      }
    } else if (req.body.jdTexts) {
      const texts = JSON.parse(req.body.jdTexts);
      const ids = req.body.jobIds ? JSON.parse(req.body.jobIds) : [];
      jdList = texts.map((t, i) => parseJDText(t, ids[i] || null));
    } else {
      return res.status(400).json({ error: 'Provide at least one JD file or jdTexts array' });
    }

    if (jdList.length === 0) {
      return res.status(400).json({ error: 'No valid JDs provided' });
    }

    // --- Match ---
    const result = matchResumeToJobs(resumeData, jdList);
    res.json({ success: true, data: result });

  } catch (err) {
    console.error('Match error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Parse Multiple JDs from one text ────────────────────────────────────────
/**
 * POST /api/parse-jds-bulk
 * Send a large text containing multiple JDs (e.g., "Sample 1: ... Sample 2: ...").
 */
router.post('/parse-jds-bulk', async (req, res) => {
  try {
    const text = req.body.text;
    if (!text) return res.status(400).json({ error: 'Provide "text" in body' });

    const jds = parseMultipleJDs(text);
    const cleaned = jds.map(({ rawText, ...jd }) => jd);
    res.json({ success: true, count: jds.length, data: cleaned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Match with raw text (JSON body) ─────────────────────────────────────────
/**
 * POST /api/match-text
 * JSON body: { resumeText: string, jds: [{ jobId, text }] }
 * Easiest endpoint for testing without file uploads.
 */
router.post('/match-text', express.json({ limit: '5mb' }), async (req, res) => {
  try {
    const { resumeText, jds } = req.body;

    if (!resumeText) return res.status(400).json({ error: 'resumeText is required' });
    if (!jds || !Array.isArray(jds) || jds.length === 0) {
      return res.status(400).json({ error: 'jds array is required' });
    }

    const resumeData = parseResumeText(resumeText);
    const jdList = jds.map(j => parseJDText(j.text, j.jobId || null));
    const result = matchResumeToJobs(resumeData, jdList);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Match-text error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
