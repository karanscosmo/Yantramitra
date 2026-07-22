const roles = ['super_admin', 'plant_admin', 'reliability_engineer', 'maintenance_manager', 'technician', 'operator', 'viewer'];

const roleHierarchy = {
  super_admin: ['super_admin', 'plant_admin', 'reliability_engineer', 'maintenance_manager', 'technician', 'operator', 'viewer'],
  plant_admin: ['plant_admin', 'reliability_engineer', 'maintenance_manager', 'technician', 'operator', 'viewer'],
  reliability_engineer: ['reliability_engineer', 'maintenance_manager', 'technician', 'operator', 'viewer'],
  maintenance_manager: ['maintenance_manager', 'technician', 'operator', 'viewer'],
  technician: ['technician', 'operator', 'viewer'],
  operator: ['operator', 'viewer'],
  viewer: ['viewer']
};

const permissionRegistry = new Map();
const roleAssignments = new Map();

const defaultPermissions = {
  super_admin: ['*'],
  plant_admin: [
    'plant:read', 'plant:update', 'plant:delete',
    'machine:read', 'machine:create', 'machine:update', 'machine:delete',
    'workflow:read', 'workflow:create', 'workflow:update', 'workflow:execute',
    'user:read', 'user:create', 'user:update',
    'fleet:read', 'fleet:update',
    'integration:read', 'integration:connect',
    'audit:read',
    'report:read', 'report:create',
    'security:read'
  ],
  reliability_engineer: [
    'machine:read', 'machine:update',
    'workflow:read', 'workflow:create', 'workflow:update', 'workflow:execute',
    'fleet:read',
    'report:read', 'report:create',
    'analysis:read', 'analysis:create',
    'learning:read'
  ],
  maintenance_manager: [
    'machine:read',
    'workflow:read', 'workflow:create', 'workflow:update', 'workflow:execute',
    'fleet:read',
    'report:read',
    'technician:assign'
  ],
  technician: [
    'machine:read',
    'workflow:read', 'workflow:execute',
    'workflow:update_status',
    'report:read'
  ],
  operator: [
    'machine:read',
    'workflow:read', 'workflow:execute',
    'dashboard:read'
  ],
  viewer: [
    'machine:read',
    'dashboard:read',
    'report:read'
  ]
};

Object.entries(defaultPermissions).forEach(([role, perms]) => {
  perms.forEach(p => registerPermission(p, role, `Default ${role} permission`));
});

function registerPermission(permission, role, description) {
  if (!permissionRegistry.has(permission)) {
    permissionRegistry.set(permission, { permission, description: description || '', roles: new Set() });
  }
  permissionRegistry.get(permission).roles.add(role);
}

function assignRole(userId, role, assignedBy = 'system') {
  if (!roles.includes(role)) throw new Error(`Invalid role '${role}'. Valid roles: ${roles.join(', ')}`);
  const prevRole = roleAssignments.get(userId)?.role || null;
  roleAssignments.set(userId, { userId, role, assignedBy, assignedAt: new Date().toISOString(), prevRole });
  return { userId, role, assignedAt: new Date().toISOString() };
}

function getUserRole(userId) {
  const assignment = roleAssignments.get(userId);
  return assignment ? assignment.role : null;
}

function userHasRole(userId, role) {
  const userRole = getUserRole(userId);
  if (!userRole) return false;
  const effectiveRoles = roleHierarchy[userRole] || [userRole];
  return effectiveRoles.includes(role);
}

function userHasPermission(userId, permission) {
  const userRole = getUserRole(userId);
  if (!userRole) return false;
  const effectiveRoles = roleHierarchy[userRole] || [userRole];
  for (const r of effectiveRoles) {
    if (permissionRegistry.has(permission) && permissionRegistry.get(permission).roles.has(r)) return true;
    if (permissionRegistry.has('*') && permissionRegistry.get('*').roles.has(r)) return true;
    const wildcard = permission.split(':')[0] + ':*';
    if (permissionRegistry.has(wildcard) && permissionRegistry.get(wildcard).roles.has(r)) return true;
  }
  return false;
}

function checkRouteAccess(userId, route, method) {
  const userRole = getUserRole(userId);
  if (!userRole) return { allowed: false, reason: 'User has no role assigned' };
  if (userRole === 'super_admin') return { allowed: true, role: userRole };
  return { allowed: true, role: userRole };
}

function getEffectivePermissions(userId) {
  const userRole = getUserRole(userId);
  if (!userRole) return [];
  const effectiveRoles = roleHierarchy[userRole] || [userRole];
  const perms = new Set();
  permissionRegistry.forEach((entry, permission) => {
    for (const r of effectiveRoles) {
      if (entry.roles.has(r)) perms.add(permission);
    }
  });
  return Array.from(perms).sort();
}

function listRoles() {
  return roles.map(role => ({
    role,
    hierarchyLevel: roles.indexOf(role),
    inherits: (roleHierarchy[role] || [role]).filter(r => r !== role),
    permissions: getPermissionsForRole(role)
  }));
}

function getPermissionsForRole(role) {
  if (!roles.includes(role)) return [];
  const perms = [];
  permissionRegistry.forEach((entry, permission) => {
    if (entry.roles.has(role)) perms.push(permission);
  });
  return perms.sort();
}

function getAllAssignments() {
  return Array.from(roleAssignments.values());
}

module.exports = {
  roles,
  roleHierarchy,
  registerPermission,
  assignRole,
  getUserRole,
  userHasRole,
  userHasPermission,
  checkRouteAccess,
  getEffectivePermissions,
  listRoles,
  getPermissionsForRole,
  getAllAssignments
};
