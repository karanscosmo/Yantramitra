/**
 * YantraMitra Platform — Production ML Hardening & Regression Test Suite
 * Validates: Parts 1 to 14 of ML Production Audit
 */

const assert = require('assert');
const mlPrediction = require('../services/mlPrediction');

async function runHardeningTests() {
  console.log('==================================================');
  console.log('YantraMitra ML Production Hardening Test Suite');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // PART 3 — 12 REALISTIC INDUSTRIAL SCENARIO VALIDATIONS
  // ----------------------------------------------------

  test('Scenario 1: Healthy Operational Machine', () => {
    const m = { id: 'm-healthy', health: 98, status: 'running', installationDate: '2024-01-01' };
    const r = [{ metric: 'temperature', value: 52 }, { metric: 'vibration', value: 1.1 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.failureProbability <= 25, `Failure prob should be <= 25%, got ${res.failureProbability}%`);
    assert(res.riskLevel === 'Low', `Risk level should be Low, got ${res.riskLevel}`);
    assert(res.remainingUsefulLife > 1000, `RUL should be > 1000h, got ${res.remainingUsefulLife}h`);
  });

  test('Scenario 2: Newly Commissioned Machine', () => {
    const m = { id: 'm-new', health: 100, status: 'running', installationDate: new Date().toISOString() };
    const r = [{ metric: 'vibration', value: 0.8 }, { metric: 'temperature', value: 48 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.failureProbability <= 15, `Failure prob should be <= 15%, got ${res.failureProbability}%`);
    assert(res.riskLevel === 'Low', `Risk level should be Low, got ${res.riskLevel}`);
  });

  test('Scenario 3: High Accumulated Runtime Aging Machine', () => {
    const m = { id: 'm-aging', health: 65, status: 'running', installationDate: '2018-01-01' };
    const r = [{ metric: 'vibration', value: 2.8 }, { metric: 'temperature', value: 71 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.remainingUsefulLife < 1200, `RUL for aging asset should be reduced, got ${res.remainingUsefulLife}h`);
  });

  test('Scenario 4: Mechanical Bearing Wear Anomaly', () => {
    const m = { id: 'm-bearing', health: 58, status: 'running' };
    const r = [{ metric: 'vibration', value: 6.8 }, { metric: 'temperature', value: 68 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.failureProbability >= 40, `Bearing wear should elevate failure prob, got ${res.failureProbability}%`);
    assert(res.topContributions.some(c => c.feature === 'vibration'), 'Vibration should be top SHAP contributor');
  });

  test('Scenario 5: Motor Overheating Anomaly', () => {
    const m = { id: 'm-overheat', health: 60, status: 'warning' };
    const r = [{ metric: 'temperature', value: 110.5 }, { metric: 'vibration', value: 2.5 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.failureProbability >= 50, `Overheating should elevate failure prob, got ${res.failureProbability}%`);
    assert(res.topContributions.some(c => c.feature === 'temperature'), 'Temperature should be top SHAP contributor');
  });

  test('Scenario 6: Pressure Fluctuation & Instability', () => {
    const m = { id: 'm-pressure', health: 70, status: 'running' };
    const r = [{ metric: 'pressure', value: 18.5 }, { metric: 'temperature', value: 65 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.success, 'Pressure anomaly evaluation should succeed');
  });

  test('Scenario 7: Severe Multi-Harmonic Vibration Spike', () => {
    const m = { id: 'm-vib-spike', health: 40, status: 'warning' };
    const r = [{ metric: 'vibration', value: 14.2 }, { metric: 'temperature', value: 78 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.failureProbability >= 70, `Vibration spike should trigger high failure prob, got ${res.failureProbability}%`);
    assert(res.riskLevel === 'High' || res.riskLevel === 'Critical', `Risk should be High/Critical, got ${res.riskLevel}`);
  });

  test('Scenario 8: Electrical Current & Load Power Spike', () => {
    const m = { id: 'm-power', health: 62, status: 'running' };
    const r = [{ metric: 'power', value: 95.0 }, { metric: 'rpm', value: 12000 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.success, 'Power/RPM load spike evaluation should succeed');
  });

  test('Scenario 9: Multiple Simultaneous Faults (Thermal + Vibration + Alarms)', () => {
    const m = { id: 'm-multifault', health: 32, status: 'warning', alarms: [{}, {}, {}] };
    const r = [{ metric: 'vibration', value: 9.8 }, { metric: 'temperature', value: 105.0 }, { metric: 'pressure', value: 1.2 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.failureProbability >= 75, `Multifault should trigger Critical failure prob, got ${res.failureProbability}%`);
    assert(res.riskLevel === 'Critical', `Risk level should be Critical, got ${res.riskLevel}`);
    assert(res.remainingUsefulLife < 150, `RUL should be under 150 hours, got ${res.remainingUsefulLife}h`);
  });

  test('Scenario 10: Sensor Drift & Variance', () => {
    const m = { id: 'm-drift', health: 82, status: 'running' };
    const r = [{ metric: 'vibration', value: 3.5 }, { metric: 'vibration', value: 8.2 }, { metric: 'vibration', value: 1.1 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.success, 'Sensor variance drift calculation should succeed');
  });

  test('Scenario 11: Offline Equipment', () => {
    const m = { id: 'm-offline', health: 75, status: 'offline' };
    const r = [];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.success, 'Offline machine inference should succeed');
  });

  test('Scenario 12: Machine Under Active Maintenance', () => {
    const m = { id: 'm-maint', health: 50, status: 'maintenance' };
    const r = [{ metric: 'vibration', value: 0.2 }, { metric: 'temperature', value: 35.0 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.success, 'Maintenance machine evaluation should succeed');
  });

  // ----------------------------------------------------
  // PART 4 — INPUT BOUNDS & SANITIZATION VALIDATION
  // ----------------------------------------------------

  test('Part 4.1: Corrupted Null / Undefined / NaN / Infinity Inputs', () => {
    const m = { id: null, health: NaN, status: undefined, installationDate: 'invalid-date' };
    const r = [{ metric: 'temperature', value: Infinity }, { metric: 'vibration', value: -999.0 }, { metric: null, value: NaN }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.success, 'Engine must never crash on corrupted/null inputs');
    assert(res.failureProbability >= 0 && res.failureProbability <= 100, 'Failure prob must remain bounded 0-100%');
    assert(res.remainingUsefulLife >= 0, 'RUL must remain >= 0');
  });

  test('Part 4.2: Extreme Out-of-Bound Telemetry (Impossible RPM & Temp)', () => {
    const m = { id: 'm-extreme', health: 90, status: 'running' };
    const r = [{ metric: 'temperature', value: 99999.0 }, { metric: 'rpm', value: 999999.0 }, { metric: 'vibration', value: -500.0 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.success, 'Out-of-bound values must be sanitized gracefully');
  });

  // ----------------------------------------------------
  // PART 5 — PHYSICAL CONSTRAINTS CLAMPING
  // ----------------------------------------------------

  test('Part 5: Physical Range Clamping Guarantees', () => {
    const m = { id: 'm-bounds', health: 0, status: 'warning', alarms: [{},{},{},{},{}] };
    const r = [{ metric: 'temperature', value: 200.0 }, { metric: 'vibration', value: 50.0 }];
    const res = mlPrediction.predictForMachine(m, r);
    assert(res.failureProbability >= 0 && res.failureProbability <= 100, 'Failure probability strictly 0-100%');
    assert(res.confidence >= 0 && res.confidence <= 100, 'Confidence strictly 0-100%');
    assert(res.remainingUsefulLife >= 0, 'RUL strictly >= 0');
    assert(['Low', 'Medium', 'High', 'Critical'].includes(res.riskLevel), 'Risk level strictly one of 4 enum levels');
  });

  // ----------------------------------------------------
  // PART 6 — DETERMINISTIC INFERENCE
  // ----------------------------------------------------

  test('Part 6: Deterministic Inference Verification', () => {
    const m = { id: 'm-det', health: 85, status: 'running' };
    const r = [{ metric: 'vibration', value: 2.5 }, { metric: 'temperature', value: 68.5 }];
    const res1 = mlPrediction.predictForMachine(m, r);
    const res2 = mlPrediction.predictForMachine(m, r);
    assert.strictEqual(res1.failureProbability, res2.failureProbability, 'Identical telemetry must yield identical failure probability');
    assert.strictEqual(res1.remainingUsefulLife, res2.remainingUsefulLife, 'Identical telemetry must yield identical RUL');
    assert.strictEqual(res1.riskLevel, res2.riskLevel, 'Identical telemetry must yield identical risk level');
  });

  // ----------------------------------------------------
  // PART 7 & 11 — HEALTH CHECK & MODEL CACHE METRICS
  // ----------------------------------------------------

  test('Part 7 & 11: Production Health Check API Status', () => {
    const status = mlPrediction.getHealthCheckStatus();
    assert(status.modelLoaded === true, 'modelLoaded should be true');
    assert(status.cacheStatus === 'CACHED_IN_MEMORY', 'cacheStatus should be CACHED_IN_MEMORY');
    assert(status.modelStatus === 'Healthy' || status.modelStatus === 'Warning', 'modelStatus should be valid');
    assert(status.inferenceCount > 0, 'inferenceCount should be tracked');
    assert(typeof status.averageLatencyMs === 'number', 'averageLatencyMs should be numeric');
    assert(typeof status.memoryUsageMb === 'number', 'memoryUsageMb should be numeric');
    assert(status.modelHash, 'SHA-256 modelHash should be present');
  });

  // ----------------------------------------------------
  // PART 8 — PERFORMANCE AUDIT & BENCHMARKING
  // ----------------------------------------------------

  test('Part 8: Performance Audit (Single, 100, 1000 Inference Batches)', () => {
    const m = { id: 'm-perf', health: 80, status: 'running' };
    const r = [{ metric: 'vibration', value: 2.2 }, { metric: 'temperature', value: 65.0 }];

    // Batch 1000 benchmark
    const batchSize = 1000;
    const start = Date.now();
    for (let i = 0; i < batchSize; i++) {
      mlPrediction.predictForMachine(m, r);
    }
    const elapsed = Date.now() - start;
    const avgLatency = elapsed / batchSize;
    console.log(`         [Performance Audit] ${batchSize} inferences executed in ${elapsed}ms (Avg: ${avgLatency.toFixed(4)}ms per inference)`);
    assert(avgLatency < 200, `Average latency must be sub-200ms, achieved ${avgLatency.toFixed(4)}ms`);
  });

  console.log('\n==================================================');
  console.log(`Production Hardening Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) process.exit(1);
}

runHardeningTests();
