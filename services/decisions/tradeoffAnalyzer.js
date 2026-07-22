/**
 * YantraMitra Platform — Trade-off Analyzer
 * Compares decision options across 6 operational dimensions:
 * Cost, Safety, Reliability, Downtime, Energy Impact, Production Impact.
 * Returns a normalized score matrix (0–10, higher = better).
 */

class TradeoffAnalyzer {
  /**
   * @param {Array} options - Array of decision options each with simulation results
   * @returns {Object} tradeoff matrix + dimension winner map
   */
  analyze(options) {
    const dimensions = ['cost', 'safety', 'reliability', 'downtime', 'energyImpact', 'productionImpact'];

    // Build raw dimension scores for each option
    const rawScores = options.map(opt => {
      const expected = opt.simulation?.scenarios?.expectedCase || {};
      const cost = expected.estimatedCostINR || 100000;
      const risk = expected.riskScore || 50;
      const duration = opt.estimatedDurationMinutes || 90;
      const unitsLost = expected.productionUnitsLost || 100;

      return {
        optionId: opt.optionId,
        optionName: opt.name,
        raw: {
          cost,
          riskScore: risk,
          durationMinutes: duration,
          productionLoss: unitsLost,
          energyUsageKWh: duration * (opt.riskLevel === 'HIGH' ? 2.5 : 1.2),
          reliabilityGain: opt.reliabilityGainPercent || (100 - risk) * 0.6
        }
      };
    });

    // Normalize: invert cost/risk/duration/loss dimensions (lower raw = higher score)
    const normalize = (values, invert = false) => {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      return values.map(v => {
        const norm = (v - min) / range; // 0→1
        return Math.round((invert ? (1 - norm) : norm) * 10 * 10) / 10; // 0→10
      });
    };

    const costs = rawScores.map(s => s.raw.cost);
    const risks = rawScores.map(s => s.raw.riskScore);
    const durations = rawScores.map(s => s.raw.durationMinutes);
    const losses = rawScores.map(s => s.raw.productionLoss);
    const energies = rawScores.map(s => s.raw.energyUsageKWh);
    const reliabilities = rawScores.map(s => s.raw.reliabilityGain);

    const normCost = normalize(costs, true);         // lower cost = higher score
    const normSafety = normalize(risks, true);       // lower risk = higher safety score
    const normReliability = normalize(reliabilities, false); // higher gain = better
    const normDowntime = normalize(durations, true); // shorter = better
    const normEnergy = normalize(energies, true);    // lower energy = better
    const normProduction = normalize(losses, true);  // lower loss = better

    const matrix = rawScores.map((s, i) => ({
      optionId: s.optionId,
      optionName: s.optionName,
      scores: {
        cost: normCost[i],
        safety: normSafety[i],
        reliability: normReliability[i],
        downtime: normDowntime[i],
        energyImpact: normEnergy[i],
        productionImpact: normProduction[i]
      },
      raw: s.raw
    }));

    // Find dimension winner
    const winners = {};
    for (const dim of dimensions) {
      const best = matrix.reduce((a, b) => (a.scores[dim] > b.scores[dim] ? a : b));
      winners[dim] = best.optionId;
    }

    return { matrix, dimensionWinners: winners };
  }
}

module.exports = new TradeoffAnalyzer();
