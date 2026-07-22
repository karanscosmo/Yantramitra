const logStore = [];
const MAX_LOG_ENTRIES = 5000;
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, FATAL: 4 };

let requestIdCounter = 0;

function generateRequestId() {
  return `req-${Date.now()}-${++requestIdCounter}`;
}

function generateCorrelationId() {
  return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function log(level, message, context = {}) {
  const levelNum = LOG_LEVELS[level];
  if (levelNum == null) throw new Error(`Invalid log level '${level}'. Valid: ${Object.keys(LOG_LEVELS).join(', ')}`);

  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    level,
    levelNum,
    message,
    service: context.service || 'yantramitra',
    requestId: context.requestId || null,
    correlationId: context.correlationId || null,
    tenantId: context.tenantId || null,
    userId: context.userId || null,
    duration: context.duration || null,
    error: context.error || null,
    metadata: context.metadata || null
  };

  logStore.push(entry);
  if (logStore.length > MAX_LOG_ENTRIES) logStore.shift();

  return entry;
}

function debug(message, context) { return log('DEBUG', message, context); }
function info(message, context) { return log('INFO', message, context); }
function warn(message, context) { return log('WARN', message, context); }
function error(message, context) { return log('ERROR', message, context); }
function fatal(message, context) { return log('FATAL', message, context); }

function search(filters = {}) {
  let results = [...logStore];

  if (filters.level) results = results.filter(e => e.level === filters.level);
  if (filters.minLevel) results = results.filter(e => e.levelNum >= LOG_LEVELS[filters.minLevel]);
  if (filters.service) results = results.filter(e => e.service === filters.service);
  if (filters.requestId) results = results.filter(e => e.requestId === filters.requestId);
  if (filters.correlationId) results = results.filter(e => e.correlationId === filters.correlationId);
  if (filters.tenantId) results = results.filter(e => e.tenantId === filters.tenantId);
  if (filters.userId) results = results.filter(e => e.userId === filters.userId);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(e =>
      (e.message && e.message.toLowerCase().includes(q)) ||
      (e.error && e.error.toLowerCase().includes(q))
    );
  }
  if (filters.startDate) results = results.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
  if (filters.endDate) results = results.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));

  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return results.slice(0, filters.limit || 200);
}

function getLogStats() {
  const counts = {};
  logStore.forEach(e => { counts[e.level] = (counts[e.level] || 0) + 1; });
  return {
    total: logStore.length,
    byLevel: counts,
    uniqueServices: new Set(logStore.map(e => e.service).filter(Boolean)).size,
    dateRange: logStore.length > 0 ? { earliest: logStore[0].timestamp, latest: logStore[logStore.length - 1].timestamp } : null
  };
}

function createRequestContext(req) {
  const requestId = generateRequestId();
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  return { requestId, correlationId, userId: req.user?.id || req.headers['x-user-id'] || null, tenantId: req.headers['x-tenant-id'] || null };
}

function clear() {
  const count = logStore.length;
  logStore.length = 0;
  return { cleared: true, entriesRemoved: count };
}

module.exports = {
  LOG_LEVELS,
  generateRequestId,
  generateCorrelationId,
  log,
  debug,
  info,
  warn,
  error,
  fatal,
  search,
  getLogStats,
  createRequestContext,
  clear
};
