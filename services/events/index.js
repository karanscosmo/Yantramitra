/**
 * YantraMitra Platform — Event-Driven Industrial Architecture Facade
 */

const eventBus = require('./eventBus');
const eventHistory = require('./eventHistory');
const ruleEngine = require('./ruleEngine');
const triggerEngine = require('./triggerEngine');
const eventReplay = require('./eventReplay');
const { EVENT_TYPES, SEVERITY_LEVELS } = require('./eventTypes');

function getEventSystemStatus() {
  return {
    busStatus: 'ACTIVE_READY',
    architecture: 'PUBLISH_SUBSCRIBE_EVENT_DRIVEN',
    publishedEventsCount: eventBus.publishedEventsCount,
    subscribersCount: eventBus.subscribersCount,
    persistedHistoryCount: eventHistory.history.length,
    activeRulesCount: ruleEngine.rules.length,
    triggeredActionsCount: triggerEngine.triggeredActionsCount,
    eventTypes: Object.values(EVENT_TYPES)
  };
}

module.exports = {
  eventBus,
  eventHistory,
  ruleEngine,
  triggerEngine,
  eventReplay,
  EVENT_TYPES,
  SEVERITY_LEVELS,
  getEventSystemStatus
};
