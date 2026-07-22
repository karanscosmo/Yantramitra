/**
 * YantraMitra Platform — Reactive Trigger Engine
 * Listens to published events, evaluates matching rules, and executes autonomous reactive triggers:
 * 1. High Vibration -> Automatically creates Spindle Vibration Workflow
 * 2. Critical Prediction -> Triggers Multi-Agent RCA Analysis
 * 3. Low Inventory -> Dispatches Maintenance Notification
 * 4. Safety Violation -> Halts/Pauses Active Workflow
 */

const eventBus = require('./eventBus');
const ruleEngine = require('./ruleEngine');
const workflowService = require('../workflows');
const agentService = require('../agents');

class TriggerEngine {
  constructor() {
    this.triggeredActionsCount = 0;
    this.init();
  }

  init() {
    eventBus.subscribe('*', async (event) => {
      await this.processEventTriggers(event);
    });
  }

  async processEventTriggers(event) {
    const triggeredRules = ruleEngine.evaluateEvent(event);

    for (const rule of triggeredRules) {
      this.triggeredActionsCount++;

      try {
        if (rule.action === 'TRIGGER_WORKFLOW') {
          const tplId = rule.actionPayload.templateId || 'tpl_spindle_vibration';
          await workflowService.workflowEngine.createAndSimulateWorkflow(tplId, { id: event.machineId, name: event.machineName });
        } else if (rule.action === 'LAUNCH_RCA_AGENT') {
          await agentService.dispatchMultiAgentFlow(`Analyze critical failure risk for ${event.machineName}`, { machineId: event.machineId, userIntent: 'diagnostics' });
        } else if (rule.action === 'NOTIFY_PLANNER') {
          workflowService.notificationEngine.dispatchNotification('MAINTENANCE_TECH', 'Low Inventory Alert', `Low stock detected for machine ${event.machineName}. Reorder recommended.`);
        } else if (rule.action === 'HALT_WORKFLOW') {
          const activeWorkflows = workflowService.workflowEngine.listAllWorkflows();
          const targetWf = activeWorkflows.find(w => w.machineId === event.machineId) || activeWorkflows[activeWorkflows.length - 1];
          if (targetWf) {
            workflowService.workflowEngine.pauseWorkflow(targetWf.workflowId);
          }
        }
      } catch (e) {
        console.warn(`[Trigger Engine] Trigger execution error for rule ${rule.ruleId}:`, e.message);
      }
    }
  }
}

module.exports = new TriggerEngine();
