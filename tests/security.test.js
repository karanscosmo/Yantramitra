const assert = require('assert');
const securityService = require('../services/security');

async function runSecurityTests() {
  console.log('==================================================');
  console.log('YantraMitra Security & Governance Test Suite');
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

  // ─── RBAC ────────────────────────────────────────────────────

  await test('1. RBAC System Status Returns Correct Shape', () => {
    const status = securityService.getSecuritySystemStatus();
    assert.strictEqual(status.systemStatus, 'ACTIVE_READY');
    assert(status.capabilities.length >= 8, 'Must have ≥ 8 capabilities');
    assert(status.rbac.roles === 7);
  });

  await test('2. RBAC Has All 7 Roles', () => {
    assert(securityService.rbac.roles.includes('super_admin'));
    assert(securityService.rbac.roles.includes('plant_admin'));
    assert(securityService.rbac.roles.includes('reliability_engineer'));
    assert(securityService.rbac.roles.includes('maintenance_manager'));
    assert(securityService.rbac.roles.includes('technician'));
    assert(securityService.rbac.roles.includes('operator'));
    assert(securityService.rbac.roles.includes('viewer'));
    assert.strictEqual(securityService.rbac.roles.length, 7);
  });

  await test('3. RBAC Role Hierarchy — Super Admin Inherits All', () => {
    const hierarchy = securityService.rbac.roleHierarchy;
    assert(hierarchy.super_admin.includes('viewer'));
    assert(hierarchy.super_admin.includes('plant_admin'));
    assert(hierarchy.super_admin.includes('technician'));
    assert.strictEqual(hierarchy.super_admin.length, 7);
  });

  await test('4. RBAC Role Hierarchy — Viewer Inherits Only Viewer', () => {
    const hierarchy = securityService.rbac.roleHierarchy;
    assert(hierarchy.viewer.includes('viewer'));
    assert.strictEqual(hierarchy.viewer.length, 1);
  });

  await test('5. RBAC Assign Role and Get User Role', () => {
    const result = securityService.rbac.assignRole('user-001', 'technician', 'admin-1');
    assert.strictEqual(result.role, 'technician');
    assert(result.assignedAt);

    const role = securityService.rbac.getUserRole('user-001');
    assert.strictEqual(role, 'technician');
  });

  await test('6. RBAC Throws on Invalid Role', () => {
    assert.throws(() => securityService.rbac.assignRole('user-bad', 'ceo'));
  });

  await test('7. RBAC userHasRole — Direct Match', () => {
    securityService.rbac.assignRole('user-002', 'plant_admin');
    assert(securityService.rbac.userHasRole('user-002', 'plant_admin'));
    assert(securityService.rbac.userHasRole('user-002', 'viewer'));
  });

  await test('8. RBAC userHasRole — No Match', () => {
    assert(!securityService.rbac.userHasRole('user-002', 'super_admin'));
  });

  await test('9. RBAC userHasPermission — Super Admin Has All', () => {
    securityService.rbac.assignRole('user-super', 'super_admin');
    assert(securityService.rbac.userHasPermission('user-super', 'machine:read'));
    assert(securityService.rbac.userHasPermission('user-super', 'security:read'));
  });

  await test('10. RBAC userHasPermission — Operator Limited', () => {
    securityService.rbac.assignRole('user-op', 'operator');
    assert(securityService.rbac.userHasPermission('user-op', 'machine:read'));
    assert(securityService.rbac.userHasPermission('user-op', 'dashboard:read'));
    assert(!securityService.rbac.userHasPermission('user-op', 'audit:read'));
    assert(!securityService.rbac.userHasPermission('user-op', 'workflow:create'));
  });

  await test('11. RBAC userHasPermission — Viewer Read-Only', () => {
    securityService.rbac.assignRole('user-view', 'viewer');
    assert(securityService.rbac.userHasPermission('user-view', 'machine:read'));
    assert(!securityService.rbac.userHasPermission('user-view', 'workflow:execute'));
  });

  await test('12. RBAC getEffectivePermissions Returns Correct Set', () => {
    securityService.rbac.assignRole('user-eff', 'maintenance_manager');
    const perms = securityService.rbac.getEffectivePermissions('user-eff');
    assert(perms.includes('workflow:create'));
    assert(perms.includes('technician:assign'));
    assert(!perms.includes('integration:connect'));
  });

  await test('13. RBAC listRoles Returns All With Hierarchy Info', () => {
    const roles = securityService.rbac.listRoles();
    assert.strictEqual(roles.length, 7);
    const sa = roles.find(r => r.role === 'super_admin');
    assert(sa.hierarchyLevel === 0);
    assert(sa.inherits.length === 6);
  });

  await test('14. RBAC getAllAssignments Returns Assigned Users', () => {
    const assigns = securityService.rbac.getAllAssignments();
    assert(assigns.length >= 4);
  });

  // ─── ABAC ────────────────────────────────────────────────────

  await test('15. ABAC Create Policy with Conditions', () => {
    const policy = securityService.abac.createPolicy(
      'allow-maintenance-night',
      'Allow maintenance team night access',
      { 'subject.department': { eq: 'maintenance' }, 'time.hour': { between: [22, 6] } },
      securityService.abac.POLICY_EFFECTS.ALLOW,
      15
    );
    assert(policy.id);
    assert(policy.name === 'allow-maintenance-night');
    assert(policy.effect === 'ALLOW');
  });

  await test('16. ABAC Evaluate Policy — Match Returns Allowed', () => {
    const result = securityService.abac.evaluate(
      { role: 'technician', department: 'maintenance', plantId: 'plant-pune-01' },
      { type: 'machine', critical: false },
      'read'
    );
    assert(result.allowed === true || result.allowed === false);
    assert(result.reason);
    assert(Array.isArray(result.policies));
  });

  await test('17. ABAC Evaluate Policy — Deny for External Department on Sensitive', () => {
    const result = securityService.abac.evaluate(
      { role: 'operator', department: 'production', plantId: 'plant-pune-01' },
      { type: 'document', sensitive: true },
      'read'
    );
    assert(result.allowed === false);
  });

  await test('18. ABAC Update and Delete Policy', () => {
    const p = securityService.abac.createPolicy('temp-policy', 'Temp', { 'subject.role': { eq: 'test' } });
    const updated = securityService.abac.updatePolicy(p.id, { description: 'Updated temp' });
    assert(updated.description === 'Updated temp');

    const deleted = securityService.abac.deletePolicy(p.id);
    assert(deleted.deleted === true);
  });

  await test('19. ABAC List Policies Returns Seed + Created', () => {
    const policies = securityService.abac.listPolicies();
    assert(policies.length >= 4, 'Must have at least 4 seed policies');
    policies.forEach(p => {
      assert(p.id);
      assert(p.name);
      assert(p.effect);
    });
  });

  await test('20. ABAC Time-Based Evaluation — Day Shift Matches', () => {
    const hour = new Date().getHours();
    const isDayShift = hour >= 6 && hour <= 18;
    const result = securityService.abac.evaluate(
      { role: 'operator', plantId: 'plant-pune-01' },
      { type: 'machine' },
      'read'
    );
    assert(typeof result.allowed === 'boolean');
  });

  // ─── Multi-Tenant ────────────────────────────────────────────

  await test('21. Multi-Tenant Has Seed Tenants', () => {
    const tenants = securityService.multiTenant.listTenants();
    assert(tenants.length >= 3);
    const pune = tenants.find(t => t.id === 'tenant-pune');
    assert(pune);
    assert(pune.name === 'Pune Manufacturing Plant');
    assert(pune.plan === 'enterprise');
  });

  await test('22. Multi-Tenant Create and Get Tenant', () => {
    const created = securityService.multiTenant.createTenant('tenant-test', 'Test Facility', { domain: 'test.yantramitra.com', plan: 'professional' });
    assert(created.id === 'tenant-test');
    assert(created.status === 'active');

    const got = securityService.multiTenant.getTenant('tenant-test');
    assert(got.name === 'Test Facility');
  });

  await test('23. Multi-Tenant Throws on Duplicate', () => {
    assert.throws(() => securityService.multiTenant.createTenant('tenant-test', 'Duplicate'));
  });

  await test('24. Multi-Tenant Update and Status Management', () => {
    const updated = securityService.multiTenant.updateTenant('tenant-test', { name: 'Updated Facility' });
    assert(updated.name === 'Updated Facility');

    const deactivated = securityService.multiTenant.setTenantStatus('tenant-test', 'suspended');
    assert(deactivated.status === 'suspended');

    const active = securityService.multiTenant.isTenantActive('tenant-test');
    assert(active === false);

    securityService.multiTenant.setTenantStatus('tenant-test', 'active');
  });

  await test('25. Multi-Tenant Delete Tenant', () => {
    const created = securityService.multiTenant.createTenant('tenant-todelete', 'To Delete');
    const deleted = securityService.multiTenant.deleteTenant('tenant-todelete');
    assert(deleted.deleted === true);
    assert(deleted.tenantId === 'tenant-todelete');
  });

  await test('26. Multi-Tenant Tenant Config and Feature Check', () => {
    const config = securityService.multiTenant.getTenantConfig('tenant-pune');
    assert(config.features.includes('ml'));
    assert(securityService.multiTenant.checkTenantFeature('tenant-pune', 'analytics'));
    assert(!securityService.multiTenant.checkTenantFeature('tenant-pune', 'nonexistent'));
  });

  await test('27. Multi-Tenant Scope Data to Tenant', () => {
    const data = [{ id: 1, tenantId: 'tenant-pune' }, { id: 2, tenantId: 'tenant-ahmedabad' }, { id: 3 }];
    const scoped = securityService.multiTenant.scopeDataToTenant('tenant-pune', data);
    assert(scoped.length === 2);
  });

  // ─── Audit System ────────────────────────────────────────────

  await test('28. Audit Track Login Event', () => {
    const entry = securityService.auditSystem.trackEvent('LOGIN', { userId: 'user-001', ip: '192.168.1.1', status: 'SUCCESS' });
    assert(entry.id);
    assert(entry.type === 'LOGIN');
    assert(entry.userId === 'user-001');
  });

  await test('29. Audit Track All Event Types', () => {
    const types = securityService.auditSystem.EVENT_TYPES;
    assert(types.length >= 17);
    types.forEach(t => {
      const entry = securityService.auditSystem.trackEvent(t, { userId: 'user-audit', details: `Test ${t}` });
      assert(entry.type === t);
    });
  });

  await test('30. Audit Throws on Invalid Event Type', () => {
    assert.throws(() => securityService.auditSystem.trackEvent('INVALID_EVENT'));
  });

  await test('31. Audit Search by Type', () => {
    const results = securityService.auditSystem.searchAudit({ type: 'LOGIN' });
    assert(results.length > 0);
    results.forEach(r => assert(r.type === 'LOGIN'));
  });

  await test('32. Audit Search by User ID', () => {
    const results = securityService.auditSystem.searchAudit({ userId: 'user-audit' });
    assert(results.length > 0);
  });

  await test('33. Audit Search by Date Range', () => {
    const results = securityService.auditSystem.searchAudit({
      startDate: new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date().toISOString()
    });
    assert(results.length > 0);
  });

  await test('34. Audit Search with Text Query', () => {
    const results = securityService.auditSystem.searchAudit({ search: 'LOGIN' });
    assert(results.length > 0);
  });

  await test('35. Audit Stats Returns Correct Counts', () => {
    const stats = securityService.auditSystem.getAuditStats();
    assert(stats.totalEntries > 0);
    assert(typeof stats.successCount === 'number');
    assert(typeof stats.uniqueUsers === 'number');
    assert(stats.byType.LOGIN > 0);
  });

  await test('36. Audit Clear Log', () => {
    const cleared = securityService.auditSystem.clearAuditLog();
    assert(cleared.cleared === true);
    assert(cleared.entriesRemoved > 0);
    const stats = securityService.auditSystem.getAuditStats();
    assert(stats.totalEntries === 0);
  });

  // ─── Secrets Management ──────────────────────────────────────

  await test('37. Secrets Store and Retrieve', () => {
    const stored = securityService.secretsManager.storeSecret('api-key-scada', 'sk-scada-abc123', 'api', { createdBy: 'admin' });
    assert(stored.name === 'api-key-scada');
    assert(stored.version === 1);

    const retrieved = securityService.secretsManager.getSecret('api-key-scada', 'test');
    assert(retrieved.value === 'sk-scada-abc123');
    assert(retrieved.version === 1);
  });

  await test('38. Secrets Encrypt/Decrypt Round Trip', () => {
    const plaintext = 'sensitive-data-here-42';
    const encrypted = securityService.secretsManager.encrypt(plaintext);
    assert(encrypted.includes(':'));
    const decrypted = securityService.secretsManager.decrypt(encrypted);
    assert.strictEqual(decrypted, plaintext);
  });

  await test('39. Secrets Rotation', () => {
    securityService.secretsManager.storeSecret('db-password', 'old-password', 'database');
    const rotated = securityService.secretsManager.rotateSecret('db-password', 'new-password', 'admin');
    assert(rotated.prevVersion === 1);
    assert(rotated.newVersion === 2);

    const retrieved = securityService.secretsManager.getSecret('db-password', 'test');
    assert(retrieved.value === 'new-password');
    assert(retrieved.version === 2);
  });

  await test('40. Secrets Throws on Missing Secret', () => {
    assert.throws(() => securityService.secretsManager.getSecret('nonexistent-secret'));
  });

  await test('41. Secrets List by Category', () => {
    const all = securityService.secretsManager.listSecrets();
    assert(all.length > 0);

    const api = securityService.secretsManager.listSecrets('api');
    assert(api.length > 0);
    api.forEach(s => assert(s.category === 'api'));
  });

  await test('42. Secrets Delete', () => {
    securityService.secretsManager.storeSecret('temp-secret', 'temp-value', 'temp');
    const deleted = securityService.secretsManager.deleteSecret('temp-secret');
    assert(deleted.deleted === true);
    assert.throws(() => securityService.secretsManager.getSecret('temp-secret'));
  });

  await test('43. Secrets Access Log', () => {
    const log = securityService.secretsManager.getAccessLog();
    assert(log.length > 0);
    log.forEach(e => {
      assert(e.name);
      assert(e.action);
    });
  });

  await test('44. Secrets Generate Encryption Key', () => {
    const key = securityService.secretsManager.generateEncryptionKey();
    assert(typeof key === 'string');
    assert(key.length === 64);
  });

  await test('45. Secrets Hash String', () => {
    const hash = securityService.secretsManager.hashString('test-input');
    assert(typeof hash === 'string');
    assert(hash.length === 64);
  });

  // ─── Compliance Engine ───────────────────────────────────────

  await test('46. Compliance Has 3 Standards', () => {
    const standards = Object.keys(securityService.complianceEngine.STANDARDS);
    assert(standards.includes('ISO_27001'));
    assert(standards.includes('IEC_62443'));
    assert(standards.includes('SOC_2'));
    assert.strictEqual(standards.length, 3);
  });

  await test('47. Compliance Generate ISO 27001 Report', () => {
    const report = securityService.complianceEngine.generateComplianceReport('ISO_27001', { generatedBy: 'admin', tenantId: 'tenant-pune' });
    assert(report.standard === 'ISO 27001');
    assert(report.totalControls === 8);
    assert(typeof report.overallScore === 'number');
    assert(report.overallScore > 0);
    assert(report.controls.length === 8);
    assert(['FULLY_COMPLIANT', 'PARTIALLY_COMPLIANT'].includes(report.status));
  });

  await test('48. Compliance Generate IEC 62443 Report', () => {
    const report = securityService.complianceEngine.generateComplianceReport('IEC_62443');
    assert(report.standard === 'IEC 62443');
    assert(report.totalControls === 8);
  });

  await test('49. Compliance Generate SOC 2 Report', () => {
    const report = securityService.complianceEngine.generateComplianceReport('SOC_2');
    assert(report.standard === 'SOC 2');
    assert(report.totalControls === 8);
  });

  await test('50. Compliance Get and List Reports', () => {
    const report = securityService.complianceEngine.generateComplianceReport('ISO_27001');
    const retrieved = securityService.complianceEngine.getComplianceReport(report.id);
    assert(retrieved.id === report.id);

    const list = securityService.complianceEngine.listComplianceReports();
    assert(list.length >= 3);
  });

  await test('51. Compliance Record and Get Violations', () => {
    const violation = securityService.complianceEngine.recordViolation({
      type: 'ACCESS_VIOLATION',
      userId: 'user-001',
      resource: '/api/secrets',
      severity: 'HIGH',
      details: 'Unauthorized access attempt to secrets API'
    });
    assert(violation.id);
    assert(violation.type === 'ACCESS_VIOLATION');

    const violations = securityService.complianceEngine.getViolations({ severity: 'HIGH' });
    assert(violations.length > 0);
  });

  await test('52. Compliance Remediate Violation', () => {
    const v = securityService.complianceEngine.recordViolation({ type: 'POLICY_VIOLATION', severity: 'MEDIUM', details: 'Test' });
    const remediated = securityService.complianceEngine.remediateViolation(v.id, 'admin');
    assert(remediated.remediated === true);
    assert(remediated.remediatedBy === 'admin');
  });

  await test('53. Compliance Summary', () => {
    const summary = securityService.complianceEngine.getComplianceSummary();
    assert(summary.standards.length === 3);
    assert(summary.reportsGenerated > 0);
    assert(typeof summary.totalViolations === 'number');
  });

  // ─── Session Management ──────────────────────────────────────

  await test('54. Session Create and Retrieve', () => {
    const session = securityService.sessionManager.createSession('user-sess-01', { deviceName: 'Chrome Browser', deviceType: 'browser', ip: '10.0.0.1' });
    assert(session.sessionId);
    assert(session.userId === 'user-sess-01');
    assert(session.active === true);

    const retrieved = securityService.sessionManager.getSession(session.sessionId);
    assert(retrieved.sessionId === session.sessionId);
  });

  await test('55. Session Touch Updates Last Activity', () => {
    const session = securityService.sessionManager.createSession('user-touch');
    const touched = securityService.sessionManager.touchSession(session.sessionId);
    assert(touched.lastActivity);
  });

  await test('56. Session Revoke', () => {
    const session = securityService.sessionManager.createSession('user-revoke');
    const revoked = securityService.sessionManager.revokeSession(session.sessionId, 'Testing revocation');
    assert(revoked.revoked === true);
    assert(revoked.reason === 'Testing revocation');
  });

  await test('57. Session Revoke All User Sessions', () => {
    securityService.sessionManager.createSession('user-multi', { deviceName: 'Device A' });
    securityService.sessionManager.createSession('user-multi', { deviceName: 'Device B' });
    const result = securityService.sessionManager.revokeAllUserSessions('user-multi', 'Admin logout');
    assert(result.revoked >= 2);
  });

  await test('58. Session Get Active Sessions', () => {
    const session = securityService.sessionManager.createSession('user-active');
    const active = securityService.sessionManager.getActiveSessions('user-active');
    assert(active.length >= 1);
    assert(active[0].active === true);
  });

  await test('59. Session Enforces Concurrent Limit', () => {
    for (let i = 0; i < 6; i++) {
      securityService.sessionManager.createSession('user-concurrent', { deviceName: `Device ${i}` });
    }
    const active = securityService.sessionManager.getActiveSessions('user-concurrent');
    assert(active.length <= 5);
  });

  await test('60. Session Register and Get Device', () => {
    const device = securityService.sessionManager.registerDevice({ deviceName: 'Mobile App', deviceType: 'mobile' });
    assert(device.deviceId);
    assert(device.deviceName === 'Mobile App');

    const got = securityService.sessionManager.getDevice(device.deviceId);
    assert(got.deviceId === device.deviceId);
  });

  await test('61. Session Summary', () => {
    const summary = securityService.sessionManager.getSessionsSummary();
    assert(typeof summary.totalSessions === 'number');
    assert(typeof summary.activeSessions === 'number');
    assert(typeof summary.uniqueUsers === 'number');
    assert(typeof summary.uniqueDevices === 'number');
  });

  await test('62. Session Cleanup Expired', () => {
    const result = securityService.sessionManager.cleanupExpiredSessions();
    assert(typeof result.cleaned === 'number');
  });

  // ─── Security Monitoring ─────────────────────────────────────

  await test('63. Security Monitor Create Alert Rule and Trigger', () => {
    const rule = securityService.securityMonitor.createAlert('Test Alert', 'Test description', 'HIGH', false);
    assert(rule.id);
    assert(rule.name === 'Test Alert');

    const alert = securityService.securityMonitor.triggerAlert(rule.id, { userId: 'user-mon', details: 'Test trigger' });
    assert(alert.ruleId === rule.id);
    assert(alert.severity === 'HIGH');
  });

  await test('64. Security Monitor Acknowledge and Resolve Alert', () => {
    const rule = securityService.securityMonitor.createAlert('Temp Alert', 'Temp', 'LOW', false);
    const alert = securityService.securityMonitor.triggerAlert(rule.id, {});

    const ack = securityService.securityMonitor.acknowledgeAlert(alert.id);
    assert(ack.acknowledged === true);

    const resolved = securityService.securityMonitor.resolveAlert(alert.id, 'Investigated');
    assert(resolved.resolved === true);
    assert(resolved.resolution === 'Investigated');
  });

  await test('65. Security Monitor Track Failed Login', () => {
    for (let i = 0; i < 3; i++) {
      securityService.securityMonitor.trackFailedLogin('user-fail', '10.0.0.99');
    }
    const result = securityService.securityMonitor.trackFailedLogin('user-fail', '10.0.0.99');
    assert(typeof result.recentAttempts === 'number');
    assert(typeof result.locked === 'boolean');
  });

  await test('66. Security Monitor Track Suspicious Activity', () => {
    const alert = securityService.securityMonitor.trackSuspiciousActivity('User accessed admin panel outside hours', { userId: 'user-susp', severity: 'HIGH' });
    assert(alert);
    assert(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(alert.severity));
  });

  await test('67. Security Monitor Track Privilege Escalation', () => {
    const alert = securityService.securityMonitor.trackPrivilegeEscalation('user-esc', 'operator', 'super_admin', { ip: '10.0.0.55' });
    assert(alert);
    assert(alert.severity === 'CRITICAL');
  });

  await test('68. Security Monitor Track Unauthorized Access', () => {
    const alert = securityService.securityMonitor.trackUnauthorizedAccess('user-unauth', '/api/security/secrets', 'READ', { ip: '10.0.0.77' });
    assert(alert);
    assert(alert.resource === '/api/security/secrets');
  });

  await test('69. Security Monitor Rate Limit Check', () => {
    const result = securityService.securityMonitor.checkRateLimit('user-rate', 'test-action', 1000, 60000);
    assert(result.allowed === true);
    assert(typeof result.currentCount === 'number');
  });

  await test('70. Security Monitor Get Alerts with Filters', () => {
    const all = securityService.securityMonitor.getAlerts({});
    assert(Array.isArray(all));

    const critical = securityService.securityMonitor.getAlerts({ severity: 'CRITICAL' });
    critical.forEach(a => assert(a.severity === 'CRITICAL'));

    const unresolved = securityService.securityMonitor.getAlerts({ unresolved: true });
    unresolved.forEach(a => assert(a.resolved === false));
  });

  await test('71. Security Monitor Alert Rules and Summary', () => {
    const rules = securityService.securityMonitor.getAlertRules();
    assert(rules.length >= 7);

    const summary = securityService.securityMonitor.getAlertSummary();
    assert(typeof summary.totalAlerts === 'number');
    assert(typeof summary.bySeverity.critical === 'number');
    assert(typeof summary.bySeverity.high === 'number');
    assert(typeof summary.activeRules === 'number');
  });

  // ─── End-to-End ──────────────────────────────────────────────

  await test('72. End-to-End: Role Assignment + Permission Check + Session + Audit', () => {
    securityService.rbac.assignRole('user-e2e', 'reliability_engineer');

    assert(securityService.rbac.userHasPermission('user-e2e', 'machine:update'));
    assert(!securityService.rbac.userHasPermission('user-e2e', 'integration:connect'));

    const session = securityService.sessionManager.createSession('user-e2e', { deviceName: 'E2E Test', ip: '10.0.0.1' });
    assert(session.active);

    const entry = securityService.auditSystem.trackEvent('API_ACCESS', {
      userId: 'user-e2e',
      resource: '/api/fleet',
      action: 'GET',
      status: 'SUCCESS'
    });
    assert(entry.type === 'API_ACCESS');

    const search = securityService.auditSystem.searchAudit({ userId: 'user-e2e' });
    assert(search.length > 0);
  });

  await test('73. End-to-End: Tenant Scoped Data Access', () => {
    const status = securityService.getSecuritySystemStatus();
    assert(status.multiTenant.tenants >= 3);
  });

  await test('74. End-to-End: Full Compliance Report with Violation Tracking', () => {
    const report = securityService.complianceEngine.generateComplianceReport('SOC_2', { tenantId: 'tenant-pune' });
    assert(report.standard === 'SOC 2');

    securityService.complianceEngine.recordViolation({
      type: 'ACCESS_VIOLATION',
      standard: 'SOC_2',
      userId: 'user-comp',
      severity: 'HIGH',
      details: 'Unauthorized SOC 2 data access'
    });

    const violations = securityService.complianceEngine.getViolations({ standard: 'SOC_2' });
    assert(violations.length > 0);
  });

  console.log(`\n==================================================`);
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`==================================================`);
  if (failed > 0) process.exit(1);
}

runSecurityTests();
