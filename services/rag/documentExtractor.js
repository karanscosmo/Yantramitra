/**
 * YantraMitra Platform — RAG Document Extractor Service
 * Extracts text, structural headings, tables, and metadata from multi-format files
 * Supported formats: PDF, DOCX, XLSX, CSV, Markdown, TXT, JSON, XML
 */

const fs = require('fs');
const path = require('path');

/**
 * Extracts raw text and structure from a file path or buffer
 */
async function extractDocumentContent(input, options = {}) {
  const fileName = options.fileName || (typeof input === 'string' ? path.basename(input) : 'uploaded_document');
  const ext = (options.extension || fileName.split('.').pop() || '').toLowerCase();
  let buffer = null;

  if (typeof input === 'string') {
    if (!fs.existsSync(input)) {
      throw new Error(`Document file not found: ${input}`);
    }
    buffer = fs.readFileSync(input);
  } else if (Buffer.isBuffer(input)) {
    buffer = input;
  } else {
    throw new Error('Invalid input: Expected file path or Buffer');
  }

  let text = '';
  let metadata = {
    docName: fileName,
    docType: ext,
    fileSize: buffer.length,
    extractedAt: new Date().toISOString(),
    sections: []
  };

  try {
    if (ext === 'pdf' || options.mimeType === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      text = pdfData.text || '';
      metadata.numPages = pdfData.numpages || 1;
    } else if (ext === 'docx') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
    } else if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = require('xlsx');
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const sheetTexts = [];
      wb.SheetNames.forEach(sheetName => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
        const sheetStr = rows.map(r => Array.isArray(r) ? r.join(' | ') : String(r)).join('\n');
        sheetTexts.push(`### Sheet: ${sheetName}\n${sheetStr}`);
      });
      text = sheetTexts.join('\n\n');
    } else if (ext === 'csv') {
      text = buffer.toString('utf8');
    } else if (['txt', 'md', 'markdown', 'json', 'xml', 'log', 'yaml', 'yml'].includes(ext)) {
      text = buffer.toString('utf8');
    } else {
      text = buffer.toString('utf8');
    }
  } catch (err) {
    console.error(`Document extraction error for ${fileName}:`, err.message);
    text = buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, '');
  }

  // Parse structural headings (# Section, ## Section, etc.)
  const lines = text.split('\n');
  const sections = [];
  let currentHeading = 'General Overview';

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      currentHeading = trimmed.replace(/^#+\s*/, '');
      sections.push(currentHeading);
    }
  });

  metadata.sections = Array.from(new Set(sections));

  return {
    text: text.trim(),
    metadata
  };
}

module.exports = {
  extractDocumentContent
};
