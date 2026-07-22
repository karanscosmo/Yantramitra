/**
 * YantraMitra Platform — Autonomous Maintenance Planner Agent
 * Generates preventive & corrective maintenance execution plans, downtime estimates,
 * required technician staffing, skill levels, and precision tooling.
 */

class MaintenancePlannerAgent {
  constructor() {
    this.agentId = 'agent-planner-02';
    this.name = 'Maintenance Planner Agent';
    this.type = 'Execution Planning Engine';
    this.capabilities = ['Downtime Estimation', 'Technician Staffing Allocation', 'Tooling Package Assembly', 'Task Sequence Synthesis'];
  }

  async execute(sharedContext) {
    const { machine, rcaOutput } = sharedContext;
    const machineName = machine?.name || 'Target Equipment';
    const probableCause = rcaOutput?.probableRootCause || 'Standard Component Wear';

    let estimatedDowntimeHours = 2.5;
    let requiredTechnicians = 2;
    let skillLevel = 'L2 Senior Mechanical Technician';

    if (probableCause.includes('Bearing') || probableCause.includes('Spindle')) {
      estimatedDowntimeHours = 4.0;
      requiredTechnicians = 2;
      skillLevel = 'L3 Precision Mechanical Specialist';
    } else if (probableCause.includes('Winding') || probableCause.includes('Overheating')) {
      estimatedDowntimeHours = 3.5;
      requiredTechnicians = 2;
      skillLevel = 'L3 High-Voltage Certified Electrician';
    }

    const taskSequence = [
      '1. Execute LOTO zero-energy isolation and verify pressure dissipation.',
      '2. Disassemble protective drive enclosure and inspect for mechanical debris.',
      '3. Extract worn component set using hydraulic puller fixture.',
      '4. Install replacement component using precision torque wrench to OEM specs.',
      '5. Perform alignment calibration and laser runout check prior to restart.'
    ];

    const requiredTools = [
      'Precision Torque Wrench (10 - 150 Nm)',
      'Gates Sonic Belt Tension Meter',
      'Laser Alignment System',
      'Digital Dial Indicator (0.001 mm resolution)',
      '500V Insulation Megger Tester'
    ];

    const planResult = {
      agentId: this.agentId,
      agentName: this.name,
      targetMachine: machineName,
      maintenanceType: probableCause.includes('Overhaul') ? 'Major Overhaul' : 'Corrective Precision Repair',
      estimatedDowntimeHours,
      requiredTechnicians,
      requiredSkillLevel: skillLevel,
      taskSequence,
      requiredTools
    };

    sharedContext.plannerOutput = planResult;
    return planResult;
  }
}

module.exports = new MaintenancePlannerAgent();
