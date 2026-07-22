/**
 * YantraMitra Platform — Autonomous Work Order Generation Agent
 * Synthesizes structured, actionable maintenance work orders (WO-2026-XXXX) with priority rating,
 * step-by-step checklist, safety directives, and estimated labor hours.
 */

class WorkOrderAgent {
  constructor() {
    this.agentId = 'agent-wo-04';
    this.name = 'Work Order Generation Agent';
    this.type = 'Operational Dispatch Engine';
    this.capabilities = ['Prisma WorkOrder Payload Generation', 'Priority Matrix Rating', 'Safety Note Embedding', 'Labor Hour Scheduling'];
  }

  async execute(sharedContext) {
    const { machine, rcaOutput, plannerOutput, sparePartsOutput } = sharedContext;
    const machineName = machine?.name || 'Target Equipment';
    const failureProb = rcaOutput?.failureProbability ?? 15.0;

    let priority = 'MEDIUM';
    if (failureProb > 60.0) priority = 'CRITICAL';
    else if (failureProb > 30.0) priority = 'HIGH';

    const woNumber = `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const workOrderResult = {
      agentId: this.agentId,
      agentName: this.name,
      workOrderNumber: woNumber,
      title: `Precision Maintenance — ${machineName} (${rcaOutput?.probableRootCause || 'Component Overhaul'})`,
      machineName,
      priority,
      status: 'PENDING_APPROVAL',
      estimatedDurationHours: plannerOutput?.estimatedDowntimeHours || 3.0,
      assignedTechnicians: plannerOutput?.requiredTechnicians || 2,
      skillLevelRequired: plannerOutput?.requiredSkillLevel || 'L2 Senior Technician',
      checklist: plannerOutput?.taskSequence || [
        'Perform LOTO isolation and verify zero-energy state',
        'Replace worn component set and recalibrate alignment',
        'Perform 30-minute test run and log vibration SCADA readings'
      ],
      partsRequired: sparePartsOutput?.recommendedParts.map(p => `${p.partName} (${p.partNumber})`) || ['Standard Component Set'],
      createdAt: new Date().toISOString()
    };

    sharedContext.workOrderOutput = workOrderResult;
    return workOrderResult;
  }
}

module.exports = new WorkOrderAgent();
