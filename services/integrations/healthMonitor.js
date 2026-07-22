const connectorHealth = new Map();

function getHealthKey(connectorName) {
  return connectorName;
}

function recordConnectionAttempt(connectorName, success, latencyMs) {
  const key = getHealthKey(connectorName);
  if (!connectorHealth.has(key)) {
    connectorHealth.set(key, {
      connectorName,
      connectionStatus: 'UNKNOWN',
      lastConnected: null,
      lastDisconnected: null,
      lastSync: null,
      latency: [],
      failureCount: 0,
      retryCount: 0,
      consecutiveFailures: 0,
      uptimePercent: 100,
      firstSeen: new Date().toISOString(),
      lastChecked: new Date().toISOString()
    });
  }

  const record = connectorHealth.get(key);

  if (success) {
    record.connectionStatus = 'CONNECTED';
    record.lastConnected = new Date().toISOString();
    record.consecutiveFailures = 0;
  } else {
    record.connectionStatus = 'DISCONNECTED';
    record.lastDisconnected = new Date().toISOString();
    record.failureCount++;
    record.consecutiveFailures++;
  }

  if (latencyMs != null) {
    record.latency.push({ value: latencyMs, timestamp: new Date().toISOString() });
    if (record.latency.length > 100) record.latency.shift();
  }

  record.lastChecked = new Date().toISOString();
  record.uptimePercent = calculateUptime(key);
  return record;
}

function recordSync(connectorName, success, durationMs) {
  const key = getHealthKey(connectorName);
  if (!connectorHealth.has(key)) {
    recordConnectionAttempt(connectorName, true, null);
  }

  const record = connectorHealth.get(key);
  record.lastSync = new Date().toISOString();

  if (!success) {
    record.retryCount++;
  }

  return record;
}

function recordLatency(connectorName, latencyMs) {
  const key = getHealthKey(connectorName);
  if (!connectorHealth.has(key)) {
    recordConnectionAttempt(connectorName, true, latencyMs);
    return connectorHealth.get(key);
  }

  const record = connectorHealth.get(key);
  record.latency.push({ value: latencyMs, timestamp: new Date().toISOString() });
  if (record.latency.length > 100) record.latency.shift();
  record.lastChecked = new Date().toISOString();
  return record;
}

function calculateUptime(key) {
  const record = connectorHealth.get(key);
  if (!record) return 100;
  const totalAttempts = record.failureCount + getSuccessCount(key);
  if (totalAttempts === 0) return 100;
  return Math.round(((totalAttempts - record.failureCount) / totalAttempts) * 10000) / 100;
}

function getSuccessCount(key) {
  const record = connectorHealth.get(key);
  if (!record) return 0;
  const totalLatencySamples = record.latency.length;
  return Math.max(totalLatencySamples, record.failureCount > 0 ? 1 : 0);
}

function getConnectorHealth(connectorName) {
  const key = getHealthKey(connectorName);
  const record = connectorHealth.get(key);

  if (!record) {
    return {
      connectorName,
      connectionStatus: 'NOT_REGISTERED',
      lastConnected: null,
      lastDisconnected: null,
      lastSync: null,
      averageLatency: null,
      failureCount: 0,
      retryCount: 0,
      consecutiveFailures: 0,
      uptimePercent: 100,
      status: 'UNKNOWN'
    };
  }

  const latencies = record.latency;
  const avgLatency = latencies.length > 0
    ? Math.round(latencies.reduce((s, l) => s + l.value, 0) / latencies.length * 100) / 100
    : null;

  return {
    ...record,
    averageLatency: avgLatency,
    status: record.connectionStatus === 'CONNECTED' ? 'HEALTHY' : 'CRITICAL',
    monitoredSince: record.firstSeen
  };
}

function getAllHealth() {
  const names = Array.from(connectorHealth.keys());
  return names.map(name => getConnectorHealth(name));
}

function getOverallHealthSummary() {
  const all = getAllHealth();
  const healthy = all.filter(h => h.status === 'HEALTHY').length;
  const critical = all.filter(h => h.status === 'CRITICAL').length;
  const unknown = all.filter(h => h.status === 'UNKNOWN').length;
  const totalFailures = all.reduce((s, h) => s + h.failureCount, 0);
  const totalRetries = all.reduce((s, h) => s + h.retryCount, 0);
  const totalLatencies = all.filter(h => h.averageLatency != null).map(h => h.averageLatency);
  const averageLatency = totalLatencies.length > 0
    ? Math.round(totalLatencies.reduce((s, l) => s + l, 0) / totalLatencies.length * 100) / 100
    : null;

  return {
    totalConnectors: all.length,
    healthy,
    critical,
    unknown,
    totalFailures,
    totalRetries,
    averageLatency,
    connectors: all
  };
}

function resetHealth(connectorName) {
  const key = getHealthKey(connectorName);
  connectorHealth.delete(key);
  return { connectorName, reset: true };
}

module.exports = {
  recordConnectionAttempt,
  recordSync,
  recordLatency,
  getConnectorHealth,
  getAllHealth,
  getOverallHealthSummary,
  resetHealth
};
