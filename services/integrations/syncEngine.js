const syncJobs = new Map();
const retryQueue = [];
const syncHistory = [];
const conflictLog = [];

function createScheduler() {
  let activeTimers = new Map();

  return {
    scheduleSync: (jobName, connectorName, syncFn, intervalMs, options = {}) => {
      if (syncJobs.has(jobName)) throw new Error(`Sync job '${jobName}' already exists`);

      const job = {
        jobName,
        connectorName,
        syncFn,
        intervalMs,
        options: {
          incremental: options.incremental !== false,
          conflictDetection: options.conflictDetection !== false,
          maxRetries: options.maxRetries || 3,
          ...options
        },
        status: 'SCHEDULED',
        lastSync: null,
        lastDuration: null,
        lastError: null,
        consecutiveFailures: 0,
        createdAt: new Date().toISOString()
      };

      syncJobs.set(jobName, job);

      const timer = setInterval(async () => {
        const result = await executeSync(jobName);
        return result;
      }, intervalMs);

      activeTimers.set(jobName, timer);
      return { jobName, intervalMs, status: 'SCHEDULED', scheduledAt: job.createdAt };
    },

    executeSync: async (jobName) => {
      return executeSync(jobName);
    },

    executeIncrementalSync: async (connectorName, syncFn, lastSyncTimestamp) => {
      const startTime = Date.now();
      try {
        const result = await syncFn(lastSyncTimestamp);
        const duration = Date.now() - startTime;
        const record = {
          id: `sync-${Date.now()}`,
          connectorName,
          type: 'INCREMENTAL',
          lastSyncTimestamp,
          result,
          duration,
          status: 'SUCCESS',
          timestamp: new Date().toISOString()
        };
        syncHistory.push(record);
        return record;
      } catch (err) {
        const record = {
          id: `sync-${Date.now()}`,
          connectorName,
          type: 'INCREMENTAL',
          lastSyncTimestamp,
          error: err.message,
          status: 'FAILED',
          timestamp: new Date().toISOString()
        };
        syncHistory.push(record);
        throw err;
      }
    },

    detectConflicts: (localData, remoteData, idField = 'id') => {
      const conflicts = [];
      const localMap = new Map(localData.map(item => [item[idField], item]));
      const remoteMap = new Map(remoteData.map(item => [item[idField], item]));

      localData.forEach(localItem => {
        const remoteItem = remoteMap.get(localItem[idField]);
        if (remoteItem && JSON.stringify(localItem) !== JSON.stringify(remoteItem)) {
          const conflict = {
            id: localItem[idField],
            local: localItem,
            remote: remoteItem,
            detectedAt: new Date().toISOString(),
            resolution: 'UNRESOLVED'
          };
          conflicts.push(conflict);
          conflictLog.push(conflict);
        }
      });

      return { conflicts, conflictCount: conflicts.length };
    },

    resolveConflict: (conflictId, resolution, resolvedData) => {
      const conflict = conflictLog.find(c => c.id === conflictId && c.resolution === 'UNRESOLVED');
      if (!conflict) throw new Error(`Unresolved conflict '${conflictId}' not found`);
      conflict.resolution = resolution;
      conflict.resolvedData = resolvedData;
      conflict.resolvedAt = new Date().toISOString();
      return { conflictId, resolution, resolved: true };
    },

    addToRetryQueue: (jobName, error) => {
      const entry = {
        id: `retry-${Date.now()}`,
        jobName,
        error: error.message || String(error),
        attempts: 0,
        maxAttempts: syncJobs.get(jobName)?.options?.maxRetries || 3,
        createdAt: new Date().toISOString()
      };
      retryQueue.push(entry);
      return entry;
    },

    processRetryQueue: async () => {
      const results = [];
      const pending = retryQueue.filter(r => r.attempts < r.maxAttempts);

      for (const entry of pending) {
        entry.attempts++;
        try {
          const job = syncJobs.get(entry.jobName);
          if (job) {
            await executeSync(entry.jobName);
            entry.resolved = true;
            entry.resolvedAt = new Date().toISOString();
            results.push({ id: entry.id, jobName: entry.jobName, resolved: true, attempts: entry.attempts });
          }
        } catch (err) {
          entry.lastError = err.message;
          entry.lastAttemptAt = new Date().toISOString();
          results.push({ id: entry.id, jobName: entry.jobName, resolved: false, attempts: entry.attempts, error: err.message });
        }
      }
      return results;
    },

    getSyncStatus: () => ({
      totalSyncJobs: syncJobs.size,
      activeSyncJobs: Array.from(syncJobs.values()).map(j => ({
        jobName: j.jobName,
        connectorName: j.connectorName,
        status: j.status,
        lastSync: j.lastSync,
        lastDuration: j.lastDuration,
        lastError: j.lastError,
        consecutiveFailures: j.consecutiveFailures,
        intervalMs: j.intervalMs
      })),
      retryQueueSize: retryQueue.filter(r => r.attempts < r.maxAttempts).length,
      totalRetries: retryQueue.length,
      unresolvedConflicts: conflictLog.filter(c => c.resolution === 'UNRESOLVED').length,
      totalConflicts: conflictLog.length,
      syncHistoryCount: syncHistory.length
    }),

    getSyncHistory: (limit = 50) => syncHistory.slice(-limit)
  };

  async function executeSync(jobName) {
    const job = syncJobs.get(jobName);
    if (!job) throw new Error(`Sync job '${jobName}' not found`);

    const startTime = Date.now();
    job.status = 'RUNNING';

    try {
      const lastSync = job.lastSync;
      const result = await job.syncFn(lastSync);
      const duration = Date.now() - startTime;

      job.lastSync = new Date().toISOString();
      job.lastDuration = duration;
      job.lastError = null;
      job.consecutiveFailures = 0;
      job.status = 'COMPLETED';

      const record = {
        id: `sync-${Date.now()}`,
        jobName,
        connectorName: job.connectorName,
        type: job.options.incremental ? 'INCREMENTAL' : 'FULL',
        duration,
        result: { syncedCount: result?.syncedCount || 0 },
        status: 'SUCCESS',
        timestamp: job.lastSync
      };
      syncHistory.push(record);
      return { success: true, jobName, duration, timestamp: job.lastSync };
    } catch (err) {
      const duration = Date.now() - startTime;
      job.lastDuration = duration;
      job.lastError = err.message;
      job.consecutiveFailures++;
      job.status = job.consecutiveFailures >= (job.options.maxRetries || 3) ? 'FAILED' : 'RETRYING';

      const record = {
        id: `sync-${Date.now()}`,
        jobName,
        connectorName: job.connectorName,
        error: err.message,
        duration,
        status: 'FAILED',
        timestamp: new Date().toISOString()
      };
      syncHistory.push(record);

      if (job.consecutiveFailures < (job.options.maxRetries || 3)) {
        addToRetryQueue(jobName, err);
      }

      return { success: false, jobName, error: err.message, consecutiveFailures: job.consecutiveFailures };
    }
  }

  function addToRetryQueue(jobName, error) {
    const entry = {
      id: `retry-${Date.now()}`,
      jobName,
      error: error.message || String(error),
      attempts: 0,
      maxAttempts: syncJobs.get(jobName)?.options?.maxRetries || 3,
      createdAt: new Date().toISOString()
    };
    retryQueue.push(entry);
  }
}

module.exports = { createScheduler };
