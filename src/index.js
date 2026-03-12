'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./api/routes');

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Root
app.get('/', (req, res) => {
  res.json({
    service: 'Resume Parsing & Job Matching API',
    version: '1.0.0',
    description: 'Rule-based system (no LLMs) for parsing resumes and matching to job descriptions.',
    endpoints: {
      'GET  /api/health': 'Health check',
      'POST /api/parse-resume': 'Parse a resume file (PDF/TXT) or raw text',
      'POST /api/parse-jd': 'Parse a single job description',
      'POST /api/match': 'Match resume file(s) against JD file(s)',
      'POST /api/match-text': 'Match resume & JDs from raw text (JSON body)',
      'POST /api/parse-jds-bulk': 'Parse multiple JDs from a combined text'
    },
    docs: 'See README.md for full usage examples'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Resume Matcher API running on http://localhost:${PORT}`);
  console.log(`   Try: GET http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
