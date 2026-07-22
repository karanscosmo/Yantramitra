/**
 * YantraMitra Platform — Autonomous Industrial Digital Worker Workflow Test Suite
 * Tests workflow templates, Action Planner, Execution Simulator, Approval Engine,
 * multi-step execution, pause/resume, automated rollback, audit trail, notifications,
 * and workflow execution latency benchmark (< 200ms).
 */

const assert = require('assert');
const workflowService = require('../services/workflows');

async function runWorkflowEngineTests() {
  console.log('==================================================');
  console.log('YantraMitra Industrial Digital Worker Workflow Test Suite');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return Promise.resolve()
      .then(() => fn())
      .then(() => {
        console.log(`  [PASS] ${name}`);
        passed++;
      })
      .catch(err => {
        console.error(`  [FAIL] ${name}`);
        console.error(`         Error: ${err.message}`);
        failed++;
      });
  }

  // Test 1: Industrial Templates Catalog
  await test('1. Industrial Workflow Templates Catalog Verification', () => {
    const templates = workflowService.listAllTemplates();
    assert.strictEqual(templates.length, 6, `Expected 6 workflow templates, got ${templates.length}`);
    const bearingTpl = workflowService.getTemplateById('tpl_bearing_replacement');
    assert(bearingTpl, 'Bearing replacement template must exist');
    assert.strictEqual(bearingTpl.steps.length, 6, 'Bearing replacement template must have 6 steps');
  });

  // Test 2: Action Planner Task Graph Construction
  await test('2. Action Planner Executable Task Graph Generation', () => {
    const plan = workflowService.actionPlanner.createWorkflowPlan('tpl_spindle_vibration', { name: 'VMC 850 Spindle' });
    assert(plan.workflowId.startsWith('WF-2026-'), 'Workflow ID must be formatted');
    assert.strictEqual(plan.totalSteps, 4, 'Spindle vibration template should have 4 steps');
    assert.strictEqual(plan.status, 'PLAN_GENERATED');
  });

  // Test 3: Execution Simulator Dry-Run Impact Calculation
  await test('3. Execution Simulator Dry-Run Downtime & Risk Prediction', () => {
    const plan = workflowService.actionPlanner.createWorkflowPlan('tpl_bearing_replacement', { name: 'Thermax Boiler 30T' });
    const sim = workflowService.executionSimulator.simulateWorkflow(plan);
    assert.strictEqual(sim.simulationStatus, 'DRY_RUN_PASSED');
    assert(sim.predictedDowntimeHours > 0, 'Downtime hours must be positive');
    assert(sim.predictedFinancialImpactINR > 0, 'Financial impact in INR must be calculated');
    assert(sim.safetyRiskScore >= 0 && sim.safetyRiskScore <= 100, 'Safety risk score must be between 0 and 100');
  });

  // Test 4: Approval Engine Risk Authorization Evaluation
  await test('4. Approval Engine Risk-Based Authorization Gates', () => {
    const plan = workflowService.actionPlanner.createWorkflowPlan('tpl_bearing_replacement', { name: 'Jyoti VMC 850' });

    // Step 1 (HIGH Risk LOTO) requires supervisor approval
    const step1Approval = workflowService.approvalEngine.evaluateStepApproval(plan.steps[0], plan);
    assert.strictEqual(step1Approval.requiresSupervisor, true, 'High risk LOTO step must require supervisor');
    assert.strictEqual(step1Approval.approvalStatus, 'PENDING_SUPERVISOR_APPROVAL');

    // Step 3 (MEDIUM Risk autoApprove = true) auto-approves
    const step3Approval = workflowService.approvalEngine.evaluateStepApproval(plan.steps[2], plan);
    assert.strictEqual(step3Approval.approvalStatus, 'AUTO_APPROVED');
  });

  // Test 5: Multi-Step Stateful Execution & Simulation Initialization
  await test('5. Workflow Engine Initialization & Dry-Run Creation', async () => {
    const { plan, simulation } = await workflowService.workflowEngine.createAndSimulateWorkflow('tpl_motor_overheating', { name: 'Induction Motor M-101' });
    assert.strictEqual(plan.status, 'SIMULATED_READY');
    assert.strictEqual(simulation.simulationStatus, 'DRY_RUN_PASSED');
  });

  // Test 6: High-Risk Step Supervisor Authorization (`approveStep`)
  await test('6. High-Risk Step Supervisor Approval Authorization', async () => {
    const { plan } = await workflowService.workflowEngine.createAndSimulateWorkflow('tpl_bearing_replacement', { name: 'Spindle Assembly S-01' });

    // Step 1 is HIGH risk LOTO -> Requires Supervisor Authorization
    const res1 = await workflowService.workflowEngine.executeNextStep(plan.workflowId);
    assert.strictEqual(res1.workflowStatus, 'AWAITING_APPROVAL');

    // Authorize Step 1 via Supervisor
    const res2 = await workflowService.workflowEngine.approveStep(plan.workflowId, 'Chief Supervisor Karan');
    assert.strictEqual(res2.executedStep.status, 'COMPLETED');
    assert.strictEqual(res2.executedStep.stepIndex, 1);
  });

  // Test 7: Pause & Resume Capabilities
  await test('7. Workflow Execution Pause & Resume Interlocking', async () => {
    const { plan } = await workflowService.workflowEngine.createAndSimulateWorkflow('tpl_preventive_maintenance', { name: 'Pump Station P-2' });

    // Pause workflow
    const pausedWF = workflowService.workflowEngine.pauseWorkflow(plan.workflowId);
    assert.strictEqual(pausedWF.status, 'PAUSED');

    // Execution attempt while paused should throw error
    await assert.rejects(async () => {
      await workflowService.workflowEngine.executeNextStep(plan.workflowId);
    }, /PAUSED/);

    // Resume workflow
    const resumedWF = workflowService.workflowEngine.resumeWorkflow(plan.workflowId);
    assert.strictEqual(resumedWF.status, 'IN_PROGRESS');
  });

  // Test 8: Automated Rollback Execution (`rollbackWorkflow`)
  await test('8. Automated Rollback Routine Execution', async () => {
    const { plan } = await workflowService.workflowEngine.createAndSimulateWorkflow('tpl_preventive_maintenance', { name: 'Stamping Press ST-1' });

    // Execute low-risk step 1
    await workflowService.workflowEngine.executeNextStep(plan.workflowId);

    // Trigger automated rollback
    const rollbackRes = workflowService.workflowEngine.rollbackWorkflow(plan.workflowId);
    assert.strictEqual(rollbackRes.status, 'ROLLED_BACK');
    assert.strictEqual(rollbackRes.rollbackLog.length, 1, 'Should roll back 1 executed step');
    assert(rollbackRes.rollbackLog[0].routineExecuted, 'Rollback routine must be recorded');
  });

  // Test 9: Immutable Audit Trail & Real-Time Notifications Logging
  await test('9. Immutable Audit Ledger & Notification Dispatch Verification', () => {
    const status = workflowService.getWorkflowSystemStatus();
    assert(status.auditTrailLedgerEntries > 0, 'Audit trail must record workflow events');
    assert(status.notificationsCount > 0, 'Notifications engine must dispatch alerts');
  });

  // Test 10: Workflow Execution Latency Benchmark (< 200ms)
  await test('10. Workflow Simulation & Execution Benchmark (< 200ms)', async () => {
    const iterations = 10;
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      const { plan } = await workflowService.workflowEngine.createAndSimulateWorkflow('tpl_spindle_vibration', { name: 'CNC Lathe L-1' });
      await workflowService.workflowEngine.executeNextStep(plan.workflowId);
    }
    const elapsed = Date.now() - start;
    const avgMs = elapsed / iterations;
    console.log(`         [Workflow Benchmark] ${iterations} Workflow Creation, Simulation & Step Executions in ${elapsed}ms (Avg: ${avgMs.toFixed(2)}ms per flow)`);
    assert(avgMs < 200, `Average workflow execution latency must be < 200ms, achieved ${avgMs.toFixed(2)}ms`);
  });

  console.log('\n==================================================');
  console.log(`Workflow Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) process.exit(1);
}

runWorkflowEngineTests();
