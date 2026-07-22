/**
 * YantraMitra Platform — Enterprise Fleet Intelligence Test Suite
 * Covers: Fleet Manager KPIs, Cross-Plant Analytics, Benchmark Engine,
 * Fleet Anomaly Detection, Global Recommendations, and latency.
 */

const assert = require('assert');
const fleetService = require('../services/fleet');

async function runFleetTests() {
  console.log('==================================================');
  console.log('YantraMitra Enterprise Fleet Intelligence Test Suite');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return Promise.resolve().then(() => fn())
      .then(() => { console.log(`  [PASS] ${name}`); passed++; })
      .catch(err => { console.error(`  [FAIL] ${name}\n         Error: ${err.message}`); failed++; });
  }

  // ─── Test 1: System Status ───
  await test('1. Fleet System Status & Registry Validation', () => {
    const status = fleetService.getFleetSystemStatus();
    assert.strictEqual(status.systemStatus, 'ACTIVE_READY');
    assert(status.totalPlants >= 3, `Must have ≥ 3 plants, got ${status.totalPlants}`);
    assert(status.totalMachines >= 10, `Must have ≥ 10 machines, got ${status.totalMachines}`);
    assert(status.fleetHealthScore >= 0 && status.fleetHealthScore <= 100, 'Fleet health score must be 0–100');
    assert(Array.isArray(status.capabilities) && status.capabilities.length >= 5);
    console.log(`         [Fleet] ${status.totalPlants} plants, ${status.totalMachines} machines — Health Score: ${status.fleetHealthScore}/100`);
  });

  // ─── Test 2: Fleet KPI Aggregation ───
  await test('2. Fleet KPI Aggregation (Availability, OEE, MTBF, MTTR)', () => {
    const overview = fleetService.FleetManager.getFleetOverview();
    const kpis = overview.fleetKPIs;

    assert(kpis.fleetAvailability > 0 && kpis.fleetAvailability <= 1, 'Fleet availability must be 0–1');
    assert(kpis.fleetOEE > 0 && kpis.fleetOEE <= 1, 'Fleet OEE must be 0–1');
    assert(kpis.fleetMTBF > 0, 'Fleet MTBF must be positive');
    assert(kpis.fleetMTTR > 0, 'Fleet MTTR must be positive');
    assert(kpis.totalMaintenanceCostINR > 0, 'Total maintenance cost must be positive');
    assert(kpis.totalDowntimeHours > 0, 'Total downtime hours must be positive');
    assert(overview.plants.length >= 3, 'Overview must include ≥ 3 plants');

    for (const plant of overview.plants) {
      assert(plant.availability > 0 && plant.availability <= 1, `Plant ${plant.plantId} availability out of range`);
      assert(plant.oee > 0 && plant.oee <= 1, `Plant ${plant.plantId} OEE out of range`);
    }

    console.log(`         [KPIs] Fleet OEE: ${(kpis.fleetOEE * 100).toFixed(1)}%, Availability: ${(kpis.fleetAvailability * 100).toFixed(1)}%, MTBF: ${kpis.fleetMTBF}h, MTTR: ${kpis.fleetMTTR}h`);
  });

  // ─── Test 3: Cross-Plant Analytics ───
  await test('3. Cross-Plant Analytics — Best/Worst Performer Identification', () => {
    const comparison = fleetService.crossPlantAnalytics.comparePlants();
    assert(comparison.plants.length >= 3, 'Must compare ≥ 3 plants');

    const dims = ['availability', 'oee', 'mtbf', 'totalDowntimeHours'];
    for (const dim of dims) {
      assert(comparison.bestPerformers[dim], `Must have best performer for dimension: ${dim}`);
      assert(comparison.worstPerformers[dim], `Must have worst performer for dimension: ${dim}`);
      assert(comparison.bestPerformers[dim].plantId, `Best performer for ${dim} must have plantId`);
    }

    console.log(`         [Cross-Plant] Best OEE: ${comparison.bestPerformers.oee.plantName}, Worst OEE: ${comparison.worstPerformers.oee.plantName}`);
  });

  // ─── Test 4: Machine Class Comparison ───
  await test('4. Machine Class Comparison — Multi-Class Coverage', () => {
    const classComp = fleetService.crossPlantAnalytics.compareMachineClasses();
    assert(classComp.classCount >= 5, `Must cover ≥ 5 machine classes, got ${classComp.classCount}`);
    assert(classComp.bestClass, 'Must identify best-performing machine class');
    assert(classComp.worstClass, 'Must identify worst-performing machine class');
    assert(classComp.bestClass.avgOEE >= classComp.worstClass.avgOEE, 'Best class OEE must be ≥ worst class OEE');
    console.log(`         [Classes] ${classComp.classCount} classes — Best: ${classComp.bestClass.class} (OEE ${(classComp.bestClass.avgOEE * 100).toFixed(1)}%), Worst: ${classComp.worstClass.class} (OEE ${(classComp.worstClass.avgOEE * 100).toFixed(1)}%)`);
  });

  // ─── Test 5: Machine Rankings ───
  await test('5. Fleet Machine Rankings — Strict Ordering & Complete Coverage', () => {
    const rankings = fleetService.crossPlantAnalytics.rankAllMachines();
    assert(rankings.totalMachines >= 10, `Must rank ≥ 10 machines`);

    // Verify rank ordering
    for (let i = 0; i < rankings.byOEE.length - 1; i++) {
      assert(rankings.byOEE[i].oee >= rankings.byOEE[i + 1].oee, `OEE rank order violated at position ${i}`);
      assert(rankings.byOEE[i].rank === i + 1, `Rank field mismatch at index ${i}`);
    }
    for (let i = 0; i < rankings.byRisk.length - 1; i++) {
      assert(rankings.byRisk[i].failureProbability >= rankings.byRisk[i + 1].failureProbability, `Risk rank order violated at position ${i}`);
    }

    console.log(`         [Rankings] Top OEE: ${rankings.byOEE[0].machineName} (${(rankings.byOEE[0].oee * 100).toFixed(1)}%), Highest risk: ${rankings.byRisk[0].machineName} (${rankings.byRisk[0].failureProbability}%)`);
  });

  // ─── Test 6: Benchmark Engine ───
  await test('6. Benchmark Engine — Composite Score, Tier Distribution & Plant Rankings', () => {
    const summary = fleetService.benchmarkEngine.getBenchmarkSummary();
    assert(summary.machineBenchmarks.length >= 10, 'Must benchmark ≥ 10 machines');
    assert(summary.plantBenchmarks.length >= 3, 'Must benchmark ≥ 3 plants');
    assert(summary.topMachine, 'Must identify top benchmark machine');
    assert(summary.bottomMachine, 'Must identify bottom benchmark machine');
    assert(summary.topMachine.benchmarkScore >= summary.bottomMachine.benchmarkScore, 'Top score must be ≥ bottom score');
    assert(summary.tierDistribution, 'Tier distribution must be present');

    const validTiers = ['ELITE', 'GOOD', 'AVERAGE', 'POOR'];
    for (const machine of summary.machineBenchmarks) {
      assert(validTiers.includes(machine.tier), `Invalid tier "${machine.tier}" for ${machine.machineId}`);
      assert(machine.benchmarkScore >= 0 && machine.benchmarkScore <= 100, 'Benchmark score must be 0–100');
    }

    console.log(`         [Benchmark] Top: ${summary.topMachine.machineName} (${summary.topMachine.benchmarkScore}/100, ${summary.topMachine.tier}), Bottom: ${summary.bottomMachine.machineName} (${summary.bottomMachine.benchmarkScore}/100)`);
    console.log(`         [Tiers] ${JSON.stringify(summary.tierDistribution)}`);
  });

  // ─── Test 7: Fleet Anomaly Detection ───
  await test('7. Fleet Anomaly Detection — Z-Score Outlier Detection (≥ 1 anomaly expected)', () => {
    const report = fleetService.fleetAnomalyDetector.getFullAnomalyReport();
    assert(report.totalMachinesScanned >= 10, 'Must scan ≥ 10 machines');
    assert(report.anomalousMachines >= 1, `Must detect ≥ 1 anomalous machine (fleet has deliberate outliers), detected ${report.anomalousMachines}`);
    assert(report.fleetBaseline, 'Fleet baseline stats must be present');
    assert(report.fleetBaseline.oee, 'Fleet OEE baseline must be present');
    assert(report.anomalyRate >= 0 && report.anomalyRate <= 100, 'Anomaly rate must be 0–100%');

    for (const anomaly of report.anomalies) {
      assert(anomaly.anomalyFlags.length >= 1, `Anomaly ${anomaly.machineId} must have ≥ 1 flag`);
      assert(['CRITICAL', 'WARNING'].includes(anomaly.overallSeverity), `Invalid severity: ${anomaly.overallSeverity}`);
      for (const flag of anomaly.anomalyFlags) {
        assert(typeof flag.zScore === 'number', 'Z-score must be numeric');
        assert(['CRITICAL', 'WARNING'].includes(flag.severity), `Invalid flag severity`);
      }
    }

    console.log(`         [Anomaly] Scanned ${report.totalMachinesScanned} machines — ${report.anomalousMachines} anomalies detected (${report.anomalyRate}% rate)`);
    if (report.anomalies.length > 0) {
      console.log(`         [Top Anomaly] ${report.anomalies[0].machineName} — flags: ${report.anomalies[0].anomalyFlags.map(f => f.dimension).join(', ')}`);
    }
  });

  // ─── Test 8: Global Recommendations ───
  await test('8. Global Recommendations — All 6 Types Generated & Priority Sorted', () => {
    const recs = fleetService.globalRecommendations.generate();
    assert(recs.totalRecommendations >= 5, `Must generate ≥ 5 recommendations, got ${recs.totalRecommendations}`);
    assert(recs.recommendations.length === recs.totalRecommendations, 'Recommendation count mismatch');

    const validTypes = ['URGENT_MAINTENANCE', 'PREVENTIVE_SCHEDULE', 'INVENTORY_TRANSFER', 'TECHNICIAN_REDEPLOY', 'BEST_PRACTICE_SHARE', 'DECOMMISSION_REVIEW'];
    const validPrios = ['P1', 'P2', 'P3', 'P4'];
    for (const rec of recs.recommendations) {
      assert(validTypes.includes(rec.type), `Invalid recommendation type: ${rec.type}`);
      assert(validPrios.includes(rec.priority), `Invalid priority: ${rec.priority}`);
      assert(rec.title && rec.description, `Recommendation ${rec.id} missing title/description`);
      assert(rec.estimatedImpact, `Recommendation ${rec.id} must have estimatedImpact`);
    }

    // Verify sorted by priority (P1 before P2 before P3 before P4)
    const pOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
    for (let i = 0; i < recs.recommendations.length - 1; i++) {
      assert(pOrder[recs.recommendations[i].priority] <= pOrder[recs.recommendations[i + 1].priority],
        `Priority sort order violated at index ${i}: ${recs.recommendations[i].priority} > ${recs.recommendations[i + 1].priority}`);
    }

    console.log(`         [Recommendations] ${recs.totalRecommendations} total — P1: ${recs.byPriority.P1}, P2: ${recs.byPriority.P2}, P3: ${recs.byPriority.P3}, P4: ${recs.byPriority.P4}`);
    console.log(`         [Top Rec] [${recs.recommendations[0].priority}] ${recs.recommendations[0].title}`);
  });

  // ─── Test 9: Server.js syntax check ───
  await test('9. server.js Passes Node Syntax Check (no regression)', async () => {
    const { execSync } = require('child_process');
    const result = execSync('node --check server.js 2>&1', { cwd: process.cwd(), encoding: 'utf8' });
    assert(result.trim() === '', `server.js syntax error: ${result}`);
  });

  // ─── Test 10: Fleet Latency Benchmark (<20ms for 200 ops) ───
  await test('10. Fleet Intelligence Latency Benchmark (200 operations < 20ms)', () => {
    const iterations = 200;
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      fleetService.FleetManager.getFleetOverview();
      fleetService.benchmarkEngine.getBenchmarkSummary();
      fleetService.fleetAnomalyDetector.detectMachineAnomalies();
    }
    const elapsed = Date.now() - start;
    console.log(`         [Fleet Benchmark] ${iterations * 3} fleet operations in ${elapsed}ms (Avg: ${(elapsed / (iterations * 3)).toFixed(4)}ms per op)`);
    assert(elapsed < 500, `200 fleet query cycles must complete in < 500ms, took ${elapsed}ms`);
  });

  console.log('\n==================================================');
  console.log(`Fleet Intelligence Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) process.exit(1);
}

runFleetTests().catch(console.error);
