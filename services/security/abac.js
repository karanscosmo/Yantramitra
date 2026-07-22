const policies = new Map();
let policyIdCounter = 0;

const POLICY_EFFECTS = { ALLOW: 'ALLOW', DENY: 'DENY' };

function createPolicy(name, description, conditions, effect = POLICY_EFFECTS.ALLOW, priority = 0) {
  const id = `policy-${++policyIdCounter}`;
  const policy = {
    id,
    name,
    description,
    conditions,
    effect,
    priority,
    enabled: true,
    createdAt: new Date().toISOString(),
    evaluationCount: 0
  };
  policies.set(id, policy);
  return policy;
}

function updatePolicy(id, updates) {
  const policy = policies.get(id);
  if (!policy) throw new Error(`Policy '${id}' not found`);
  Object.assign(policy, updates, { updatedAt: new Date().toISOString() });
  return policy;
}

function deletePolicy(id) {
  if (!policies.has(id)) throw new Error(`Policy '${id}' not found`);
  policies.delete(id);
  return { deleted: true, id };
}

function getPolicy(id) {
  return policies.get(id) || null;
}

function listPolicies() {
  return Array.from(policies.values()).sort((a, b) => b.priority - a.priority);
}

function evaluate(subject, resource, action) {
  const applicable = Array.from(policies.values())
    .filter(p => p.enabled && matchesConditions(p.conditions, subject, resource, action))
    .sort((a, b) => b.priority - a.priority);

  applicable.forEach(p => p.evaluationCount++);

  if (applicable.length === 0) return { allowed: false, reason: 'No applicable policy', policies: [] };
  const firstMatch = applicable[0];
  const allowed = firstMatch.effect === POLICY_EFFECTS.ALLOW;
  return {
    allowed,
    effect: firstMatch.effect,
    policy: { id: firstMatch.id, name: firstMatch.name, priority: firstMatch.priority },
    reason: allowed ? `Allowed by policy '${firstMatch.name}'` : `Denied by policy '${firstMatch.name}'`,
    policies: applicable.map(p => ({ id: p.id, name: p.name, effect: p.effect }))
  };
}

function matchesConditions(conditions, subject, resource, action) {
  for (const [key, condition] of Object.entries(conditions)) {
    const value = resolveAttribute(key, subject, resource, action);
    if (!evaluateCondition(value, condition)) return false;
  }
  return true;
}

function resolveAttribute(key, subject, resource, action) {
  const parts = key.split('.');
  if (parts[0] === 'subject' && parts[1]) return subject?.[parts.slice(1).join('.')];
  if (parts[0] === 'resource' && parts[1]) return resource?.[parts.slice(1).join('.')];
  if (parts[0] === 'action') return action;
  if (key === 'time.now') return new Date().toISOString();
  if (key === 'time.hour') return new Date().getHours();
  if (key === 'time.dayOfWeek') return new Date().getDay();
  if (key === 'time.date') return new Date().toISOString().split('T')[0];
  return subject?.[key] ?? resource?.[key] ?? null;
}

function evaluateCondition(value, condition) {
  if (typeof condition === 'object' && condition !== null) {
    const op = Object.keys(condition)[0];
    const target = condition[op];
    switch (op) {
      case 'eq': return value === target;
      case 'neq': return value !== target;
      case 'in': return Array.isArray(target) && target.includes(value);
      case 'notIn': return Array.isArray(target) && !target.includes(value);
      case 'gte': return typeof value === 'number' && value >= target;
      case 'lte': return typeof value === 'number' && value <= target;
      case 'gt': return typeof value === 'number' && value > target;
      case 'lt': return typeof value === 'number' && value < target;
      case 'between': return Array.isArray(target) && value >= target[0] && value <= target[1];
      case 'exists': return value != null;
      case 'pattern': return typeof value === 'string' && new RegExp(target).test(value);
      default: return false;
    }
  }
  return value === condition;
}

function seedDefaultPolicies() {
  createPolicy('allow-day-shift-plant-pune', 'Allow day shift access for Pune plant',
    { 'subject.plantId': { eq: 'plant-pune-01' }, 'time.hour': { between: [6, 18] } },
    POLICY_EFFECTS.ALLOW, 10
  );
  createPolicy('deny-night-machine-write', 'Deny write operations on critical machines during night shift',
    { 'resource.critical': { eq: true }, 'time.hour': { between: [22, 5] }, 'action': { pattern: 'write|delete|update' } },
    POLICY_EFFECTS.DENY, 20
  );
  createPolicy('allow-technician-machines', 'Allow technicians to access assigned machines',
    { 'subject.role': { eq: 'technician' }, 'resource.type': { eq: 'machine' } },
    POLICY_EFFECTS.ALLOW, 5
  );
  createPolicy('deny-external-access', 'Deny access from external departments to sensitive resources',
    { 'subject.department': { neq: 'maintenance' }, 'resource.sensitive': { eq: true } },
    POLICY_EFFECTS.DENY, 25
  );
}

seedDefaultPolicies();

module.exports = {
  POLICY_EFFECTS,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getPolicy,
  listPolicies,
  evaluate
};
