const rbac = require('./rbac');
const abac = require('./abac');
const multiTenant = require('./multiTenant');
const auditSystem = require('./auditSystem');
const secretsManager = require('./secretsManager');
const complianceEngine = require('./complianceEngine');
const sessionManager = require('./sessionManager');
const securityMonitor = require('./securityMonitor');

function getSecuritySystemStatus() {
  const auditStats = auditSystem.getAuditStats();
  const sessionSummary = sessionManager.getSessionsSummary();
  const alertSummary = securityMonitor.getAlertSummary();
  const complianceSummary = complianceEngine.getComplianceSummary();

  return {
    systemStatus: 'ACTIVE_READY',
    securityMode: 'ENTERPRISE_GRADE',
    rbac: {
      roles: rbac.roles.length,
      assignments: rbac.getAllAssignments().length
    },
    abac: {
      policies: abac.listPolicies().length
    },
    multiTenant: {
      tenants: multiTenant.listTenants().length
    },
    audit: {
      totalEntries: auditStats.totalEntries,
      uniqueUsers: auditStats.uniqueUsers
    },
    sessions: {
      active: sessionSummary.activeSessions,
      total: sessionSummary.totalSessions
    },
    alerts: {
      total: alertSummary.totalAlerts,
      unresolved: alertSummary.unresolved
    },
    compliance: {
      standards: complianceSummary.standards.length,
      violations: complianceSummary.totalViolations
    },
    capabilities: [
      'Role-Based Access Control (RBAC) — 7 roles with hierarchy',
      'Attribute-Based Access Control (ABAC) — Dynamic policy evaluation',
      'Multi-Tenant Architecture — Complete tenant isolation',
      'Security Audit System — Searchable event history',
      'Secrets Management — AES-256-GCM encrypted storage',
      'Compliance Engine — ISO 27001, IEC 62443, SOC 2',
      'Session Management — Tracking, device registry, concurrent control',
      'Security Monitoring — Alerts, rate limiting, threat detection'
    ]
  };
}

module.exports = {
  rbac,
  abac,
  multiTenant,
  auditSystem,
  secretsManager,
  complianceEngine,
  sessionManager,
  securityMonitor,
  getSecuritySystemStatus
};
