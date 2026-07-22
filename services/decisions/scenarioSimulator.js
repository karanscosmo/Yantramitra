/**
 * YantraMitra Platform — Scenario Simulator
 * Simulates Best-Case, Expected-Case, and Worst-Case operational outcomes for each decision option.
 * Estimates downtime hours, production loss (units), cost (INR), and risk score (0-100).
 */

class ScenarioSimulator {
  /**
   * @param {Object} option - A decision option (name, estimatedDurationMinutes, riskLevel, etc.)
   * @param {Object} context - Machine context (failureProbability, remainingUsefulLife, riskLevel)
   */
  simulate(option, context = {}) {
    const baseDuration = option.estimatedDurationMinutes || 90;
    const baseRisk = this._riskToScore(option.riskLevel || context.riskLevel || 'MEDIUM');
    const failureProb = context.failureProbability || 30;

    return {
      optionId: option.optionId,
      optionName: option.name,
      scenarios: {
        bestCase: {
          label: 'Best Case',
          probability: 0.25,
          downtimeHours: Math.round((baseDuration * 0.7) / 60 * 10) / 10,
          productionUnitsLost: Math.round(baseDuration * 0.7 * 1.2),
          estimatedCostINR: Math.round(baseDuration * 0.7 * 600),
          riskScore: Math.max(5, baseRisk - 20),
          description: 'Optimal execution with no complications or delays.'
        },
        expectedCase: {
          label: 'Expected Case',
          probability: 0.55,
          downtimeHours: Math.round((baseDuration * 1.1) / 60 * 10) / 10,
          productionUnitsLost: Math.round(baseDuration * 1.1 * 1.2),
          estimatedCostINR: Math.round(baseDuration * 1.1 * 800),
          riskScore: baseRisk,
          description: 'Nominal execution accounting for standard delays and coordination time.'
        },
        worstCase: {
          label: 'Worst Case',
          probability: 0.20,
          downtimeHours: Math.round((baseDuration * 1.8) / 60 * 10) / 10,
          productionUnitsLost: Math.round(baseDuration * 1.8 * 1.2),
          estimatedCostINR: Math.round(baseDuration * 1.8 * 1200 + failureProb * 5000),
          riskScore: Math.min(98, baseRisk + 25),
          description: 'Secondary failure or part unavailability causes significant schedule overrun.'
        }
      }
    };
  }

  _riskToScore(level) {
    const map = { LOW: 15, MEDIUM: 40, HIGH: 65, CRITICAL: 88 };
    return map[level] || 40;
  }
}

module.exports = new ScenarioSimulator();
