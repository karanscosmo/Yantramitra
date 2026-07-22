const userBuckets = new Map();
const tenantBuckets = new Map();
const apiBuckets = new Map();
const ipBuckets = new Map();
const globalBucket = { count: 0, resetAt: Date.now() };
const globalMax = 10000;

const SLIDING_WINDOW_MS = 60000;
const BURST_MULTIPLIER = 2;

const limits = {
  user: 200,
  tenant: 2000,
  api: { 'GET': 500, 'POST': 200, 'PUT': 150, 'DELETE': 50 },
  ip: 1000
};

function getBucket(map, key) {
  if (!map.has(key)) {
    map.set(key, { count: 0, windowStart: Date.now(), burst: 0 });
  }
  return map.get(key);
}

function checkWindow(bucket, maxRequests) {
  const now = Date.now();
  if (now - bucket.windowStart > SLIDING_WINDOW_MS) {
    bucket.count = 0;
    bucket.windowStart = now;
    bucket.burst = 0;
  }
  const burstLimit = Math.floor(maxRequests * BURST_MULTIPLIER);
  if (bucket.count >= maxRequests && bucket.burst >= burstLimit) return false;
  if (bucket.count >= maxRequests) {
    const elapsed = now - bucket.windowStart;
    const ratio = elapsed / SLIDING_WINDOW_MS;
    if (ratio < 0.9) return false;
  }
  return true;
}

function increment(bucket) {
  bucket.count++;
  if (bucket.count > bucket.burst + 1) bucket.burst = 0;
  bucket.burst++;
}

function checkAndIncrement(type, key, maxRequests) {
  let bucket;
  switch (type) {
    case 'user': bucket = getBucket(userBuckets, key); break;
    case 'tenant': bucket = getBucket(tenantBuckets, key); break;
    case 'api': bucket = getBucket(apiBuckets, key); break;
    case 'ip': bucket = getBucket(ipBuckets, key); break;
    default: return { allowed: true };
  }

  const allowed = checkWindow(bucket, maxRequests);
  if (allowed) {
    increment(bucket);
    return {
      allowed: true,
      current: bucket.count,
      limit: maxRequests,
      remaining: maxRequests - bucket.count,
      windowMs: SLIDING_WINDOW_MS,
      burstLimit: Math.floor(maxRequests * BURST_MULTIPLIER)
    };
  }

  return {
    allowed: false,
    current: bucket.count,
    limit: maxRequests,
    remaining: 0,
    windowMs: SLIDING_WINDOW_MS,
    retryAfter: Math.max(0, Math.ceil((bucket.windowStart + SLIDING_WINDOW_MS - Date.now()) / 1000))
  };
}

function checkUserRate(userId) {
  return checkAndIncrement('user', userId, limits.user);
}

function checkTenantRate(tenantId) {
  return checkAndIncrement('tenant', tenantId, limits.tenant);
}

function checkApiRate(method) {
  const methodLimit = limits.api[method] || 100;
  return checkAndIncrement('api', method, methodLimit);
}

function checkIpRate(ip) {
  return checkAndIncrement('ip', ip, limits.ip);
}

function checkGlobalRate() {
  const now = Date.now();
  if (now - globalBucket.resetAt > SLIDING_WINDOW_MS) {
    globalBucket.count = 0;
    globalBucket.resetAt = now;
  }
  globalBucket.count++;
  return {
    allowed: globalBucket.count <= globalMax,
    current: globalBucket.count,
    limit: globalMax,
    remaining: Math.max(0, globalMax - globalBucket.count)
  };
}

function checkAll(userId, tenantId, method, ip) {
  const results = {};
  let allowed = true;

  const global = checkGlobalRate();
  results.global = global;
  if (!global.allowed) allowed = false;

  if (userId) {
    const user = checkUserRate(userId);
    results.user = user;
    if (!user.allowed) allowed = false;
  }

  if (tenantId) {
    const tenant = checkTenantRate(tenantId);
    results.tenant = tenant;
    if (!tenant.allowed) allowed = false;
  }

  if (method) {
    const api = checkApiRate(method);
    results.api = api;
    if (!api.allowed) allowed = false;
  }

  if (ip) {
    const ipResult = checkIpRate(ip);
    results.ip = ipResult;
    if (!ipResult.allowed) allowed = false;
  }

  return { allowed, checks: results };
}

function getRateStatus() {
  const now = Date.now();
  return {
    users: Array.from(userBuckets.entries()).map(([id, b]) => ({ id, count: b.count, windowElapsed: Math.round((now - b.windowStart) / 1000), windowRemaining: Math.max(0, Math.ceil((b.windowStart + SLIDING_WINDOW_MS - now) / 1000)) })),
    tenants: Array.from(tenantBuckets.entries()).map(([id, b]) => ({ id, count: b.count })),
    api: Array.from(apiBuckets.entries()).map(([m, b]) => ({ method: m, count: b.count })),
    global: { count: globalBucket.count, limit: globalMax, remaining: Math.max(0, globalMax - globalBucket.count) },
    limits: { user: limits.user, tenant: limits.tenant, api: limits.api }
  };
}

function resetRate(key) {
  userBuckets.delete(key);
  tenantBuckets.delete(key);
  apiBuckets.delete(key);
  return { reset: true };
}

module.exports = {
  checkAndIncrement,
  checkUserRate,
  checkTenantRate,
  checkApiRate,
  checkIpRate,
  checkGlobalRate,
  checkAll,
  getRateStatus,
  resetRate
};
