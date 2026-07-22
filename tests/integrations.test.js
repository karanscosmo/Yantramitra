const assert = require('assert');
const integrationService = require('../services/integrations');

async function runIntegrationTests() {
  console.log('==================================================');
  console.log('YantraMitra Enterprise Integration Test Suite');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
      failed++;
    }
  }

  // ─── Integration Hub ──────────────────────────────────────────

  await test('1. Integration Hub Status Returns Correct Shape', () => {
    const status = integrationService.getIntegrationSystemStatus();
    assert.strictEqual(status.systemStatus, 'ACTIVE_READY');
    assert(status.capabilities.length >= 9, 'Must have ≥ 9 capabilities');
    assert(status.hub.totalConnectors >= 0, 'hub.totalConnectors must be a number');
  });

  await test('2. Integration Hub Register / Enable / Disable Connectors', () => {
    const mockConn = { type: 'TEST', name: 'test-conn-01', getStatus: () => ({ connected: false }) };
    const reg = integrationService.integrationHub.registerConnector('TEST', 'test-conn-01', mockConn);
    assert(reg.message.includes('registered'));

    const enabled = integrationService.integrationHub.enableConnector('test-conn-01', { host: 'localhost' });
    assert(enabled.message.includes('enabled'));

    const listed = integrationService.integrationHub.listConnectors();
    const found = listed.find(c => c.name === 'test-conn-01');
    assert(found, 'Connector must appear in list');
    assert(found.enabled === true);

    const disabled = integrationService.integrationHub.disableConnector('test-conn-01');
    assert(disabled.message.includes('disabled'));

    const afterDisable = integrationService.integrationHub.listConnectors().find(c => c.name === 'test-conn-01');
    assert(afterDisable.enabled === false);
  });

  await test('3. Integration Hub Get Hub Status', () => {
    const hubStatus = integrationService.integrationHub.getHubStatus();
    assert(typeof hubStatus.totalConnectors === 'number');
    assert(typeof hubStatus.enabledConnectors === 'number');
    assert(Array.isArray(hubStatus.connectors));
  });

  await test('4. Integration Hub Throws on Duplicate Registration', () => {
    const mock = { type: 'DUP', name: 'dup-conn', getStatus: () => ({}) };
    integrationService.integrationHub.registerConnector('DUP', 'dup-conn', mock);
    assert.throws(() => {
      integrationService.integrationHub.registerConnector('DUP', 'dup-conn', mock);
    }, /already registered/);
  });

  await test('5. Integration Hub Throws on Enable Unknown Connector', () => {
    assert.throws(() => {
      integrationService.integrationHub.enableConnector('nonexistent-conn');
    }, /not found/);
  });

  await test('6. Integration Hub Lists Enabled Connectors Only', () => {
    const enabledList = integrationService.integrationHub.listEnabledConnectors();
    assert(Array.isArray(enabledList));
    enabledList.forEach(name => {
      const meta = integrationService.integrationHub.getConnectorMeta(name);
      assert(meta.enabled === true);
    });
  });

  // ─── OPC-UA Connector ────────────────────────────────────────

  await test('7. OPC-UA Connector Connect / Disconnect', () => {
    const conn = integrationService.connectors.opcua.createConnector();
    const result = conn.connect('opc.tcp://localhost:4840');
    assert(result.connected === true);
    assert(result.nodesAvailable === 5);

    const disconnected = conn.disconnect();
    assert(disconnected.connected === false);
  });

  await test('8. OPC-UA Connector Browse Nodes', () => {
    const conn = integrationService.connectors.opcua.createConnector();
    conn.connect('opc.tcp://localhost:4840');
    const nodes = conn.browseNodes();
    assert(nodes.length === 5);
    nodes.forEach(n => {
      assert(n.nodeId, 'Node must have nodeId');
      assert(n.displayName, 'Node must have displayName');
    });
    conn.disconnect();
  });

  await test('9. OPC-UA Connector Read Node', () => {
    const conn = integrationService.connectors.opcua.createConnector();
    conn.connect('opc.tcp://localhost:4840');
    const nodes = conn.browseNodes();
    const reading = conn.readNode(nodes[0].nodeId);
    assert(reading.nodeId === nodes[0].nodeId);
    assert(typeof reading.value === 'number');
    assert(reading.timestamp);
    conn.disconnect();
  });

  await test('10. OPC-UA Connector Subscribe / Unsubscribe', () => {
    const conn = integrationService.connectors.opcua.createConnector();
    conn.connect('opc.tcp://localhost:4840');
    const nodes = conn.browseNodes();
    const sub = conn.subscribe(nodes[0].nodeId, (v) => {}, 1000);
    assert(sub.subscriptionId, 'Must return subscription ID');
    assert(sub.nodeId === nodes[0].nodeId);

    const unsub = conn.unsubscribe(sub.subscriptionId);
    assert(unsub.unsubscribed === true);
    conn.disconnect();
  });

  await test('11. OPC-UA Connector Throws on Read When Disconnected', () => {
    const conn = integrationService.connectors.opcua.createConnector();
    assert.throws(() => conn.readNode('ns=2;i=1001'), /not connected/);
  });

  await test('12. OPC-UA Connector Status', () => {
    const conn = integrationService.connectors.opcua.createConnector();
    conn.connect('opc.tcp://localhost:4840');
    const status = conn.getStatus();
    assert(status.connected === true);
    assert(status.endpoint === 'opc.tcp://localhost:4840');
    assert(typeof status.activeSubscriptions === 'number');
    conn.disconnect();
  });

  // ─── MQTT Connector ──────────────────────────────────────────

  await test('13. MQTT Connector Connect / Disconnect', () => {
    const conn = integrationService.connectors.mqtt.createConnector();
    const result = conn.connect({ host: 'mqtt.example.com', port: 1883, clientId: 'ym-test' });
    assert(result.connected === true);
    assert(result.clientId === 'ym-test');

    const disconnected = conn.disconnect();
    assert(disconnected.connected === false);
  });

  await test('14. MQTT Connector Publish', () => {
    const conn = integrationService.connectors.mqtt.createConnector();
    conn.connect({ host: 'localhost' });
    const pub1 = conn.publish('yantra/machine/01/temperature', 72.5, 1);
    assert(pub1.topic === 'yantra/machine/01/temperature');
    assert(pub1.messageId);
    assert(typeof pub1.delivered === 'boolean');

    const pub2 = conn.publish('yantra/machine/01/status', { running: true, load: 85 }, 2);
    assert(pub2.topic === 'yantra/machine/01/status');
    conn.disconnect();
  });

  await test('15. MQTT Connector Subscribe / Unsubscribe', () => {
    const conn = integrationService.connectors.mqtt.createConnector();
    conn.connect({ host: 'localhost' });
    const sub = conn.subscribe('yantra/+/temperature', 1);
    assert(sub.subscriptionId);
    assert(sub.topic === 'yantra/+/temperature');

    const unsub = conn.unsubscribe(sub.subscriptionId);
    assert(unsub.unsubscribed === true);
    conn.disconnect();
  });

  await test('16. MQTT Connector Auto-Reconnect', () => {
    const conn = integrationService.connectors.mqtt.createConnector();
    conn.connect({ host: 'localhost', maxReconnectAttempts: 5 });
    const reconn = conn.reconnect();
    assert(reconn.reconnected === true);
    assert(typeof reconn.attempt === 'number');
    conn.disconnect();
  });

  await test('17. MQTT Connector Simulate Incoming Message', () => {
    const conn = integrationService.connectors.mqtt.createConnector();
    conn.connect({ host: 'localhost' });
    const msg = conn.simulateMessage('yantra/machine/02/vibration', 0.03);
    assert(msg.topic === 'yantra/machine/02/vibration');
    assert(msg.totalReceived > 0);
    conn.disconnect();
  });

  await test('18. MQTT Connector Throws on Publish When Disconnected', () => {
    const conn = integrationService.connectors.mqtt.createConnector();
    assert.throws(() => conn.publish('test/topic', 'data'), /not connected/);
  });

  await test('19. MQTT Connector Status', () => {
    const conn = integrationService.connectors.mqtt.createConnector();
    conn.connect({ host: 'mqtt.test.com', port: 1883 });
    const status = conn.getStatus();
    assert(status.connected === true);
    assert(status.host === 'mqtt.test.com');
    assert(typeof status.publishedCount === 'number');
    conn.disconnect();
  });

  // ─── Modbus Connector ────────────────────────────────────────

  await test('20. Modbus Connector Connect / Disconnect', () => {
    const conn = integrationService.connectors.modbus.createConnector();
    const result = conn.connect({ host: '192.168.1.100', port: 502, unitId: 1 });
    assert(result.connected === true);
    assert(result.host === '192.168.1.100');

    const dis = conn.disconnect();
    assert(dis.connected === false);
  });

  await test('21. Modbus Connector Read Holding Registers', () => {
    const conn = integrationService.connectors.modbus.createConnector();
    conn.connect({ host: 'localhost' });
    const data = conn.readHoldingRegisters(0, 5);
    assert(data.length === 5);
    assert(data.unitId === 1);
    data.values.forEach(v => {
      assert(typeof v.address === 'number');
      assert(typeof v.value === 'number');
      assert(v.value >= 0 && v.value <= 65535);
    });
    conn.disconnect();
  });

  await test('22. Modbus Connector Write Single Register', () => {
    const conn = integrationService.connectors.modbus.createConnector();
    conn.connect({ host: 'localhost' });
    const result = conn.writeHoldingRegister(10, 500);
    assert(result.written === true);
    assert(result.address === 10);
    assert(result.value === 500);

    const readback = conn.readHoldingRegisters(10, 1);
    assert(readback.values[0].value === 500);
    conn.disconnect();
  });

  await test('23. Modbus Connector Write Multiple Registers', () => {
    const conn = integrationService.connectors.modbus.createConnector();
    conn.connect({ host: 'localhost' });
    const result = conn.writeMultipleRegisters(20, [100, 200, 300]);
    assert(result.count === 3);
    assert(result.written.length === 3);

    const readback = conn.readHoldingRegisters(20, 3);
    assert(readback.values[0].value === 100);
    assert(readback.values[1].value === 200);
    assert(readback.values[2].value === 300);
    conn.disconnect();
  });

  await test('24. Modbus Connector Throws on Out-of-Range Write', () => {
    const conn = integrationService.connectors.modbus.createConnector();
    conn.connect({ host: 'localhost' });
    assert.throws(() => conn.writeHoldingRegister(0, 70000), /out of range/);
    conn.disconnect();
  });

  await test('25. Modbus Connector Polling Start / Stop', () => {
    const conn = integrationService.connectors.modbus.createConnector();
    conn.connect({ host: 'localhost' });
    const started = conn.startPolling('motor-temp', 0, 2, 5000, () => {});
    assert(started.jobName === 'motor-temp');
    assert(started.started === true);

    const stopped = conn.stopPolling('motor-temp');
    assert(stopped.stopped === true);
    conn.disconnect();
  });

  await test('26. Modbus Connector Status', () => {
    const conn = integrationService.connectors.modbus.createConnector();
    conn.connect({ host: '10.0.0.50' });
    const status = conn.getStatus();
    assert(status.connected === true);
    assert(typeof status.activePollingJobs === 'number');
    conn.disconnect();
  });

  // ─── REST/Webhook Connector ──────────────────────────────────

  await test('27. REST Connector GET with Retry', async () => {
    const conn = integrationService.connectors.restWebhook.createConnector();
    const response = await conn.restGet('https://api.example.com/equipment', {}, 2);
    assert(response.status === 200);
    assert(response.data.success === true);
  });

  await test('28. REST Connector POST with Retry', async () => {
    const conn = integrationService.connectors.restWebhook.createConnector();
    const response = await conn.restPost('https://api.example.com/workorders', { asset: 'EQ-001', description: 'Test' }, {}, 2);
    assert(response.status === 200);
    assert(response.data.received === true);
    assert(response.data.body.asset === 'EQ-001');
  });

  await test('29. REST Connector PUT with Retry', async () => {
    const conn = integrationService.connectors.restWebhook.createConnector();
    const response = await conn.restPut('https://api.example.com/workorders/WO-001', { status: 'COMPLETE' }, {}, 2);
    assert(response.status === 200);
  });

  await test('30. REST Connector DELETE with Retry', async () => {
    const conn = integrationService.connectors.restWebhook.createConnector();
    const response = await conn.restDelete('https://api.example.com/workorders/WO-001', {}, 2);
    assert(response.status === 204);
  });

  await test('31. Webhook Register / Receive / Unregister', () => {
    const conn = integrationService.connectors.restWebhook.createConnector();
    const reg = conn.registerWebhook('/webhooks/sap', (entry) => {});
    assert(reg.registered === true);

    const received = conn.receiveWebhook('/webhooks/sap', { event: 'WO_CREATED', id: 'WO-123' }, { 'x-api-key': 'test' });
    assert(received.received === true);
    assert(received.webhookId);

    const webhooks = conn.getReceivedWebhooks();
    assert(webhooks.length > 0);
    assert(webhooks[0].path === '/webhooks/sap');
    assert(webhooks[0].payload.event === 'WO_CREATED');

    const unreg = conn.unregisterWebhook('/webhooks/sap');
    assert(unreg.unregistered === true);
  });

  await test('32. Webhook Throws on Duplicate Path Registration', () => {
    const conn = integrationService.connectors.restWebhook.createConnector();
    conn.registerWebhook('/webhooks/test', () => {});
    assert.throws(() => conn.registerWebhook('/webhooks/test', () => {}), /already registered/);
  });

  await test('33. Webhook Clear Received', () => {
    const conn = integrationService.connectors.restWebhook.createConnector();
    conn.receiveWebhook('/test', { msg: 'hello' });
    assert(conn.getReceivedWebhooks().length > 0);
    conn.clearReceivedWebhooks();
    assert(conn.getReceivedWebhooks().length === 0);
  });

  await test('34. REST Connector Status', () => {
    const conn = integrationService.connectors.restWebhook.createConnector();
    conn.registerWebhook('/webhooks/status-test', () => {});
    conn.receiveWebhook('/webhooks/status-test', { test: true });
    const status = conn.getStatus();
    assert(typeof status.webhookHandlers === 'number');
    assert(typeof status.webhooksReceived === 'number');
  });

  // ─── ERP/CMMS Adapters ───────────────────────────────────────

  await test('35. SAP PM Adapter Authenticate', async () => {
    const sap = integrationService.adapters.sap.createAdapter();
    const auth = await sap.authenticate({ baseUrl: 'https://sap.example.com', username: 'admin', password: 'pass' });
    assert(auth.authenticated === true);
    assert(auth.system === 'SAP PM');
    assert(auth.sessionId);
  });

  await test('36. SAP PM Adapter Create / Get / Update Work Order', async () => {
    const sap = integrationService.adapters.sap.createAdapter();
    await sap.authenticate({ baseUrl: 'https://sap.example.com' });

    const wo = await sap.createWorkOrder({ equipment: 'EQ-1001', description: 'Replace bearing', priority: 'HIGH' });
    assert(wo.id.startsWith('WO-'));
    assert(wo.status === 'CREATED');

    const retrieved = await sap.getWorkOrder(wo.id);
    assert(retrieved);
    assert(retrieved.id === wo.id);

    const updated = await sap.updateWorkOrder(wo.id, { priority: 'MEDIUM' });
    assert(updated.priority === 'MEDIUM');
  });

  await test('37. SAP PM Adapter Close Work Order', async () => {
    const sap = integrationService.adapters.sap.createAdapter();
    await sap.authenticate({ baseUrl: 'https://sap.example.com' });
    const wo = await sap.createWorkOrder({ equipment: 'EQ-1002', description: 'Test close' });
    const closed = await sap.closeWorkOrder(wo.id, 'Completed successfully');
    assert(closed.status === 'CLOSED');
    assert(closed.completionNotes === 'Completed successfully');
  });

  await test('38. SAP PM Adapter Sync Work Orders', async () => {
    const sap = integrationService.adapters.sap.createAdapter();
    await sap.authenticate({ baseUrl: 'https://sap.example.com' });
    await sap.createWorkOrder({ equipment: 'EQ-1003', description: 'Sync test' });
    const synced = await sap.syncWorkOrders();
    assert(synced.syncedCount > 0);
    assert(synced.lastSync);
  });

  await test('39. SAP PM Adapter Get Equipment List', async () => {
    const sap = integrationService.adapters.sap.createAdapter();
    await sap.authenticate({ baseUrl: 'https://sap.example.com' });
    const equipment = await sap.getEquipmentList();
    assert(equipment.length === 5);
    equipment.forEach(eq => {
      assert(eq.equipmentId);
      assert(eq.status);
    });
  });

  await test('40. SAP PM Adapter Status', () => {
    const sap = integrationService.adapters.sap.createAdapter();
    const status = sap.getStatus();
    assert(status.system === 'SAP PM');
  });

  await test('41. IBM Maximo Adapter Authenticate', async () => {
    const maximo = integrationService.adapters.maximo.createAdapter();
    const auth = await maximo.authenticate({ baseUrl: 'https://maximo.example.com', apikey: 'key-123' });
    assert(auth.authenticated === true);
    assert(auth.system === 'IBM Maximo');
    assert(auth.token);
  });

  await test('42. IBM Maximo Adapter Create / Get / Complete Work Order', async () => {
    const maximo = integrationService.adapters.maximo.createAdapter();
    await maximo.authenticate({ baseUrl: 'https://maximo.example.com' });
    const wo = await maximo.createWorkOrder({ assetnum: 'ASSET-001', description: 'PM Routine A' });
    assert(wo.wonum.startsWith('MX-'));
    assert(wo.status === 'WAPPR');

    const retrieved = await maximo.getWorkOrder(wo.wonum);
    assert(retrieved.wonum === wo.wonum);

    const completed = await maximo.completeWorkOrder(wo.wonum, 4500, 8.5);
    assert(completed.status === 'COMPLETE');
    assert(completed.actualCost === 4500);
  });

  await test('43. IBM Maximo Adapter Sync Assets and PM Programs', async () => {
    const maximo = integrationService.adapters.maximo.createAdapter();
    await maximo.authenticate({ baseUrl: 'https://maximo.example.com' });
    const assets = await maximo.syncAssets();
    assert(assets.syncedCount === 8);
    assert(assets.assets.length === 8);

    const pm = await maximo.syncPMPrograms();
    assert(pm.syncedCount === 4);
    assert(pm.programs.length === 4);
  });

  await test('44. IBM Maximo Adapter Status', () => {
    const maximo = integrationService.adapters.maximo.createAdapter();
    const status = maximo.getStatus();
    assert(status.system === 'IBM Maximo');
  });

  await test('45. Siemens Opcenter Adapter Authenticate', async () => {
    const opc = integrationService.adapters.siemensOpcenter.createAdapter();
    const auth = await opc.authenticate({ baseUrl: 'https://opcenter.example.com', tenant: 'plant-pune' });
    assert(auth.authenticated === true);
    assert(auth.system === 'Siemens Opcenter');
  });

  await test('46. Siemens Opcenter Adapter Create / Get / Update Production Order', async () => {
    const opc = integrationService.adapters.siemensOpcenter.createAdapter();
    await opc.authenticate({ baseUrl: 'https://opcenter.example.com' });
    const po = await opc.createProductionOrder({ product: 'Shaft-100', quantity: 200, line: 'Line-A' });
    assert(po.id.startsWith('PO-'));
    assert(po.status === 'RELEASED');

    const retrieved = await opc.getProductionOrder(po.id);
    assert(retrieved.id === po.id);

    const updated = await opc.updateProductionOrderStatus(po.id, 'IN_PROGRESS');
    assert(updated.status === 'IN_PROGRESS');
  });

  await test('47. Siemens Opcenter Adapter Report Production', async () => {
    const opc = integrationService.adapters.siemensOpcenter.createAdapter();
    await opc.authenticate({ baseUrl: 'https://opcenter.example.com' });
    const po = await opc.createProductionOrder({ product: 'Gear-200', quantity: 100 });
    const reported = await opc.reportProduction(po.id, 95, 5, 30);
    assert(reported.goodCount === 95);
    assert(reported.rejectCount === 5);
    assert(reported.yield === 95);
  });

  await test('48. Siemens Opcenter Adapter Sync Schedule and Get Quality', async () => {
    const opc = integrationService.adapters.siemensOpcenter.createAdapter();
    await opc.authenticate({ baseUrl: 'https://opcenter.example.com' });
    const schedule = await opc.syncProductionSchedule();
    assert(schedule.syncedCount === 6);
    assert(schedule.schedule[0].priority === 'HIGH');

    const quality = await opc.getQualityMetrics();
    assert(typeof quality.overallYield === 'number');
    assert(quality.topDefects.length === 3);
  });

  await test('49. Siemens Opcenter Adapter Status', () => {
    const opc = integrationService.adapters.siemensOpcenter.createAdapter();
    const status = opc.getStatus();
    assert(status.system === 'Siemens Opcenter');
  });

  // ─── Synchronization Engine ─────────────────────────────────

  await test('50. Sync Engine Schedule and Execute Sync', async () => {
    const sync = integrationService.syncEngine;
    const scheduled = sync.scheduleSync('test-sync-job', 'opcua', async (lastSync) => {
      return { syncedCount: 42, lastSync: new Date().toISOString() };
    }, 60000);
    assert(scheduled.jobName === 'test-sync-job');
    assert(scheduled.status === 'SCHEDULED');

    const result = await sync.executeSync('test-sync-job');
    assert(result.success === true);
    assert(result.jobName === 'test-sync-job');
  });

  await test('51. Sync Engine Incremental Sync', async () => {
    const sync = integrationService.syncEngine;
    const lastSync = new Date(Date.now() - 86400000).toISOString();
    const result = await sync.executeIncrementalSync('maximo', async (ts) => {
      return { syncedCount: 10, from: ts };
    }, lastSync);
    assert(result.type === 'INCREMENTAL');
    assert(result.status === 'SUCCESS');
  });

  await test('52. Sync Engine Conflict Detection', () => {
    const sync = integrationService.syncEngine;
    const local = [{ id: 'A', value: 100 }, { id: 'B', value: 200 }];
    const remote = [{ id: 'A', value: 150 }, { id: 'B', value: 200 }];
    const result = sync.detectConflicts(local, remote);
    assert(result.conflictCount === 1);
    assert(result.conflicts[0].id === 'A');
  });

  await test('53. Sync Engine Conflict Resolution', () => {
    const sync = integrationService.syncEngine;
    // Trigger conflict detection first
    sync.detectConflicts(
      [{ id: 'CONF-1', value: 100 }],
      [{ id: 'CONF-1', value: 999 }]
    );
    const resolved = sync.resolveConflict('CONF-1', 'USE_REMOTE', { id: 'CONF-1', value: 999 });
    assert(resolved.resolved === true);
    assert(resolved.resolution === 'USE_REMOTE');
  });

  await test('54. Sync Engine Retry Queue', async () => {
    const sync = integrationService.syncEngine;
    const entry = sync.addToRetryQueue('test-sync-job', new Error('Connection timeout'));
    assert(entry.id);
    assert(entry.attempts === 0);
    assert(entry.maxAttempts === 3);

    const results = await sync.processRetryQueue();
    assert(Array.isArray(results));
  });

  await test('55. Sync Engine Status', () => {
    const status = integrationService.syncEngine.getSyncStatus();
    assert(typeof status.totalSyncJobs === 'number');
    assert(Array.isArray(status.activeSyncJobs));
    assert(typeof status.retryQueueSize === 'number');
    assert(typeof status.unresolvedConflicts === 'number');
    assert(typeof status.syncHistoryCount === 'number');
  });

  // ─── Connector Health Monitor ────────────────────────────────

  await test('56. Health Monitor Record Connection Success', () => {
    const hm = integrationService.healthMonitor;
    const rec = hm.recordConnectionAttempt('opcua-connector', true, 45);
    assert(rec.connectionStatus === 'CONNECTED');
    assert(rec.lastConnected);
    assert(rec.consecutiveFailures === 0);
  });

  await test('57. Health Monitor Record Connection Failure', () => {
    const hm = integrationService.healthMonitor;
    hm.recordConnectionAttempt('failing-conn', false, null);
    const rec = hm.recordConnectionAttempt('failing-conn', false, null);
    assert(rec.connectionStatus === 'DISCONNECTED');
    assert(rec.failureCount === 2);
    assert(rec.consecutiveFailures === 2);
  });

  await test('58. Health Monitor Record Sync', () => {
    const hm = integrationService.healthMonitor;
    const rec = hm.recordSync('opcua-connector', true, 1200);
    assert(rec.lastSync);
  });

  await test('59. Health Monitor Record Latency', () => {
    const hm = integrationService.healthMonitor;
    const rec = hm.recordLatency('opcua-connector', 32);
    assert(rec.lastChecked);
  });

  await test('60. Health Monitor Get Connector Health', () => {
    const hm = integrationService.healthMonitor;
    const health = hm.getConnectorHealth('opcua-connector');
    assert(health.connectorName === 'opcua-connector');
    assert(health.averageLatency != null);
    assert(typeof health.uptimePercent === 'number');
  });

  await test('61. Health Monitor Get All Health', () => {
    const hm = integrationService.healthMonitor;
    const all = hm.getAllHealth();
    assert(Array.isArray(all));
    assert(all.length > 0);
  });

  await test('62. Health Monitor Get Overall Summary', () => {
    const hm = integrationService.healthMonitor;
    const summary = hm.getOverallHealthSummary();
    assert(typeof summary.totalConnectors === 'number');
    assert(typeof summary.healthy === 'number');
    assert(typeof summary.critical === 'number');
    assert(typeof summary.totalFailures === 'number');
    assert(typeof summary.averageLatency === 'number' || summary.averageLatency === null);
  });

  await test('63. Health Monitor Reset', () => {
    const hm = integrationService.healthMonitor;
    hm.recordConnectionAttempt('reset-conn', true, 10);
    const reset = hm.resetHealth('reset-conn');
    assert(reset.reset === true);
    const after = hm.getConnectorHealth('reset-conn');
    assert(after.connectionStatus === 'NOT_REGISTERED');
  });

  // ─── Connector Registration Flow ─────────────────────────────

  await test('64. End-to-End: Register All Connectors and Adapters', () => {
    const hub = integrationService.integrationHub;

    const opcuaConn = integrationService.connectors.opcua.createConnector();
    const mqttConn = integrationService.connectors.mqtt.createConnector();
    const modbusConn = integrationService.connectors.modbus.createConnector();
    const restConn = integrationService.connectors.restWebhook.createConnector();
    const sapAdapter = integrationService.adapters.sap.createAdapter();
    const maximoAdapter = integrationService.adapters.maximo.createAdapter();
    const siemensAdapter = integrationService.adapters.siemensOpcenter.createAdapter();

    hub.registerConnector(opcuaConn.type, opcuaConn.name, opcuaConn);
    hub.registerConnector(mqttConn.type, mqttConn.name, mqttConn);
    hub.registerConnector(modbusConn.type, modbusConn.name, modbusConn);
    hub.registerConnector(restConn.type, restConn.name, restConn);
    hub.registerConnector(sapAdapter.type + '|' + sapAdapter.system, sapAdapter.name, sapAdapter);
    hub.registerConnector(maximoAdapter.type + '|' + maximoAdapter.system, maximoAdapter.name, maximoAdapter);
    hub.registerConnector(siemensAdapter.type + '|' + siemensAdapter.system, siemensAdapter.name, siemensAdapter);

    const all = hub.listConnectors();
    assert(all.length >= 7, 'All 7 connectors/adapters must be registered');
  });

  await test('65. End-to-End: Enable Connectors and Verify Hub Status', () => {
    const hub = integrationService.integrationHub;

    hub.enableConnector('opcua', { endpoint: 'opc.tcp://plant-pune:4840' });
    hub.enableConnector('mqtt', { host: 'mqtt.plant.local', port: 1883 });
    hub.enableConnector('modbus', { host: '192.168.1.100' });
    hub.enableConnector('restWebhook', {});

    const status = hub.getHubStatus();
    assert(status.enabledConnectors >= 4, 'At least 4 connectors enabled');
  });

  await test('66. End-to-End: Get Connector After Enable', () => {
    const hub = integrationService.integrationHub;
    const conn = hub.getConnector('opcua');
    assert(conn, 'Must retrieve opcua connector');
    assert(conn.type === 'OPC-UA');
  });

  console.log(`\n==================================================`);
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`==================================================`);
  if (failed > 0) process.exit(1);
}

runIntegrationTests();
