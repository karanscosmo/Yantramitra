/**
 * YantraMitra Platform — Industrial Knowledge Graph Node & Relationship Schemas
 * Defines all node types and typed relationship schemas for the operational knowledge graph.
 */

const NODE_TYPES = {
  PLANT: 'Plant',
  LINE: 'ProductionLine',
  MACHINE: 'Machine',
  SENSOR: 'Sensor',
  ALARM: 'Alarm',
  SOP: 'SOP',
  MANUAL: 'Manual',
  WORKFLOW: 'Workflow',
  WORK_ORDER: 'WorkOrder',
  INCIDENT: 'Incident',
  SPARE_PART: 'SparePart',
  TECHNICIAN: 'Technician'
};

const RELATIONSHIP_TYPES = {
  CONTAINS: 'CONTAINS',               // Plant → Line, Line → Machine
  HAS_SENSOR: 'HAS_SENSOR',           // Machine → Sensor
  TRIGGERS: 'TRIGGERS',               // Sensor → Alarm
  GOVERNED_BY: 'GOVERNED_BY',         // Machine → SOP, Machine → Manual
  INITIATES: 'INITIATES',             // Alarm → Workflow
  GENERATES: 'GENERATES',             // Workflow → WorkOrder
  REQUIRES: 'REQUIRES',               // WorkOrder → SparePart
  ASSIGNED_TO: 'ASSIGNED_TO',         // WorkOrder → Technician
  DOCUMENTED_IN: 'DOCUMENTED_IN',     // Incident → Manual, Incident → SOP
  RELATED_TO: 'RELATED_TO',           // Incident → Alarm, Incident → Machine
  SIMILAR_TO: 'SIMILAR_TO',           // Machine → Machine (similarity)
  CAUSED_BY: 'CAUSED_BY'              // Incident → Machine
};

module.exports = { NODE_TYPES, RELATIONSHIP_TYPES };
