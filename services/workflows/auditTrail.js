/**
 * YantraMitra Platform — Immutable Workflow Audit Trail Ledger
 * Records an append-only audit log of every workflow decision, dry-run simulation result,
 * supervisor approval, step execution, and automated rollback event.
 */

class AuditTrailLedger {
  constructor() {
    this.ledger = [];
  }

  logEvent(workflowId, eventType, description, payload = {}) {
    const entry = {
      entryId: `AUD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      workflowId,
      eventType, // e.g. 'WORKFLOW_CREATED', 'SIMULATION_EXECUTED', 'APPROVAL_REQUESTED', 'STEP_COMPLETED', 'ROLLBACK_TRIGGERED'
      description,
      payload,
      timestamp: new Date().toISOString()
    };
    this.ledger.push(entry);
    return entry;
  }

  getAuditHistoryForWorkflow(workflowId) {
    return this.ledger.filter(entry => entry.workflowId === workflowId);
  }

  getAllAuditLogs() {
    return this.ledger;
  }
}

module.exports = new AuditTrailLedger();
