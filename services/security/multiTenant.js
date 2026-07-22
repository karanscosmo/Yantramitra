const tenants = new Map();
const tenantData = new Map();

const defaultTenants = [
  { id: 'tenant-pune', name: 'Pune Manufacturing Plant', domain: 'pune.yantramitra.com', plan: 'enterprise', status: 'active', settings: { maxUsers: 500, maxMachines: 200, features: ['analytics', 'integrations', 'ml'] } },
  { id: 'tenant-ahmedabad', name: 'Ahmedabad Facility', domain: 'ahmedabad.yantramitra.com', plan: 'professional', status: 'active', settings: { maxUsers: 100, maxMachines: 50, features: ['analytics'] } },
  { id: 'tenant-chennai', name: 'Chennai Operations', domain: 'chennai.yantramitra.com', plan: 'enterprise', status: 'active', settings: { maxUsers: 300, maxMachines: 150, features: ['analytics', 'integrations', 'ml', 'fleet'] } }
];

defaultTenants.forEach(t => {
  tenants.set(t.id, { ...t, createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString() });
});

function createTenant(id, name, config = {}) {
  if (tenants.has(id)) throw new Error(`Tenant '${id}' already exists`);
  const tenant = {
    id,
    name,
    domain: config.domain || `${id}.yantramitra.com`,
    plan: config.plan || 'professional',
    status: 'active',
    settings: config.settings || {},
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  };
  tenants.set(id, tenant);
  tenantData.set(id, { machines: [], users: [], workflows: [] });
  return tenant;
}

function getTenant(tenantId) {
  return tenants.get(tenantId) || null;
}

function listTenants() {
  return Array.from(tenants.values());
}

function updateTenant(tenantId, updates) {
  const tenant = tenants.get(tenantId);
  if (!tenant) throw new Error(`Tenant '${tenantId}' not found`);
  Object.assign(tenant, updates, { modifiedAt: new Date().toISOString() });
  return tenant;
}

function deleteTenant(tenantId) {
  if (!tenants.has(tenantId)) throw new Error(`Tenant '${tenantId}' not found`);
  tenants.delete(tenantId);
  tenantData.delete(tenantId);
  return { deleted: true, tenantId };
}

function setTenantStatus(tenantId, status) {
  const tenant = tenants.get(tenantId);
  if (!tenant) throw new Error(`Tenant '${tenantId}' not found`);
  tenant.status = status;
  tenant.modifiedAt = new Date().toISOString();
  return tenant;
}

function isTenantActive(tenantId) {
  const tenant = tenants.get(tenantId);
  return tenant ? tenant.status === 'active' : false;
}

function createTenantMiddleware() {
  return function tenantMiddleware(req, res, next) {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId || req.body?.tenantId;
    if (tenantId) {
      const tenant = tenants.get(tenantId);
      if (!tenant) return res.status(404).json({ error: `Tenant '${tenantId}' not found` });
      if (tenant.status !== 'active') return res.status(403).json({ error: `Tenant '${tenantId}' is ${tenant.status}` });
      req.tenant = tenant;
      req.tenantId = tenantId;
    }
    next();
  };
}

function scopeDataToTenant(tenantId, data) {
  if (!tenantId) return data;
  if (Array.isArray(data)) return data.filter(item => item.tenantId === tenantId || !item.tenantId);
  if (data && typeof data === 'object') return { ...data, tenantId: data.tenantId || tenantId };
  return data;
}

function getTenantConfig(tenantId) {
  const tenant = tenants.get(tenantId);
  if (!tenant) return null;
  return {
    id: tenant.id,
    name: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
    features: tenant.settings.features || [],
    maxUsers: tenant.settings.maxUsers,
    maxMachines: tenant.settings.maxMachines
  };
}

function checkTenantFeature(tenantId, feature) {
  const config = getTenantConfig(tenantId);
  if (!config) return false;
  return (config.features || []).includes(feature);
}

module.exports = {
  createTenant,
  getTenant,
  listTenants,
  updateTenant,
  deleteTenant,
  setTenantStatus,
  isTenantActive,
  createTenantMiddleware,
  scopeDataToTenant,
  getTenantConfig,
  checkTenantFeature
};
