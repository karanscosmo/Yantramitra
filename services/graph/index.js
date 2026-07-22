/**
 * YantraMitra Platform — Industrial Knowledge Graph System Facade
 */

const graphEngine = require('./graphEngine');
const { NODE_TYPES, RELATIONSHIP_TYPES } = require('./graphSchema');

function getGraphSystemStatus() {
  const stats = graphEngine.getStats();
  return {
    graphStatus: 'ACTIVE_READY',
    ...stats,
    nodeTypes: Object.values(NODE_TYPES),
    relationshipTypes: Object.values(RELATIONSHIP_TYPES)
  };
}

module.exports = {
  graphEngine,
  NODE_TYPES,
  RELATIONSHIP_TYPES,
  getGraphSystemStatus
};
