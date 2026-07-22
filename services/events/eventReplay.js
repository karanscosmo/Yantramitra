/**
 * YantraMitra Platform — Event Replay Engine
 * Replays historical event trajectories sequentially through the Event Bus and Trigger Engine
 * for debugging, regression testing, and scenario analysis.
 */

const eventBus = require('./eventBus');
const eventHistory = require('./eventHistory');

class EventReplayEngine {
  async replayEvents(eventIds = [], options = {}) {
    let eventsToReplay = [];

    if (eventIds && eventIds.length > 0) {
      eventsToReplay = eventIds.map(id => eventHistory.getEventById(id)).filter(Boolean);
    } else {
      eventsToReplay = eventHistory.queryHistory({ limit: options.limit || 10 });
    }

    const replayed = [];
    for (const evt of eventsToReplay) {
      const replayEvent = eventBus.publish(evt.eventType, {
        ...evt.payload,
        isReplay: true,
        originalEventId: evt.eventId
      });
      replayed.push(replayEvent);
    }

    return {
      replayStatus: 'COMPLETED',
      replayedCount: replayed.length,
      replayedEvents: replayed,
      replayedAt: new Date().toISOString()
    };
  }
}

module.exports = new EventReplayEngine();
