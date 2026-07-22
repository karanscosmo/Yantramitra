/**
 * YantraMitra Platform — Decision Intelligence System Facade
 */

const decisionEngine = require('./decisionEngine');
const scenarioSimulator = require('./scenarioSimulator');
const tradeoffAnalyzer = require('./tradeoffAnalyzer');
const decisionScorer = require('./decisionScorer');
const explanationEngine = require('./explanationEngine');

module.exports = {
  decisionEngine,
  scenarioSimulator,
  tradeoffAnalyzer,
  decisionScorer,
  explanationEngine,
  getDecisionSystemStatus: () => decisionEngine.getStatus()
};
