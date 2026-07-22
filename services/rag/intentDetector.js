/**
 * YantraMitra Platform — RAG Intent Detector Service
 * Classifies user queries into domain operational intents to route retrieval strategies
 */

const INTENT_KEYWORDS = {
  diagnostics: ['diagnose', 'diagnostic', 'root cause', 'fault', 'vibration', 'spike', 'overheat', 'anomaly', 'troubleshoot', 'failure', 'error code', 'alarm', 'issue'],
  maintenance: ['maintenance', 'overhaul', 'service', 'lubrication', 'grease', 'replace', 'repair', 'clean', 'inspection', 'pm', 'schedule'],
  sop: ['sop', 'procedure', 'standard', 'protocol', 'instructions', 'guide', 'steps', 'loto', 'lockout'],
  machine_health: ['health', 'rul', 'remaining useful life', 'failure probability', 'risk', 'bearing', 'spindle', 'condition'],
  inventory: ['inventory', 'part', 'spare', 'stock', 'sku', 'reserve', 'reorder', 'quantity'],
  safety: ['safety', 'loto', 'ppe', 'danger', 'hazard', 'emergency', 'isolation', 'protective'],
  analytics: ['oee', 'energy', 'co2', 'uptime', 'kpi', 'performance', 'summary', 'analytics', 'efficiency']
};

/**
 * Detects operational intent from user query text
 */
function detectQueryIntent(queryText) {
  if (!queryText || typeof queryText !== 'string') {
    return { primaryIntent: 'general', confidence: 1.0, tags: ['general'] };
  }

  const cleanQuery = queryText.toLowerCase();
  const scores = {};

  Object.keys(INTENT_KEYWORDS).forEach(intent => {
    let matches = 0;
    INTENT_KEYWORDS[intent].forEach(keyword => {
      if (cleanQuery.includes(keyword)) matches++;
    });
    scores[intent] = matches;
  });

  let maxScore = 0;
  let primaryIntent = 'general';

  Object.keys(scores).forEach(intent => {
    if (scores[intent] > maxScore) {
      maxScore = scores[intent];
      primaryIntent = intent;
    }
  });

  const matchedIntents = Object.keys(scores).filter(intent => scores[intent] > 0);

  return {
    primaryIntent,
    confidence: maxScore > 0 ? Math.min(1.0, 0.5 + maxScore * 0.25) : 0.6,
    tags: matchedIntents.length > 0 ? matchedIntents : ['general']
  };
}

module.exports = {
  detectQueryIntent,
  INTENT_KEYWORDS
};
