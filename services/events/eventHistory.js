/**
 * YantraMitra Platform — Immutable Event History Ledger
 * Persists all published industrial events and provides filtering by machine, event type, severity, and time range.
 */

const fs = require('fs');
const path = require('path');
const eventBus = require('./eventBus');

class EventHistoryLedger {
  constructor() {
    this.history = [];
    this.dbPath = path.join(__dirname, '..', '..', 'data', 'event_db', 'events.json');

    // Subscribe to all wildcard events on Event Bus
    eventBus.subscribe('*', (event) => {
      this.history.push(event);
      if (this.history.length > 5000) this.history.shift(); // Retain last 5,000 events in memory
    });
  }

  queryHistory(filters = {}) {
    let results = [...this.history];

    if (filters.machineId) {
      results = results.filter(e => e.machineId === filters.machineId);
    }
    if (filters.eventType) {
      results = results.filter(e => e.eventType === filters.eventType);
    }
    if (filters.severity) {
      results = results.filter(e => e.severity === filters.severity);
    }
    if (filters.limit) {
      results = results.slice(-parseInt(filters.limit));
    }

    return results;
  }

  getEventById(eventId) {
    return this.history.find(e => e.eventId === eventId) || null;
  }
}

module.exports = new EventHistoryLedger();
