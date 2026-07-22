/**
 * YantraMitra Platform — Autonomous Industrial Digital Worker & Workflow System Facade
 */

const workflowEngine = require('./workflowEngine');
const actionPlanner = require('./actionPlanner');
const executionSimulator = require('./executionSimulator');
const approvalEngine = require('./approvalEngine');
const auditTrail = require('./auditTrail');
const notificationEngine = require('./notificationEngine');
const { WORKFLOW_TEMPLATES, listAllTemplates, getTemplateById } = require('./workflowTemplates');

function getWorkflowSystemStatus() {
  return {
    engineStatus: 'ACTIVE_READY',
    digitalWorkerMode: 'AUTONOMOUS_WORKFLOW_EXECUTION',
    totalActiveWorkflows: workflowEngine.activeWorkflows.size,
    availableTemplatesCount: Object.keys(WORKFLOW_TEMPLATES).length,
    auditTrailLedgerEntries: auditTrail.ledger.length,
    notificationsCount: notificationEngine.notifications.length,
    features: ['Multi-Step Execution', 'Dry-Run Simulation', 'Risk Approval Gates', 'Pause/Resume/Retry', 'Automated Rollback', 'Immutable Audit Trail']
  };
}

module.exports = {
  workflowEngine,
  actionPlanner,
  executionSimulator,
  approvalEngine,
  auditTrail,
  notificationEngine,
  WORKFLOW_TEMPLATES,
  listAllTemplates,
  getTemplateById,
  getWorkflowSystemStatus
};
