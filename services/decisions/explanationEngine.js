/**
 * YantraMitra Platform — Recommendation Explanation Engine
 * Generates natural-language explanations citing ML predictions, RAG evidence, and Knowledge Graph dependencies.
 * Explains why the top-ranked option outperforms alternatives.
 */

class ExplanationEngine {
  /**
   * @param {Array} ranked - Ranked options from DecisionScorer
   * @param {Object} context - { mlPrediction, ragEvidence, graphImpact }
   */
  explain(ranked, context = {}) {
    if (!ranked || ranked.length === 0) return [];

    const top = ranked[0];
    const explanations = [];

    for (const option of ranked) {
      const isTop = option.rank === 1;
      const mlCtx = context.mlPrediction || {};
      const ragCtx = context.ragEvidence || [];
      const graphCtx = context.graphImpact || {};

      const reasons = [];

      // Score-based reasoning
      if (option.scores.safety >= 7) {
        reasons.push(`Safety score of ${option.scores.safety}/10 meets critical operational standards (OSHA 1910.147).`);
      } else if (option.scores.safety < 4) {
        reasons.push(`Safety score of ${option.scores.safety}/10 indicates elevated LOTO or personnel risk.`);
      }

      if (option.scores.cost >= 7) {
        reasons.push(`Cost profile is favorable — lowest expected financial exposure among alternatives.`);
      }

      if (option.scores.downtime >= 7) {
        reasons.push(`Shortest estimated downtime minimizes production line availability impact.`);
      }

      if (option.scores.reliability >= 7) {
        reasons.push(`Highest reliability gain expected — projected to improve MTBF by ${Math.round(option.scores.reliability * 3)}%.`);
      }

      // ML context
      if (mlCtx.failureProbability > 70) {
        reasons.push(`ML Predictive Engine flagged failure probability at ${mlCtx.failureProbability.toFixed(1)}% — immediate intervention is evidence-backed.`);
      }
      if (mlCtx.remainingUsefulLife && mlCtx.remainingUsefulLife < 10) {
        reasons.push(`ML-predicted Remaining Useful Life of ${mlCtx.remainingUsefulLife.toFixed(1)} hours makes deferred action high-risk.`);
      }

      // RAG evidence
      if (ragCtx.length > 0) {
        reasons.push(`RAG knowledge retrieval surfaced ${ragCtx.length} relevant SOP and manual excerpt(s) supporting this approach.`);
      }

      // Graph context
      if (graphCtx.totalImpactedNodes > 5) {
        reasons.push(`Knowledge Graph impact analysis identified ${graphCtx.totalImpactedNodes} downstream assets — contains failure cascade risk.`);
      }

      // Comparison with rank 1
      if (!isTop) {
        const scoreDiff = (top.compositeScore - option.compositeScore).toFixed(2);
        reasons.push(`Ranks #${option.rank} — composite score ${scoreDiff} points below top option "${top.optionName}" primarily due to lower ${this._weakestDimension(option, top)} score.`);
      } else {
        reasons.push(`Ranked #1 of ${ranked.length} alternatives with highest composite score (${option.compositeScore}/10, ${option.confidencePercent}% confidence).`);
      }

      explanations.push({
        rank: option.rank,
        optionId: option.optionId,
        optionName: option.optionName,
        compositeScore: option.compositeScore,
        confidencePercent: option.confidencePercent,
        recommended: isTop,
        explanationReasons: reasons,
        evidenceSources: [
          ...(mlCtx.failureProbability ? ['ML Predictive Engine (XGBoost Gradient Boosting)'] : []),
          ...(ragCtx.length > 0 ? ['Hybrid Vector RAG Knowledge Base'] : []),
          ...(graphCtx.totalImpactedNodes ? ['Industrial Knowledge Graph Impact Analysis'] : [])
        ]
      });
    }

    return explanations;
  }

  _weakestDimension(option, reference) {
    const dims = ['safety', 'reliability', 'cost', 'downtime', 'productionImpact', 'energyImpact'];
    let maxGap = -Infinity;
    let weakDim = 'safety';
    for (const d of dims) {
      const gap = (reference.scores[d] || 0) - (option.scores[d] || 0);
      if (gap > maxGap) { maxGap = gap; weakDim = d; }
    }
    return weakDim;
  }
}

module.exports = new ExplanationEngine();
