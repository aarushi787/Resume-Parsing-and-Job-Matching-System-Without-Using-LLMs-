'use strict';

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * Extract plain text from a file (PDF or plain text).
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<string>} - Raw text content
 */
async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    return extractTextFromPDF(filePath);
  } else if (['.txt', '.md'].includes(ext)) {
    return fs.readFileSync(filePath, 'utf8');
  } else if (ext === '.json') {
    return fs.readFileSync(filePath, 'utf8');
  } else {
    throw new Error(`Unsupported file type: ${ext}. Supported: .pdf, .txt`);
  }
}

/**
 * Extract text from PDF buffer/path.
 * @param {string|Buffer} input - File path or Buffer
 * @returns {Promise<string>}
 */
async function extractTextFromPDF(input) {
  let dataBuffer;
  if (Buffer.isBuffer(input)) {
    dataBuffer = input;
  } else {
    dataBuffer = fs.readFileSync(input);
  }

  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * Extract text from uploaded file buffer with mime type.
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @returns {Promise<string>}
 */
async function extractTextFromBuffer(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    return extractTextFromPDF(buffer);
  } else if (mimetype === 'text/plain') {
    return buffer.toString('utf8');
  } else {
    throw new Error(`Unsupported MIME type: ${mimetype}`);
  }
}

/**
 * Clean extracted text - normalize whitespace, fix common OCR issues.
 * @param {string} text
 * @returns {string}
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')          // normalize line endings
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')         // collapse spaces/tabs
    .replace(/\n{3,}/g, '\n\n')      // max 2 consecutive newlines
    .replace(/[^\x20-\x7E\n]/g, ' ') // remove non-printable chars (keep ASCII)
    .trim();
}

module.exports = {
  extractTextFromFile,
  extractTextFromPDF,
  extractTextFromBuffer,
  cleanText
};
