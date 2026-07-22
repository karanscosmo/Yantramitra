/**
 * YantraMitra Platform — Event Types & Payload Schemas
 * Standardized industrial event taxonomy covering Telemetry, Alarms, Predictions, Workflows, Maintenance, Inventory, Safety.
 */

const EVENT_TYPES = {
  TELEMETRY: 'event.industrial.telemetry',
  ALARM: 'event.industrial.alarm',
  PREDICTION: 'event.industrial.prediction',
  WORKFLOW: 'event.industrial.workflow',
  MAINTENANCE: 'event.industrial.maintenance',
  INVENTORY: 'event.industrial.inventory',
  SAFETY: 'event.industrial.safety'
};

const SEVERITY_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

module.exports = {
  EVENT_TYPES,
  SEVERITY_LEVELS
};
