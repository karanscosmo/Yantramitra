/**
 * YantraMitra Platform — Autonomous Multi-Step Workflow Engine
 * Manages stateful execution of operational workflow graphs:
 * Supports Dry-Run Simulation, Risk Approval Gates, Step Execution, Pause/Resume, Retry, and Automated Rollback.
 */

const actionPlanner = require('./actionPlanner');
const executionSimulator = require('./executionSimulator');
const approvalEngine = require('./approvalEngine');
const auditTrail = require('./auditTrail');
const notificationEngine = require('./notificationEngine');

class WorkflowEngine {
  constructor() {
    this.activeWorkflows = new Map();
  }

  /**
   * Initializes and dry-runs a new workflow plan
   */
  async createAndSimulateWorkflow(templateId, machine, customOptions = {}) {
    const plan = actionPlanner.createWorkflowPlan(templateId, machine, customOptions);
    const simulation = executionSimulator.simulateWorkflow(plan);

    plan.simulation = simulation;
    plan.status = 'SIMULATED_READY';

    this.activeWorkflows.set(plan.workflowId, plan);

    auditTrail.logEvent(plan.workflowId, 'WORKFLOW_CREATED', `Workflow "${plan.title}" plan created & dry-run simulated.`, { simulation });
    notificationEngine.dispatchNotification('SUPERVISOR', 'New Workflow Dry-Run Simulated', `Workflow ${plan.workflowId} (${plan.title}) passed dry-run simulation. Risk: ${simulation.riskCategory}.`);

    return {
      plan,
      simulation
    };
  }

  /**
   * Executes the next pending step in a workflow graph
   */
  async executeNextStep(workflowId, supervisorAuthorization = null) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    if (workflow.status === 'PAUSED') {
      throw new Error(`Workflow ${workflowId} is PAUSED. Resume execution first.`);
    }
    if (workflow.status === 'COMPLETED' || workflow.status === 'ROLLED_BACK') {
      return { workflowStatus: workflow.status, message: `Workflow is already in final state: ${workflow.status}` };
    }

    const currentIdx = workflow.currentStepIndex;
    if (currentIdx >= workflow.steps.length) {
      workflow.status = 'COMPLETED';
      auditTrail.logEvent(workflowId, 'WORKFLOW_COMPLETED', `All ${workflow.totalSteps} steps completed successfully.`);
      notificationEngine.dispatchNotification('OPERATOR', 'Workflow Completed', `Workflow ${workflowId} (${workflow.title}) executed cleanly.`);
      return { workflowStatus: workflow.status, workflow };
    }

    const step = workflow.steps[currentIdx];

    // Check Approval
    let approval = approvalEngine.evaluateStepApproval(step, workflow);
    if (approval.requiresSupervisor && supervisorAuthorization) {
      approval = approvalEngine.authorizeStep(step, supervisorAuthorization);
    }

    if (approval.approvalStatus === 'PENDING_SUPERVISOR_APPROVAL') {
      workflow.status = 'AWAITING_APPROVAL';
      auditTrail.logEvent(workflowId, 'APPROVAL_REQUIRED', `Step ${step.stepIndex} (${step.name}) requires supervisor clearance.`, { step });
      notificationEngine.dispatchNotification('SUPERVISOR', 'Supervisor Authorization Required', `Step ${step.stepIndex} of ${workflowId} requires approval.`);
      return {
        workflowStatus: workflow.status,
        pendingStep: step,
        approvalNeeded: approval
      };
    }

    // Execute Step
    step.status = 'IN_PROGRESS';
    step.executedAt = new Date().toISOString();

    // Simulate Step Execution Result (100% Deterministic Success)
    step.status = 'COMPLETED';
    workflow.currentStepIndex++;

    auditTrail.logEvent(workflowId, 'STEP_EXECUTED', `Executed Step ${step.stepIndex}: ${step.name}`, { step, approval });

    if (workflow.currentStepIndex >= workflow.steps.length) {
      workflow.status = 'COMPLETED';
      auditTrail.logEvent(workflowId, 'WORKFLOW_COMPLETED', `All ${workflow.totalSteps} steps executed cleanly.`);
    } else {
      workflow.status = 'IN_PROGRESS';
    }

    return {
      workflowStatus: workflow.status,
      executedStep: step,
      remainingSteps: workflow.totalSteps - workflow.currentStepIndex,
      workflow
    };
  }

  /**
   * Approves a pending high-risk workflow step
   */
  async approveStep(workflowId, supervisorName = 'Shift Supervisor') {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    if (workflow.status === 'AWAITING_APPROVAL') {
      workflow.status = 'IN_PROGRESS';
    }
    return this.executeNextStep(workflowId, supervisorName);
  }

  /**
   * Pauses an active workflow
   */
  pauseWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
    workflow.status = 'PAUSED';
    auditTrail.logEvent(workflowId, 'WORKFLOW_PAUSED', `Workflow execution paused by operator.`);
    notificationEngine.dispatchNotification('OPERATOR', 'Workflow Paused', `Workflow ${workflowId} has been paused.`);
    return workflow;
  }

  /**
   * Resumes a paused workflow
   */
  resumeWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
    workflow.status = 'IN_PROGRESS';
    auditTrail.logEvent(workflowId, 'WORKFLOW_RESUMED', `Workflow execution resumed by operator.`);
    return workflow;
  }

  /**
   * Automated Rollback of executed workflow steps
   */
  rollbackWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    const executedSteps = workflow.steps.filter(s => s.status === 'COMPLETED').reverse();
    const rollbackLog = [];

    executedSteps.forEach(s => {
      s.status = 'ROLLED_BACK';
      rollbackLog.push({ stepId: s.stepId, name: s.name, routineExecuted: s.rollbackRoutine });
    });

    workflow.status = 'ROLLED_BACK';
    auditTrail.logEvent(workflowId, 'WORKFLOW_ROLLED_BACK', `Workflow execution rolled back cleanly.`, { rollbackLog });
    notificationEngine.dispatchNotification('SUPERVISOR', 'Workflow Rolled Back', `Workflow ${workflowId} executed automated rollback routine.`);

    return {
      workflowId,
      status: workflow.status,
      rollbackLog
    };
  }

  getWorkflowById(workflowId) {
    return this.activeWorkflows.get(workflowId) || null;
  }

  listAllWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }
}

module.exports = new WorkflowEngine();
