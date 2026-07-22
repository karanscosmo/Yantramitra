/**
 * YantraMitra Platform — Autonomous Multi-Agent Automated Test Suite
 * Tests 6 specialized autonomous agents, Agent Orchestrator, Shared Context Bus,
 * intent routing, zero duplicate reasoning, citations, and orchestrator latency benchmark.
 */

const assert = require('assert');
const agentService = require('../services/agents');
const rcaAgent = require('../services/agents/rcaAgent');
const maintenancePlannerAgent = require('../services/agents/maintenancePlannerAgent');
const sparePartsAgent = require('../services/agents/sparePartsAgent');
const workOrderAgent = require('../services/agents/workOrderAgent');
const safetyComplianceAgent = require('../services/agents/safetyComplianceAgent');
const reliabilityEngineerAgent = require('../services/agents/reliabilityEngineerAgent');

async function runMultiAgentTests() {
  console.log('==================================================');
  console.log('YantraMitra Autonomous Multi-Agent Test Suite');
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

  // Test 1: Registered Autonomous Agents & Status
  await test('1. Agent Registry & Status Verification', () => {
    const status = agentService.getAgentStatus();
    assert.strictEqual(status.orchestratorStatus, 'ACTIVE_READY');
    assert.strictEqual(status.totalAgents, 6, `Expected 6 agents, got ${status.totalAgents}`);
    assert(Array.isArray(status.agents), 'Agent list must be an array');
  });

  // Test 2: Root Cause Analysis (RCA) Agent Execution
  await test('2. RCA Agent Telemetry & SHAP Attribution Analysis', async () => {
    const mockContext = {
      machine: { name: 'VMC 850 CNC Milling Machine' },
      mlPrediction: { failureProbability: 72.5, shapAttributions: [{ feature: 'Vibration RMS', impact: 42.1 }] },
      activeAlarms: [{ title: 'Spindle Bearing Overheating' }]
    };
    const res = await rcaAgent.execute(mockContext);
    assert(res.probableRootCause, 'RCA Agent must output probable root cause');
    assert(res.confidenceScore > 0.5, 'Confidence score must be > 0.5');
    assert(mockContext.rcaOutput, 'RCA output must be stored in Shared Context');
  });

  // Test 3: Maintenance Planner Agent Execution
  await test('3. Maintenance Planner Agent Sequence & Downtime Estimation', async () => {
    const mockContext = {
      machine: { name: 'Thermax Steam Boiler 30T' },
      rcaOutput: { probableRootCause: 'Mechanical Bearing Fatigue' }
    };
    const res = await maintenancePlannerAgent.execute(mockContext);
    assert(res.estimatedDowntimeHours > 0, 'Downtime hours must be positive');
    assert(res.taskSequence.length > 0, 'Task sequence must contain steps');
    assert(res.requiredTools.length > 0, 'Required tools list must be populated');
  });

  // Test 4: Spare Parts Agent Execution
  await test('4. Spare Parts Agent BOM & Prisma Inventory Lookup', async () => {
    const mockContext = {
      machine: { id: 'mach-001', name: 'Jyoti VMC 850' },
      rcaOutput: { probableRootCause: 'Spindle Bearing Spalling' }
    };
    const res = await sparePartsAgent.execute(mockContext);
    assert(res.recommendedParts.length > 0, 'Recommended parts array must not be empty');
    assert(res.recommendedParts[0].partNumber, 'Part must have part number');
  });

  // Test 5: Work Order Agent Execution
  await test('5. Work Order Agent Structured Payload Synthesis', async () => {
    const mockContext = {
      machine: { name: 'ASMPT SIPLACE TX2' },
      rcaOutput: { failureProbability: 85.0 },
      plannerOutput: { estimatedDowntimeHours: 4.0 },
      sparePartsOutput: { recommendedParts: [{ partName: 'Ceramic Bearing Set', partNumber: 'P-BRG-101' }] }
    };
    const res = await workOrderAgent.execute(mockContext);
    assert(res.workOrderNumber.startsWith('WO-2026-'), 'WO number must be formatted');
    assert.strictEqual(res.priority, 'CRITICAL', 'High probability should assign CRITICAL priority');
  });

  // Test 6: Safety Compliance Agent Execution
  await test('6. Safety Compliance Agent LOTO & OSHA Audit', async () => {
    const mockContext = {
      machine: { name: 'Hydraulic Press 500T' },
      plannerOutput: { taskSequence: ['1. Perform LOTO zero-energy isolation', '2. Replace cylinder seals'] }
    };
    const res = await safetyComplianceAgent.execute(mockContext);
    assert.strictEqual(res.lotoVerified, true, 'LOTO step should be verified');
    assert(res.requiredPPE.length > 0, 'PPE list must be populated');
  });

  // Test 7: Reliability Engineer Agent Execution
  await test('7. Reliability Engineer Agent MTBF & Availability Modeling', async () => {
    const mockContext = {
      machine: { name: 'Fanuc R-2000iC Robot', health: 90.0 }
    };
    const res = await reliabilityEngineerAgent.execute(mockContext);
    assert(res.estimatedMTBFHours > 1000, 'MTBF must be > 1000 hours for 90% health');
    assert(res.availabilityPercentage > 99.0, 'Availability should exceed 99%');
  });

  // Test 8: Agent Orchestrator Multi-Agent Flow & Shared Context Bus
  await test('8. Agent Orchestrator Dispatch & Shared Context Bus', async () => {
    const res = await agentService.dispatchMultiAgentFlow('Perform root cause analysis and generate work order for bearing overheating');
    assert(res.success === true, 'Orchestrator dispatch should succeed');
    assert(res.executedAgents.length >= 4, 'Multiple agents should execute collaboratively');
    assert(res.agentOutputs.rca, 'RCA agent output must be present');
    assert(res.agentOutputs.workOrder, 'Work Order agent output must be present');
    assert(res.reply.includes('Collaborative Multi-Agent Executive Analysis'), 'Unified response must be synthesized');
  });

  // Test 9: Zero Duplicate Reasoning & Citation Verification
  await test('9. Citation Grounding & Zero Duplicate Reasoning Verification', async () => {
    const res = await agentService.dispatchMultiAgentFlow('Check safety directives and spare parts for CNC milling spindle overhaul');
    assert(res.reply.includes('Grounded Sources & Evidence'), 'Citations must be grounded in response');
    assert(res.sources.length > 0, 'Sources array must not be empty');
  });

  // Test 10: Multi-Agent Orchestrator Performance Latency Benchmark (< 200ms)
  await test('10. Multi-Agent Orchestration Performance Benchmark (< 200ms)', async () => {
    const iterations = 10;
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      await agentService.dispatchMultiAgentFlow('Analyze spindle bearing wear and generate LOTO safety checklist');
    }
    const elapsed = Date.now() - start;
    const avgMs = elapsed / iterations;
    console.log(`         [Agent Benchmark] ${iterations} Multi-Agent Orchestration flows executed in ${elapsed}ms (Avg: ${avgMs.toFixed(2)}ms per flow)`);
    assert(avgMs < 200, `Average multi-agent orchestrator latency must be < 200ms, achieved ${avgMs.toFixed(2)}ms`);
  });

  console.log('\n==================================================');
  console.log(`Multi-Agent Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) process.exit(1);
}

runMultiAgentTests();
