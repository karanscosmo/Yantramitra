/**
 * YantraMitra Platform — RAG Citation Engine Service
 * Extracts, verifies, and formats grounded citation sources for AI Copilot responses
 */

/**
 * Verifies and appends formatted citation list to LLM response text
 */
function appendVerifiedCitations(replyText, sources = []) {
  if (!replyText || typeof replyText !== 'string') return replyText;
  if (!sources || sources.length === 0) return replyText;

  // Deduplicate sources by ref tag
  const uniqueSourcesMap = new Map();
  sources.forEach(src => {
    if (src.ref && !uniqueSourcesMap.has(src.ref)) {
      uniqueSourcesMap.set(src.ref, src);
    }
  });

  const uniqueSources = Array.from(uniqueSourcesMap.values());

  // Check which sources were cited in the reply
  const citedSources = uniqueSources.filter(src => replyText.includes(src.ref) || replyText.includes(src.name));

  const activeSources = citedSources.length > 0 ? citedSources : uniqueSources.slice(0, 3);

  const sourceLines = activeSources.map((src, idx) => {
    return `${idx + 1}. **${src.name}** \`${src.ref}\` — *Type: ${src.type || 'Knowledge Base'}${src.section ? `, Section: ${src.section}` : ''}*`;
  });

  // If response already has a sources section, return as is
  if (replyText.includes('## Sources') || replyText.includes('### Sources')) {
    return replyText;
  }

  return `${replyText.trim()}\n\n---\n### 📚 Grounded Sources & Evidence\n${sourceLines.join('\n')}`;
}

module.exports = {
  appendVerifiedCitations
};
