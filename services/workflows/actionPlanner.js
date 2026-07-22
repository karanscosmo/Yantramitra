/**
 * YantraMitra Platform — Autonomous Action Planner
 * Converts multi-agent outputs (RCA, Planner, Work Order, Safety) or workflow templates
 * into structured executable task graphs with risk levels, prerequisites, and rollback routines.
 */

const { WORKFLOW_TEMPLATES, getTemplateById } = require('./workflowTemplates');

class ActionPlanner {
  createWorkflowPlan(templateId, machine, customOptions = {}) {
    const template = getTemplateById(templateId) || WORKFLOW_TEMPLATES.preventive_maintenance;
    const machineName = machine?.name || customOptions.machineName || 'Industrial Machine';
    const workflowId = `WF-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const executableSteps = template.steps.map((step, idx) => ({
      stepIndex: idx + 1,
      stepId: step.id,
      name: step.name,
      riskLevel: step.risk,
      autoApprove: step.autoApprove,
      status: 'PENDING',
      executedAt: null,
      rollbackRoutine: step.rollbackStep,
      prerequisites: idx > 0 ? [template.steps[idx - 1].id] : []
    }));

    return {
      workflowId,
      templateId: template.templateId,
      title: `${template.name} — ${machineName}`,
      category: template.category,
      machineName,
      machineId: machine?.id || customOptions.machineId || 'mach-generic',
      overallRiskLevel: template.riskLevel,
      estimatedDurationMinutes: template.estimatedDurationMinutes,
      currentStepIndex: 0,
      totalSteps: executableSteps.length,
      status: 'PLAN_GENERATED',
      steps: executableSteps,
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = new ActionPlanner();
