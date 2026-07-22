/**
 * YantraMitra Platform — Fleet Anomaly Detector
 * Identifies plants and machines that deviate significantly from fleet baseline.
 * Uses Z-score outlier detection on OEE, availability, failure probability, and downtime.
 */

const { FLEET_REGISTRY, MACHINE_TELEMETRY } = require('./fleetManager');

const Z_THRESHOLD = 1.5;  // |z| > 1.5 → anomaly flag

class FleetAnomalyDetector {
  _stats(values) {
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    return { mean, stdDev: Math.sqrt(variance) };
  }

  _zScore(value, mean, stdDev) {
    return stdDev === 0 ? 0 : (value - mean) / stdDev;
  }

  /**
   * Detect machine-level anomalies vs fleet baseline on 4 dimensions.
   */
  detectMachineAnomalies() {
    const allMachines = [];
    for (const plant of FLEET_REGISTRY.plants) {
      for (const machine of plant.machines) {
        const tel = MACHINE_TELEMETRY[machine.machineId];
        if (tel) allMachines.push({ ...machine, plantId: plant.plantId, plantName: plant.name, tel });
      }
    }

    const dimensions = [
      { key: 'oee',               label: 'OEE',                lowIsBad: true  },
      { key: 'availability',      label: 'Availability',        lowIsBad: true  },
      { key: 'failureProbability',label: 'Failure Probability', lowIsBad: false },
      { key: 'downtimeHours',     label: 'Downtime Hours',      lowIsBad: false }
    ];

    const dimStats = {};
    for (const dim of dimensions) {
      const values = allMachines.map(m => m.tel[dim.key]);
      dimStats[dim.key] = this._stats(values);
    }

    const anomalies = [];
    for (const machine of allMachines) {
      const flags = [];
      for (const dim of dimensions) {
        const { mean, stdDev } = dimStats[dim.key];
        const z = this._zScore(machine.tel[dim.key], mean, stdDev);
        const isAnomaly = dim.lowIsBad ? z < -Z_THRESHOLD : z > Z_THRESHOLD;
        if (isAnomaly) {
          flags.push({
            dimension: dim.label,
            value: machine.tel[dim.key],
            fleetMean: Math.round(mean * 1000) / 1000,
            zScore: Math.round(z * 100) / 100,
            severity: Math.abs(z) > 2.5 ? 'CRITICAL' : 'WARNING',
            direction: dim.lowIsBad ? 'BELOW_BASELINE' : 'ABOVE_BASELINE'
          });
        }
      }

      if (flags.length > 0) {
        anomalies.push({
          machineId: machine.machineId,
          machineName: machine.name,
          class: machine.class,
          plantId: machine.plantId,
          plantName: machine.plantName,
          anomalyCount: flags.length,
          overallSeverity: flags.some(f => f.severity === 'CRITICAL') ? 'CRITICAL' : 'WARNING',
          anomalyFlags: flags
        });
      }
    }

    anomalies.sort((a, b) => b.anomalyCount - a.anomalyCount);

    return {
      detectedAt: new Date().toISOString(),
      totalMachinesScanned: allMachines.length,
      anomalousMachines: anomalies.length,
      anomalyRate: Math.round((anomalies.length / allMachines.length) * 100),
      fleetBaseline: Object.fromEntries(
        dimensions.map(d => [d.key, { mean: Math.round(dimStats[d.key].mean * 1000) / 1000, stdDev: Math.round(dimStats[d.key].stdDev * 1000) / 1000 }])
      ),
      anomalies
    };
  }

  /**
   * Detect plant-level anomalies on aggregated KPIs.
   */
  detectPlantAnomalies() {
    const { FleetManager } = require('./fleetManager');
    const plantKPIs = FLEET_REGISTRY.plants.map(p => FleetManager.aggregatePlantKPIs(p)).filter(Boolean);

    const dims = ['availability', 'oee', 'avgFailureProbability', 'totalDowntimeHours'];
    const dimStats = {};
    for (const dim of dims) {
      dimStats[dim] = this._stats(plantKPIs.map(p => p[dim]));
    }

    const plantAnomalies = [];
    for (const kpi of plantKPIs) {
      const flags = [];
      for (const dim of dims) {
        const lowIsBad = ['availability', 'oee'].includes(dim);
        const { mean, stdDev } = dimStats[dim];
        const z = this._zScore(kpi[dim], mean, stdDev);
        const isAnomaly = lowIsBad ? z < -Z_THRESHOLD : z > Z_THRESHOLD;
        if (isAnomaly) {
          flags.push({ dimension: dim, value: kpi[dim], fleetMean: Math.round(mean * 1000) / 1000, zScore: Math.round(z * 100) / 100 });
        }
      }
      if (flags.length > 0) {
        plantAnomalies.push({ plantId: kpi.plantId, plantName: kpi.plantName, anomalyFlags: flags });
      }
    }

    return { plantAnomalies, totalPlantsScanned: plantKPIs.length };
  }

  /**
   * Combined machine + plant anomaly report.
   */
  getFullAnomalyReport() {
    const machineReport = this.detectMachineAnomalies();
    const plantReport   = this.detectPlantAnomalies();
    return { ...machineReport, plantAnomalies: plantReport.plantAnomalies };
  }
}

module.exports = new FleetAnomalyDetector();
