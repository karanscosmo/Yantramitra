const jobQueues = new Map();
const deadLetterQueue = [];
const jobHistory = [];
let jobIdCounter = 0;

const PRIORITIES = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
const JOB_TYPES = ['rag_indexing', 'learning_analysis', 'fleet_analytics', 'report_generation', 'sync_job', 'cache_warmup', 'data_export'];

const retryPolicies = {
  default: { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 2 },
  rag_indexing: { maxRetries: 2, backoffMs: 5000, backoffMultiplier: 3 },
  sync_job: { maxRetries: 5, backoffMs: 2000, backoffMultiplier: 2 },
  data_export: { maxRetries: 2, backoffMs: 3000, backoffMultiplier: 2 }
};

function createQueue(name) {
  if (jobQueues.has(name)) throw new Error(`Queue '${name}' already exists`);
  const queue = { name, jobs: [], createdAt: new Date().toISOString() };
  jobQueues.set(name, queue);
  return { name, created: true };
}

function enqueue(queueName, type, data, options = {}) {
  if (!JOB_TYPES.includes(type)) throw new Error(`Invalid job type '${type}'. Valid: ${JOB_TYPES.join(', ')}`);
  if (!jobQueues.has(queueName)) createQueue(queueName);

  const job = {
    id: `job-${++jobIdCounter}-${Date.now()}`,
    queueName,
    type,
    data,
    priority: PRIORITIES[options.priority] || PRIORITIES.MEDIUM,
    status: 'QUEUED',
    retryPolicy: options.retryPolicy || retryPolicies[type] || retryPolicies.default,
    attempts: 0,
    maxRetries: options.maxRetries != null ? options.maxRetries : (retryPolicies[type]?.maxRetries || 3),
    createdAt: new Date().toISOString(),
    scheduledAt: options.delay ? new Date(Date.now() + options.delay).toISOString() : null,
    startedAt: null,
    completedAt: null,
    error: null,
    metadata: options.metadata || {}
  };

  const queue = jobQueues.get(queueName);
  queue.jobs.push(job);
  queue.jobs.sort((a, b) => a.priority - b.priority);

  return job;
}

function dequeue(queueName) {
  const queue = jobQueues.get(queueName);
  if (!queue) throw new Error(`Queue '${queueName}' not found`);
  const now = Date.now();
  const idx = queue.jobs.findIndex(j => j.status === 'QUEUED' && (!j.scheduledAt || new Date(j.scheduledAt).getTime() <= now));
  if (idx === -1) return null;
  const job = queue.jobs[idx];
  job.status = 'RUNNING';
  job.startedAt = new Date().toISOString();
  return job;
}

function complete(jobId, result) {
  const job = findJob(jobId);
  if (!job) throw new Error(`Job '${jobId}' not found`);
  job.status = 'COMPLETED';
  job.completedAt = new Date().toISOString();
  job.result = result;
  jobHistory.push({ ...job });
  return job;
}

function fail(jobId, error) {
  const job = findJob(jobId);
  if (!job) throw new Error(`Job '${jobId}' not found`);
  job.attempts++;
  job.error = error?.message || String(error);

  if (job.attempts >= job.maxRetries) {
    job.status = 'FAILED';
    job.completedAt = new Date().toISOString();
    deadLetterQueue.push({ ...job, movedToDLQAt: new Date().toISOString() });
    jobHistory.push({ ...job });
  } else {
    const delay = job.retryPolicy.backoffMs * Math.pow(job.retryPolicy.backoffMultiplier, job.attempts - 1);
    job.status = 'RETRYING';
    job.scheduledAt = new Date(Date.now() + delay).toISOString();
    const queue = jobQueues.get(job.queueName);
    if (queue) queue.jobs.sort((a, b) => a.priority - b.priority);
  }
  return job;
}

function schedule(type, data, cronExpression, options = {}) {
  const job = enqueue('scheduled', type, data, { ...options, metadata: { ...options.metadata, scheduled: true, cronExpression } });
  job.status = 'SCHEDULED';
  return job;
}

function getQueueStatus(queueName) {
  const queue = jobQueues.get(queueName);
  if (!queue) return null;
  const jobs = queue.jobs;
  return {
    name: queueName,
    total: jobs.length,
    queued: jobs.filter(j => j.status === 'QUEUED').length,
    running: jobs.filter(j => j.status === 'RUNNING').length,
    completed: jobs.filter(j => j.status === 'COMPLETED').length,
    failed: jobs.filter(j => j.status === 'FAILED').length,
    retrying: jobs.filter(j => j.status === 'RETRYING').length,
    scheduled: jobs.filter(j => j.status === 'SCHEDULED').length,
    createdAt: queue.createdAt
  };
}

function getAllQueueStatus() {
  const names = Array.from(jobQueues.keys());
  return names.map(n => getQueueStatus(n));
}

function getDeadLetterQueue() {
  return deadLetterQueue.map(j => ({
    id: j.id,
    type: j.type,
    error: j.error,
    attempts: j.attempts,
    movedToDLQAt: j.movedToDLQAt
  }));
}

function retryFromDLQ(jobId) {
  const idx = deadLetterQueue.findIndex(j => j.id === jobId);
  if (idx === -1) throw new Error(`DLQ job '${jobId}' not found`);
  const job = deadLetterQueue.splice(idx, 1)[0];
  job.attempts = 0;
  job.status = 'QUEUED';
  job.error = null;
  job.scheduledAt = null;
  const queue = jobQueues.get(job.queueName);
  if (queue) queue.jobs.push(job);
  return job;
}

function findJob(jobId) {
  for (const [, queue] of jobQueues) {
    const found = queue.jobs.find(j => j.id === jobId);
    if (found) return found;
  }
  return deadLetterQueue.find(j => j.id === jobId) || null;
}

function getJobHistory(limit = 100) {
  return jobHistory.slice(-limit).reverse();
}

function processNext(queueName) {
  const job = dequeue(queueName);
  if (!job) return null;
  try {
    const result = executeJob(job);
    complete(job.id, result);
    return { jobId: job.id, status: 'COMPLETED', result };
  } catch (err) {
    fail(job.id, err);
    return { jobId: job.id, status: 'FAILED', error: err.message };
  }
}

function executeJob(job) {
  switch (job.type) {
    case 'rag_indexing': return { indexed: true, chunks: Math.floor(Math.random() * 100) + 50, duration: Math.floor(Math.random() * 2000) + 500 };
    case 'learning_analysis': return { analyzed: true, insights: Math.floor(Math.random() * 10) + 3, duration: Math.floor(Math.random() * 1000) + 200 };
    case 'fleet_analytics': return { analyzed: true, machines: Math.floor(Math.random() * 20) + 5, duration: Math.floor(Math.random() * 1500) + 300 };
    case 'report_generation': return { generated: true, pages: Math.floor(Math.random() * 10) + 1, format: 'PDF', duration: Math.floor(Math.random() * 3000) + 1000 };
    case 'sync_job': return { synced: true, records: Math.floor(Math.random() * 500) + 50, duration: Math.floor(Math.random() * 5000) + 1000 };
    default: return { processed: true, duration: Math.floor(Math.random() * 500) + 100 };
  }
}

createQueue('default');
createQueue('scheduled');
createQueue('high_priority');

module.exports = {
  PRIORITIES,
  JOB_TYPES,
  createQueue,
  enqueue,
  dequeue,
  complete,
  fail,
  schedule,
  getQueueStatus,
  getAllQueueStatus,
  getDeadLetterQueue,
  retryFromDLQ,
  getJobHistory,
  processNext,
  findJob
};
