/**
 * YantraMitra Platform — Decision Scorer
 * Assigns weighted composite confidence scores to every decision option and produces a ranked list.
 *
 * Dimension weights (default profile):
 *   Safety          30%
 *   Reliability     25%
 *   Cost            20%
 *   Downtime        15%
 *   Production      5%
 *   Energy          5%
 */

const DEFAULT_WEIGHTS = {
  safety: 0.30,
  reliability: 0.25,
  cost: 0.20,
  downtime: 0.15,
  productionImpact: 0.05,
  energyImpact: 0.05
};

class DecisionScorer {
  /**
   * @param {Array} tradeoffMatrix - Output of TradeoffAnalyzer.analyze().matrix
   * @param {Object} weights - Optional custom weight profile
   */
  score(tradeoffMatrix, weights = DEFAULT_WEIGHTS) {
    const scored = tradeoffMatrix.map(entry => {
      const s = entry.scores;
      const composite =
        (s.safety * (weights.safety || 0)) +
        (s.reliability * (weights.reliability || 0)) +
        (s.cost * (weights.cost || 0)) +
        (s.downtime * (weights.downtime || 0)) +
        (s.productionImpact * (weights.productionImpact || 0)) +
        (s.energyImpact * (weights.energyImpact || 0));

      const confidence = Math.min(99, Math.round(composite * 10)); // 0-99%

      return {
        optionId: entry.optionId,
        optionName: entry.optionName,
        compositeScore: Math.round(composite * 100) / 100,  // out of 10
        confidencePercent: confidence,
        scores: s,
        weights
      };
    });

    // Rank by composite score descending
    const ranked = scored
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .map((entry, idx) => ({ rank: idx + 1, ...entry }));

    return { ranked, appliedWeights: weights };
  }
}

module.exports = new DecisionScorer();
