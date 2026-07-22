/**
 * YantraMitra Platform — Decision Engine
 * Central orchestrator that generates multiple action plans for an industrial problem,
 * runs scenario simulation, trade-off analysis, scoring, and explainable ranking.
 */

const scenarioSimulator = require('./scenarioSimulator');
const tradeoffAnalyzer = require('./tradeoffAnalyzer');
const decisionScorer = require('./decisionScorer');
const explanationEngine = require('./explanationEngine');

// Pre-configured industrial decision option templates
const OPTION_TEMPLATES = {
  IMMEDIATE_REPAIR: {
    optionId: 'opt_immediate_repair',
    name: 'Immediate Corrective Repair',
    description: 'Stop machine now and perform full corrective maintenance.',
    estimatedDurationMinutes: 240,
    riskLevel: 'HIGH',
    reliabilityGainPercent: 8.5
  },
  DEFERRED_REPAIR: {
    optionId: 'opt_deferred_repair',
    name: 'Deferred Repair (Next Scheduled Window)',
    description: 'Continue operation under monitoring until the next planned maintenance window.',
    estimatedDurationMinutes: 90,
    riskLevel: 'MEDIUM',
    reliabilityGainPercent: 4.2
  },
  PREVENTIVE_MAINTENANCE: {
    optionId: 'opt_preventive_maintenance',
    name: 'Preventive Maintenance Cycle',
    description: 'Execute the standard 500-hour PM checklist to preempt failure.',
    estimatedDurationMinutes: 120,
    riskLevel: 'LOW',
    reliabilityGainPercent: 6.0
  },
  COMPONENT_REPLACEMENT: {
    optionId: 'opt_component_replacement',
    name: 'Critical Component Replacement',
    description: 'Replace the highest-risk component (bearing / seal / motor winding) only.',
    estimatedDurationMinutes: 180,
    riskLevel: 'HIGH',
    reliabilityGainPercent: 7.8
  }
};

class DecisionEngine {
  /**
   * Orchestrates full decision intelligence analysis.
   * @param {Object} problem - { problemType, machineId, machineName, context }
   *   context: { mlPrediction, ragEvidence, graphImpact, customWeights }
   */
  async analyze(problem = {}) {
    const decisionId = `DEC-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const { machineId = 'mach-generic', machineName = 'Industrial Equipment', context = {} } = problem;
    const mlCtx = context.mlPrediction || {};

    // 1. Generate decision options (select relevant subset based on failure probability)
    const failureProb = mlCtx.failureProbability || 30;
    let selectedOptions;
    if (failureProb >= 75) {
      selectedOptions = ['IMMEDIATE_REPAIR', 'COMPONENT_REPLACEMENT', 'DEFERRED_REPAIR'];
    } else if (failureProb >= 40) {
      selectedOptions = ['PREVENTIVE_MAINTENANCE', 'COMPONENT_REPLACEMENT', 'DEFERRED_REPAIR'];
    } else {
      selectedOptions = ['PREVENTIVE_MAINTENANCE', 'DEFERRED_REPAIR', 'IMMEDIATE_REPAIR'];
    }

    const options = selectedOptions.map(key => ({ ...OPTION_TEMPLATES[key] }));

    // 2. Scenario Simulation for each option
    const optionsWithSimulation = options.map(opt => ({
      ...opt,
      simulation: scenarioSimulator.simulate(opt, mlCtx)
    }));

    // 3. Trade-off Analysis
    const { matrix: tradeoffMatrix, dimensionWinners } = tradeoffAnalyzer.analyze(optionsWithSimulation);

    // Merge simulation back into matrix entries
    const enrichedMatrix = tradeoffMatrix.map(entry => {
      const optWithSim = optionsWithSimulation.find(o => o.optionId === entry.optionId);
      return { ...entry, simulation: optWithSim?.simulation, estimatedDurationMinutes: optWithSim?.estimatedDurationMinutes, riskLevel: optWithSim?.riskLevel };
    });

    // 4. Decision Scoring & Ranking
    const { ranked, appliedWeights } = decisionScorer.score(enrichedMatrix, context.customWeights);

    // 5. Explanation Generation
    const explanations = explanationEngine.explain(ranked, {
      mlPrediction: mlCtx,
      ragEvidence: context.ragEvidence || [],
      graphImpact: context.graphImpact || {}
    });

    return {
      decisionId,
      machineId,
      machineName,
      analyzedAt: new Date().toISOString(),
      problemContext: {
        failureProbability: failureProb,
        remainingUsefulLife: mlCtx.remainingUsefulLife || null,
        riskLevel: mlCtx.riskLevel || 'UNKNOWN'
      },
      optionsAnalyzed: options.length,
      tradeoffMatrix: enrichedMatrix,
      dimensionWinners,
      rankedRecommendations: ranked,
      explanations,
      topRecommendation: explanations.find(e => e.rank === 1) || null,
      appliedWeights
    };
  }

  getStatus() {
    return {
      engineStatus: 'ACTIVE_READY',
      availableOptions: Object.keys(OPTION_TEMPLATES).length,
      dimensions: ['cost', 'safety', 'reliability', 'downtime', 'energyImpact', 'productionImpact'],
      capabilities: ['Multi-Option Analysis', 'Scenario Simulation', 'Trade-off Matrix', 'Weighted Scoring', 'Explainable Ranking']
    };
  }
}

module.exports = new DecisionEngine();
