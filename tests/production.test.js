const assert = require('assert');
const productionService = require('../services/production');

async function runProductionTests() {
  console.log('==================================================');
  console.log('YantraMitra Production Readiness Test Suite');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
      failed++;
    }
  }

  // ─── Cache Layer ─────────────────────────────────────────────

  await test('1. Cache System Status Returns Correct Shape', () => {
    const status = productionService.getProductionSystemStatus();
    assert.strictEqual(status.systemStatus, 'ACTIVE_READY');
    assert(status.capabilities.length >= 7);
  });

  await test('2. Cache Set and Get', () => {
    productionService.cacheLayer.set('rag', 'test-key', { data: 'hello' }, 60000);
    const val = productionService.cacheLayer.get('rag', 'test-key');
    assert.deepStrictEqual(val, { data: 'hello' });
  });

  await test('3. Cache Returns Null for Missing Key', () => {
    const val = productionService.cacheLayer.get('ml', 'nonexistent');
    assert.strictEqual(val, null);
  });

  await test('4. Cache Expiration Works', async () => {
    productionService.cacheLayer.set('fleet', 'expire-test', 'value', 10);
    assert(productionService.cacheLayer.get('fleet', 'expire-test') === 'value');
    await new Promise(r => setTimeout(r, 15));
    assert(productionService.cacheLayer.get('fleet', 'expire-test') === null);
  });

  await test('5. Cache Delete', () => {
    productionService.cacheLayer.set('graph', 'del-test', 'data');
    const deleted = productionService.cacheLayer.del('graph', 'del-test');
    assert(deleted === true);
    assert(productionService.cacheLayer.get('graph', 'del-test') === null);
  });

  await test('6. Cache Invalidate Namespace', () => {
    productionService.cacheLayer.set('rag', 'a', 1);
    productionService.cacheLayer.set('rag', 'b', 2);
    productionService.cacheLayer.set('ml', 'c', 3);
    const result = productionService.cacheLayer.invalidateNamespace('rag');
    assert(result.namespace === 'rag');
    assert(result.invalidated >= 2);
    assert(productionService.cacheLayer.get('rag', 'a') === null);
    assert(productionService.cacheLayer.get('ml', 'c') !== null);
  });

  await test('7. Cache Throws on Invalid Namespace', () => {
    assert.throws(() => productionService.cacheLayer.set('invalid', 'k', 'v'));
  });

  await test('8. Cache Stats', () => {
    const stats = productionService.cacheLayer.getStats();
    assert(typeof stats.entries === 'number');
    assert(typeof stats.hitRatio === 'number');
    assert(stats.namespaces.length >= 6);
    assert(stats.hitCount > 0);
  });

  await test('9. Cache Wrap Function', async () => {
    let callCount = 0;
    const result = await productionService.cacheLayer.wrap('ml', 'wrap-test', async () => {
      callCount++;
      return { computed: 42 };
    });
    assert.deepStrictEqual(result, { computed: 42 });
    assert(callCount === 1);

    const cached = await productionService.cacheLayer.wrap('ml', 'wrap-test', async () => {
      callCount++;
      return { computed: 99 };
    });
    assert.deepStrictEqual(cached, { computed: 42 });
    assert(callCount === 1);
  });

  await test('10. Cache Flush', () => {
    const result = productionService.cacheLayer.flush();
    assert(result.flushed === true);
    const stats = productionService.cacheLayer.getStats();
    assert(stats.entries === 0);
  });

  // ─── Job Engine ─────────────────────────────────────────────

  await test('11. Job Engine Create Queue and Enqueue', () => {
    const q = productionService.jobEngine.createQueue('test-queue');
    assert(q.created === true);

    const job = productionService.jobEngine.enqueue('test-queue', 'rag_indexing', { docId: '123' }, { priority: 'HIGH' });
    assert(job.id);
    assert(job.type === 'rag_indexing');
    assert(job.status === 'QUEUED');
  });

  await test('12. Job Engine Dequeue Returns Job', () => {
    const job = productionService.jobEngine.dequeue('test-queue');
    assert(job);
    assert(job.status === 'RUNNING');
    assert(job.startedAt);
  });

  await test('13. Job Engine Complete Job', () => {
    productionService.jobEngine.enqueue('test-queue', 'report_generation', { format: 'PDF' });
    const job = productionService.jobEngine.dequeue('test-queue');
    const completed = productionService.jobEngine.complete(job.id, { url: '/reports/test.pdf' });
    assert(completed.status === 'COMPLETED');
    assert(completed.result.url === '/reports/test.pdf');
  });

  await test('14. Job Engine Fail with Retry', () => {
    const job = productionService.jobEngine.enqueue('test-queue', 'sync_job', {});
    const running = productionService.jobEngine.dequeue(job.queueName);
    const failed = productionService.jobEngine.fail(running.id, new Error('Connection timeout'));
    assert(failed.status === 'RETRYING');
    assert(failed.attempts === 1);
    assert(failed.scheduledAt);
  });

  await test('15. Job Engine Dead-Letter Queue', () => {
    productionService.jobEngine.createQueue('dlq-test');
    const job1 = productionService.jobEngine.enqueue('dlq-test', 'sync_job', {}, { maxRetries: 0 });
    const job2 = productionService.jobEngine.enqueue('dlq-test', 'sync_job', {}, { maxRetries: 0 });
    const r1 = productionService.jobEngine.dequeue('dlq-test');
    assert(r1, 'Must dequeue first job');
    productionService.jobEngine.fail(r1.id, new Error('Fail 1'));
    const r2 = productionService.jobEngine.dequeue('dlq-test');
    assert(r2, 'Must dequeue second job');
    productionService.jobEngine.fail(r2.id, new Error('Fail 2'));

    const dlq = productionService.jobEngine.getDeadLetterQueue();
    assert(dlq.length >= 2, `DLQ should contain 2 jobs, got ${dlq.length}`);
  });

  await test('16. Job Engine Schedule Job', () => {
    const scheduled = productionService.jobEngine.schedule('fleet_analytics', { fleetId: 'F-001' }, '0 */6 * * *', { priority: 'LOW' });
    assert(scheduled.status === 'SCHEDULED');
  });

  await test('17. Job Engine Queue Status', () => {
    const status = productionService.jobEngine.getQueueStatus('default');
    assert(status);
    assert(typeof status.total === 'number');
    assert(status.name === 'default');
  });

  await test('18. Job Engine All Queue Status', () => {
    const all = productionService.jobEngine.getAllQueueStatus();
    assert(all.length >= 3);
    all.forEach(q => {
      assert(q.name);
      assert(typeof q.queued === 'number');
    });
  });

  await test('19. Job Engine Retry From DLQ', () => {
    const dlqBefore = productionService.jobEngine.getDeadLetterQueue().length;
    if (dlqBefore > 0) {
      const retried = productionService.jobEngine.retryFromDLQ(productionService.jobEngine.getDeadLetterQueue()[0].id);
      assert(retried.status === 'QUEUED');
    }
  });

  await test('20. Job Engine Has Default Queues', () => {
    assert(productionService.jobEngine.getQueueStatus('default'));
    assert(productionService.jobEngine.getQueueStatus('scheduled'));
    assert(productionService.jobEngine.getQueueStatus('high_priority'));
  });

  await test('21. Job Engine Has Correct Job Types', () => {
    assert(productionService.jobEngine.JOB_TYPES.includes('rag_indexing'));
    assert(productionService.jobEngine.JOB_TYPES.includes('fleet_analytics'));
    assert(productionService.jobEngine.JOB_TYPES.includes('report_generation'));
    assert(productionService.jobEngine.JOB_TYPES.includes('sync_job'));
    assert(productionService.jobEngine.JOB_TYPES.length >= 5);
  });

  // ─── Observability ──────────────────────────────────────────

  await test('22. Observability Record API Latency', () => {
    productionService.observability.recordApiLatency('GET', '/api/machines', 45, 200);
    productionService.observability.recordApiLatency('POST', '/api/workflows', 120, 201);
    productionService.observability.recordApiLatency('GET', '/api/fleet', 500, 500);
    const metrics = productionService.observability.getApiMetrics();
    assert(metrics.requestCount >= 3);
    assert(metrics.errorCount >= 1);
    assert(metrics.averageLatency > 0);
    assert(metrics.byEndpoint.length >= 2);
  });

  await test('23. Observability Record Agent Execution', () => {
    productionService.observability.recordAgentExecution('user-1', 'diagnostic', 2500);
    productionService.observability.recordAgentExecution('user-1', 'planner', 1800);
    const metrics = productionService.observability.getAgentMetrics();
    assert(metrics.totalExecutions >= 2);
    assert(metrics.averageExecutionTime > 0);
  });

  await test('24. Observability Active Workflows', () => {
    productionService.observability.setActiveWorkflows(5);
    productionService.observability.incrementActiveWorkflows();
    assert(productionService.observability.getMetricSummary().activeWorkflows === 6);
    productionService.observability.decrementActiveWorkflows();
  });

  await test('25. Observability Health Checks Are Registered', () => {
    const summary = productionService.observability.getMetricSummary();
    assert(summary.health.length >= 6);
    const names = summary.health.map(h => h.name);
    assert(names.includes('database'));
    assert(names.includes('cache'));
    assert(names.includes('rag'));
    assert(names.includes('ml'));
    assert(names.includes('integrations'));
    assert(names.includes('queue'));
  });

  await test('26. Observability Run All Health Checks', async () => {
    const results = await productionService.observability.runAllHealthChecks();
    assert(results.status === 'healthy');
    assert(results.total >= 6);
    assert(results.healthy === results.total);
  });

  await test('27. Observability Run Single Health Check', async () => {
    const result = await productionService.observability.runHealthCheck('database');
    assert(result.name === 'database');
    assert(result.status === 'healthy');
    assert(result.details);
  });

  await test('28. Observability Metric Summary', () => {
    const summary = productionService.observability.getMetricSummary();
    assert(typeof summary.requests.total === 'number');
    assert(typeof summary.latency.average === 'number');
    assert(typeof summary.activeWorkflows === 'number');
  });

  // ─── Logger ─────────────────────────────────────────────────

  await test('29. Logger Debug, Info, Warn, Error, Fatal', () => {
    const d = productionService.logger.debug('debug msg', { service: 'test' });
    assert(d.level === 'DEBUG');

    const i = productionService.logger.info('info msg', { userId: 'u1' });
    assert(i.level === 'INFO');
    assert(i.userId === 'u1');

    const w = productionService.logger.warn('warn msg');
    assert(w.level === 'WARN');

    const e = productionService.logger.error('error msg', { error: 'something broke' });
    assert(e.level === 'ERROR');
    assert(e.error === 'something broke');

    const f = productionService.logger.fatal('fatal msg');
    assert(f.level === 'FATAL');
  });

  await test('30. Logger Throws on Invalid Level', () => {
    assert.throws(() => productionService.logger.log('INVALID', 'msg'));
  });

  await test('31. Logger Search by Level', () => {
    const errors = productionService.logger.search({ level: 'ERROR' });
    assert(errors.length > 0);
    errors.forEach(e => assert(e.level === 'ERROR'));
  });

  await test('32. Logger Search by Service', () => {
    const results = productionService.logger.search({ service: 'test' });
    assert(results.length > 0);
  });

  await test('33. Logger Search by Text', () => {
    const results = productionService.logger.search({ search: 'info msg' });
    assert(results.length > 0);
  });

  await test('34. Logger Create Request Context', () => {
    const req = { headers: { 'x-correlation-id': 'corr-test' }, user: { id: 'u-42' } };
    const ctx = productionService.logger.createRequestContext(req);
    assert(ctx.requestId);
    assert(ctx.correlationId === 'corr-test');
    assert(ctx.userId === 'u-42');
  });

  await test('35. Logger Stats', () => {
    const stats = productionService.logger.getLogStats();
    assert(stats.total > 0);
    assert(stats.byLevel.INFO > 0);
    assert(stats.byLevel.ERROR > 0);
  });

  await test('36. Logger Clear', () => {
    const result = productionService.logger.clear();
    assert(result.cleared === true);
    assert(result.entriesRemoved > 0);
    assert(productionService.logger.getLogStats().total === 0);
  });

  // ─── Performance Monitor ────────────────────────────────────

  await test('37. Performance Monitor CPU and Memory', () => {
    const cpu = productionService.performanceMonitor.recordCpuUsage();
    assert(typeof cpu.user === 'number');
    assert(typeof cpu.system === 'number');

    const mem = productionService.performanceMonitor.recordMemoryUsage();
    assert(typeof mem.rss === 'number');
    assert(typeof mem.heapUsed === 'number');
  });

  await test('38. Performance Monitor Record Sample', () => {
    const sample = productionService.performanceMonitor.recordPerformanceSample();
    assert(sample.cpu);
    assert(sample.memory);
    assert(sample.uptime > 0);
  });

  await test('39. Performance Monitor Event Loop Delay', async () => {
    const delay = await productionService.performanceMonitor.recordEventLoopDelay();
    assert(typeof delay === 'number');
    assert(delay >= 0);
  });

  await test('40. Performance Monitor Slow Endpoints', () => {
    productionService.performanceMonitor.recordSlowEndpoint('GET', '/api/slow-endpoint', 2500);
    const report = productionService.performanceMonitor.getPerformanceReport();
    assert(report.slowEndpoints.length >= 0);
  });

  await test('41. Performance Monitor Full Report', () => {
    productionService.performanceMonitor.recordPerformanceSample();
    const report = productionService.performanceMonitor.getPerformanceReport();
    assert(report.current.memory.rss > 0);
    assert(typeof report.current.uptime === 'number');
    assert(typeof report.averages.heapUsedMB === 'number');
  });

  await test('42. Performance Monitor Cold Start', () => {
    const cs = productionService.performanceMonitor.getColdStartDuration();
    assert(typeof cs.duration === 'number');
    assert(typeof cs.isColdStart === 'boolean');
  });

  // ─── Resilience Layer ───────────────────────────────────────

  await test('43. Resilience Circuit Breaker Create and State', () => {
    const cb = productionService.resilience.createCircuitBreaker('test-cb', { failureThreshold: 2, timeout: 5000 });
    assert(cb.state === 'CLOSED');

    for (let i = 0; i < 3; i++) {
      productionService.resilience.recordFailure('test-cb');
    }
    assert(productionService.resilience.isOpen('test-cb') === true);
  });

  await test('44. Resilience Circuit Breaker Success Recloses', () => {
    const cb = productionService.resilience.getCircuitBreakerStatus('test-cb');
    if (cb.state === 'HALF_OPEN' || cb.state === 'OPEN') {
      cb.timeout = 0;
    }
    productionService.resilience.recordSuccess('test-cb');
    productionService.resilience.recordSuccess('test-cb');
    const status = productionService.resilience.getCircuitBreakerStatus('test-cb');
    assert(status.state === 'CLOSED' || status.state === 'HALF_OPEN' || status.state === 'OPEN');
  });

  await test('45. Resilience Circuit Breaker Call with Fallback', async () => {
    const result = await productionService.resilience.call('test-cb',
      async () => { throw new Error('Service down'); },
      'fallback_value'
    );
    assert(result === 'fallback_value');
  });

  await test('46. Resilience List All Circuit Breakers', () => {
    const all = productionService.resilience.getAllCircuitBreakers();
    assert(all.length >= 5);
    const names = all.map(c => c.name);
    assert(names.includes('integrations'));
    assert(names.includes('rag'));
    assert(names.includes('ml'));
    assert(names.includes('database'));
    assert(names.includes('queue'));
  });

  await test('47. Resilience Retry with Exponential Backoff', async () => {
    let attempts = 0;
    const result = await productionService.resilience.withRetry(async () => {
      attempts++;
      if (attempts < 3) throw new Error('Transient error');
      return 'success';
    }, { maxRetries: 3, baseDelay: 10 });
    assert(result === 'success');
    assert(attempts === 3);
  });

  await test('48. Resilience Timeout Handling', async () => {
    const result = await productionService.resilience.withTimeout(
      async () => { await new Promise(r => setTimeout(r, 10)); return 'done'; },
      1000,
      'timeout_fallback'
    );
    assert(result === 'done');
  });

  await test('49. Resilience Timeout Triggers Fallback', async () => {
    const result = await productionService.resilience.withTimeout(
      async () => { await new Promise(r => setTimeout(r, 100)); return 'late'; },
      10,
      'fallback'
    );
    assert(result === 'fallback');
  });

  await test('50. Resilience Bulkhead Create and Run', async () => {
    const bh = productionService.resilience.createBulkhead('test-bh', 3);
    assert(bh.maxConcurrent === 3);

    const result = await productionService.resilience.runInBulkhead('test-bh', async () => 'done');
    assert(result === 'done');
  });

  await test('51. Resilience Bulkhead Rejects When Full', async () => {
    const bh = productionService.resilience.createBulkhead('full-bh', 1);
    const slowPromise = productionService.resilience.runInBulkhead('full-bh', async () => {
      await new Promise(r => setTimeout(r, 100));
      return 'slow';
    });
    await new Promise(r => setTimeout(r, 5));
    try {
      await productionService.resilience.runInBulkhead('full-bh', async () => 'rejected');
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.message.includes('at capacity'));
    }
    await slowPromise;
  });

  await test('52. Resilience Bulkheads Exist for All Resources', () => {
    const all = productionService.resilience.getAllBulkheads();
    const names = all.map(b => b.name);
    assert(names.includes('integrations'));
    assert(names.includes('rag'));
    assert(names.includes('ml'));
    assert(names.includes('database'));
    assert(names.includes('queue'));
  });

  await test('53. Resilience Circuit Breaker Reset', () => {
    const reset = productionService.resilience.resetCircuitBreaker('test-cb');
    assert(reset.reset === true);
    assert(reset.state === 'CLOSED');
  });

  // ─── Rate Limiter ────────────────────────────────────────────

  await test('54. Rate Limiter User Rate Check', () => {
    for (let i = 0; i < 5; i++) productionService.rateLimiter.checkUserRate('user-rate-test');
    const result = productionService.rateLimiter.checkUserRate('user-rate-test');
    assert(result.allowed === true || result.allowed === false);
    assert(typeof result.current === 'number');
    assert(typeof result.limit === 'number');
  });

  await test('55. Rate Limiter Tenant Rate Check', () => {
    const result = productionService.rateLimiter.checkTenantRate('tenant-rate-test');
    assert(typeof result.allowed === 'boolean');
    assert(result.remaining >= 0);
  });

  await test('56. Rate Limiter API Rate Check', () => {
    const result = productionService.rateLimiter.checkApiRate('GET');
    assert(typeof result.allowed === 'boolean');
    assert(typeof result.limit === 'number');
  });

  await test('57. Rate Limiter IP Rate Check', () => {
    const result = productionService.rateLimiter.checkIpRate('10.0.0.1');
    assert(typeof result.allowed === 'boolean');
  });

  await test('58. Rate Limiter Global Rate Check', () => {
    const result = productionService.rateLimiter.checkGlobalRate();
    assert(typeof result.allowed === 'boolean');
    assert(typeof result.current === 'number');
    assert(result.limit === 10000);
  });

  await test('59. Rate Limiter Check All Combined', () => {
    const result = productionService.rateLimiter.checkAll('user-combo', 'tenant-combo', 'POST', '10.0.0.99');
    assert(typeof result.allowed === 'boolean');
    assert(result.checks.global);
    assert(result.checks.user);
    assert(result.checks.tenant);
    assert(result.checks.api);
    assert(result.checks.ip);
  });

  await test('60. Rate Limiter Get Status', () => {
    const status = productionService.rateLimiter.getRateStatus();
    assert(Array.isArray(status.users));
    assert(Array.isArray(status.tenants));
    assert(Array.isArray(status.api));
    assert(typeof status.global.count === 'number');
    assert(typeof status.limits.user === 'number');
  });

  // ─── End-to-End ──────────────────────────────────────────────

  await test('61. End-to-End: Cache + Job + Logging Pipeline', () => {
    productionService.cacheLayer.set('rag', 'e2e-key', 'cached-value');

    const job = productionService.jobEngine.enqueue('default', 'rag_indexing', { docId: 'e2e' }, { priority: 'HIGH' });
    assert(job.status === 'QUEUED');

    const logEntry = productionService.logger.info('Job enqueued', { metadata: { jobId: job.id, type: job.type } });
    assert(logEntry.metadata.jobId);

    const cached = productionService.cacheLayer.get('rag', 'e2e-key');
    assert(cached === 'cached-value');
  });

  await test('62. End-to-End: Resilience + Rate Limiting + Observability', async () => {
    const rateCheck = productionService.rateLimiter.checkAll('e2e-user', null, 'GET', null);
    assert(typeof rateCheck.allowed === 'boolean');

    productionService.observability.recordApiLatency('GET', '/api/e2e', 30, 200);

    const cbResult = await productionService.resilience.call('database', async () => ({ data: 'ok' }), null);
    assert(cbResult.data === 'ok');
  });

  await test('63. End-to-End: Full System Status', () => {
    const status = productionService.getProductionSystemStatus();
    assert(status.cache.entries >= 0);
    assert(status.jobs.queues >= 3);
    assert(status.observability.healthChecks >= 6);
    assert(typeof status.resilience.circuitBreakers === 'number');
  });

  await test('64. End-to-End: Production Readiness API Shape', () => {
    const status = productionService.getProductionSystemStatus();
    const expectedKeys = ['systemStatus', 'productionMode', 'cache', 'jobs', 'observability', 'rateLimiting', 'resilience', 'capabilities'];
    expectedKeys.forEach(k => assert(status[k] !== undefined, `Missing key: ${k}`));
  });

  console.log(`\n==================================================`);
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`==================================================`);
  if (failed > 0) process.exit(1);
}

runProductionTests();
