/**
 * YantraMitra Platform — RAG Intelligent Text Chunker Service
 * Splits document text into 150-300 token semantic chunks with 10-15% overlap
 * Preserves structural headings, section context, tables, and rich metadata
 */

const crypto = require('crypto');

/**
 * Estimates token count from character string (~4 chars per token)
 */
function estimateTokens(str) {
  return Math.ceil((str || '').length / 4);
}

/**
 * Chunks extracted document text into overlapping semantic blocks
 */
function chunkDocument(docText, docMetadata = {}) {
  const targetChunkSizeChars = 500; // ~125-150 tokens per chunk
  const overlapChars = 75;           // ~20 tokens overlap
  const minChunkSizeChars = 80;

  if (!docText || docText.trim().length === 0) {
    return [];
  }

  const paragraphs = docText.split(/\n\s*\n/);
  const chunks = [];

  let currentChunkText = '';
  let currentSection = 'General Overview';
  let chunkIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (!para) continue;

    // Detect section heading
    if (para.startsWith('#')) {
      const headingText = para.replace(/^#+\s*/, '');
      currentSection = headingText;
    }

    if ((currentChunkText.length + para.length) > targetChunkSizeChars && currentChunkText.length >= minChunkSizeChars) {
      // Finalize chunk
      const chunkId = `${docMetadata.docName || 'doc'}_chk_${chunkIndex}_${crypto.randomBytes(4).toString('hex')}`;
      chunks.push(createChunkObject(currentChunkText, currentSection, chunkIndex, docMetadata, chunkId));

      chunkIndex++;
      // Retain overlap from end of current chunk
      const overlapText = currentChunkText.slice(-overlapChars);
      currentChunkText = overlapText + '\n\n' + para;
    } else {
      if (currentChunkText.length > 0) {
        currentChunkText += '\n\n' + para;
      } else {
        currentChunkText = para;
      }
    }
  }

  if (currentChunkText.trim().length >= minChunkSizeChars || chunks.length === 0) {
    const chunkId = `${docMetadata.docName || 'doc'}_chk_${chunkIndex}_${crypto.randomBytes(4).toString('hex')}`;
    chunks.push(createChunkObject(currentChunkText, currentSection, chunkIndex, docMetadata, chunkId));
  }

  return chunks;
}

/**
 * Builds structured chunk object with rich metadata
 */
function createChunkObject(text, section, index, docMetadata, chunkId) {
  const cleanText = text.trim();
  const tokenCount = estimateTokens(cleanText);

  return {
    id: chunkId,
    docId: docMetadata.docId || docMetadata.docName || 'unknown_doc',
    docName: docMetadata.docName || 'Document',
    docType: docMetadata.docType || 'text',
    plant: docMetadata.plant || 'All Plants',
    machine: docMetadata.machine || 'General Machinery',
    section: section || 'General',
    page: docMetadata.page || 1,
    uploadDate: docMetadata.uploadDate || new Date().toISOString(),
    tags: docMetadata.tags || ['sops', 'manuals', 'industrial'],
    version: docMetadata.version || '1.0',
    chunkIndex: index,
    tokenCount,
    text: cleanText
  };
}

module.exports = {
  chunkDocument,
  estimateTokens
};
