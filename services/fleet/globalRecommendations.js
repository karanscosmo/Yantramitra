/**
 * YantraMitra Platform — Global Recommendations Engine
 * Synthesizes fleet-wide insights into actionable cross-plant recommendations:
 * maintenance prioritization, inventory redistribution, and resource allocation.
 */

const { FLEET_REGISTRY, MACHINE_TELEMETRY, FleetManager } = require('./fleetManager');
const benchmarkEngine   = require('./benchmarkEngine');
const anomalyDetector   = require('./fleetAnomalyDetector');

const REC_TYPES = {
  URGENT_MAINTENANCE:   'URGENT_MAINTENANCE',
  PREVENTIVE_SCHEDULE:  'PREVENTIVE_SCHEDULE',
  INVENTORY_TRANSFER:   'INVENTORY_TRANSFER',
  TECHNICIAN_REDEPLOY:  'TECHNICIAN_REDEPLOY',
  BEST_PRACTICE_SHARE:  'BEST_PRACTICE_SHARE',
  DECOMMISSION_REVIEW:  'DECOMMISSION_REVIEW'
};

class GlobalRecommendationsEngine {
  generate() {
    const recommendations = [];
    const allMachines = [];
    for (const plant of FLEET_REGISTRY.plants) {
      for (const m of plant.machines) {
        const tel = MACHINE_TELEMETRY[m.machineId];
        if (tel) allMachines.push({ ...m, plantId: plant.plantId, plantName: plant.name, tel });
      }
    }

    // 1. Urgent maintenance for critical/high machines
    const criticalMachines = allMachines.filter(m => ['CRITICAL', 'HIGH'].includes(m.tel.riskLevel));
    for (const machine of criticalMachines) {
      recommendations.push({
        id: `REC-MAINT-${machine.machineId.toUpperCase()}`,
        type: REC_TYPES.URGENT_MAINTENANCE,
        priority: machine.tel.riskLevel === 'CRITICAL' ? 'P1' : 'P2',
        title: `${machine.tel.riskLevel} Risk — Immediate Maintenance on ${machine.machineName || machine.name}`,
        description: `Machine ${machine.machineId} at ${machine.plantName} has failure probability of ${machine.tel.failureProbability}% and ${machine.tel.downtimeHours}h cumulative downtime. Corrective action required before next shift.`,
        affectedAsset: machine.machineId,
        plant: machine.plantId,
        estimatedImpact: {
          downtimeReductionHours: Math.round(machine.tel.downtimeHours * 0.6 * 10) / 10,
          costSavingINR: Math.round(machine.tel.maintenanceCostINR * 0.4),
          mtbfImprovementHours: Math.round(machine.tel.mtbf * 0.15)
        }
      });
    }

    // 2. Preventive schedule for medium-risk machines
    const mediumMachines = allMachines.filter(m => m.tel.riskLevel === 'MEDIUM');
    for (const machine of mediumMachines) {
      recommendations.push({
        id: `REC-PM-${machine.machineId.toUpperCase()}`,
        type: REC_TYPES.PREVENTIVE_SCHEDULE,
        priority: 'P3',
        title: `Schedule 500-Hour PM Cycle — ${machine.machineName || machine.name}`,
        description: `Failure probability at ${machine.tel.failureProbability}%. Proactive PM within the next 72 hours will prevent escalation and extend MTBF by an estimated ${Math.round(machine.tel.mtbf * 0.12)}h.`,
        affectedAsset: machine.machineId,
        plant: machine.plantId,
        estimatedImpact: {
          downtimeReductionHours: Math.round(machine.tel.downtimeHours * 0.35 * 10) / 10,
          costSavingINR: Math.round(machine.tel.maintenanceCostINR * 0.25),
          mtbfImprovementHours: Math.round(machine.tel.mtbf * 0.12)
        }
      });
    }

    // 3. Inventory redistribution — move spare parts toward highest-risk plants
    const plantKPIs = FLEET_REGISTRY.plants.map(p => FleetManager.aggregatePlantKPIs(p));
    const sortedByRisk = [...plantKPIs].sort((a, b) => b.avgFailureProbability - a.avgFailureProbability);
    if (sortedByRisk.length >= 2) {
      const highRiskPlant  = sortedByRisk[0];
      const lowRiskPlant   = sortedByRisk[sortedByRisk.length - 1];
      recommendations.push({
        id: 'REC-INV-REDISTRIB-001',
        type: REC_TYPES.INVENTORY_TRANSFER,
        priority: 'P2',
        title: `Redistribute Spare Parts from ${lowRiskPlant.plantName} → ${highRiskPlant.plantName}`,
        description: `${highRiskPlant.plantName} (avg failure prob: ${highRiskPlant.avgFailureProbability}%) has insufficient buffer stock given current risk profile. Transfer SKF bearings, Viton seals from ${lowRiskPlant.plantName} (avg failure prob: ${lowRiskPlant.avgFailureProbability}%) to reduce critical stockout risk.`,
        fromPlant: lowRiskPlant.plantId,
        toPlant: highRiskPlant.plantId,
        estimatedImpact: { stockoutRiskReduction: '60%', emergencyProcurementSavingINR: 35000 }
      });
    }

    // 4. Technician redeployment — align to plant risk
    const criticalPlant = sortedByRisk[0];
    recommendations.push({
      id: 'REC-TECH-REDEPLOY-001',
      type: REC_TYPES.TECHNICIAN_REDEPLOY,
      priority: 'P2',
      title: `Redeploy Senior Technician to ${criticalPlant.plantName}`,
      description: `${criticalPlant.plantName} has ${criticalPlant.criticalMachines + criticalPlant.highRiskMachines} critical/high risk machines active. Recommend temporary redeployment of one Senior Maintenance Technician (Hydraulics certified) for the next 5 days.`,
      targetPlant: criticalPlant.plantId,
      estimatedImpact: { mttrReductionHours: 1.8, incidentPreventionEstimate: 2 }
    });

    // 5. Best practice sharing — top-performing plant to laggard
    const benchmark = benchmarkEngine.benchmarkPlants();
    if (benchmark.length >= 2) {
      const topPlant    = benchmark[0];
      const bottomPlant = benchmark[benchmark.length - 1];
      recommendations.push({
        id: 'REC-BP-SHARE-001',
        type: REC_TYPES.BEST_PRACTICE_SHARE,
        priority: 'P3',
        title: `Knowledge Transfer: ${topPlant.plantName} → ${bottomPlant.plantName}`,
        description: `${topPlant.plantName} (benchmark score: ${topPlant.benchmarkScore}/100, OEE: ${(topPlant.kpi.oee * 100).toFixed(1)}%) significantly outperforms ${bottomPlant.plantName} (score: ${bottomPlant.benchmarkScore}/100, OEE: ${(bottomPlant.kpi.oee * 100).toFixed(1)}%). Recommend a 2-day maintenance knowledge-transfer workshop.`,
        fromPlant: topPlant.plantId,
        toPlant: bottomPlant.plantId,
        estimatedImpact: { oeeImprovementEstimate: '8–12%', mtbfImprovementHours: 80 }
      });
    }

    // 6. Decommission review for oldest poor-performing machines
    const poorMachines = allMachines.filter(m => m.tel.availability < 0.85 && m.age >= 5);
    for (const machine of poorMachines) {
      recommendations.push({
        id: `REC-DECOM-${machine.machineId.toUpperCase()}`,
        type: REC_TYPES.DECOMMISSION_REVIEW,
        priority: 'P4',
        title: `Decommission Review — ${machine.machineName || machine.name} (Age: ${machine.age}yr)`,
        description: `Machine availability at ${(machine.tel.availability * 100).toFixed(1)}% with age ${machine.age} years. Total maintenance cost INR ${machine.tel.maintenanceCostINR.toLocaleString()} this cycle. Recommend lifecycle assessment vs replacement ROI.`,
        affectedAsset: machine.machineId,
        plant: machine.plantId,
        estimatedImpact: { annualMaintenanceSavingINR: Math.round(machine.tel.maintenanceCostINR * 1.8) }
      });
    }

    // Sort by priority
    const prioOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
    recommendations.sort((a, b) => (prioOrder[a.priority] ?? 4) - (prioOrder[b.priority] ?? 4));

    return {
      generatedAt: new Date().toISOString(),
      totalRecommendations: recommendations.length,
      byPriority: {
        P1: recommendations.filter(r => r.priority === 'P1').length,
        P2: recommendations.filter(r => r.priority === 'P2').length,
        P3: recommendations.filter(r => r.priority === 'P3').length,
        P4: recommendations.filter(r => r.priority === 'P4').length
      },
      byType: Object.fromEntries(Object.values(REC_TYPES).map(t => [t, recommendations.filter(r => r.type === t).length])),
      recommendations
    };
  }
}

module.exports = new GlobalRecommendationsEngine();
