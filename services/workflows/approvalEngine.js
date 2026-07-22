/**
 * YantraMitra Platform — Workflow Approval Engine
 * Evaluates operational step risk ratings and enforces authorization gates:
 * High/Critical risk steps require supervisor sign-off; Low-risk steps execute automatically.
 */

class ApprovalEngine {
  evaluateStepApproval(step, workflowPlan) {
    if (!step.autoApprove || step.riskLevel === 'CRITICAL' || step.riskLevel === 'HIGH') {
      return {
        stepId: step.stepId,
        approvalStatus: 'PENDING_SUPERVISOR_APPROVAL',
        requiresSupervisor: true,
        authorizedBy: null,
        approvedAt: null,
        authorizationMessage: `Step "${step.name}" is classified as ${step.riskLevel} RISK. High-voltage / LOTO authorization required.`
      };
    }

    return {
      stepId: step.stepId,
      approvalStatus: 'AUTO_APPROVED',
      requiresSupervisor: false,
      authorizedBy: 'SYSTEM_AUTONOMOUS_POLICY',
      approvedAt: new Date().toISOString()
    };
  }

  authorizeStep(step, supervisorName = 'Shift Supervisor') {
    return {
      stepId: step.stepId,
      approvalStatus: 'SUPERVISOR_APPROVED',
      requiresSupervisor: true,
      authorizedBy: supervisorName,
      approvedAt: new Date().toISOString()
    };
  }
}

module.exports = new ApprovalEngine();
