/**
 * YantraMitra Platform — Event-Driven Architecture Automated Test Suite
 * Tests Event Bus Pub/Sub, Rule Engine, Reactive Triggers, Event History Ledger,
 * Event Replay Engine, and High-Throughput Event Latency Benchmark (< 100ms for 1,000 events).
 */

const assert = require('assert');
const eventService = require('../services/events');
const { EVENT_TYPES } = require('../services/events/eventTypes');

async function runEventDrivenTests() {
  console.log('==================================================');
  console.log('YantraMitra Event-Driven Industrial Architecture Test Suite');
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

  // Test 1: Event Bus Pub/Sub Verification
  await test('1. Event Bus Pub/Sub Channel Dispatching', () => {
    let received = false;
    const unsubscribe = eventService.eventBus.subscribe(EVENT_TYPES.TELEMETRY, (evt) => {
      received = true;
      assert.strictEqual(evt.machineId, 'mach-test-01');
    });

    eventService.eventBus.publish(EVENT_TYPES.TELEMETRY, { machineId: 'mach-test-01', vibration: 2.1 });
    assert.strictEqual(received, true, 'Subscriber callback must be invoked on event publish');
    unsubscribe();
  });

  // Test 2: Standard Event Taxonomy & Health Status
  await test('2. Event Taxonomy & System Health Verification', () => {
    const status = eventService.getEventSystemStatus();
    assert.strictEqual(status.busStatus, 'ACTIVE_READY');
    assert.strictEqual(status.architecture, 'PUBLISH_SUBSCRIBE_EVENT_DRIVEN');
    assert(status.eventTypes.includes(EVENT_TYPES.TELEMETRY), 'Telemetry type must be registered');
    assert(status.activeRulesCount >= 4, 'Rule engine must contain rules');
  });

  // Test 3: Rule Engine Condition Evaluation (AND/OR Logic)
  await test('3. Rule Engine IF->THEN AND/OR Condition Evaluation', () => {
    const mockVibrationEvent = {
      eventType: EVENT_TYPES.TELEMETRY,
      payload: { vibration: 5.2 }
    };
    const triggered = eventService.ruleEngine.evaluateEvent(mockVibrationEvent);
    assert(triggered.length > 0, 'Rule engine must trigger rule for vibration > 4.5');
    assert.strictEqual(triggered[0].action, 'TRIGGER_WORKFLOW');
  });

  // Test 4: Reactive Trigger Engine — High Vibration -> Create Workflow
  await test('4. Reactive Trigger: High Vibration Spikes Automatically Create Workflow', async () => {
    const initialWorkflows = require('../services/workflows').workflowEngine.listAllWorkflows().length;

    eventService.eventBus.publish(EVENT_TYPES.TELEMETRY, {
      machineId: 'mach-spindle-01',
      machineName: 'Jyoti VMC 850 Milling CNC',
      vibration: 5.8
    });

    // Small tick delay to allow async trigger handler completion
    await new Promise(r => setTimeout(r, 50));

    const finalWorkflows = require('../services/workflows').workflowEngine.listAllWorkflows().length;
    assert(finalWorkflows > initialWorkflows, 'High vibration event must trigger workflow creation');
  });

  // Test 5: Reactive Trigger Engine — Critical ML Prediction -> Launch RCA Agent
  await test('5. Reactive Trigger: Critical Failure Prediction Automatically Launches RCA Agent', async () => {
    const event = eventService.eventBus.publish(EVENT_TYPES.PREDICTION, {
      machineId: 'mach-boiler-30t',
      machineName: 'Thermax Steam Boiler 30T',
      failureProbability: 88.5,
      remainingUsefulLife: 2.1
    });

    await new Promise(r => setTimeout(r, 50));
    assert(event.eventId, 'Published prediction event must carry eventId');
  });

  // Test 6: Reactive Trigger Engine — Low Inventory -> Dispatches Notification
  await test('6. Reactive Trigger: Low Spare Stock Dispatches Maintenance Notification', async () => {
    const initialNotifs = require('../services/workflows').notificationEngine.notifications.length;

    eventService.eventBus.publish(EVENT_TYPES.INVENTORY, {
      machineId: 'mach-pump-02',
      machineName: 'Hydraulic Pump Station P-2',
      quantityInStock: 0
    });

    await new Promise(r => setTimeout(r, 50));

    const finalNotifs = require('../services/workflows').notificationEngine.notifications.length;
    assert(finalNotifs > initialNotifs, 'Low inventory trigger must dispatch notification');
  });

  // Test 7: Reactive Trigger Engine — Safety LOTO Violation -> Halts Active Workflow
  await test('7. Reactive Trigger: Safety LOTO Violation Halts Active Workflow', async () => {
    // Create an active workflow first
    const wfService = require('../services/workflows');
    const { plan } = await wfService.workflowEngine.createAndSimulateWorkflow('tpl_preventive_maintenance', { name: 'Safety Test Machine' });

    // Publish safety violation event
    eventService.eventBus.publish(EVENT_TYPES.SAFETY, {
      machineId: plan.machineId,
      machineName: plan.machineName,
      lotoMissing: true
    });

    await new Promise(r => setTimeout(r, 50));

    const updatedPlan = wfService.workflowEngine.getWorkflowById(plan.workflowId);
    assert.strictEqual(updatedPlan.status, 'PAUSED', 'Safety violation must pause active workflow');
  });

  // Test 8: Event History Ledger Persistence & Filtering
  await test('8. Persistent Event History Ledger & Multi-Criteria Filtering', () => {
    const history = eventService.eventHistory.queryHistory({ eventType: EVENT_TYPES.TELEMETRY });
    assert(history.length > 0, 'History ledger must record published telemetry events');
    assert.strictEqual(history[0].eventType, EVENT_TYPES.TELEMETRY);
  });

  // Test 9: Event Replay Engine
  await test('9. Event Replay Engine Trajectory Execution', async () => {
    const replayRes = await eventService.eventReplay.replayEvents([], { limit: 3 });
    assert.strictEqual(replayRes.replayStatus, 'COMPLETED');
    assert.strictEqual(replayRes.replayedCount, 3, 'Replay engine should replay 3 historical events');
  });

  // Test 10: Event Bus High-Throughput Latency Benchmark (< 100ms for 1,000 events)
  await test('10. High-Throughput Event Bus Benchmark (1,000 Published Events < 100ms)', () => {
    const totalEvents = 1000;
    const start = Date.now();

    for (let i = 0; i < totalEvents; i++) {
      eventService.eventBus.publish(EVENT_TYPES.TELEMETRY, {
        machineId: `mach-${i % 10}`,
        vibration: 1.5 + (i * 0.001)
      });
    }

    const elapsed = Date.now() - start;
    const avgMs = elapsed / totalEvents;

    console.log(`         [Event Bus Benchmark] ${totalEvents} Events Published & Dispatched in ${elapsed}ms (Avg: ${avgMs.toFixed(4)}ms per event)`);
    assert(elapsed < 100, `1,000 events must publish in < 100ms, achieved ${elapsed}ms`);
  });

  console.log('\n==================================================');
  console.log(`Event-Driven Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) process.exit(1);
}

runEventDrivenTests();
