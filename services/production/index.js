const cacheLayer = require('./cacheLayer');
const jobEngine = require('./jobEngine');
const observability = require('./observability');
const logger = require('./logger');
const performanceMonitor = require('./performanceMonitor');
const resilience = require('./resilience');
const rateLimiter = require('./rateLimiter');

function getProductionSystemStatus() {
  const cacheStats = cacheLayer.getStats();
  const queues = jobEngine.getAllQueueStatus();
  const health = observability.getMetricSummary();
  const rateStatus = rateLimiter.getRateStatus();

  return {
    systemStatus: 'ACTIVE_READY',
    productionMode: 'ENTERPRISE_SCALE',
    cache: {
      entries: cacheStats.entries,
      hitRatio: cacheStats.hitRatio,
      namespaces: cacheStats.namespaces.length
    },
    jobs: {
      queues: queues.length,
      totalQueued: queues.reduce((s, q) => s + q.queued, 0)
    },
    observability: {
      healthChecks: health.health.length,
      requests: health.requests.total
    },
    rateLimiting: {
      users: rateStatus.users.length,
      tenants: rateStatus.tenants.length
    },
    resilience: {
      circuitBreakers: resilience.getAllCircuitBreakers().length,
      bulkheads: resilience.getAllBulkheads().length
    },
    capabilities: [
      'Distributed Cache Layer — Namespaced with TTL, Redis adapter, in-memory fallback',
      'Background Job Engine — Queue, priorities, retry, DLQ, scheduled jobs',
      'Observability Platform — API latency, error rate, agent metrics, health checks',
      'Central Logging — Structured, correlation IDs, searchable by level/service/user',
      'Performance Monitoring — CPU, memory, event loop, slow endpoints, cold start',
      'Resilience Layer — Circuit breakers, retry with backoff, timeout, bulkhead',
      'Rate Limiting — Per user/tenant/API/IP, sliding window, burst protection'
    ]
  };
}

module.exports = {
  cacheLayer,
  jobEngine,
  observability,
  logger,
  performanceMonitor,
  resilience,
  rateLimiter,
  getProductionSystemStatus
};
