/**
 * YantraMitra Platform — Industrial Workflow Templates Catalog
 * Defines pre-built operational workflow templates for standard industrial maintenance procedures.
 */

const WORKFLOW_TEMPLATES = {
  bearing_replacement: {
    templateId: 'tpl_bearing_replacement',
    name: 'Spindle Bearing Replacement & Laser Alignment',
    category: 'Mechanical Overhaul',
    targetEquipmentType: 'CNC Milling Spindle / Lathe',
    riskLevel: 'HIGH',
    estimatedDurationMinutes: 240,
    steps: [
      { id: 'step_1', name: 'LOTO Zero-Energy State Isolation', risk: 'HIGH', autoApprove: false, rollbackStep: 'Remove LOTO padlocks & restore electrical isolation breaker' },
      { id: 'step_2', name: 'Coolant & Pneumatic Line Depressurization', risk: 'MEDIUM', autoApprove: true, rollbackStep: 'Re-pressurize lines to nominal 6 bar' },
      { id: 'step_3', name: 'Extract Worn Bearing Set using Hydraulic Puller', risk: 'MEDIUM', autoApprove: true, rollbackStep: 'Re-seat original bearing package' },
      { id: 'step_4', name: 'Install OEM Matched Ceramic Precision Bearings', risk: 'HIGH', autoApprove: false, rollbackStep: 'Extract replacement bearings' },
      { id: 'step_5', name: 'Execute Laser Radial Runout Alignment (<0.003 mm)', risk: 'LOW', autoApprove: true, rollbackStep: 'Reset alignment baseline' },
      { id: 'step_6', name: '30-Minute No-Load Spin Test & Vibration Spectrum Logging', risk: 'LOW', autoApprove: true, rollbackStep: 'Halt spin test & log anomaly' }
    ]
  },

  motor_overheating: {
    templateId: 'tpl_motor_overheating',
    name: 'Electric Motor Thermal Flush & Stator Inspection',
    category: 'Electrical & Thermal Maintenance',
    targetEquipmentType: 'Heavy Induction Motor',
    riskLevel: 'HIGH',
    estimatedDurationMinutes: 180,
    steps: [
      { id: 'step_1', name: 'Verify Motor Electrical Lockout & Megger Test', risk: 'HIGH', autoApprove: false, rollbackStep: 'Reconnect motor feeder breaker' },
      { id: 'step_2', name: 'Flush Stator Water Cooling Jacket with Descaling Solution', risk: 'MEDIUM', autoApprove: true, rollbackStep: 'Drain descaling fluid & flush with deionized water' },
      { id: 'step_3', name: 'Inspect Winding Insulation Resistance (500V Megger)', risk: 'LOW', autoApprove: true, rollbackStep: 'Log baseline resistance' },
      { id: 'step_4', name: 'Re-torque Terminal Block Studs to 45 Nm', risk: 'MEDIUM', autoApprove: true, rollbackStep: 'Loosen terminal block fasteners' },
      { id: 'step_5', name: 'Energize Motor & Log Thermal Imaging Camera Baseline', risk: 'HIGH', autoApprove: false, rollbackStep: 'Trip motor circuit breaker immediately' }
    ]
  },

  pump_cavitation: {
    templateId: 'tpl_pump_cavitation',
    name: 'Hydraulic Pump Cavitation Relief & Seal Overhaul',
    category: 'Fluid Power',
    targetEquipmentType: 'Hydraulic Pump Station',
    riskLevel: 'MEDIUM',
    estimatedDurationMinutes: 150,
    steps: [
      { id: 'step_1', name: 'Close Suction Isolation Valve & Bleed Accumulator Pressure', risk: 'HIGH', autoApprove: false, rollbackStep: 'Open suction isolation valve' },
      { id: 'step_2', name: 'Replace Damaged Viton Shaft Seals & O-Rings', risk: 'MEDIUM', autoApprove: true, rollbackStep: 'Re-install seal housing' },
      { id: 'step_3', name: 'Prime Hydraulic Suction Line & Remove Entrained Air', risk: 'LOW', autoApprove: true, rollbackStep: 'Drain suction reservoir' },
      { id: 'step_4', name: 'Set Proportional Pressure Relief Valve to 17.5 bar', risk: 'MEDIUM', autoApprove: true, rollbackStep: 'Back off pressure setting to 10 bar' }
    ]
  },

  spindle_vibration: {
    templateId: 'tpl_spindle_vibration',
    name: 'Dynamic Spindle Balancing & Belt Tensioning',
    category: 'Vibration Diagnostics',
    targetEquipmentType: 'High-Speed CNC Milling Spindle',
    riskLevel: 'MEDIUM',
    estimatedDurationMinutes: 120,
    steps: [
      { id: 'step_1', name: 'Measure Baseline Vibration Velocity FFT Spectrum', risk: 'LOW', autoApprove: true, rollbackStep: 'Clear FFT baseline log' },
      { id: 'step_2', name: 'Adjust Gates Poly-V Belt Tension to 150 Hz Sonic Target', risk: 'MEDIUM', autoApprove: true, rollbackStep: 'De-tension drive belt' },
      { id: 'step_3', name: 'Attach Precision Counterweights to Spindle Flange', risk: 'MEDIUM', autoApprove: true, rollbackStep: 'Remove counterweights' },
      { id: 'step_4', name: 'Verify Vibration RMS Velocity (<1.8 mm/s ISO 10816)', risk: 'LOW', autoApprove: true, rollbackStep: 'Halt vibration run' }
    ]
  },

  emergency_shutdown: {
    templateId: 'tpl_emergency_shutdown',
    name: 'Zero-Energy Emergency Safety Interlock Shutdown',
    category: 'Safety Interlock',
    targetEquipmentType: 'All Heavy Industrial Equipment',
    riskLevel: 'CRITICAL',
    estimatedDurationMinutes: 15,
    steps: [
      { id: 'step_1', name: 'Trigger Automated Emergency Stop (E-STOP) Interlock', risk: 'CRITICAL', autoApprove: false, rollbackStep: 'Manual E-STOP Reset Authorization' },
      { id: 'step_2', name: 'Isolate Main Electrical Bus Breaker CB-101', risk: 'CRITICAL', autoApprove: false, rollbackStep: 'Re-close CB-101 after safety clearance' },
      { id: 'step_3', name: 'Dump Pneumatic Pressure Lines to 0 bar', risk: 'HIGH', autoApprove: true, rollbackStep: 'Re-pressurize pneumatic header' },
      { id: 'step_4', name: 'Dispatch EHS Emergency Alert to Plant Safety Officer', risk: 'LOW', autoApprove: true, rollbackStep: 'Cancel EHS alert' }
    ]
  },

  preventive_maintenance: {
    templateId: 'tpl_preventive_maintenance',
    name: 'Standard 500-Hour Preventive Maintenance Inspection',
    category: 'Routine PM',
    targetEquipmentType: 'Generic Industrial Machinery',
    riskLevel: 'LOW',
    estimatedDurationMinutes: 90,
    steps: [
      { id: 'step_1', name: 'Inspect Drive Belt Tension & Pulley Alignment', risk: 'LOW', autoApprove: true, rollbackStep: 'Re-check belt alignment' },
      { id: 'step_2', name: 'Replenish Synthetic Grease (Klüberplex BEV 41-822)', risk: 'LOW', autoApprove: true, rollbackStep: 'Wipe excess grease' },
      { id: 'step_3', name: 'Clean SCADA Telemetry Optical Sensor Lenses', risk: 'LOW', autoApprove: true, rollbackStep: 'Re-verify sensor calibration' },
      { id: 'step_4', name: 'Log Complete Sensor Diagnostic Check & Reset PM Timer', risk: 'LOW', autoApprove: true, rollbackStep: 'Restore PM timer count' }
    ]
  }
};

module.exports = {
  WORKFLOW_TEMPLATES,
  getTemplateById: (id) => WORKFLOW_TEMPLATES[id] || Object.values(WORKFLOW_TEMPLATES).find(t => t.templateId === id) || null,
  listAllTemplates: () => Object.values(WORKFLOW_TEMPLATES)
};
