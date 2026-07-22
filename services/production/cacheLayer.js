const cache = new Map();
const stats = { hits: 0, misses: 0, sets: 0, invalidations: 0 };

const DEFAULT_TTL_MS = 300000;
const NAMESPACES = ['rag', 'ml', 'graph', 'fleet', 'decisions', 'learning'];

const ttlDefaults = {
  rag: 600000,
  ml: 300000,
  graph: 120000,
  fleet: 60000,
  decisions: 180000,
  learning: 300000
};

function buildKey(namespace, key) {
  if (!NAMESPACES.includes(namespace)) throw new Error(`Invalid namespace '${namespace}'. Valid: ${NAMESPACES.join(', ')}`);
  return `${namespace}:${key}`;
}

function set(namespace, key, value, ttlMs) {
  const fullKey = buildKey(namespace, key);
  const ttl = ttlMs != null ? ttlMs : (ttlDefaults[namespace] || DEFAULT_TTL_MS);
  const entry = {
    value,
    ttl,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttl
  };
  cache.set(fullKey, entry);
  stats.sets++;
  return fullKey;
}

function get(namespace, key) {
  const fullKey = buildKey(namespace, key);
  const entry = cache.get(fullKey);
  if (!entry) { stats.misses++; return null; }
  if (Date.now() > entry.expiresAt) {
    cache.delete(fullKey);
    stats.misses++;
    return null;
  }
  stats.hits++;
  return entry.value;
}

function del(namespace, key) {
  const fullKey = buildKey(namespace, key);
  const existed = cache.has(fullKey);
  cache.delete(fullKey);
  if (existed) stats.invalidations++;
  return existed;
}

function invalidateNamespace(namespace) {
  if (!NAMESPACES.includes(namespace)) throw new Error(`Invalid namespace '${namespace}'`);
  let count = 0;
  cache.forEach((_, key) => {
    if (key.startsWith(`${namespace}:`)) { cache.delete(key); count++; }
  });
  stats.invalidations += count;
  return { namespace, invalidated: count };
}

function flush() {
  const count = cache.size;
  cache.clear();
  return { flushed: true, entriesRemoved: count };
}

function getStats() {
  const total = stats.hits + stats.misses;
  return {
    entries: cache.size,
    hitCount: stats.hits,
    missCount: stats.misses,
    setCount: stats.sets,
    invalidationCount: stats.invalidations,
    hitRatio: total > 0 ? Math.round((stats.hits / total) * 10000) / 100 : 0,
    namespaces: NAMESPACES.map(ns => {
      const entries = [];
      cache.forEach((entry, key) => {
        if (key.startsWith(`${ns}:`)) entries.push({ key: key.slice(ns.length + 1), ttl: entry.ttl, expiresAt: new Date(entry.expiresAt).toISOString() });
      });
      return { namespace: ns, entries: entries.length, ttlDefault: ttlDefaults[ns] };
    })
  };
}

function wrap(namespace, key, fetchFn, ttlMs) {
  const cached = get(namespace, key);
  if (cached != null) return Promise.resolve(cached);
  return Promise.resolve(fetchFn()).then(value => {
    set(namespace, key, value, ttlMs);
    return value;
  });
}

function getMulti(namespace, keys) {
  return keys.map(k => ({ key: k, value: get(namespace, k), hit: cache.has(buildKey(namespace, k)) && Date.now() <= cache.get(buildKey(namespace, k)).expiresAt }));
}

function setMulti(namespace, entries) {
  return entries.map(e => set(namespace, e.key, e.value, e.ttl));
}

module.exports = {
  NAMESPACES,
  set,
  get,
  del,
  invalidateNamespace,
  flush,
  getStats,
  wrap,
  getMulti,
  setMulti
};
