/**
 * YantraMitra Platform — Fleet Benchmark Engine
 * Ranks plants and machines on Reliability, Maintenance Cost, and Downtime.
 * Produces a composite benchmark score and performance tier for each asset.
 */

const { FLEET_REGISTRY, MACHINE_TELEMETRY, FleetManager } = require('./fleetManager');

const TIER_THRESHOLDS = { ELITE: 80, GOOD: 60, AVERAGE: 40, POOR: 0 };

class BenchmarkEngine {
  /**
   * Compute a normalized composite benchmark score (0–100) for a machine.
   * Higher = better.
   */
  _machineScore(tel) {
    // Normalize each metric to 0–1 range using fleet-observed min/max
    const allTel = Object.values(MACHINE_TELEMETRY);
    const norm = (val, key, invert = false) => {
      const values = allTel.map(t => t[key]);
      const min = Math.min(...values); const max = Math.max(...values);
      const range = max - min || 1;
      const n = (val - min) / range;
      return invert ? 1 - n : n;
    };

    // Weights sum to 1.0; score is 0–1 → scale to 0–100
    const score =
      norm(tel.oee, 'oee') * 0.35 +
      norm(tel.availability, 'availability') * 0.25 +
      norm(tel.mtbf, 'mtbf') * 0.20 +
      norm(tel.maintenanceCostINR, 'maintenanceCostINR', true) * 0.10 +
      norm(tel.downtimeHours, 'downtimeHours', true) * 0.10;

    return Math.min(100, Math.round(score * 100));
  }

  _tier(score) {
    if (score >= TIER_THRESHOLDS.ELITE)   return 'ELITE';
    if (score >= TIER_THRESHOLDS.GOOD)    return 'GOOD';
    if (score >= TIER_THRESHOLDS.AVERAGE) return 'AVERAGE';
    return 'POOR';
  }

  /**
   * Full machine-level benchmark ranking.
   */
  benchmarkMachines() {
    const ranked = [];
    for (const plant of FLEET_REGISTRY.plants) {
      for (const machine of plant.machines) {
        const tel = MACHINE_TELEMETRY[machine.machineId];
        if (!tel) continue;
        const score = this._machineScore(tel);
        ranked.push({
          machineId: machine.machineId,
          machineName: machine.name,
          class: machine.class,
          plantId: plant.plantId,
          plantName: plant.name,
          benchmarkScore: score,
          tier: this._tier(score),
          oee: tel.oee,
          availability: tel.availability,
          mtbf: tel.mtbf,
          mttr: tel.mttr,
          maintenanceCostINR: tel.maintenanceCostINR,
          downtimeHours: tel.downtimeHours
        });
      }
    }
    ranked.sort((a, b) => b.benchmarkScore - a.benchmarkScore);
    return ranked.map((r, i) => ({ rank: i + 1, ...r }));
  }

  /**
   * Plant-level benchmark: average machine benchmark scores per plant.
   */
  benchmarkPlants() {
    const plantScores = FLEET_REGISTRY.plants.map(plant => {
      const machineBenchmarks = plant.machines
        .map(m => ({ machine: m, tel: MACHINE_TELEMETRY[m.machineId] }))
        .filter(x => x.tel);

      const scores = machineBenchmarks.map(x => this._machineScore(x.tel));
      const avgScore = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;

      const kpi = FleetManager.aggregatePlantKPIs(plant);
      return {
        plantId: plant.plantId,
        plantName: plant.name,
        location: plant.location,
        benchmarkScore: avgScore,
        tier: this._tier(avgScore),
        totalMachines: plant.machines.length,
        kpi
      };
    });

    plantScores.sort((a, b) => b.benchmarkScore - a.benchmarkScore);
    return plantScores.map((p, i) => ({ rank: i + 1, ...p }));
  }

  getBenchmarkSummary() {
    const machines = this.benchmarkMachines();
    const plants   = this.benchmarkPlants();
    const tierDist = machines.reduce((acc, m) => { acc[m.tier] = (acc[m.tier] || 0) + 1; return acc; }, {});

    return {
      machineBenchmarks: machines,
      plantBenchmarks: plants,
      tierDistribution: tierDist,
      eliteMachines: machines.filter(m => m.tier === 'ELITE'),
      poorMachines:  machines.filter(m => m.tier === 'POOR'),
      topMachine:    machines[0],
      bottomMachine: machines[machines.length - 1],
      topPlant:      plants[0],
      bottomPlant:   plants[plants.length - 1]
    };
  }
}

module.exports = new BenchmarkEngine();
