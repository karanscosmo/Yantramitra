/**
 * YantraMitra Platform — Automated Machine Learning Test Suite
 * Tests: Model metadata, Normal machine, Critical machine, Missing telemetry, Corrupted telemetry, Offline machines, Extreme spikes, Latency benchmark
 */

const assert = require('assert');
const mlPrediction = require('../services/mlPrediction');

async function runTests() {
  console.log('==================================================');
  console.log('YantraMitra Machine Learning Test Suite');
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

  // Test 1: Model Metadata Retrieval
  test('1. Model Metadata Retrieval & Structure', () => {
    const meta = mlPrediction.getModelMetadata();
    assert(meta, 'Metadata object should exist');
    assert(meta.model_version, 'Model version should be present');
    assert(meta.algorithm, 'Algorithm should be specified');
    assert(meta.metrics, 'Metrics object should be present');
    assert(meta.shap_feature_importance, 'SHAP feature importance map should exist');
  });

  // Test 2: Normal Operating Machine (Healthy Telemetry)
  test('2. Normal Operational Machine Prediction (Low Risk, High RUL)', () => {
    const machine = { id: 'test-normal', health: 95, status: 'running', installationDate: '2023-01-01' };
    const readings = [
      { metric: 'temperature', value: 55.0 },
      { metric: 'vibration', value: 1.2 },
      { metric: 'pressure', value: 6.0 },
      { metric: 'rpm', value: 3000 },
      { metric: 'power', value: 25.0 }
    ];
    const res = mlPrediction.predictForMachine(machine, readings);
    assert(res.success, 'Prediction should succeed');
    assert(res.failureProbability < 35, `Failure prob should be low (<35%), got ${res.failureProbability}%`);
    assert(res.remainingUsefulLife > 1000, `RUL should be high (>1000h), got ${res.remainingUsefulLife}h`);
    assert(res.riskLevel === 'Low' || res.riskLevel === 'Medium', `Risk level should be Low/Medium, got ${res.riskLevel}`);
    assert(res.confidence >= 75, `Confidence score should be high, got ${res.confidence}%`);
  });

  // Test 3: Critical Machine (Thermal & Vibration Spikes)
  test('3. Critical Machine Prediction (High Risk, Low RUL, Critical Level)', () => {
    const machine = { id: 'test-critical', health: 45, status: 'warning', alarms: [{ id: 'a1' }, { id: 'a2' }] };
    const readings = [
      { metric: 'temperature', value: 98.5 },
      { metric: 'vibration', value: 8.4 },
      { metric: 'pressure', value: 2.1 },
      { metric: 'rpm', value: 4500 },
      { metric: 'power', value: 58.0 }
    ];
    const res = mlPrediction.predictForMachine(machine, readings);
    assert(res.success, 'Prediction should succeed');
    assert(res.failureProbability >= 60, `Failure prob should be high (>=60%), got ${res.failureProbability}%`);
    assert(res.remainingUsefulLife < 400, `RUL should be low (<400h), got ${res.remainingUsefulLife}h`);
    assert(res.riskLevel === 'High' || res.riskLevel === 'Critical', `Risk level should be High/Critical, got ${res.riskLevel}`);
    assert(res.topContributions.length > 0, 'SHAP feature contributions should be populated');
  });

  // Test 4: Missing Telemetry Handling
  test('4. Missing Telemetry Data Imputation', () => {
    const machine = { id: 'test-missing', health: 88, status: 'running' };
    const readings = []; // Zero readings provided
    const res = mlPrediction.predictForMachine(machine, readings);
    assert(res.success, 'Prediction should succeed even with empty readings');
    assert(Number.isInteger(res.failureProbability), 'Failure probability should be integer');
    assert(Number.isInteger(res.remainingUsefulLife), 'RUL should be integer');
  });

  // Test 5: Corrupted Telemetry Input Handling
  test('5. Corrupted / Null Telemetry Bounds Check', () => {
    const machine = { id: 'test-corrupt', health: null, status: 'running' };
    const readings = [
      { metric: 'temperature', value: 'invalid_number' },
      { metric: 'vibration', value: NaN },
      { metric: 'pressure', value: null }
    ];
    const res = mlPrediction.predictForMachine(machine, readings);
    assert(res.success, 'Prediction should handle corrupted telemetry gracefully');
    assert(res.failureProbability >= 0 && res.failureProbability <= 100, 'Failure prob should remain bounded 0-100');
  });

  // Test 6: Offline / Maintenance Machine Handling
  test('6. Offline / Maintenance Machine Status Evaluation', () => {
    const machine = { id: 'test-maint', health: 50, status: 'maintenance' };
    const readings = [{ metric: 'temperature', value: 40.0 }, { metric: 'vibration', value: 0.5 }];
    const res = mlPrediction.predictForMachine(machine, readings);
    assert(res.success, 'Prediction should process maintenance state');
    assert(res.topContributions, 'SHAP feature contributions should be returned');
  });

  // Test 7: Inference Execution Latency Benchmark
  test('7. Inference Execution Latency Benchmark (< 200ms)', () => {
    const machine = { id: 'test-bench', health: 80, status: 'running' };
    const readings = [{ metric: 'vibration', value: 3.2 }, { metric: 'temperature', value: 72.0 }];
    const iterations = 100;
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      mlPrediction.predictForMachine(machine, readings);
    }
    const elapsed = Date.now() - start;
    const avgLatency = elapsed / iterations;
    console.log(`         [Benchmark] ${iterations} inferences took ${elapsed}ms (Average: ${avgLatency.toFixed(3)}ms per inference)`);
    assert(avgLatency < 200, `Average latency should be under 200ms, got ${avgLatency.toFixed(3)}ms`);
  });

  console.log('\n==================================================');
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
