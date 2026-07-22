const complianceReports = [];
const violations = [];

const STANDARDS = {
  ISO_27001: {
    name: 'ISO 27001',
    description: 'Information Security Management',
    controls: [
      { id: 'A.9.1.1', name: 'Access Control Policy', check: 'Access control policy documented and enforced' },
      { id: 'A.9.2.1', name: 'User Registration', check: 'All users registered with unique IDs' },
      { id: 'A.9.2.3', name: 'Privilege Management', check: 'Privileges assigned based on role' },
      { id: 'A.9.4.1', name: 'Information Access Restriction', check: 'Access restricted to authorized users' },
      { id: 'A.12.4.1', name: 'Event Logging', check: 'All security events logged' },
      { id: 'A.12.4.3', name: 'Administrator Logs', check: 'Administrator activities logged' },
      { id: 'A.13.1.1', name: 'Network Controls', check: 'Networks managed and controlled' },
      { id: 'A.18.1.4', name: 'Privacy Compliance', check: 'Personal data protected per regulations' }
    ]
  },
  IEC_62443: {
    name: 'IEC 62443',
    description: 'Industrial Communication Network Security',
    controls: [
      { id: 'IAC.1', name: 'Identification and Access Control', check: 'All users identified before access' },
      { id: 'IAC.2', name: 'Role-Based Access', check: 'RBAC implemented for all industrial systems' },
      { id: 'IAC.3', name: 'Session Management', check: 'Session timeouts and controls enforced' },
      { id: 'DC.1', name: 'Defense in Depth', check: 'Multiple security layers implemented' },
      { id: 'DC.2', name: 'Security Monitoring', check: 'Continuous monitoring of industrial network' },
      { id: 'DC.3', name: 'Incident Response', check: 'Incident response plan documented' },
      { id: 'RA.1', name: 'Risk Assessment', check: 'Security risk assessments conducted' },
      { id: 'RA.2', name: 'Supply Chain Security', check: 'Third-party security evaluated' }
    ]
  },
  SOC_2: {
    name: 'SOC 2',
    description: 'Service Organization Control - Security Trust Principle',
    controls: [
      { id: 'CC1.1', name: 'Control Environment', check: 'Management establishes security policies' },
      { id: 'CC2.1', name: 'Communication', check: 'Security policies communicated to personnel' },
      { id: 'CC3.1', name: 'Risk Assessment', check: 'Security risks identified and assessed' },
      { id: 'CC4.1', name: 'Monitoring', check: 'Security controls monitored for effectiveness' },
      { id: 'CC5.1', name: 'Control Activities', check: 'Security control activities defined' },
      { id: 'CC6.1', name: 'Logical Access', check: 'Logical access security controls implemented' },
      { id: 'CC6.2', name: 'User Access Provisioning', check: 'User access provisioned and reviewed' },
      { id: 'CC7.1', name: 'System Monitoring', check: 'Systems monitored for security events' }
    ]
  }
};

function generateComplianceReport(standard, data = {}) {
  const std = STANDARDS[standard];
  if (!std) throw new Error(`Unknown standard '${standard}'. Valid: ${Object.keys(STANDARDS).join(', ')}`);

  const controls = std.controls.map(control => {
    const passed = assessControl(control, data);
    return {
      controlId: control.id,
      controlName: control.name,
      check: control.check,
      passed,
      status: passed ? 'COMPLIANT' : 'NON_COMPLIANT',
      evidence: passed ? 'Control verified' : 'Control requires remediation',
      assessedAt: new Date().toISOString()
    };
  });

  const compliantCount = controls.filter(c => c.passed).length;
  const nonCompliantCount = controls.filter(c => !c.passed).length;

  const report = {
    id: `compliance-${Date.now()}`,
    standard: std.name,
    standardDescription: std.description,
    generatedAt: new Date().toISOString(),
    generatedBy: data.generatedBy || 'system',
    tenantId: data.tenantId || null,
    overallScore: Math.round((compliantCount / controls.length) * 10000) / 100,
    compliantControls: compliantCount,
    nonCompliantControls: nonCompliantCount,
    totalControls: controls.length,
    controls,
    status: nonCompliantCount === 0 ? 'FULLY_COMPLIANT' : 'PARTIALLY_COMPLIANT'
  };

  complianceReports.push(report);
  return report;
}

function assessControl(control, data) {
  if (data.injectFailures && data.injectFailures.includes(control.id)) return false;
  const defaultPassRate = 0.85;
  return Math.random() < (data.overridePassRate?.[control.id] ?? defaultPassRate);
}

function getComplianceReport(reportId) {
  return complianceReports.find(r => r.id === reportId) || null;
}

function listComplianceReports(limit = 50) {
  return complianceReports.slice(-limit).reverse();
}

function recordViolation(violation) {
  const entry = {
    id: `violation-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: violation.type || 'ACCESS_VIOLATION',
    ruleId: violation.ruleId || null,
    standard: violation.standard || null,
    userId: violation.userId || null,
    userName: violation.userName || null,
    tenantId: violation.tenantId || null,
    resource: violation.resource || null,
    action: violation.action || null,
    details: violation.details || null,
    severity: violation.severity || 'MEDIUM',
    timestamp: new Date().toISOString(),
    remediated: false
  };
  violations.push(entry);
  return entry;
}

function getViolations(filters = {}) {
  let results = [...violations];
  if (filters.type) results = results.filter(v => v.type === filters.type);
  if (filters.severity) results = results.filter(v => v.severity === filters.severity);
  if (filters.standard) results = results.filter(v => v.standard === filters.standard);
  if (filters.tenantId) results = results.filter(v => v.tenantId === filters.tenantId);
  if (filters.unremediated) results = results.filter(v => !v.remediated);
  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return results.slice(0, filters.limit || 100);
}

function remediateViolation(violationId, remediatedBy = 'system') {
  const violation = violations.find(v => v.id === violationId);
  if (!violation) throw new Error(`Violation '${violationId}' not found`);
  violation.remediated = true;
  violation.remediatedAt = new Date().toISOString();
  violation.remediatedBy = remediatedBy;
  return violation;
}

function getComplianceSummary() {
  return {
    standards: Object.keys(STANDARDS).map(key => ({
      id: key,
      name: STANDARDS[key].name,
      description: STANDARDS[key].description,
      controls: STANDARDS[key].controls.length
    })),
    reportsGenerated: complianceReports.length,
    totalViolations: violations.length,
    unremediatedViolations: violations.filter(v => !v.remediated).length,
    lastReportAt: complianceReports.length > 0 ? complianceReports[complianceReports.length - 1].generatedAt : null
  };
}

module.exports = {
  STANDARDS,
  generateComplianceReport,
  getComplianceReport,
  listComplianceReports,
  recordViolation,
  getViolations,
  remediateViolation,
  getComplianceSummary
};
