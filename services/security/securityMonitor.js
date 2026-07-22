const alerts = [];
const alertRules = new Map();
const rateLimitTracker = new Map();
let alertIdCounter = 0;

const SEVERITY_LEVELS = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

function createAlert(name, description, severity = 'MEDIUM', autoResolve = false) {
  const id = `rule-${++alertIdCounter}`;
  const rule = { id, name, description, severity, autoResolve, enabled: true, createdAt: new Date().toISOString(), triggerCount: 0 };
  alertRules.set(id, rule);
  return rule;
}

function triggerAlert(ruleId, data = {}) {
  const rule = alertRules.get(ruleId);
  if (!rule || !rule.enabled) return null;

  rule.triggerCount++;

  const alert = {
    id: `alert-${Date.now()}-${rule.triggerCount}`,
    ruleId,
    ruleName: rule.name,
    severity: rule.severity,
    severityLevel: SEVERITY_LEVELS[rule.severity] || 1,
    timestamp: new Date().toISOString(),
    userId: data.userId || null,
    tenantId: data.tenantId || null,
    ip: data.ip || null,
    resource: data.resource || null,
    action: data.action || null,
    details: data.details || rule.description,
    metadata: data.metadata || null,
    acknowledged: false,
    resolved: rule.autoResolve,
    resolvedAt: rule.autoResolve ? new Date().toISOString() : null
  };

  alerts.push(alert);
  return alert;
}

function acknowledgeAlert(alertId) {
  const alert = alerts.find(a => a.id === alertId);
  if (!alert) throw new Error(`Alert '${alertId}' not found`);
  alert.acknowledged = true;
  alert.acknowledgedAt = new Date().toISOString();
  return alert;
}

function resolveAlert(alertId, resolution = 'Manual resolution') {
  const alert = alerts.find(a => a.id === alertId);
  if (!alert) throw new Error(`Alert '${alertId}' not found`);
  alert.resolved = true;
  alert.resolvedAt = new Date().toISOString();
  alert.resolution = resolution;
  return alert;
}

function trackFailedLogin(userId, ip) {
  const key = `${userId}:${ip}`;
  const now = Date.now();
  if (!rateLimitTracker.has(key)) rateLimitTracker.set(key, []);
  const attempts = rateLimitTracker.get(key);
  attempts.push(now);
  const recent = attempts.filter(t => now - t < 300000);
  rateLimitTracker.set(key, recent);

  if (recent.length >= 5) {
    const rule = Array.from(alertRules.values()).find(r => r.name === 'Excessive Failed Logins');
    if (rule) triggerAlert(rule.id, { userId, ip, details: `5+ failed login attempts in 5 minutes from IP ${ip}`, severity: 'HIGH' });
  }

  return { recentAttempts: recent.length, locked: recent.length >= 5 };
}

function trackSuspiciousActivity(details, data = {}) {
  const ruleName = data.ruleName || 'Suspicious Activity Detected';
  let rule = Array.from(alertRules.values()).find(r => r.name === ruleName);
  if (!rule) rule = createAlert(ruleName, details, 'MEDIUM', false);

  return triggerAlert(rule.id, { ...data, details });
}

function trackPrivilegeEscalation(userId, fromRole, toRole, data = {}) {
  let rule = Array.from(alertRules.values()).find(r => r.name === 'Privilege Escalation Attempt');
  if (!rule) rule = createAlert('Privilege Escalation Attempt', 'Unauthorized privilege escalation detected', 'CRITICAL', false);

  const alert = triggerAlert(rule.id, {
    userId,
    details: `User ${userId} attempted privilege escalation from '${fromRole}' to '${toRole}'`,
    severity: 'CRITICAL',
    ...data
  });
  return alert;
}

function trackUnauthorizedAccess(userId, resource, action, data = {}) {
  let rule = Array.from(alertRules.values()).find(r => r.name === 'Unauthorized Access Attempt');
  if (!rule) rule = createAlert('Unauthorized Access Attempt', 'Unauthorized access to resource detected', 'HIGH', false);

  return triggerAlert(rule.id, {
    userId,
    resource,
    action,
    details: `User ${userId} attempted unauthorized ${action} on '${resource}'`,
    ...data
  });
}

function checkRateLimit(userId, action, limit = 100, windowMs = 60000) {
  const key = `${userId}:${action}`;
  const now = Date.now();
  if (!rateLimitTracker.has(key)) rateLimitTracker.set(key, []);
  const hits = rateLimitTracker.get(key);
  hits.push(now);
  const recent = hits.filter(t => now - t < windowMs);
  rateLimitTracker.set(key, recent);

  if (recent.length > limit) {
    let rule = Array.from(alertRules.values()).find(r => r.name === 'Excessive API Requests');
    if (!rule) rule = createAlert('Excessive API Requests', 'API rate limit exceeded', 'MEDIUM', true);
    triggerAlert(rule.id, { userId, action, details: `Rate limit exceeded: ${recent.length} requests in ${windowMs}ms`, metadata: { count: recent.length, limit, windowMs } });
    return { allowed: false, currentCount: recent.length, limit };
  }

  return { allowed: true, currentCount: recent.length, limit };
}

function getAlerts(filters = {}) {
  let results = [...alerts];
  if (filters.severity) results = results.filter(a => a.severity === filters.severity);
  if (filters.unacknowledged) results = results.filter(a => !a.acknowledged);
  if (filters.unresolved) results = results.filter(a => !a.resolved);
  if (filters.userId) results = results.filter(a => a.userId === filters.userId);
  if (filters.ruleId) results = results.filter(a => a.ruleId === filters.ruleId);
  if (filters.startDate) results = results.filter(a => new Date(a.timestamp) >= new Date(filters.startDate));
  if (filters.endDate) results = results.filter(a => new Date(a.timestamp) <= new Date(filters.endDate));
  results.sort((a, b) => b.severityLevel - a.severityLevel || new Date(b.timestamp) - new Date(a.timestamp));
  return results.slice(0, filters.limit || 100);
}

function getAlertRules() {
  return Array.from(alertRules.values());
}

function getAlertSummary() {
  const total = alerts.length;
  const unacknowledged = alerts.filter(a => !a.acknowledged).length;
  const unresolved = alerts.filter(a => !a.resolved).length;
  const critical = alerts.filter(a => a.severity === 'CRITICAL').length;
  const high = alerts.filter(a => a.severity === 'HIGH').length;
  const medium = alerts.filter(a => a.severity === 'MEDIUM').length;
  const low = alerts.filter(a => a.severity === 'LOW').length;

  return {
    totalAlerts: total,
    unacknowledged,
    unresolved,
    bySeverity: { critical, high, medium, low },
    activeRules: alertRules.size,
    totalTriggers: Array.from(alertRules.values()).reduce((s, r) => s + r.triggerCount, 0)
  };
}

createAlert('Excessive Failed Logins', 'Multiple failed login attempts detected', 'HIGH', false);
createAlert('Suspicious Activity Detected', 'Unusual user behavior detected', 'MEDIUM', false);
createAlert('Privilege Escalation Attempt', 'Unauthorized privilege escalation detected', 'CRITICAL', false);
createAlert('Unauthorized Access Attempt', 'Unauthorized access to resource detected', 'HIGH', false);
createAlert('Excessive API Requests', 'API rate limit exceeded', 'MEDIUM', true);
createAlert('Configuration Change', 'Security-relevant configuration change detected', 'LOW', true);
createAlert('New Device Connected', 'New device connected to platform', 'LOW', true);

module.exports = {
  createAlert,
  triggerAlert,
  acknowledgeAlert,
  resolveAlert,
  trackFailedLogin,
  trackSuspiciousActivity,
  trackPrivilegeEscalation,
  trackUnauthorizedAccess,
  checkRateLimit,
  getAlerts,
  getAlertRules,
  getAlertSummary
};
