const auditLog = [];
const MAX_LOG_SIZE = 10000;

const EVENT_TYPES = [
  'LOGIN', 'LOGOUT', 'API_ACCESS', 'WORKFLOW_EXECUTION', 'AGENT_ACTION',
  'CONFIG_CHANGE', 'INTEGRATION_EVENT', 'PERMISSION_CHANGE', 'ROLE_CHANGE',
  'SESSION_CREATED', 'SESSION_EXPIRED', 'SESSION_REVOKED', 'SECURITY_ALERT',
  'FAILED_LOGIN', 'DATA_EXPORT', 'DATA_IMPORT', 'PASSWORD_CHANGE',
  'SECRET_ACCESS', 'SECRET_ROTATION', 'POLICY_CHANGE', 'TENANT_CHANGE'
];

function trackEvent(type, data = {}) {
  if (!EVENT_TYPES.includes(type)) throw new Error(`Invalid event type '${type}'`);

  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    timestamp: new Date().toISOString(),
    userId: data.userId || null,
    userName: data.userName || null,
    tenantId: data.tenantId || null,
    role: data.role || null,
    ip: data.ip || null,
    userAgent: data.userAgent || null,
    resource: data.resource || null,
    action: data.action || null,
    status: data.status || 'SUCCESS',
    details: data.details || null,
    metadata: data.metadata || null
  };

  auditLog.push(entry);

  if (auditLog.length > MAX_LOG_SIZE) {
    auditLog.splice(0, auditLog.length - MAX_LOG_SIZE);
  }

  return entry;
}

function searchAudit(filters = {}) {
  let results = [...auditLog];

  if (filters.type) results = results.filter(e => e.type === filters.type);
  if (filters.userId) results = results.filter(e => e.userId === filters.userId);
  if (filters.tenantId) results = results.filter(e => e.tenantId === filters.tenantId);
  if (filters.role) results = results.filter(e => e.role === filters.role);
  if (filters.resource) results = results.filter(e => e.resource && e.resource.includes(filters.resource));
  if (filters.status) results = results.filter(e => e.status === filters.status);
  if (filters.action) results = results.filter(e => e.action && e.action.includes(filters.action));

  if (filters.startDate) {
    const start = new Date(filters.startDate).getTime();
    results = results.filter(e => new Date(e.timestamp).getTime() >= start);
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate).getTime();
    results = results.filter(e => new Date(e.timestamp).getTime() <= end);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(e =>
      (e.details && e.details.toLowerCase().includes(q)) ||
      (e.resource && e.resource.toLowerCase().includes(q)) ||
      (e.userName && e.userName.toLowerCase().includes(q)) ||
      (e.type && e.type.toLowerCase().includes(q))
    );
  }

  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const limit = filters.limit || 100;
  return results.slice(0, limit);
}

function getAuditStats() {
  const typeCounts = {};
  auditLog.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });

  const successCount = auditLog.filter(e => e.status === 'SUCCESS').length;
  const failureCount = auditLog.filter(e => e.status === 'FAILURE').length;

  return {
    totalEntries: auditLog.length,
    byType: typeCounts,
    successCount,
    failureCount,
    uniqueUsers: new Set(auditLog.map(e => e.userId).filter(Boolean)).size,
    uniqueTenants: new Set(auditLog.map(e => e.tenantId).filter(Boolean)).size,
    dateRange: auditLog.length > 0 ? {
      earliest: auditLog[0].timestamp,
      latest: auditLog[auditLog.length - 1].timestamp
    } : null
  };
}

function clearAuditLog() {
  const count = auditLog.length;
  auditLog.length = 0;
  return { cleared: true, entriesRemoved: count };
}

module.exports = {
  EVENT_TYPES,
  trackEvent,
  searchAudit,
  getAuditStats,
  clearAuditLog
};
