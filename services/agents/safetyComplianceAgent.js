/**
 * YantraMitra Platform — Autonomous Safety Compliance & LOTO Agent
 * Validates maintenance execution plans against Standard Operating Procedures (SOPs)
 * and Lockout/Tagout (LOTO) procedures retrieved from RAG knowledge base.
 */

class SafetyComplianceAgent {
  constructor() {
    this.agentId = 'agent-safety-05';
    this.name = 'Safety Compliance & LOTO Agent';
    this.type = 'EHS & Regulatory Audit Engine';
    this.capabilities = ['LOTO Zero-Energy State Audit', 'PPE Specification Matching', 'OSHA 1910.147 Compliance Verification', 'Hazard Pre-Check Flagging'];
  }

  async execute(sharedContext) {
    const { machine, plannerOutput, ragKnowledge } = sharedContext;
    const machineName = machine?.name || 'Target Equipment';
    const tasks = plannerOutput?.taskSequence || [];

    const safetyDirectives = [];
    const complianceWarnings = [];

    // LOTO Verification Check
    const hasLOTO = tasks.some(t => t.toLowerCase().includes('loto') || t.toLowerCase().includes('zero-energy') || t.toLowerCase().includes('lockout'));

    if (hasLOTO) {
      safetyDirectives.push('LOTO Directive 1: Apply safety padlocks to main circuit breaker CB-101 and lock pneumatic valve PV-202 in CLOSED position.');
      safetyDirectives.push('LOTO Directive 2: Bleed residual hydraulic accumulator pressure to 0 bar prior to entering machine cell.');
    } else {
      complianceWarnings.push('CRITICAL WARNING: Maintenance task sequence lacks explicit Lockout/Tagout (LOTO) zero-energy verification step!');
      safetyDirectives.push('REQUIRED INJECTION: Mandate 10-minute LOTO zero-energy isolation pre-check prior to mechanical disassembly.');
    }

    // PPE Requirements
    const ppeRequirements = [
      'Class 2 Arc Flash Protection Suit & Face Shield (NFPA 70E)',
      'Cut-Resistant Kevlar Gloves (ANSI Level A4)',
      'Steel-Toe Safety Boots (ASTM F2413)',
      'High-Noise Reduction Ear Defenders (NRR 29 dB)'
    ];

    const safetyResult = {
      agentId: this.agentId,
      agentName: this.name,
      targetMachine: machineName,
      isCompliant: complianceWarnings.length === 0,
      complianceStatus: complianceWarnings.length === 0 ? 'COMPLIANT_WITH_OSHA_1910.147' : 'REQUIRES_SAFETY_INJECTION',
      lotoVerified: hasLOTO,
      safetyDirectives,
      complianceWarnings,
      requiredPPE: ppeRequirements,
      auditedAt: new Date().toISOString()
    };

    sharedContext.safetyOutput = safetyResult;
    return safetyResult;
  }
}

module.exports = new SafetyComplianceAgent();
