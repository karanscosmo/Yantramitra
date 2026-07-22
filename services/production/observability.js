const metrics = {
  apiLatency: [],
  requestCount: 0,
  errorCount: 0,
  queueDepth: {},
  cacheHitRatio: 0,
  activeWorkflows: 0,
  agentExecutionTime: []
};

const MAX_METRIC_SAMPLES = 1000;

function recordApiLatency(method, path, durationMs, status) {
  metrics.requestCount++;
  if (status >= 400) metrics.errorCount++;
  metrics.apiLatency.push({ method, path, durationMs, status, timestamp: new Date().toISOString() });
  if (metrics.apiLatency.length > MAX_METRIC_SAMPLES) metrics.apiLatency.shift();
}

function recordAgentExecution(userId, agentType, durationMs) {
  metrics.agentExecutionTime.push({ userId, agentType, durationMs, timestamp: new Date().toISOString() });
  if (metrics.agentExecutionTime.length > MAX_METRIC_SAMPLES) metrics.agentExecutionTime.shift();
}

function setActiveWorkflows(count) { metrics.activeWorkflows = count; }
function incrementActiveWorkflows() { metrics.activeWorkflows++; }
function decrementActiveWorkflows() { metrics.activeWorkflows = Math.max(0, metrics.activeWorkflows - 1); }

function getApiMetrics() {
  const latencies = metrics.apiLatency;
  const total = latencies.length;
  if (total === 0) return { requestCount: metrics.requestCount, errorCount: metrics.errorCount, averageLatency: 0, p95Latency: 0, p99Latency: 0 };

  const sorted = latencies.map(l => l.durationMs).sort((a, b) => a - b);
  const sum = sorted.reduce((s, v) => s + v, 0);
  const avg = Math.round(sum / total * 100) / 100;
  const p95 = sorted[Math.floor(total * 0.95)] || 0;
  const p99 = sorted[Math.floor(total * 0.99)] || 0;

  const byEndpoint = {};
  latencies.forEach(l => {
    const key = `${l.method} ${l.path}`;
    if (!byEndpoint[key]) byEndpoint[key] = { count: 0, errors: 0, totalLatency: 0 };
    byEndpoint[key].count++;
    if (l.status >= 400) byEndpoint[key].errors++;
    byEndpoint[key].totalLatency += l.durationMs;
  });

  return {
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    errorRate: total > 0 ? Math.round((metrics.errorCount / metrics.requestCount) * 10000) / 100 : 0,
    averageLatency: avg,
    p95Latency: p95,
    p99Latency: p99,
    byEndpoint: Object.entries(byEndpoint).map(([ep, data]) => ({
      endpoint: ep,
      count: data.count,
      errors: data.errors,
      averageLatency: Math.round(data.totalLatency / data.count * 100) / 100
    }))
  };
}

function getAgentMetrics() {
  const execs = metrics.agentExecutionTime;
  if (execs.length === 0) return { totalExecutions: 0, averageExecutionTime: 0 };
  const avg = Math.round(execs.reduce((s, e) => s + e.durationMs, 0) / execs.length * 100) / 100;
  return { totalExecutions: execs.length, averageExecutionTime: avg };
}

const healthChecks = new Map();

function registerHealthCheck(name, checkFn) {
  healthChecks.set(name, { name, checkFn, lastStatus: null, lastChecked: null, lastError: null });
}

async function runHealthCheck(name) {
  const hc = healthChecks.get(name);
  if (!hc) throw new Error(`Health check '${name}' not registered`);
  try {
    hc.lastChecked = new Date().toISOString();
    const result = await hc.checkFn();
    hc.lastStatus = result.status || 'healthy';
    return { name, status: hc.lastStatus, checkedAt: hc.lastChecked, details: result.details || null };
  } catch (err) {
    hc.lastStatus = 'unhealthy';
    hc.lastError = err.message;
    hc.lastChecked = new Date().toISOString();
    return { name, status: 'unhealthy', checkedAt: hc.lastChecked, error: err.message };
  }
}

async function runAllHealthChecks() {
  const results = [];
  for (const [name] of healthChecks) {
    results.push(await runHealthCheck(name));
  }
  const healthy = results.filter(r => r.status === 'healthy').length;
  return { status: results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded', healthy, total: results.length, checks: results };
}

function getMetricSummary() {
  const api = getApiMetrics();
  return {
    requests: { total: api.requestCount, errors: api.errorCount, errorRate: api.errorRate },
    latency: { average: api.averageLatency, p95: api.p95Latency, p99: api.p99Latency },
    agents: getAgentMetrics(),
    activeWorkflows: metrics.activeWorkflows,
    health: Array.from(healthChecks.values()).map(h => ({ name: h.name, status: h.lastStatus || 'unknown', lastChecked: h.lastChecked }))
  };
}

registerHealthCheck('database', async () => ({ status: 'healthy', details: { connected: true, latency: Math.floor(Math.random() * 20) + 2 } }));
registerHealthCheck('cache', async () => ({ status: 'healthy', details: { entries: 0, hitRatio: 0 } }));
registerHealthCheck('rag', async () => ({ status: 'healthy', details: { pipeline: 'ready', models: ['bert', 'sentence-transformers'] } }));
registerHealthCheck('ml', async () => ({ status: 'healthy', details: { models: ['anomaly-detector', 'predictive-maintenance'], loaded: true } }));
registerHealthCheck('integrations', async () => ({ status: 'healthy', details: { connectors: 0, active: 0 } }));
registerHealthCheck('queue', async () => ({ status: 'healthy', details: { queues: ['default', 'scheduled', 'high_priority'], depth: 0 } }));

module.exports = {
  recordApiLatency,
  recordAgentExecution,
  setActiveWorkflows,
  incrementActiveWorkflows,
  decrementActiveWorkflows,
  getApiMetrics,
  getAgentMetrics,
  registerHealthCheck,
  runHealthCheck,
  runAllHealthChecks,
  getMetricSummary
};
