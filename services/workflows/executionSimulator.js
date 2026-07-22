/**
 * YantraMitra Platform — Workflow Execution Simulator
 * Conducts dry-run simulations of operational workflows to predict downtime hours,
 * production throughput loss, financial impact (INR), and safety risk scores (0 to 100).
 */

class ExecutionSimulator {
  simulateWorkflow(workflowPlan) {
    const totalMinutes = workflowPlan.estimatedDurationMinutes || 120;
    const estimatedDowntimeHours = Math.round((totalMinutes / 60) * 10) / 10;
    const overallRisk = workflowPlan.overallRiskLevel || 'MEDIUM';

    let safetyRiskScore = 35;
    let financialImpactINR = estimatedDowntimeHours * 45000; // INR 45,000 per downtime hour
    let productionUnitsLost = Math.round(estimatedDowntimeHours * 120);

    if (overallRisk === 'CRITICAL') {
      safetyRiskScore = 88;
      financialImpactINR = estimatedDowntimeHours * 95000;
    } else if (overallRisk === 'HIGH') {
      safetyRiskScore = 65;
      financialImpactINR = estimatedDowntimeHours * 65000;
    } else if (overallRisk === 'LOW') {
      safetyRiskScore = 15;
      financialImpactINR = estimatedDowntimeHours * 22000;
    }

    const stepImpacts = workflowPlan.steps.map(step => ({
      stepId: step.stepId,
      stepName: step.name,
      predictedDowntimeMinutes: Math.round(totalMinutes / workflowPlan.steps.length),
      requiresLOTO: step.name.toLowerCase().includes('loto') || step.name.toLowerCase().includes('zero-energy'),
      safetyPrecaution: step.risk === 'HIGH' || step.risk === 'CRITICAL' ? 'Mandatory Supervisor On-Site Clearance' : 'Standard Technician PPE'
    }));

    return {
      workflowId: workflowPlan.workflowId,
      simulationStatus: 'DRY_RUN_PASSED',
      predictedDowntimeHours: estimatedDowntimeHours,
      predictedProductionUnitsLost: productionUnitsLost,
      predictedFinancialImpactINR: financialImpactINR,
      safetyRiskScore, // Scale 0 (Safe) to 100 (Severe)
      riskCategory: safetyRiskScore > 75 ? 'HIGH_RISK_ACTION' : safetyRiskScore > 40 ? 'MEDIUM_RISK_ACTION' : 'LOW_RISK_ACTION',
      stepImpacts,
      simulatedAt: new Date().toISOString()
    };
  }
}

module.exports = new ExecutionSimulator();
