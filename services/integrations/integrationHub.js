const connectors = new Map();
const connectorMeta = new Map();

function registerConnector(type, name, instance) {
  if (connectors.has(name)) throw new Error(`Connector '${name}' already registered`);
  connectors.set(name, instance);
  connectorMeta.set(name, {
    type,
    name,
    enabled: false,
    registeredAt: new Date().toISOString(),
    config: {}
  });
  return { message: `Connector '${name}' registered`, type };
}

function enableConnector(name, config = {}) {
  const meta = connectorMeta.get(name);
  if (!meta) throw new Error(`Connector '${name}' not found`);
  if (meta.enabled) return { message: `Connector '${name}' already enabled` };
  meta.enabled = true;
  meta.config = { ...meta.config, ...config };
  meta.enabledAt = new Date().toISOString();
  return { message: `Connector '${name}' enabled`, config: meta.config };
}

function disableConnector(name) {
  const meta = connectorMeta.get(name);
  if (!meta) throw new Error(`Connector '${name}' not found`);
  if (!meta.enabled) return { message: `Connector '${name}' already disabled` };
  meta.enabled = false;
  meta.disabledAt = new Date().toISOString();
  return { message: `Connector '${name}' disabled` };
}

function getConnector(name) {
  return connectors.get(name) || null;
}

function getConnectorMeta(name) {
  return connectorMeta.get(name) || null;
}

function listConnectors() {
  return Array.from(connectorMeta.entries()).map(([name, meta]) => ({
    name,
    type: meta.type,
    enabled: meta.enabled,
    registeredAt: meta.registeredAt,
    enabledAt: meta.enabledAt || null,
    disabledAt: meta.disabledAt || null
  }));
}

function listEnabledConnectors() {
  return Array.from(connectorMeta.entries())
    .filter(([, meta]) => meta.enabled)
    .map(([name]) => name);
}

function getHubStatus() {
  const all = listConnectors();
  const enabled = all.filter(c => c.enabled);
  return {
    totalConnectors: all.length,
    enabledConnectors: enabled.length,
    disabledConnectors: all.length - enabled.length,
    connectors: all
  };
}

module.exports = {
  registerConnector,
  enableConnector,
  disableConnector,
  getConnector,
  getConnectorMeta,
  listConnectors,
  listEnabledConnectors,
  getHubStatus
};
