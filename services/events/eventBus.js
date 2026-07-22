/**
 * YantraMitra Platform — Central Publish/Subscribe Event Bus
 * Non-blocking asynchronous event dispatcher with topic matching and subscriber management.
 */

const EventEmitter = require('events');
const { EVENT_TYPES } = require('./eventTypes');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
    this.subscribersCount = 0;
    this.publishedEventsCount = 0;
  }

  /**
   * Publishes an event to all registered topic subscribers asynchronously
   */
  publish(eventType, payload = {}) {
    const event = {
      eventId: `EVT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      eventType,
      machineId: payload.machineId || payload.machine?.id || 'mach-generic',
      machineName: payload.machineName || payload.machine?.name || 'Industrial Equipment',
      severity: payload.severity || 'INFO',
      payload,
      publishedAt: new Date().toISOString()
    };

    this.publishedEventsCount++;

    // Emit event on specific channel and wildcard channel
    this.emit(eventType, event);
    this.emit('*', event);

    return event;
  }

  /**
   * Subscribes a callback handler to a specific event type or wildcard '*'
   */
  subscribe(eventType, handler) {
    this.on(eventType, handler);
    this.subscribersCount++;
    return () => {
      this.off(eventType, handler);
      this.subscribersCount--;
    };
  }
}

module.exports = new EventBus();
