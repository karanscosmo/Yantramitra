/**
 * YantraMitra Platform — Autonomous Multi-Agent Systems Facade
 */

const agentOrchestrator = require('./agentOrchestrator');

function getAgentStatus() {
  return {
    orchestratorStatus: 'ACTIVE_READY',
    totalAgents: agentOrchestrator.agents.size,
    sharedContextBus: 'CONNECTED',
    mlPredictionIntegration: 'ENABLED',
    hybridRAGIntegration: 'ENABLED',
    agents: agentOrchestrator.getAgentList()
  };
}

module.exports = {
  agentOrchestrator,
  getAgentStatus,
  dispatchMultiAgentFlow: (query, opts) => agentOrchestrator.dispatchMultiAgentFlow(query, opts)
};
