/**
 * YantraMitra Platform — Reactive Rule Engine
 * Evaluates user-defined IF -> THEN reactive rules supporting boolean AND/OR operators across event payloads.
 */

class RuleEngine {
  constructor() {
    this.rules = [
      {
        ruleId: 'rule_vibration_workflow',
        name: 'High Vibration Workflow Trigger',
        eventType: 'event.industrial.telemetry',
        priority: 'HIGH',
        logic: 'OR',
        conditions: [
          { field: 'payload.vibration', operator: '>', value: 4.5 },
          { field: 'payload.vibrationVelocity', operator: '>', value: 4.5 }
        ],
        action: 'TRIGGER_WORKFLOW',
        actionPayload: { templateId: 'tpl_spindle_vibration' }
      },
      {
        ruleId: 'rule_critical_prediction_rca',
        name: 'Critical ML Prediction RCA Dispatch',
        eventType: 'event.industrial.prediction',
        priority: 'CRITICAL',
        logic: 'AND',
        conditions: [
          { field: 'payload.failureProbability', operator: '>', value: 70.0 }
        ],
        action: 'LAUNCH_RCA_AGENT',
        actionPayload: { userIntent: 'diagnostics' }
      },
      {
        ruleId: 'rule_low_inventory_notification',
        name: 'Low Inventory Reorder Alert',
        eventType: 'event.industrial.inventory',
        priority: 'NORMAL',
        logic: 'AND',
        conditions: [
          { field: 'payload.quantityInStock', operator: '<', value: 2 }
        ],
        action: 'NOTIFY_PLANNER',
        actionPayload: { role: 'MAINTENANCE_TECH' }
      },
      {
        ruleId: 'rule_safety_loto_violation_pause',
        name: 'Safety LOTO Violation Workflow Interlock',
        eventType: 'event.industrial.safety',
        priority: 'CRITICAL',
        logic: 'OR',
        conditions: [
          { field: 'payload.lotoMissing', operator: '===', value: true },
          { field: 'payload.ppeMissing', operator: '===', value: true }
        ],
        action: 'HALT_WORKFLOW',
        actionPayload: { reason: 'CRITICAL_SAFETY_VIOLATION' }
      }
    ];
  }

  getValueByPath(obj, pathStr) {
    return pathStr.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  evaluateCondition(condition, event) {
    const val = this.getValueByPath(event, condition.field);
    if (val === undefined) return false;

    switch (condition.operator) {
      case '>': return val > condition.value;
      case '>=': return val >= condition.value;
      case '<': return val < condition.value;
      case '<=': return val <= condition.value;
      case '===': return val === condition.value;
      case '!==': return val !== condition.value;
      default: return false;
    }
  }

  evaluateEvent(event) {
    const triggeredRules = [];
    const matchingRules = this.rules.filter(r => r.eventType === event.eventType || r.eventType === '*');

    for (const rule of matchingRules) {
      const results = rule.conditions.map(cond => this.evaluateCondition(cond, event));
      const isTriggered = rule.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);

      if (isTriggered) {
        triggeredRules.push(rule);
      }
    }

    return triggeredRules;
  }
}

module.exports = new RuleEngine();
