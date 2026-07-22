const circuitBreakers = new Map();
const halfOpenSuccesses = new Map();

const CIRCUIT_STATES = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

function createCircuitBreaker(name, options = {}) {
  if (circuitBreakers.has(name)) throw new Error(`Circuit breaker '${name}' already exists`);
  const cb = {
    name,
    state: CIRCUIT_STATES.CLOSED,
    failureCount: 0,
    successCount: 0,
    failureThreshold: options.failureThreshold || 5,
    successThreshold: options.successThreshold || 2,
    timeout: options.timeout || 30000,
    halfOpenTimeout: options.halfOpenTimeout || 5000,
    lastFailure: null,
    lastSuccess: null,
    openedAt: null,
    halfOpenAt: null,
    createdAt: new Date().toISOString()
  };
  circuitBreakers.set(name, cb);
  halfOpenSuccesses.set(name, 0);
  return cb;
}

function isOpen(name) {
  const cb = circuitBreakers.get(name);
  if (!cb) return false;
  if (cb.state === CIRCUIT_STATES.OPEN) {
    if (cb.openedAt && Date.now() - new Date(cb.openedAt).getTime() > cb.timeout) {
      cb.state = CIRCUIT_STATES.HALF_OPEN;
      cb.halfOpenAt = new Date().toISOString();
      halfOpenSuccesses.set(name, 0);
    }
  }
  return cb.state === CIRCUIT_STATES.OPEN;
}

function recordSuccess(name) {
  const cb = circuitBreakers.get(name);
  if (!cb) return;
  cb.successCount++;
  cb.lastSuccess = new Date().toISOString();
  if (cb.state === CIRCUIT_STATES.HALF_OPEN) {
    const successes = (halfOpenSuccesses.get(name) || 0) + 1;
    halfOpenSuccesses.set(name, successes);
    if (successes >= cb.successThreshold) {
      cb.state = CIRCUIT_STATES.CLOSED;
      cb.failureCount = 0;
      cb.openedAt = null;
      cb.halfOpenAt = null;
      halfOpenSuccesses.set(name, 0);
    }
  } else {
    cb.failureCount = 0;
  }
}

function recordFailure(name) {
  const cb = circuitBreakers.get(name);
  if (!cb) return;
  cb.failureCount++;
  cb.lastFailure = new Date().toISOString();
  if (cb.state === CIRCUIT_STATES.HALF_OPEN || cb.failureCount >= cb.failureThreshold) {
    cb.state = CIRCUIT_STATES.OPEN;
    cb.openedAt = new Date().toISOString();
    halfOpenSuccesses.set(name, 0);
  }
}

async function call(name, fn, fallback) {
  if (isOpen(name)) {
    if (fallback) return typeof fallback === 'function' ? fallback() : fallback;
    throw new Error(`Circuit breaker '${name}' is OPEN`);
  }
  try {
    const result = await fn();
    recordSuccess(name);
    return result;
  } catch (err) {
    recordFailure(name);
    if (fallback) return typeof fallback === 'function' ? fallback() : fallback;
    throw err;
  }
}

function getCircuitBreakerStatus(name) {
  const cb = circuitBreakers.get(name);
  if (!cb) return null;
  return {
    ...cb,
    isOpen: cb.state === CIRCUIT_STATES.OPEN || cb.state === CIRCUIT_STATES.HALF_OPEN,
    halfOpenSuccesses: halfOpenSuccesses.get(name) || 0
  };
}

function getAllCircuitBreakers() {
  return Array.from(circuitBreakers.keys()).map(k => getCircuitBreakerStatus(k));
}

function resetCircuitBreaker(name) {
  const cb = circuitBreakers.get(name);
  if (!cb) throw new Error(`Circuit breaker '${name}' not found`);
  cb.state = CIRCUIT_STATES.CLOSED;
  cb.failureCount = 0;
  cb.successCount = 0;
  cb.openedAt = null;
  cb.halfOpenAt = null;
  halfOpenSuccesses.set(name, 0);
  return { name, state: 'CLOSED', reset: true };
}

async function withRetry(fn, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 200;
  const multiplier = options.multiplier || 2;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0 && options.onRetry) options.onRetry(attempt, lastError);
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(multiplier, attempt);
        const jitter = Math.random() * delay * 0.1;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }
  throw lastError;
}

async function withTimeout(fn, timeoutMs, fallback) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs))
  ]).catch(err => {
    if (fallback) return typeof fallback === 'function' ? fallback() : fallback;
    throw err;
  });
}

const bulkheads = new Map();

function createBulkhead(name, maxConcurrent = 10) {
  if (bulkheads.has(name)) throw new Error(`Bulkhead '${name}' already exists`);
  const bh = {
    name,
    maxConcurrent,
    active: 0,
    queued: 0,
    rejected: 0,
    completed: 0
  };
  bulkheads.set(name, bh);
  return bh;
}

async function runInBulkhead(name, fn) {
  const bh = bulkheads.get(name);
  if (!bh) throw new Error(`Bulkhead '${name}' not found`);
  if (bh.active >= bh.maxConcurrent) {
    bh.rejected++;
    throw new Error(`Bulkhead '${name}' at capacity (${bh.active}/${bh.maxConcurrent})`);
  }
  bh.active++;
  try {
    const result = await fn();
    bh.completed++;
    return result;
  } finally {
    bh.active--;
  }
}

function getBulkheadStatus(name) {
  const bh = bulkheads.get(name);
  if (!bh) return null;
  return { ...bh, available: bh.maxConcurrent - bh.active };
}

function getAllBulkheads() {
  return Array.from(bulkheads.values());
}

createBulkhead('integrations', 20);
createBulkhead('rag', 5);
createBulkhead('ml', 3);
createBulkhead('database', 50);
createBulkhead('queue', 30);

createCircuitBreaker('integrations', { failureThreshold: 3, timeout: 30000 });
createCircuitBreaker('rag', { failureThreshold: 3, timeout: 60000 });
createCircuitBreaker('ml', { failureThreshold: 2, timeout: 30000 });
createCircuitBreaker('database', { failureThreshold: 5, timeout: 10000 });
createCircuitBreaker('queue', { failureThreshold: 3, timeout: 15000 });

module.exports = {
  CIRCUIT_STATES,
  createCircuitBreaker,
  isOpen,
  recordSuccess,
  recordFailure,
  call,
  getCircuitBreakerStatus,
  getAllCircuitBreakers,
  resetCircuitBreaker,
  withRetry,
  withTimeout,
  createBulkhead,
  runInBulkhead,
  getBulkheadStatus,
  getAllBulkheads
};
