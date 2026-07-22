const perfSamples = [];
const slowEndpoints = [];
const MAX_SAMPLES = 1000;
const SLOW_THRESHOLD_MS = 1000;

function recordCpuUsage() {
  const usage = process.cpuUsage();
  return { user: usage.user / 1000, system: usage.system / 1000, timestamp: new Date().toISOString() };
}

function recordMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    rss: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(mem.external / 1024 / 1024 * 100) / 100,
    timestamp: new Date().toISOString()
  };
}

function recordPerformanceSample() {
  const sample = {
    cpu: recordCpuUsage(),
    memory: recordMemoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
  perfSamples.push(sample);
  if (perfSamples.length > MAX_SAMPLES) perfSamples.shift();
  return sample;
}

function recordEventLoopDelay() {
  return new Promise(resolve => {
    const start = Date.now();
    setImmediate(() => {
      const delay = Date.now() - start;
      resolve(delay);
    });
  });
}

function recordSlowEndpoint(method, path, durationMs) {
  slowEndpoints.push({ method, path, durationMs, timestamp: new Date().toISOString() });
  if (slowEndpoints.length > MAX_SAMPLES) slowEndpoints.shift();
}

function getPerformanceReport() {
  const mem = recordMemoryUsage();
  const cpu = recordCpuUsage();

  const recentMemory = perfSamples.length > 0 ? perfSamples.slice(-60).map(s => s.memory) : [];
  const avgHeapUsed = recentMemory.length > 0
    ? Math.round(recentMemory.reduce((s, m) => s + m.heapUsed, 0) / recentMemory.length * 100) / 100
    : mem.heapUsed;

  const recentCpu = perfSamples.length > 0 ? perfSamples.slice(-60).map(s => s.cpu) : [];
  const avgCpuUser = recentCpu.length > 0
    ? Math.round(recentCpu.reduce((s, c) => s + c.user, 0) / recentCpu.length * 100) / 100
    : cpu.user;

  const recentSlow = slowEndpoints.slice(-20);

  return {
    current: {
      memory: mem,
      cpu,
      uptime: process.uptime()
    },
    averages: {
      heapUsedMB: avgHeapUsed,
      cpuUserMs: avgCpuUser,
      samples: perfSamples.length
    },
    slowEndpoints: recentSlow.length > 0 ? recentSlow.map(e => ({
      method: e.method,
      path: e.path,
      durationMs: e.durationMs,
      timestamp: e.timestamp
    })) : [],
    eventLoopDelay: null
  };
}

function getColdStartDuration() {
  return { duration: process.uptime() > 60 ? 0 : process.uptime(), isColdStart: process.uptime() < 60 };
}

function getSamples() {
  return perfSamples.slice(-100);
}

recordPerformanceSample();

setInterval(() => recordPerformanceSample(), 30000);

module.exports = {
  recordCpuUsage,
  recordMemoryUsage,
  recordPerformanceSample,
  recordEventLoopDelay,
  recordSlowEndpoint,
  getPerformanceReport,
  getColdStartDuration,
  getSamples
};
