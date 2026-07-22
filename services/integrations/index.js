const integrationHub = require('./integrationHub');
const syncEngine = require('./syncEngine');
const healthMonitor = require('./healthMonitor');

const opcua = require('./connectors/opcua');
const mqtt = require('./connectors/mqtt');
const modbus = require('./connectors/modbus');
const restWebhook = require('./connectors/restWebhook');
const sap = require('./connectors/sap');
const maximo = require('./connectors/maximo');
const siemensOpcenter = require('./connectors/siemensOpcenter');

function getIntegrationSystemStatus() {
  const hubStatus = integrationHub.getHubStatus();
  const healthSummary = healthMonitor.getOverallHealthSummary();
  return {
    systemStatus: 'ACTIVE_READY',
    integrationMode: 'ENTERPRISE_CONNECTED',
    hub: hubStatus,
    health: healthSummary,
    capabilities: [
      'OPC-UA Connector (Read / Browse / Subscribe)',
      'MQTT Connector (Publish / Subscribe / Auto-Reconnect)',
      'Modbus Connector (TCP Read/Write / Polling)',
      'REST/Webhook Connector (Client / Receiver / Retry)',
      'SAP PM Adapter (Work Orders / Equipment)',
      'IBM Maximo Adapter (Assets / PM Programs)',
      'Siemens Opcenter Adapter (Production Orders / Quality)',
      'Synchronization Engine (Scheduled / Incremental / Retry)',
      'Connector Health Monitor (Status / Latency / Failures)'
    ]
  };
}

module.exports = {
  integrationHub,
  syncEngine: syncEngine.createScheduler(),
  healthMonitor,
  connectors: { opcua, mqtt, modbus, restWebhook },
  adapters: { sap, maximo, siemensOpcenter },
  getIntegrationSystemStatus
};
