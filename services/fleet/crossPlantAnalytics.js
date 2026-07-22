/**
 * YantraMitra Platform — Cross-Plant Analytics Engine
 * Compares plants, production lines, and machine classes across the fleet.
 * Identifies best and worst performers on every KPI dimension.
 */

const { FleetManager, FLEET_REGISTRY, MACHINE_TELEMETRY } = require('./fleetManager');

class CrossPlantAnalytics {
  /**
   * Compare all plants on core KPI dimensions and identify leaders/laggards.
   */
  comparePlants() {
    const plantKPIs = FLEET_REGISTRY.plants.map(p => FleetManager.aggregatePlantKPIs(p)).filter(Boolean);
    const dimensions = ['availability', 'oee', 'mtbf', 'totalDowntimeHours', 'totalMaintenanceCostINR', 'avgFailureProbability'];

    const winners = {};
    const laggards = {};
    for (const dim of dimensions) {
      const higherIsBetter = !['totalDowntimeHours', 'totalMaintenanceCostINR', 'avgFailureProbability', 'mttr'].includes(dim);
      const sorted = [...plantKPIs].sort((a, b) => higherIsBetter ? b[dim] - a[dim] : a[dim] - b[dim]);
      winners[dim]  = { plantId: sorted[0].plantId, plantName: sorted[0].plantName, value: sorted[0][dim] };
      laggards[dim] = { plantId: sorted[sorted.length - 1].plantId, plantName: sorted[sorted.length - 1].plantName, value: sorted[sorted.length - 1][dim] };
    }

    return { plants: plantKPIs, bestPerformers: winners, worstPerformers: laggards };
  }

  /**
   * Aggregate and compare machine classes across the entire fleet.
   */
  compareMachineClasses() {
    const classMap = {};

    for (const plant of FLEET_REGISTRY.plants) {
      for (const machine of plant.machines) {
        const tel = MACHINE_TELEMETRY[machine.machineId];
        if (!tel) continue;
        if (!classMap[machine.class]) {
          classMap[machine.class] = { class: machine.class, count: 0, availability: 0, oee: 0, mtbf: 0, mttr: 0, failureProbability: 0, downtimeHours: 0, maintenanceCostINR: 0 };
        }
        const entry = classMap[machine.class];
        entry.count++;
        entry.availability          += tel.availability;
        entry.oee                   += tel.oee;
        entry.mtbf                  += tel.mtbf;
        entry.mttr                  += tel.mttr;
        entry.failureProbability    += tel.failureProbability;
        entry.downtimeHours         += tel.downtimeHours;
        entry.maintenanceCostINR    += tel.maintenanceCostINR;
      }
    }

    const classes = Object.values(classMap).map(c => ({
      class: c.class,
      machineCount: c.count,
      avgAvailability:       Math.round((c.availability / c.count) * 1000) / 1000,
      avgOEE:                Math.round((c.oee / c.count) * 1000) / 1000,
      avgMTBF:               Math.round(c.mtbf / c.count),
      avgMTTR:               Math.round((c.mttr / c.count) * 10) / 10,
      avgFailureProbability: Math.round(c.failureProbability / c.count),
      totalDowntimeHours:    Math.round(c.downtimeHours * 10) / 10,
      totalMaintenanceCostINR: c.maintenanceCostINR
    })).sort((a, b) => b.avgOEE - a.avgOEE);

    return {
      classCount: classes.length,
      classes,
      bestClass:  classes[0],
      worstClass: classes[classes.length - 1]
    };
  }

  /**
   * Rank individual machines across the fleet on OEE and availability.
   */
  rankAllMachines() {
    const entries = [];
    for (const plant of FLEET_REGISTRY.plants) {
      for (const machine of plant.machines) {
        const tel = MACHINE_TELEMETRY[machine.machineId];
        if (!tel) continue;
        entries.push({
          machineId: machine.machineId,
          machineName: machine.name,
          class: machine.class,
          plantId: plant.plantId,
          plantName: plant.name,
          ...tel
        });
      }
    }

    const byOEE      = [...entries].sort((a, b) => b.oee - a.oee).map((e, i) => ({ rank: i + 1, ...e }));
    const byRisk     = [...entries].sort((a, b) => b.failureProbability - a.failureProbability).map((e, i) => ({ rank: i + 1, ...e }));
    const byDowntime = [...entries].sort((a, b) => b.downtimeHours - a.downtimeHours).map((e, i) => ({ rank: i + 1, ...e }));

    return { byOEE, byRisk, byDowntime, totalMachines: entries.length };
  }
}

module.exports = new CrossPlantAnalytics();
